// src/stores/users.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import CryptoJS from 'crypto-js'
import { useDatabase } from 'src/composables/useDatabase'
import PouchDB from 'pouchdb-browser'

export const useUsersStore = defineStore('users', () => {
  const { createUser, getUserWithData } = useDatabase()

  // State
  const currentUser = ref(null)
  const userData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Load current user from localStorage
  function loadCurrentUser() {
    try {
      const saved = localStorage.getItem('currentUser')
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        currentUser.value = JSON.parse(saved)
        return true
      } else {
        // Clear invalid data from localStorage
        if (saved && (saved === 'undefined' || saved.trim() === '')) {
          localStorage.removeItem('currentUser')
        }
      }
    } catch (err) {
      console.error('Failed to load current user:', err)
      // Clear corrupted data from localStorage
      localStorage.removeItem('currentUser')
    }
    return false
  }

  // Save current user to localStorage
  function saveCurrentUser(user) {
    try {
      currentUser.value = user
      localStorage.setItem('currentUser', JSON.stringify(user))
    } catch (err) {
      console.error('Failed to save current user:', err)
    }
  }

  // Clear current user
  function clearCurrentUser() {
    currentUser.value = null
    userData.value = null
    localStorage.removeItem('currentUser')
  }

  // Register new user
  async function registerUser(userData) {
    isLoading.value = true
    error.value = null

    try {
      // Hash password before creating user (only for traditional auth)
      const hashedPassword = userData.password ? CryptoJS.SHA256(userData.password).toString() : ''

      const userDoc = await createUser({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        provider: userData.provider || 'traditional',
        emailVerified: userData.emailVerified || false,
      })

      console.log('User created successfully:', userDoc)

      // Save as current user
      saveCurrentUser(userDoc)

      return userDoc
    } catch (err) {
      error.value = err.message
      console.error('Registration failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Login user
  async function loginUser(email, password) {
    isLoading.value = true
    error.value = null

    try {
      // Search database for user by email
      const { localDB } = useDatabase()

      const result = await localDB.find({
        selector: {
          type: 'user',
          email: email,
        },
      })

      if (result.docs.length === 0) {
        throw new Error('User not found')
      }

      const dbUser = result.docs[0]

      // Check if user has password (traditional users have passwords, Google users don't)
      if (!dbUser.password && dbUser.provider === 'traditional') {
        throw new Error('User account not properly configured')
      }

      // Verify password for traditional users
      if (dbUser.provider === 'traditional') {
        const hashedInput = CryptoJS.SHA256(password).toString()
        if (dbUser.password !== hashedInput) {
          throw new Error('Invalid password')
        }
      }

      // Check if email is verified for traditional users
      if (dbUser.provider === 'traditional' && !dbUser.emailVerified) {
        throw new Error('Please verify your email before logging in')
      }

      // Save user as current user
      saveCurrentUser(dbUser)

      return dbUser
    } catch (err) {
      error.value = err.message
      console.error('Login failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  function logoutUser() {
    clearCurrentUser()
  }

  // Load user's complete data
  async function loadUserData(userId = null) {
    const targetUserId = userId || currentUser.value?._id
    if (!targetUserId) {
      throw new Error('No user ID provided')
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await getUserWithData(targetUserId)
      userData.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to load user data:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Force reload user data from database (with sync)
  async function forceReloadUserData(userId = null) {
    const targetUserId = userId || currentUser.value?._id
    if (!targetUserId) {
      throw new Error('No user ID provided')
    }

    isLoading.value = true
    error.value = null

    try {
      // Force sync first
      const { localDB } = useDatabase()
      const couchDBUrl = import.meta.env.VITE_COUCHDB_URL || 'https://server.themission.site'
      const dbName = import.meta.env.VITE_COUCHDB_DB_NAME || 'mywallet_db'
      const dbUsername = import.meta.env.VITE_COUCHDB_USERNAME || 'root'
      const dbPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'Sharpest2Mind'

      const remoteDB = new PouchDB(`${couchDBUrl}/${dbName}`, {
        auth: { username: dbUsername, password: dbPassword },
      })

      console.log('Force reloading user data with database sync...')

      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 3000) // 3 second timeout

        localDB
          .sync(remoteDB, {
            live: false,
            retry: false,
          })
          .on('complete', () => {
            clearTimeout(timeout)
            console.log('Force sync completed')
            resolve()
          })
          .on('error', (err) => {
            clearTimeout(timeout)
            console.warn('Force sync failed:', err)
            resolve() // Continue even if sync fails
          })
      })

      // Now reload user data
      const data = await getUserWithData(targetUserId)
      userData.value = data

      console.log('User data force reloaded:', {
        userId: data.user?._id,
        wallets: data.wallets?.length || 0,
        categories: data.categories?.length || 0,
        transactions: data.transactions?.length || 0,
        budgets: data.budgets?.length || 0,
      })

      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to force reload user data:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update user profile
  async function updateUserProfile(updates, user = null) {
    // If no user provided, use current user (backward compatibility)
    const targetUser = user || currentUser.value

    if (!targetUser) {
      throw new Error('No user provided for profile update')
    }

    isLoading.value = true
    error.value = null

    try {
      const updatedUser = {
        ...targetUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      // Save to database using the database composable
      const { saveDoc } = useDatabase()
      const savedUser = await saveDoc(updatedUser, 'user')

      console.log('User profile updated in database:', savedUser)

      // Update local state only if we updated the current user
      if (!user || (user && user._id === currentUser.value?._id)) {
        saveCurrentUser(savedUser)
      }

      return savedUser
    } catch (err) {
      error.value = err.message
      console.error('Failed to update user profile:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Enable/disable sharing
  async function toggleSharing(enabled) {
    if (!currentUser.value) {
      throw new Error('No user logged in')
    }

    const updates = {
      isSharingEnabled: enabled,
      sharingStatus: enabled ? 'single' : 'disabled',
    }

    return await updateUserProfile(updates)
  }

  // Share wallet with another user
  async function shareWallet(walletId, userIdToShareWith) {
    if (!currentUser.value) {
      throw new Error('No user logged in')
    }

    // This would involve updating wallet permissions
    // Implementation would depend on the sharing mechanism
    console.log('Sharing wallet:', walletId, 'with user:', userIdToShareWith)

    // For now, just update the user's sharedWalletIds
    const updatedUser = {
      ...currentUser.value,
      sharedWalletIds: [...(currentUser.value.sharedWalletIds || []), walletId],
      updatedAt: new Date().toISOString(),
    }

    saveCurrentUser(updatedUser)
    return updatedUser
  }

  // Stop sharing wallet
  async function stopSharingWallet(walletId) {
    if (!currentUser.value) {
      throw new Error('No user logged in')
    }

    const updatedUser = {
      ...currentUser.value,
      sharedWalletIds: (currentUser.value.sharedWalletIds || []).filter((id) => id !== walletId),
      updatedAt: new Date().toISOString(),
    }

    saveCurrentUser(updatedUser)
    return updatedUser
  }

  // Initialize store
  function initialize() {
    loadCurrentUser()
  }

  return {
    // State
    currentUser,
    userData,
    isLoading,
    error,

    // User management
    registerUser,
    loginUser,
    logoutUser,
    loadUserData,
    forceReloadUserData,
    updateUserProfile,

    // Sharing features
    toggleSharing,
    shareWallet,
    stopSharingWallet,

    // Utility functions
    loadCurrentUser,
    saveCurrentUser,
    clearCurrentUser,
    initialize,
  }
})
