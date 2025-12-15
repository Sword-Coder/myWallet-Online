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
  const isInitialized = ref(false)

  // Load current user from localStorage
  function loadCurrentUser() {
    try {
      const saved = localStorage.getItem('currentUser')
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        currentUser.value = JSON.parse(saved)
        console.log('UsersStore: User loaded from localStorage:', {
          id: currentUser.value?._id,
          name: currentUser.value?.name,
          hasTransactionIds: !!(currentUser.value?.transactionIds?.length > 0),
        })
        return true
      } else {
        // Clear invalid data from localStorage
        if (saved && (saved === 'undefined' || saved.trim() === '')) {
          localStorage.removeItem('currentUser')
        }
      }
    } catch (err) {
      console.error('UsersStore: Failed to load current user:', err)
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
      console.log('UsersStore: User saved to localStorage:', {
        id: user?._id,
        name: user?.name,
        hasTransactionIds: !!(user?.transactionIds?.length > 0),
      })
    } catch (err) {
      console.error('UsersStore: Failed to save current user:', err)
    }
  }

  // Clear current user
  function clearCurrentUser() {
    currentUser.value = null
    userData.value = null
    localStorage.removeItem('currentUser')
    isInitialized.value = false
    console.log('UsersStore: User cleared')
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

      console.log('UsersStore: User created successfully:', userDoc)

      // Save as current user
      saveCurrentUser(userDoc)
      isInitialized.value = true

      return userDoc
    } catch (err) {
      error.value = err.message
      console.error('UsersStore: Registration failed:', err)
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
      isInitialized.value = true

      console.log('UsersStore: User logged in successfully:', {
        id: dbUser._id,
        name: dbUser.name,
        hasTransactionIds: !!(dbUser.transactionIds?.length > 0),
      })

      return dbUser
    } catch (err) {
      error.value = err.message
      console.error('UsersStore: Login failed:', err)
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
      console.error('UsersStore: Failed to load user data:', err)
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

      console.log('UsersStore: Force reloading user data with database sync...')

      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 3000) // 3 second timeout

        localDB
          .sync(remoteDB, {
            live: false,
            retry: false,
          })
          .on('complete', () => {
            clearTimeout(timeout)
            console.log('UsersStore: Force sync completed')
            resolve()
          })
          .on('error', (err) => {
            clearTimeout(timeout)
            console.warn('UsersStore: Force sync failed:', err)
            resolve() // Continue even if sync fails
          })
      })

      // Now reload user data
      const data = await getUserWithData(targetUserId)
      userData.value = data

      console.log('UsersStore: User data force reloaded:', {
        userId: data.user?._id,
        wallets: data.wallets?.length || 0,
        categories: data.categories?.length || 0,
        transactions: data.transactions?.length || 0,
        budgets: data.budgets?.length || 0,
      })

      return data
    } catch (err) {
      error.value = err.message
      console.error('UsersStore: Failed to force reload user data:', err)
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

      console.log('UsersStore: User profile updated in database:', savedUser)

      // Update local state only if we updated the current user
      if (!user || (user && user._id === currentUser.value?._id)) {
        saveCurrentUser(savedUser)
      }

      return savedUser
    } catch (err) {
      error.value = err.message
      console.error('UsersStore: Failed to update user profile:', err)
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
    console.log('UsersStore: Sharing wallet:', walletId, 'with user:', userIdToShareWith)

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

  // Initialize store with better error handling
  function initialize() {
    try {
      console.log('UsersStore: Initializing store...')
      const loaded = loadCurrentUser()
      isInitialized.value = true
      console.log('UsersStore: Store initialized:', {
        userLoaded: loaded,
        hasUser: !!currentUser.value,
        userId: currentUser.value?._id,
      })
      return loaded
    } catch (err) {
      console.error('UsersStore: Failed to initialize store:', err)
      isInitialized.value = true // Still mark as initialized to prevent infinite loading
      return false
    }
  }

  // Wait for store initialization
  async function waitForInitialization(maxWait = 5000) {
    const startTime = Date.now()

    // If already initialized, check if we have a user
    if (isInitialized.value) {
      if (currentUser.value) {
        console.log('UsersStore: Already initialized with user')
        return true
      } else {
        console.log('UsersStore: Initialized but no user found')
        return false
      }
    }

    // Wait for initialization
    while (Date.now() - startTime < maxWait) {
      if (isInitialized.value) {
        if (currentUser.value) {
          console.log('UsersStore: Initialization complete with user')
          return true
        } else {
          console.log('UsersStore: Initialization complete but no user')
          return false
        }
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log('UsersStore: Initialization timeout')
    return false
  }

  return {
    // State
    currentUser,
    userData,
    isLoading,
    error,
    isInitialized,

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
    waitForInitialization,
  }
})
