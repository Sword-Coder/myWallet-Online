import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUsersStore } from './users'
import { useUserData } from 'src/composables/useUserData'
import { useEmail } from 'src/composables/useEmail'

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
    if (!isOnline.value) {
      throw new Error('You must be online to sign in with Google')
    }

    try {
      // Check if user exists in database
      let dbUser = await usersStore.findUserByEmail(userInfo.email)
      let isNewUser = false

      if (!dbUser) {
        // Create new user
        dbUser = await usersStore.createUser({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
          emailVerified: true, // Google accounts are pre-verified
        })
        isNewUser = true
      } else {
        // Update existing user with Google info and verify email
        dbUser = await usersStore.updateUser(dbUser._id, {
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
          emailVerified: true, // Verify email when using Google
        })
      }

      if (isNewUser) {
        // Initialize default user data for new users
        await initializeUserData(dbUser._id)

        // Send welcome email for new Google users
        await sendWelcomeEmail(userInfo.email, userInfo.name)
      }

      user.value = {
        _id: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        picture: dbUser.picture || userInfo.picture,
        provider: dbUser.provider,
        emailVerified: dbUser.emailVerified,
      }
      isAuthenticated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
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

    // Force fresh load of users data
    await usersStore.loadUsers()

    const dbUser = await usersStore.findUserByEmail(email)
    if (!dbUser) {
      throw new Error('User not found')
    }

    if (!dbUser.password) {
      throw new Error('This account was created with Google. Please use Google login.')
    }

    console.log('Login attempt for user:', dbUser.email, 'verified:', dbUser.emailVerified)

    if (!dbUser.emailVerified) {
      throw new Error('Please verify your email before logging in')
    }

    const isValidPassword = await usersStore.verifyPassword(password, dbUser.password)
    if (!isValidPassword) {
      throw new Error('Invalid password')
    }

    user.value = {
      _id: dbUser._id,
      email: dbUser.email,
      name: dbUser.name,
      provider: dbUser.provider,
      emailVerified: dbUser.emailVerified,
    }
    isAuthenticated.value = true
    localStorage.setItem('user', JSON.stringify(user.value))
    return user.value
  }

  async function signup(email, password) {
    if (!isOnline.value) {
      throw new Error('You must be online to create an account')
    }

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Check if user already exists
    const existingUser = await usersStore.findUserByEmail(email)
    if (existingUser) {
      throw new Error('User already exists')
    }

    // Create user with hashed password
    const dbUser = await usersStore.createUser({
      email,
      password,
      provider: 'traditional',
      emailVerified: false,
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
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('user')
  }

  function checkAuth() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    }
  }

  async function verifyEmail(token) {
    try {
      const decoded = JSON.parse(atob(token))
      const { userId, timestamp } = decoded

      // Check if token is expired (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        throw new Error('Verification link has expired')
      }

      // Update user as verified
      const updatedUser = await usersStore.updateUser(userId, { emailVerified: true })

      // Force reload users to ensure fresh data
      await usersStore.loadUsers()

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
