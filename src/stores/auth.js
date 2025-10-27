import { defineStore } from 'pinia'
import { ref, inject } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isOnline = ref(navigator.onLine)

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
      // Get the Google Auth instance from the app
      const googleAuthInstance = inject('$googleAuth')
      if (!googleAuthInstance) {
        throw new Error('Google Auth not available')
      }

      // Use the correct method for this library
      const userInfo = await googleAuthInstance.signIn()

      user.value = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        provider: 'google',
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

  function login(email, password) {
    // Keep traditional login for backward compatibility
    if (email && password) {
      user.value = { email, provider: 'traditional' }
      isAuthenticated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function signup(email, password) {
    // Traditional signup - only works online
    if (!isOnline.value) {
      throw new Error('You must be online to create an account')
    }

    if (email && password) {
      user.value = { email, provider: 'traditional' }
      isAuthenticated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
    }
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
  }
})
