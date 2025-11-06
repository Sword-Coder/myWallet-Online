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

  // Monitor online status
  window.addEventListener('online', () => {
    isOnline.value = true
  })

  window.addEventListener('offline', () => {
    isOnline.value = false
  })

  async function loginWithGoogle() {
    if (!isOnline.value) {
      throw new Error('You must be online to sign in with Google')
    }

    try {
      // Get the Google Auth instance from global reference
      const googleAuthInstance = window.$googleAuth
      if (!googleAuthInstance) {
        throw new Error('Google Auth not available')
      }

      // Use the correct method for this library
      const userInfo = await googleAuthInstance.signIn()

      // Check if user exists in database
      let dbUser = await usersStore.findUserByEmail(userInfo.email)

      if (!dbUser) {
        // Create new user
        dbUser = await usersStore.createUser({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
          emailVerified: true, // Google accounts are pre-verified
        })

        // Initialize default user data
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

  async function signupWithGoogle() {
    // For signup, we'll use the same Google flow
    return await loginWithGoogle()
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
