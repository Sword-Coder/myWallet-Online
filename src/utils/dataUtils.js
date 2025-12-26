// src/utils/dataUtils.js
// Data manipulation utilities for the new user-centric structure

import { validateDocument, sanitizeDocument } from './schemas.js'

/**
 * Create a complete user document with all associated data
 */
export function createUserDocument(userData) {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const userDoc = {
    _id: userId,
    type: 'user',
    email: userData.email,
    name: userData.name,
    password: userData.password, // Should be hashed before calling this
    provider: userData.provider || 'traditional',
    emailVerified: userData.emailVerified || false,

    // Financial data references
    walletId: `wallet_${userId}`, // Will be created separately
    categoryIds: [], // Will be populated after categories are created
    transactionIds: [],
    budgetIds: [],

    // Sharing configuration
    sharedWithUserIds: [],
    sharedWalletIds: [],
    isSharingEnabled: false,
    sharingStatus: 'single',

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
  }

  return sanitizeDocument(userDoc, 'user')
}

/**
 * Create a wallet document for a user
 */
export function createWalletDocument(userId, walletName = 'Main Wallet') {
  const walletDoc = {
    _id: `wallet_${userId}`,
    type: 'wallet',
    ownerUserId: userId,
    name: walletName,
    balance: 0,
    walletType: 'personal',

    // Sharing arrays
    sharedWithUserIds: [],
    sharedWithWalletIds: [],

    // Optional properties
    currency: 'USD',
    icon: 'account_balance_wallet',

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return sanitizeDocument(walletDoc, 'wallet')
}

/**
 * Create a transaction document
 */
export function createTransactionDocument(transactionData) {
  const transactionDoc = {
    _id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'transaction',
    walletId: transactionData.walletId,
    userId: transactionData.userId,
    kind: transactionData.kind, // 'income', 'expense', 'transfer'
    amount: Number(transactionData.amount),
    categoryId: transactionData.categoryId,
    datetime: transactionData.datetime || new Date().toISOString(),

    // Optional properties
    notes: transactionData.notes || '',
    tags: transactionData.tags || [],
    splitPayment: transactionData.splitPayment || { isSplit: false, splitDetails: {} },

    // 🔧 FIXED: Include budget-related fields
    budgetId: transactionData.budgetId,
    isBudgetAllocation: transactionData.isBudgetAllocation || false,
    isTransfer: transactionData.isTransfer || false,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return sanitizeDocument(transactionDoc, 'transaction')
}

/**
 * Create a budget document
 */
export function createBudgetDocument(budgetData) {
  const budgetDoc = {
    _id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'budget',
    userId: budgetData.userId,
    categoryId: budgetData.categoryId,
    budgetType: budgetData.budgetType || 'monthly',
    periodStart: budgetData.periodStart,
    periodEnd: budgetData.periodEnd,

    // Budget amount or percentage
    amount: budgetData.amount || 0,
    percent: budgetData.percent || 0,
    spent: budgetData.spent || 0,

    // Sharing configuration
    isShared: budgetData.isShared || false,
    sharedWithUserIds: budgetData.sharedWithUserIds || [],

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return sanitizeDocument(budgetDoc, 'budget')
}

/**
 * Update user document with new data references
 */
export function updateUserReferences(userDoc, updates) {
  const updated = { ...userDoc }

  if (updates.walletId) updated.walletId = updates.walletId
  if (updates.categoryIds) updated.categoryIds = updates.categoryIds
  if (updates.transactionIds) updated.transactionIds = updates.transactionIds
  if (updates.budgetIds) updated.budgetIds = updates.budgetIds
  if (updates.sharedWithUserIds) updated.sharedWithUserIds = updates.sharedWithUserIds
  if (updates.sharedWalletIds) updated.sharedWalletIds = updates.sharedWalletIds
  if (updates.sharingStatus) updated.sharingStatus = updates.sharingStatus

  updated.updatedAt = new Date().toISOString()

  return sanitizeDocument(updated, 'user')
}

/**
 * Calculate spending for a budget period
 */
export function calculateBudgetSpending(transactions, categoryId, periodStart, periodEnd) {
  return transactions
    .filter((t) => {
      const transactionDate = new Date(t.datetime)
      return (
        t.categoryId === categoryId &&
        t.kind === 'expense' &&
        transactionDate >= new Date(periodStart) &&
        transactionDate <= new Date(periodEnd)
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Get user's financial summary
 */
export function getUserFinancialSummary(userDoc, transactions, budgets) {
  const userTransactions = transactions.filter((t) => t.userId === userDoc._id)
  const userBudgets = budgets.filter((b) => b.userId === userDoc._id)

  const income = userTransactions
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = userTransactions
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Update budget spent amounts
  const updatedBudgets = userBudgets.map((budget) => {
    const spent = calculateBudgetSpending(
      userTransactions,
      budget.categoryId,
      budget.periodStart,
      budget.periodEnd,
    )
    return { ...budget, spent }
  })

  return {
    income,
    expenses,
    net: income - expenses,
    budgets: updatedBudgets,
  }
}

/**
 * Filter transactions by wallet and date range
 */
export function filterTransactions(transactions, filters = {}) {
  return transactions.filter((t) => {
    // Wallet filter
    if (filters.walletId && filters.walletId !== 'all' && t.walletId !== filters.walletId) {
      return false
    }

    // Category filter
    if (filters.categoryId && t.categoryId !== filters.categoryId) {
      return false
    }

    // Date range filter
    if (filters.dateFrom) {
      const transactionDate = new Date(t.datetime)
      if (transactionDate < new Date(filters.dateFrom)) {
        return false
      }
    }

    if (filters.dateTo) {
      const transactionDate = new Date(t.datetime)
      if (transactionDate > new Date(filters.dateTo)) {
        return false
      }
    }

    // Transaction type filter
    if (filters.kind && t.kind !== filters.kind) {
      return false
    }

    return true
  })
}

/**
 * Group transactions by category
 */
export function groupTransactionsByCategory(transactions) {
  return transactions.reduce((groups, transaction) => {
    const categoryId = transaction.categoryId
    if (!groups[categoryId]) {
      groups[categoryId] = []
    }
    groups[categoryId].push(transaction)
    return groups
  }, {})
}

/**
 * Calculate category totals
 */
export function calculateCategoryTotals(transactions) {
  const grouped = groupTransactionsByCategory(transactions)
  const totals = {}

  Object.keys(grouped).forEach((categoryId) => {
    const categoryTransactions = grouped[categoryId]
    totals[categoryId] = {
      income: categoryTransactions
        .filter((t) => t.kind === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      expense: categoryTransactions
        .filter((t) => t.kind === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      count: categoryTransactions.length,
    }
  })

  return totals
}

/**
 * Get transactions for a specific time period
 */
export function getTransactionsForPeriod(transactions, period = 'current_month') {
  const now = new Date()
  let startDate, endDate

  switch (period) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case 'current_year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      break
    case 'last_30_days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      endDate = now
      break
    default:
      return transactions
  }

  return transactions.filter((t) => {
    const transactionDate = new Date(t.datetime)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

/**
 * Check if database connection is ready for transactions
 */
function isDatabaseConnectionReady(database) {
  try {
    // Check if database is closed or closing
    if (database._state === 'closing' || database._state === 'closed') {
      return false
    }

    // Check if underlying IndexedDB database is ready
    if (database._conn && database._conn.readyState === 'closing') {
      return false
    }

    return true
  } catch (error) {
    console.warn('Error checking database connection state:', error)
    return false
  }
}

/**
 * Wait for database connection to be ready
 */
async function waitForDatabaseReady(database, maxAttempts = 10, delay = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isDatabaseConnectionReady(database)) {
      return true
    }

    console.log(
      `Waiting for database connection to be ready... (attempt ${attempt + 1}/${maxAttempts})`,
    )
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return false
}

/**
 * Validate and save document with error handling and conflict resolution
 */
export async function saveDocument(database, doc, schemaName, retryCount = 0) {
  const maxRetries = 3
  const maxConnectionRetries = 5

  try {
    // Check database connection state first
    if (!isDatabaseConnectionReady(database)) {
      console.log(`Database connection not ready for ${schemaName}, waiting...`)
      const isReady = await waitForDatabaseReady(database, maxConnectionRetries)

      if (!isReady) {
        throw new Error(
          `Database connection failed to become ready after ${maxConnectionRetries} attempts`,
        )
      }
    }

    // Validate document
    const validation = validateDocument(doc, schemaName)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Sanitize document
    const sanitizedDoc = sanitizeDocument(doc, schemaName)

    // Save to database
    await database.put(sanitizedDoc)

    return sanitizedDoc
  } catch (error) {
    console.error(`Error saving ${schemaName}:`, error)

    // Handle IndexedDB connection state errors with retry logic
    if (
      error.name === 'InvalidStateError' &&
      error.message.includes('database connection is closing')
    ) {
      if (retryCount < maxConnectionRetries) {
        console.log(
          `Database connection closing, retrying ${schemaName} save... (attempt ${retryCount + 1}/${maxConnectionRetries})`,
        )
        await new Promise((resolve) => setTimeout(resolve, 100 * (retryCount + 1))) // Exponential backoff
        return saveDocument(database, doc, schemaName, retryCount + 1)
      } else {
        throw new Error(
          `Failed to save ${schemaName} after ${maxConnectionRetries} connection attempts: ${error.message}`,
        )
      }
    }

    // Handle PouchDB conflict errors with retry logic
    if (error.name === 'conflict' && retryCount < maxRetries) {
      console.log(
        `Conflict detected for ${schemaName}, retrying... (attempt ${retryCount + 1}/${maxRetries})`,
      )

      try {
        // Get the latest version from database
        const latestDoc = await database.get(doc._id)

        // Re-sanitize the original document
        const freshSanitizedDoc = sanitizeDocument(doc, schemaName)

        // Merge the changes (for user documents, prefer incoming data)
        const mergedDoc = { ...latestDoc, ...freshSanitizedDoc }
        mergedDoc.updatedAt = new Date().toISOString()

        // Remove revision info to avoid conflicts
        delete mergedDoc._rev

        // Retry with merged document
        return await saveDocument(database, mergedDoc, schemaName, retryCount + 1)
      } catch (mergeError) {
        console.error(`Failed to resolve conflict for ${schemaName}:`, mergeError)
        throw new Error(
          `Failed to save ${schemaName} after conflict resolution: ${mergeError.message}`,
        )
      }
    }

    throw error
  }
}

/**
 * Batch save documents
 */
export async function saveDocumentsBatch(database, documents, schemaName) {
  const results = []
  const errors = []

  for (const doc of documents) {
    try {
      const result = await saveDocument(database, doc, schemaName)
      results.push(result)
    } catch (error) {
      errors.push({ doc, error: error.message })
    }
  }

  return { results, errors }
}

/**
 * Get documents by type with filtering
 */
export async function getDocumentsByType(database, type, filters = {}) {
  try {
    const result = await database.find({
      selector: { type },
      ...filters,
    })
    return result.docs
  } catch (error) {
    console.error(`Error fetching ${type} documents:`, error)
    return []
  }
}
