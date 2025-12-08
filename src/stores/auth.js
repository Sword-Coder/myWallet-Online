import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUsersStore } from './users'
import { useUserData } from 'src/composables/useUserData'
import { useEmail } from 'src/composables/useEmail'
import { useDatabase } from 'src/composables/useDatabase'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isOnline = ref(navigator.onLine)
  const usersStore = useUsersStore()
  const { initializeUserData } = useUserData()
  const { sendWelcomeEmail } = useEmail()

  // Handle Google Identity Services response
  const handleGoogleAuth = async (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      const userInfo = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      }
      await loginWithGoogle(userInfo)
      console.log('Google login successful, user authenticated:', isAuthenticated.value)

      // Navigate to home after successful login
      window.location.href = '/#/home'
    } catch (error) {
      console.error('Google auth failed:', error)
      throw error
    }
  }

  // Set global handler for GIS callback
  window.handleGoogleAuth = handleGoogleAuth

  // Monitor online status
  window.addEventListener('online', () => {
    isOnline.value = true
  })

  window.addEventListener('offline', () => {
    isOnline.value = false
  })

  async function loginWithGoogle(userInfo) {
    console.log('Starting Google login with user info:', userInfo)

    if (!isOnline.value) {
      throw new Error('You must be online to sign in with Google')
    }

    try {
      // Check if user exists by loading current user
      usersStore.initialize()
      let dbUser = usersStore.currentUser
      let isNewUser = false

      console.log('Current user from store:', dbUser)

      if (!dbUser || dbUser.email !== userInfo.email) {
        console.log('Creating new user for Google login')
        // Create new user for Google login
        try {
          dbUser = await usersStore.registerUser({
            email: userInfo.email,
            name: userInfo.name,
            password: '', // Google users don't need passwords
            provider: 'google',
            emailVerified: true, // Google emails are already verified
          })
          isNewUser = true
          console.log('New user created:', dbUser)
        } catch (registerError) {
          console.error('Registration error:', registerError)
          // Handle different types of registration errors
          if (
            registerError.message.includes('already exists') ||
            registerError.name === 'conflict'
          ) {
            console.log('User already exists or conflict detected, trying to find by email')
            // Find existing user by email
            const existingUsers = await getUsersByEmail(userInfo.email)
            if (existingUsers.length > 0) {
              dbUser = existingUsers[0]
              console.log('Found existing user:', dbUser)
              // Update existing user with Google info
              dbUser = await usersStore.updateUserProfile({
                name: userInfo.name,
                picture: userInfo.picture,
                provider: 'google',
                emailVerified: true,
              })
            } else {
              throw registerError
            }
          } else {
            throw registerError
          }
        }
      } else {
        console.log('Updating existing user with Google info')
        // Update existing user with Google info
        dbUser = await usersStore.updateUserProfile({
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
          emailVerified: true,
        })
      }

      if (isNewUser) {
        console.log('Initializing user data for new user')
        // Initialize default user data for new users
        if (dbUser && dbUser._id) {
          await initializeUserData(dbUser._id)
        }

        // Send welcome email for new Google users
        await sendWelcomeEmail(userInfo.email, userInfo.name)
      }

      // Ensure we have a valid user before setting
      if (!dbUser || !dbUser._id) {
        throw new Error('Failed to create or retrieve user')
      }

      console.log('Setting authenticated user:', dbUser)

      // Ensure user is saved in the users store
      usersStore.saveCurrentUser(dbUser)

      // Set authentication state
      user.value = dbUser
      isAuthenticated.value = true

      console.log(
        'Authentication state set - user:',
        user.value,
        'authenticated:',
        isAuthenticated.value,
      )
      return user.value
    } catch (error) {
      console.error('Google login failed:', error)
      throw error
    }
  }

  async function signupWithGoogle(userInfo) {
    // For signup, we'll use the same Google flow
    return await loginWithGoogle(userInfo)
  }

  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    try {
      // Hash password for comparison
      const hashedPassword = CryptoJS.SHA256(password).toString()

      // Try to login with existing users store
      const dbUser = await usersStore.loginUser(email, password)

      if (!dbUser) {
        throw new Error('User not found')
      }

      // Verify password if user has password
      if (dbUser.password && dbUser.password !== hashedPassword) {
        throw new Error('Invalid password')
      }

      // Check if email is verified (for traditional signup)
      if (!dbUser.emailVerified && dbUser.provider === 'traditional') {
        throw new Error('Please verify your email before logging in')
      }

      user.value = dbUser
      isAuthenticated.value = true
      return user.value
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  async function signup(email, password) {
    if (!isOnline.value) {
      throw new Error('You must be online to create an account')
    }

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    try {
      // Check if user already exists
      const existingUsers = await getUsersByEmail(email)
      if (existingUsers.length > 0) {
        throw new Error('User already exists')
      }

      // Create user with hashed password
      const dbUser = await usersStore.registerUser({
        email,
        password,
        name: email.split('@')[0],
      })

      // Initialize default user data
      await initializeUserData(dbUser._id)

      // Send verification email
      const verificationToken = btoa(
        JSON.stringify({ userId: dbUser._id, email, timestamp: Date.now() }),
      )
      await sendWelcomeEmail(email, email.split('@')[0], verificationToken)

      // Don't set as authenticated until email is verified
      throw new Error('Please check your email and verify your account before logging in')
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    usersStore.logoutUser()
  }

  function checkAuth() {
    console.log('Checking authentication state...')
    usersStore.initialize()
    if (usersStore.currentUser) {
      user.value = usersStore.currentUser
      isAuthenticated.value = true
      console.log(
        'Auth state restored - user:',
        user.value?.email,
        'authenticated:',
        isAuthenticated.value,
      )
    } else {
      console.log('No authenticated user found')
    }
  }

  async function verifyEmail(token) {
    try {
      const decoded = JSON.parse(atob(token))
      const { timestamp } = decoded

      // Check if token is expired (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        throw new Error('Verification link has expired')
      }

      // Update user as verified
      const updatedUser = await usersStore.updateUserProfile({ emailVerified: true })

      console.log(
        'Email verification successful for user:',
        updatedUser.email,
        'verified:',
        updatedUser.emailVerified,
      )

      return updatedUser
    } catch (error) {
      console.error('Email verification failed:', error)
      throw error
    }
  }

  // Helper function to find users by email (using the database directly)
  async function getUsersByEmail(email) {
    try {
      const { localDB } = useDatabase()

      // Search for users by email in the database
      const result = await localDB.find({
        selector: {
          type: 'user',
          email: email,
        },
      })

      console.log(`Found ${result.docs.length} user(s) with email:`, email)
      return result.docs
    } catch (error) {
      console.error('Error finding user by email:', error)

      // Fallback to current user check
      usersStore.initialize()
      if (usersStore.currentUser && usersStore.currentUser.email === email) {
        return [usersStore.currentUser]
      }
      return []
    }
  }

  return {
    user,
    isAuthenticated,
    isOnline,
    loginWithGoogle,
    signupWithGoogle,
    login,
    signup,
    logout,
    checkAuth,
    verifyEmail,
  }
})
