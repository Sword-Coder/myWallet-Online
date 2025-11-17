// src/composables/useDatabase.js
import PouchDB from 'pouchdb-browser'
import PouchFind from 'pouchdb-find'
import { ref } from 'vue'

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

async function ensureIndexes() {
  await localDB.createIndex({
    index: { fields: ['type'] },
  })
}

ensureIndexes()

export function useDatabase() {
  async function getAllDocs(type) {
    const result = await localDB.find({ selector: { type } })
    return result.docs
  }

  async function saveDoc(doc) {
    if (!doc._id) doc._id = `${doc.type}_${Date.now()}`
    doc.updatedAt = new Date().toISOString()
    await localDB.put(doc)
  }

  async function deleteDoc(doc) {
    try {
      // Delete from local database first
      await localDB.remove(doc)
      console.log('Document deleted from local DB:', doc._id)

      // Also delete from remote server if it's a transaction
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

  return {
    getAllDocs,
    saveDoc,
    deleteDoc,
    localDB,
  }
}

// Reusable transaction utilities for consistent behavior across pages
export function useTransactions() {
  function getRecentTransactions(transactions, activeWallet = 'all', limit = 5) {
    const filtered =
      activeWallet === 'all'
        ? transactions
        : transactions.filter((t) => t.walletId === activeWallet)

    const sorted = filtered
      .filter((t) => t && t._id) // Ensure valid transactions
      .sort((a, b) => {
        // Create full datetime strings for proper comparison
        const dateTimeA = `${a.date}T${a.time || '00:00:00'}`
        const dateTimeB = `${b.date}T${b.time || '00:00:00'}`

        // Compare as full datetime (most recent first)
        return new Date(dateTimeB) - new Date(dateTimeA)
      })

    // Return limited number of transactions
    return sorted.slice(0, Math.min(limit, sorted.length))
  }

  function formatTransactionDateTime(dateStr, timeStr) {
    const date = new Date(`${dateStr}T${timeStr || '00:00:00'}`)
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
