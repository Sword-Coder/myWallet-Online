// src/stores/finances.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDatabase } from 'src/composables/useDatabase'
import { useUsersStore } from 'src/stores/users'
import { useCategoriesStore } from 'src/stores/categories'
import { useBudgetsStore } from 'src/stores/budgets'
import {
  filterTransactions,
  getUserFinancialSummary,
  updateUserReferences,
} from 'src/utils/dataUtils'
import { generateId } from 'src/utils/schemas'

export const useFinancesStore = defineStore('finances', () => {
  const database = useDatabase()
  const { createTransaction, getUserWithData, saveDoc, deleteDoc, localDB } = database
  const usersStore = useUsersStore()
  const categoriesStore = useCategoriesStore()
  const budgetsStore = useBudgetsStore()

  // State
  const wallets = ref([])
  const transactions = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const activeWalletId = ref(null)
  const lastLoadTime = ref(null)

  // Enhanced sync user's transactionIds array with actual transactions in database
  async function syncUserTransactionIds() {
    if (!usersStore.currentUser) {
      console.log('FinancesStore: No user to sync transactionIds')
      return
    }

    try {
      console.log('FinancesStore: Starting transactionIds sync...')

      // Get fresh user data
      const userData = await getUserWithData(usersStore.currentUser._id)
      const actualTransactionIds = userData.transactions.map((t) => t._id)
      const storedTransactionIds = usersStore.currentUser.transactionIds || []

      console.log('FinancesStore: Sync analysis:', {
        actualTransactions: actualTransactionIds.length,
        storedIds: storedTransactionIds.length,
        actualIds: actualTransactionIds,
        storedIdsList: storedTransactionIds,
      })

      // Check if there's a mismatch
      const hasMismatch =
        actualTransactionIds.length !== storedTransactionIds.length ||
        actualTransactionIds.some((id) => !storedTransactionIds.includes(id))

      if (hasMismatch) {
        console.log('FinancesStore: Syncing user transactionIds array:', {
          actual: actualTransactionIds.length,
          stored: storedTransactionIds.length,
        })

        const updatedUser = updateUserReferences(usersStore.currentUser, {
          transactionIds: actualTransactionIds,
        })

        await saveDoc(updatedUser)
        usersStore.saveCurrentUser(updatedUser)

        console.log('FinancesStore: User transactionIds synchronized successfully')
      } else {
        console.log('FinancesStore: TransactionIds already in sync')
      }
    } catch (err) {
      console.warn('FinancesStore: Failed to sync user transactionIds:', err)
      // Don't throw - sync failure shouldn't break data loading
    }
  }

  // Enhanced load all user financial data with comprehensive debugging
  async function loadAll(retryCount = 0) {
    const maxRetries = 3

    if (!usersStore.currentUser) {
      console.warn('FinancesStore: No user logged in, cannot load financial data')
      wallets.value = []
      transactions.value = []
      return
    }

    isLoading.value = true
    error.value = null

    try {
      console.log(`FinancesStore: Loading data (attempt ${retryCount + 1}/${maxRetries + 1})`)
      console.log('FinancesStore: Current user:', {
        id: usersStore.currentUser._id,
        name: usersStore.currentUser.name,
        transactionIdsCount: (usersStore.currentUser.transactionIds || []).length,
      })

      // Get user data with all related documents
      const userData = await getUserWithData(usersStore.currentUser._id)

      console.log('FinancesStore: Raw user data loaded:', {
        userId: userData.user?._id,
        wallets: userData.wallets?.length || 0,
        transactions: userData.transactions?.length || 0,
        categories: userData.categories?.length || 0,
        budgets: userData.budgets?.length || 0,
      })

      // Set the loaded data
      wallets.value = userData.wallets || []
      transactions.value = userData.transactions || []

      // Debug transaction data
      if (transactions.value.length > 0) {
        console.log('FinancesStore: Sample transactions:', transactions.value.slice(0, 3))
      }

      // Set active wallet if none selected
      if (!activeWalletId.value && wallets.value.length > 0) {
        activeWalletId.value = wallets.value[0]._id
        console.log('FinancesStore: Set active wallet:', activeWalletId.value)
      }

      // Sync transactionIds array to maintain data consistency
      await syncUserTransactionIds()

      // Update budgets with current spending
      try {
        await budgetsStore.refreshBudgetSpent()
        console.log('FinancesStore: Budgets refreshed')
      } catch (budgetErr) {
        console.warn('FinancesStore: Failed to refresh budgets:', budgetErr)
        // Don't fail the entire operation for budget issues
      }

      lastLoadTime.value = new Date().toISOString()

      console.log('FinancesStore: Data loaded successfully:', {
        wallets: wallets.value.length,
        transactions: transactions.value.length,
        lastLoadTime: lastLoadTime.value,
      })

      // Verify data consistency
      const storedIds = usersStore.currentUser.transactionIds || []
      const actualIds = transactions.value.map((t) => t._id)
      const matchingIds = storedIds.filter((id) => actualIds.includes(id))

      console.log('FinancesStore: Data consistency check:', {
        storedIds: storedIds.length,
        actualTransactions: actualIds.length,
        matchingIds: matchingIds.length,
        matchRate:
          storedIds.length > 0
            ? ((matchingIds.length / storedIds.length) * 100).toFixed(1) + '%'
            : 'N/A',
      })
    } catch (err) {
      console.error('FinancesStore: Failed to load financial data:', err)
      error.value = err.message || 'Failed to load financial data'

      if (retryCount < maxRetries) {
        console.log(`FinancesStore: Retrying in 1 second... (${retryCount + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return loadAll(retryCount + 1)
      }

      // If all retries failed, set empty arrays
      wallets.value = []
      transactions.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Direct database access for debugging
  async function debugDatabaseAccess() {
    if (!usersStore.currentUser) {
      console.log('FinancesStore: No user for debug access')
      return
    }

    try {
      console.log('FinancesStore: === DEBUG DATABASE ACCESS ===')

      // Check user document
      const userDoc = await localDB.get(usersStore.currentUser._id)
      console.log('FinancesStore: User document:', userDoc)

      // Check all transactions for this user using direct query
      const userTransactions = await localDB.find({
        selector: { type: 'transaction', userId: usersStore.currentUser._id },
      })

      console.log('FinancesStore: Direct transaction query result:', {
        count: userTransactions.docs.length,
        transactions: userTransactions.docs,
      })

      // Check if transactions match stored IDs
      const storedIds = userDoc.transactionIds || []
      const actualIds = userTransactions.docs.map((t) => t._id)
      const matches = storedIds.filter((id) => actualIds.includes(id))

      console.log('FinancesStore: ID matching analysis:', {
        storedIds: storedIds.length,
        actualIds: actualIds.length,
        matches: matches.length,
        missingInDb: storedIds.filter((id) => !actualIds.includes(id)),
        extraInDb: actualIds.filter((id) => !storedIds.includes(id)),
      })

      return {
        userDoc,
        userTransactions: userTransactions.docs,
        matchingIds: matches,
      }
    } catch (err) {
      console.error('FinancesStore: Debug access failed:', err)
      return null
    }
  }

  // Add new wallet
  async function addWallet(walletData) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const newWallet = {
        _id: generateId('wallet'),
        type: 'wallet',
        ownerUserId: usersStore.currentUser._id,
        name: walletData.name || 'New Wallet',
        balance: Number(walletData.balance) || 0,
        walletType: walletData.walletType || 'personal',
        sharedWithUserIds: [],
        sharedWithWalletIds: [],
        currency: walletData.currency || 'USD',
        icon: walletData.icon || 'account_balance_wallet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(newWallet)
      wallets.value.push(newWallet)

      console.log('FinancesStore: Wallet added:', newWallet.name)
      return newWallet
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to add wallet:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update wallet
  async function updateWallet(walletId, updates) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const walletIndex = wallets.value.findIndex((w) => w._id === walletId)
      if (walletIndex === -1) {
        throw new Error('Wallet not found')
      }

      const updatedWallet = {
        ...wallets.value[walletIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(updatedWallet)
      wallets.value[walletIndex] = updatedWallet

      console.log('FinancesStore: Wallet updated:', updatedWallet.name)
      return updatedWallet
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to update wallet:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete wallet
  async function deleteWallet(walletId) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const wallet = wallets.value.find((w) => w._id === walletId)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      await deleteDoc(wallet)
      wallets.value = wallets.value.filter((w) => w._id !== walletId)

      console.log('FinancesStore: Wallet deleted:', wallet.name)
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to delete wallet:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Add new transaction
  async function addTransaction(transactionData) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      // Ensure we have the required data
      if (!transactionData.walletId) {
        throw new Error('Wallet ID is required')
      }
      if (!transactionData.categoryId) {
        throw new Error('Category ID is required')
      }
      if (!transactionData.amount || transactionData.amount <= 0) {
        throw new Error('Valid amount is required')
      }

      const transactionDoc = {
        walletId: transactionData.walletId,
        userId: usersStore.currentUser._id,
        kind: transactionData.kind,
        amount: Number(transactionData.amount),
        categoryId: transactionData.categoryId,
        datetime: transactionData.datetime || new Date().toISOString(),
        notes: transactionData.notes || '',
        tags: transactionData.tags || [],
        splitPayment: transactionData.splitPayment || { isSplit: false, splitDetails: {} },
        // 🔧 FIXED: Include budget-related fields
        budgetId: transactionData.budgetId,
        isBudgetAllocation: transactionData.isBudgetAllocation || false,
        isTransfer: transactionData.isTransfer || false,
      }

      const savedTransaction = await createTransaction(transactionDoc)
      transactions.value.push(savedTransaction)

      // Update user's transactionIds array to maintain data consistency
      const currentTransactionIds = usersStore.currentUser.transactionIds || []
      const updatedTransactionIds = [...currentTransactionIds, savedTransaction._id]

      const updatedUser = updateUserReferences(usersStore.currentUser, {
        transactionIds: updatedTransactionIds,
      })

      await saveDoc(updatedUser)
      usersStore.saveCurrentUser(updatedUser)

      // Update wallet balance
      await updateWalletBalance(transactionData.walletId)

      // Refresh budgets to update spent amounts
      await budgetsStore.refreshBudgetSpent()

      console.log('FinancesStore: Transaction added:', savedTransaction._id)
      console.log('FinancesStore: Transaction data saved:', savedTransaction)
      console.log('FinancesStore: Updated user transactionIds:', updatedTransactionIds)
      return savedTransaction
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to add transaction:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update transaction with conflict resolution and fresh data
  async function updateTransaction(transactionId, updates) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('FinancesStore: updateTransaction called with:', { transactionId, updates })

      // Always fetch the fresh transaction data from database to avoid stale _rev
      let freshTransaction
      try {
        freshTransaction = await localDB.get(transactionId)
        console.log(
          'FinancesStore: Retrieved fresh transaction data:',
          freshTransaction._id,
          'rev:',
          freshTransaction._rev,
        )
      } catch (fetchError) {
        if (fetchError.name === 'not_found') {
          throw new Error(`Transaction not found: ${transactionId}`)
        }
        throw fetchError
      }

      const oldTransaction = transactions.value.find((t) => t._id === transactionId)
      console.log('FinancesStore: Found existing transaction in store:', oldTransaction)

      // Merge the fresh transaction with updates, preserving the latest _rev
      const updatedTransaction = {
        ...freshTransaction,
        ...updates,
        _rev: freshTransaction._rev, // Ensure we use the latest revision
        updatedAt: new Date().toISOString(),
      }

      console.log(
        'FinancesStore: Prepared updated transaction with fresh data:',
        updatedTransaction,
      )

      // Save with conflict resolution (now handled in saveDoc)
      const savedTransaction = await saveDoc(updatedTransaction)

      // Update the local store with the saved transaction (includes new _rev)
      const transactionIndex = transactions.value.findIndex((t) => t._id === transactionId)
      if (transactionIndex !== -1) {
        transactions.value[transactionIndex] = savedTransaction
      } else {
        // If transaction wasn't in local store, add it
        transactions.value.push(savedTransaction)
      }

      console.log(
        'FinancesStore: Updated transaction in local store:',
        savedTransaction._id,
        'new rev:',
        savedTransaction._rev,
      )

      // Update wallet balance if amount or wallet changed
      if (updates.amount !== undefined || updates.walletId !== undefined) {
        await updateWalletBalance(oldTransaction?.walletId || savedTransaction.walletId)
        if (updates.walletId && updates.walletId !== oldTransaction?.walletId) {
          await updateWalletBalance(updates.walletId)
        }
      }

      // Refresh budgets
      await budgetsStore.refreshBudgetSpent()

      console.log('FinancesStore: Transaction updated successfully:', savedTransaction._id)
      return savedTransaction
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to update transaction:', err)
      console.error('FinancesStore: Error stack:', err.stack)

      // Provide more specific error messages
      if (err.name === 'conflict') {
        throw new Error('This transaction was modified elsewhere. Please refresh and try again.')
      } else if (err.name === 'not_found') {
        throw new Error('This transaction no longer exists.')
      }

      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete transaction
  async function deleteTransaction(transactionId) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const transaction = transactions.value.find((t) => t._id === transactionId)
      if (!transaction) {
        throw new Error('Transaction not found')
      }

      await deleteDoc(transaction)
      transactions.value = transactions.value.filter((t) => t._id !== transactionId)

      // Update user's transactionIds array to maintain data consistency
      const currentTransactionIds = usersStore.currentUser.transactionIds || []
      const updatedTransactionIds = currentTransactionIds.filter((id) => id !== transactionId)

      const updatedUser = updateUserReferences(usersStore.currentUser, {
        transactionIds: updatedTransactionIds,
      })

      await saveDoc(updatedUser)
      usersStore.saveCurrentUser(updatedUser)

      // Update wallet balance
      await updateWalletBalance(transaction.walletId)

      // Refresh budgets
      await budgetsStore.refreshBudgetSpent()

      console.log('FinancesStore: Transaction deleted:', transactionId)
      console.log('FinancesStore: Updated user transactionIds:', updatedTransactionIds)
    } catch (err) {
      error.value = err.message
      console.error('FinancesStore: Failed to delete transaction:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update wallet balance based on transactions
  async function updateWalletBalance(walletId) {
    const walletTransactions = transactions.value.filter((t) => t.walletId === walletId)

    const balance = walletTransactions.reduce((total, transaction) => {
      if (transaction.kind === 'income') {
        return total + transaction.amount
      } else if (transaction.kind === 'expense') {
        return total - transaction.amount
      } else if (transaction.kind === 'transfer') {
        // Transfer transactions don't affect wallet balance (neutral)
        // This includes budget allocations
        return total
      }
      return total
    }, 0)

    await updateWallet(walletId, { balance })
  }

  // Set active wallet
  function setActiveWallet(walletId) {
    activeWalletId.value = walletId
  }

  // Get transactions for active wallet
  const activeWalletTransactions = computed(() => {
    if (!activeWalletId.value || activeWalletId.value === 'all') {
      return transactions.value
    }
    return transactions.value.filter((t) => t.walletId === activeWalletId.value)
  })

  // Get filtered transactions
  function getFilteredTransactions(filters = {}) {
    return filterTransactions(activeWalletTransactions.value, filters)
  }

  // Get recent transactions
  function getRecentTransactions(limit = 5) {
    const sorted = [...activeWalletTransactions.value].sort(
      (a, b) => new Date(b.datetime) - new Date(a.datetime),
    )
    return sorted.slice(0, limit)
  }

  // Calculate totals
  const totals = computed(() => {
    const filtered = activeWalletTransactions.value

    const income = filtered.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0)

    const expenses = filtered
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Transfer transactions (including budget allocations) don't count toward totals
    return {
      income,
      expenses,
      net: income - expenses,
    }
  })

  // Get category spending
  const spendingByCategory = computed(() => {
    const expenses = activeWalletTransactions.value.filter((t) => t.kind === 'expense')
    const spending = {}

    expenses.forEach((transaction) => {
      const categoryId = transaction.categoryId
      if (!spending[categoryId]) {
        spending[categoryId] = 0
      }
      spending[categoryId] += transaction.amount
    })

    return spending
  })

  // Get spiritual giving totals (tithes, offerings, faith promise)
  const spiritualGiving = computed(() => {
    const spiritualCategories = ['Tithes', 'Offerings', 'Faith Promise']
    const categoriesMap = categoriesStore.categories.reduce((map, cat) => {
      map[cat.name] = cat._id
      return map
    }, {})

    const spiritualCategoryIds = spiritualCategories
      .map((name) => categoriesMap[name])
      .filter((id) => id)

    const spiritualTransactions = activeWalletTransactions.value.filter(
      (t) => spiritualCategoryIds.includes(t.categoryId) && t.kind === 'expense',
    )

    return {
      tithes: spiritualTransactions
        .filter((t) => categoriesMap['Tithes'] === t.categoryId)
        .reduce((sum, t) => sum + t.amount, 0),
      offerings: spiritualTransactions
        .filter((t) => categoriesMap['Offerings'] === t.categoryId)
        .reduce((sum, t) => sum + t.amount, 0),
      faithPromise: spiritualTransactions
        .filter((t) => categoriesMap['Faith Promise'] === t.categoryId)
        .reduce((sum, t) => sum + t.amount, 0),
      total: spiritualTransactions.reduce((sum, t) => sum + t.amount, 0),
    }
  })

  // Get financial summary for current user
  const financialSummary = computed(() => {
    if (!usersStore.currentUser) return null

    return getUserFinancialSummary(usersStore.currentUser, transactions.value, budgetsStore.budgets)
  })

  // Watch for user changes
  function watchUserChanges() {
    watch(
      () => usersStore.currentUser,
      (newUser, oldUser) => {
        console.log('FinancesStore: User changed:', {
          newUser: !!newUser,
          oldUser: !!oldUser,
          userId: newUser?._id,
        })

        if (newUser) {
          loadAll()
        } else {
          wallets.value = []
          transactions.value = []
          activeWalletId.value = null
        }
      },
      { immediate: true },
    )
  }

  // Initialize default wallet for new user
  async function initializeDefaultWallet() {
    if (wallets.value.length === 0 && usersStore.currentUser) {
      try {
        await addWallet({
          name: 'Main Wallet',
          balance: 0,
          walletType: 'personal',
        })
      } catch (err) {
        console.warn('FinancesStore: Failed to create default wallet:', err)
      }
    }
  }

  return {
    // State
    wallets,
    transactions,
    isLoading,
    error,
    activeWalletId,
    lastLoadTime,

    // Computed
    activeWalletTransactions,
    totals,
    spendingByCategory,
    spiritualGiving,
    financialSummary,

    // Methods
    loadAll,
    syncUserTransactionIds,
    debugDatabaseAccess,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setActiveWallet,
    getFilteredTransactions,
    getRecentTransactions,
    initializeDefaultWallet,
    watchUserChanges,
  }
})
