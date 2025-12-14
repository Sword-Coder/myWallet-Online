// src/composables/useDatabase.js
import PouchDB from 'pouchdb-browser'
import PouchFind from 'pouchdb-find'
import { ref } from 'vue'
import { generateId } from 'src/utils/schemas.js'
import {
  createUserDocument,
  createWalletDocument,
  createTransactionDocument,
  createBudgetDocument,
  saveDocument,
} from 'src/utils/dataUtils.js'

PouchDB.plugin(PouchFind) // <-- enable the .find() method

const localDB = new PouchDB('finance_local')

// Use environment variables for database configuration
const couchDBUrl = import.meta.env.VITE_COUCHDB_URL || 'https://server.themission.site'
const dbName = import.meta.env.VITE_COUCHDB_DB_NAME || 'mywallet_db'
const dbUsername = import.meta.env.VITE_COUCHDB_USERNAME || 'root'
const dbPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'Sharpest2Mind'

const remoteDB = new PouchDB(`${couchDBUrl}/${dbName}`, {
  auth: { username: dbUsername, password: dbPassword },
})

// Continuous live sync
localDB
  .sync(remoteDB, {
    live: true,
    retry: true,
  })
  .on('change', (info) => {
    console.log('DB synced:', info)
  })
  .on('error', (err) => {
    console.error('Sync error:', err)
  })

// Enhanced indexes for new user-centric structure
async function ensureIndexes() {
  // Basic type index
  await localDB.createIndex({
    index: { fields: ['type'] },
  })

  // User-specific indexes
  await localDB.createIndex({
    index: { fields: ['type', 'ownerUserId'] },
  })

  await localDB.createIndex({
    index: { fields: ['type', 'userId'] },
  })

  // Category indexes
  await localDB.createIndex({
    index: { fields: ['type', 'createdByUserId'] },
  })

  await localDB.createIndex({
    index: { fields: ['type', 'sharedWithUserIds'] },
  })

  // Transaction indexes
  await localDB.createIndex({
    index: { fields: ['type', 'walletId', 'datetime'] },
  })

  await localDB.createIndex({
    index: { fields: ['type', 'categoryId'] },
  })
}

ensureIndexes()

// Database connection recovery helper
async function ensureDatabaseConnection() {
  try {
    // Test database connection with a simple operation
    await localDB.info()
    return true
  } catch (error) {
    console.warn('Database connection test failed, attempting recovery:', error)

    // Wait a bit and try again
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      await localDB.info()
      return true
    } catch (retryError) {
      console.error('Database connection recovery failed:', retryError)
      return false
    }
  }
}

export function useDatabase() {
  // Get documents by type with optional filtering
  async function getAllDocs(type, filters = {}) {
    try {
      const selector = { type, ...filters }
      const result = await localDB.find({ selector })
      return result.docs
    } catch (error) {
      console.error(`Error fetching ${type} documents:`, error)
      return []
    }
  }

  // Enhanced save function with validation and conflict resolution
  async function saveDoc(doc, schemaName = null, retryCount = 0) {
    const maxRetries = 3

    try {
      // If this is an update (doc has _id), handle it with conflict resolution
      if (doc._id) {
        try {
          // Always get the latest version of the document to avoid conflicts
          const existingDoc = await localDB.get(doc._id)
          console.log(
            'Retrieved existing document for update:',
            existingDoc._id,
            'rev:',
            existingDoc._rev,
          )

          // Merge the existing document with the updates
          const updatedDoc = {
            ...existingDoc,
            ...doc,
            _rev: existingDoc._rev, // Explicitly preserve the current revision
            updatedAt: new Date().toISOString(),
          }

          // If schema validation is requested, validate the merged document
          if (schemaName) {
            const validatedDoc = await saveDocument(localDB, updatedDoc, schemaName)
            return validatedDoc
          }

          // Save the updated document
          console.log('Saving updated document:', updatedDoc._id, 'with rev:', updatedDoc._rev)
          const result = await localDB.put(updatedDoc)
          console.log('Document saved successfully, new rev:', result.rev)

          // Return the updated document with the new revision
          return { ...updatedDoc, _rev: result.rev }
        } catch (getError) {
          // If document doesn't exist, treat as new document
          if (getError.name === 'not_found') {
            console.log('Document not found, creating new:', doc._id)
            if (schemaName) {
              const validatedDoc = await saveDocument(localDB, doc, schemaName)
              return validatedDoc
            }

            // Fallback for new documents
            if (!doc._id) doc._id = `${doc.type}_${Date.now()}`
            doc.updatedAt = new Date().toISOString()
            doc.createdAt = doc.createdAt || new Date().toISOString()
            const result = await localDB.put(doc)
            return { ...doc, _rev: result.rev }
          }

          // If it's a conflict error and we haven't exceeded max retries, retry
          if (getError.name === 'conflict' && retryCount < maxRetries) {
            console.log(`Conflict detected, retrying (${retryCount + 1}/${maxRetries})...`)
            await new Promise((resolve) => setTimeout(resolve, 100 * (retryCount + 1))) // Exponential backoff
            return saveDoc(doc, schemaName, retryCount + 1)
          }

          throw getError
        }
      }

      // If schema name is provided, validate and sanitize
      if (schemaName) {
        const validatedDoc = await saveDocument(localDB, doc, schemaName)
        return validatedDoc
      }

      // Fallback to old behavior for backward compatibility
      if (!doc._id) doc._id = `${doc.type}_${Date.now()}`
      doc.updatedAt = new Date().toISOString()
      doc.createdAt = doc.createdAt || new Date().toISOString()
      const result = await localDB.put(doc)
      return { ...doc, _rev: result.rev }
    } catch (error) {
      console.error('Error saving document:', error)

      // If it's a conflict error and we haven't exceeded max retries, retry
      if (error.name === 'conflict' && retryCount < maxRetries) {
        console.log(`Conflict error, retrying (${retryCount + 1}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, 100 * (retryCount + 1))) // Exponential backoff
        return saveDoc(doc, schemaName, retryCount + 1)
      }

      throw error
    }
  }

  // Enhanced delete function
  async function deleteDoc(doc) {
    try {
      // Delete from local database first
      await localDB.remove(doc)
      console.log('Document deleted from local DB:', doc._id)

      // For transactions, also try to delete from remote server
      if (doc.type === 'transaction') {
        try {
          await remoteDB.remove(doc)
          console.log('Document deleted from remote server:', doc._id)
        } catch (remoteError) {
          console.error('Failed to delete from remote server:', remoteError)
          // Don't throw error here - local deletion succeeded
          // The sync will handle retrying remote deletion
          throw new Error(
            'Transaction deleted locally but failed to delete from server. It will be synced when connection is restored.',
          )
        }
      }
    } catch (localError) {
      console.error('Failed to delete from local DB:', localError)
      throw localError // Re-throw local errors as they're critical
    }
  }

  // Get user with all their data
  async function getUserWithData(userId) {
    try {
      const user = await localDB.get(userId)

      // Get all related documents
      const [wallets, categories, transactions, budgets] = await Promise.all([
        getAllDocs('wallet', { ownerUserId: userId }),
        getAllDocs('category', { createdByUserId: userId }),
        getAllDocs('transaction', { userId: userId }),
        getAllDocs('budget', { userId: userId }),
      ])

      return {
        user,
        wallets,
        categories,
        transactions,
        budgets,
      }
    } catch (error) {
      if (error.name === 'not_found') {
        console.warn(`User not found: ${userId}`)
        throw new Error('User not found')
      }
      console.error('Error fetching user with data:', error)
      throw error
    }
  }

  // Create new user with complete setup
  async function createUser(userData) {
    console.log('Creating user with data:', userData)

    try {
      // Validate input data
      if (!userData || !userData.email || !userData.name) {
        throw new Error('Invalid user data: email and name are required')
      }

      // Ensure database connection is ready
      console.log('Ensuring database connection is ready...')
      const isConnectionReady = await ensureDatabaseConnection()
      if (!isConnectionReady) {
        throw new Error('Database connection could not be established')
      }

      // Create user document
      const userDoc = createUserDocument(userData)
      console.log('Created user document:', userDoc)

      // Create default wallet
      const walletDoc = createWalletDocument(userDoc._id, 'Main Wallet')
      console.log('Created wallet document:', walletDoc)

      // Create default categories
      const categories = [
        {
          _id: generateId('category'),
          type: 'category',
          name: 'Tithes',
          kind: 'expense',
          icon: 'volunteer_activism',
          color: 'red-5',
          description: 'Religious giving - 10% of income',
          isShared: true,
          createdByUserId: userDoc._id,
          sharedWithUserIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: generateId('category'),
          type: 'category',
          name: 'Groceries',
          kind: 'expense',
          icon: 'shopping_cart',
          color: 'red-5',
          description: 'Food and groceries',
          isShared: true,
          createdByUserId: userDoc._id,
          sharedWithUserIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: generateId('category'),
          type: 'category',
          name: 'Salary',
          kind: 'income',
          icon: 'work',
          color: 'green-5',
          description: 'Employment income',
          isShared: true,
          createdByUserId: userDoc._id,
          sharedWithUserIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      console.log('Saving user documents with schema validation...')

      // Save wallet and categories first with connection checking
      await saveDocument(localDB, walletDoc, 'wallet')
      console.log('Saved wallet document')

      // Save categories with proper schema validation
      const savedCategories = []
      for (const category of categories) {
        const savedCategory = await saveDocument(localDB, category, 'category')
        savedCategories.push(savedCategory)
      }
      console.log('Saved categories:', savedCategories.length)

      // Update user with complete references and save only once
      userDoc.walletId = walletDoc._id
      userDoc.categoryIds = savedCategories.map((c) => c._id)

      const finalUserDoc = await saveDocument(localDB, userDoc, 'user')
      console.log('Saved user document with all references:', finalUserDoc)

      return finalUserDoc // Return the user document
    } catch (error) {
      console.error('Error in createUser:', error)
      throw error
    }
  }

  // Create new transaction
  async function createTransaction(transactionData) {
    try {
      const transactionDoc = createTransactionDocument(transactionData)
      return await saveDocument(localDB, transactionDoc, 'transaction')
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  // Create new budget
  async function createBudget(budgetData) {
    try {
      const budgetDoc = createBudgetDocument(budgetData)
      return await saveDocument(localDB, budgetDoc, 'budget')
    } catch (error) {
      console.error('Error creating budget:', error)
      throw error
    }
  }

  // Get transactions for a user with optional filters
  async function getUserTransactions(userId, filters = {}) {
    try {
      const selector = { type: 'transaction', userId, ...filters }
      const result = await localDB.find({ selector })
      return result.docs
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      return []
    }
  }

  // Get budgets for a user
  async function getUserBudgets(userId) {
    try {
      const selector = { type: 'budget', userId }
      const result = await localDB.find({ selector })
      return result.docs
    } catch (error) {
      console.error('Error fetching user budgets:', error)
      return []
    }
  }

  // Get categories accessible to a user
  async function getUserCategories(userId) {
    try {
      const selector = {
        type: 'category',
        $or: [{ createdByUserId: userId }, { sharedWithUserIds: { $elemMatch: { $eq: userId } } }],
      }
      const result = await localDB.find({ selector })
      return result.docs
    } catch (error) {
      console.error('Error fetching user categories:', error)
      return []
    }
  }

  return {
    getAllDocs,
    saveDoc,
    deleteDoc,
    getUserWithData,
    createUser,
    createTransaction,
    createBudget,
    getUserTransactions,
    getUserBudgets,
    getUserCategories,
    localDB,
  }
}

// Updated transaction utilities for new structure
export function useTransactions() {
  function getRecentTransactions(transactions, activeWallet = 'all', limit = 5) {
    const filtered =
      activeWallet === 'all'
        ? transactions
        : transactions.filter((t) => t.walletId === activeWallet)

    const sorted = filtered
      .filter((t) => t && t._id) // Ensure valid transactions
      .sort((a, b) => {
        // Sort by datetime field (new structure) or fallback to date+time
        const dateTimeA = a.datetime || `${a.date}T${a.time || '00:00:00'}`
        const dateTimeB = b.datetime || `${b.date}T${b.time || '00:00:00'}`

        // Compare as full datetime (most recent first)
        return new Date(dateTimeB) - new Date(dateTimeA)
      })

    // Return limited number of transactions
    return sorted.slice(0, Math.min(limit, sorted.length))
  }

  function formatTransactionDateTime(transaction) {
    // Use datetime field if available, otherwise combine date and time
    const dateTime = transaction.datetime || `${transaction.date}T${transaction.time || '00:00:00'}`
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return {
    getRecentTransactions,
    formatTransactionDateTime,
  }
}

/**
 * Smart Scrollbar Manager
 * Hides scrollbars during scrolling, shows them when scrolling stops
 */
let scrollTimeout = null
let isScrolling = false

export function useSmartScrollbar() {
  const scrollbarElements = ref([])

  const hideScrollbars = () => {
    scrollbarElements.value.forEach((element) => {
      if (element && element.classList) {
        element.classList.add('scrollbar-hidden')
        element.classList.remove('scrollbar-visible')
      }
    })
  }

  const showScrollbars = () => {
    scrollbarElements.value.forEach((element) => {
      if (element && element.classList) {
        element.classList.add('scrollbar-visible')
        element.classList.remove('scrollbar-hidden')
      }
    })
  }

  const handleScrollStart = () => {
    if (!isScrolling) {
      isScrolling = true
      hideScrollbars()
    }

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // Set new timeout to show scrollbars when scrolling stops
    scrollTimeout = setTimeout(() => {
      isScrolling = false
      showScrollbars()
    }, 150) // Show scrollbar 150ms after scrolling stops
  }

  const addScrollableElement = (element) => {
    if (element && !scrollbarElements.value.includes(element)) {
      scrollbarElements.value.push(element)

      // Add scroll event listener
      element.addEventListener('scroll', handleScrollStart)

      // Add mouseenter listener to show scrollbar on hover
      element.addEventListener('mouseenter', () => {
        if (!isScrolling) {
          showScrollbars()
        }
      })

      // Add mouseleave listener to hide scrollbar when not hovering
      element.addEventListener('mouseleave', () => {
        if (!isScrolling) {
          hideScrollbars()
        }
      })
    }
  }

  const removeScrollableElement = (element) => {
    const index = scrollbarElements.value.indexOf(element)
    if (index > -1) {
      scrollbarElements.value.splice(index, 1)
      element.removeEventListener('scroll', handleScrollStart)
      element.removeEventListener('mouseenter', showScrollbars)
      element.removeEventListener('mouseleave', hideScrollbars)
    }
  }

  // Auto-initialize on mount
  if (typeof window !== 'undefined') {
    // Detect scrollable elements on the page
    const detectScrollableElements = () => {
      const scrollableSelectors = [
        '.q-page',
        '.q-card',
        '.q-list',
        '.q-scrollarea',
        '.dialog-content',
        '.icon-grid',
        '.calculator-keypad',
      ]

      scrollableSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element) => {
          if (element.scrollHeight > element.clientHeight) {
            addScrollableElement(element)
          }
        })
      })
    }

    // Initial detection after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', detectScrollableElements)
    } else {
      setTimeout(detectScrollableElements, 100)
    }

    // Watch for dynamically added elements
    const observer = new MutationObserver(detectScrollableElements)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  return {
    addScrollableElement,
    removeScrollableElement,
    showScrollbars,
    hideScrollbars,
  }
}
