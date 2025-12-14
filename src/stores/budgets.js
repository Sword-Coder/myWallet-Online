// src/stores/budgets.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDatabase } from 'src/composables/useDatabase'
import { useUsersStore } from 'src/stores/users'
import { useCategoriesStore } from 'src/stores/categories'
import { generateId } from 'src/utils/schemas'
import { calculateBudgetSpending } from 'src/utils/dataUtils'

export const useBudgetsStore = defineStore('budgets', () => {
  const { getUserBudgets, getUserTransactions, saveDoc } = useDatabase()
  const usersStore = useUsersStore()
  const categoriesStore = useCategoriesStore()

  // State
  const budgets = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Load budgets for current user
  async function loadBudgets() {
    if (!usersStore.currentUser) {
      console.warn('No user logged in, cannot load budgets')
      budgets.value = []
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const userBudgets = await getUserBudgets(usersStore.currentUser._id)

      // Update spent amounts based on actual transactions
      const transactions = await getUserTransactions(usersStore.currentUser._id)
      const updatedBudgets = userBudgets.map((budget) => {
        const spent = calculateBudgetSpending(
          transactions,
          budget.categoryId,
          budget.periodStart,
          budget.periodEnd,
        )
        return { ...budget, spent }
      })

      budgets.value = updatedBudgets
      console.log('Loaded budgets:', updatedBudgets.length)
    } catch (err) {
      error.value = err.message
      console.error('Failed to load budgets:', err)
      budgets.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Add new budget
  async function addBudget(budgetData) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      // Validate budget data
      if (!budgetData.categoryId) {
        throw new Error('Category ID is required')
      }

      if (!budgetData.periodStart || !budgetData.periodEnd) {
        throw new Error('Budget period is required')
      }

      if (
        budgetData.amount !== undefined &&
        (typeof budgetData.amount !== 'number' || budgetData.amount < 0)
      ) {
        throw new Error('Budget amount must be a positive number')
      }

      if (
        budgetData.percent !== undefined &&
        (typeof budgetData.percent !== 'number' ||
          budgetData.percent < 0 ||
          budgetData.percent > 100)
      ) {
        throw new Error('Budget percentage must be between 0 and 100')
      }

      const newBudget = {
        _id: generateId('budget'),
        type: 'budget',
        userId: usersStore.currentUser._id,
        categoryId: budgetData.categoryId,
        budgetType: budgetData.budgetType || 'monthly',
        periodStart: budgetData.periodStart,
        periodEnd: budgetData.periodEnd,
        amount: budgetData.amount || 0,
        percent: budgetData.percent || 0,
        spent: 0,
        isShared: budgetData.isShared || false,
        sharedWithUserIds: budgetData.sharedWithUserIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(newBudget)
      budgets.value.push(newBudget)

      console.log('Budget added for category:', budgetData.categoryId)
      return newBudget
    } catch (err) {
      error.value = err.message
      console.error('Failed to add budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update budget
  async function updateBudget(budgetId, updates) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const budgetIndex = budgets.value.findIndex((b) => b._id === budgetId)
      if (budgetIndex === -1) {
        throw new Error('Budget not found')
      }

      const updatedBudget = {
        ...budgets.value[budgetIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(updatedBudget)
      budgets.value[budgetIndex] = updatedBudget

      console.log('Budget updated:', budgetId)
      return updatedBudget
    } catch (err) {
      error.value = err.message
      console.error('Failed to update budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete budget
  async function deleteBudget(budgetId) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const budget = budgets.value.find((b) => b._id === budgetId)
      if (!budget) {
        throw new Error('Budget not found')
      }

      await saveDoc({ ...budget, _deleted: true })
      budgets.value = budgets.value.filter((b) => b._id !== budgetId)

      console.log('Budget deleted:', budgetId)
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get budgets by category
  function getBudgetsByCategory(categoryId) {
    return budgets.value.filter((b) => b.categoryId === categoryId)
  }

  // Get budgets by period
  function getBudgetsByPeriod(periodStart, periodEnd) {
    return budgets.value.filter((b) => {
      const budgetStart = new Date(b.periodStart)
      const budgetEnd = new Date(b.periodEnd)
      return budgetStart <= periodEnd && budgetEnd >= periodStart
    })
  }

  // Get current month budgets
  const currentMonthBudgets = computed(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return getBudgetsByPeriod(startOfMonth, endOfMonth)
  })

  // Calculate total budget amount for a period
  function calculateTotalBudget(periodStart, periodEnd) {
    const periodBudgets = getBudgetsByPeriod(periodStart, periodEnd)
    return periodBudgets.reduce((total, budget) => {
      if (budget.amount > 0) {
        return total + budget.amount
      }
      // For percentage budgets, we'd need to calculate based on income
      // This is a simplified version
      return total
    }, 0)
  }

  // Calculate total spent for current period
  function calculateTotalSpent() {
    return currentMonthBudgets.value.reduce((total, budget) => total + budget.spent, 0)
  }

  // Calculate expected tithes (10% of ALL salary income)
  async function calculateExpectedTithes() {
    if (!usersStore.currentUser) return 0

    try {
      const transactions = await getUserTransactions(usersStore.currentUser._id)

      // Get ALL salary transactions (not just current month)
      const salaryTransactions = transactions.filter((t) => {
        return t.kind === 'income'
      })

      // Calculate total salary income from all time
      const totalSalary = salaryTransactions.reduce((sum, t) => sum + t.amount, 0)

      // Return 10% as expected tithes
      return totalSalary * 0.1
    } catch (err) {
      console.error('Failed to calculate expected tithes:', err)
      return 0
    }
  }

  // Get budget progress percentage
  function getBudgetProgress(budget) {
    if (budget.amount > 0) {
      return Math.min((budget.spent / budget.amount) * 100, 100)
    }
    return 0
  }

  // Check if budget is exceeded
  function isBudgetExceeded(budget) {
    return budget.spent > budget.amount && budget.amount > 0
  }

  // Refresh budget spent amounts
  async function refreshBudgetSpent() {
    if (!usersStore.currentUser) return

    try {
      const transactions = await getUserTransactions(usersStore.currentUser._id)

      budgets.value = budgets.value.map((budget) => {
        const spent = calculateBudgetSpending(
          transactions,
          budget.categoryId,
          budget.periodStart,
          budget.periodEnd,
        )
        return { ...budget, spent }
      })
    } catch (err) {
      console.error('Failed to refresh budget spent amounts:', err)
    }
  }

  // Initialize default budgets for new user
  async function initializeDefaultBudgets() {
    if (budgets.value.length === 0 && usersStore.currentUser) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Get categories to create budgets for
      const categories = categoriesStore.categories
      const expenseCategories = categories.filter((c) => c.kind === 'expense')

      const defaultBudgets = [
        { categoryName: 'Groceries', amount: 3000 },
        { categoryName: 'Transportation', amount: 1500 },
        { categoryName: 'Utilities', amount: 2500 },
        { categoryName: 'Tithes', percent: 10 },
      ]

      for (const budgetData of defaultBudgets) {
        const category = expenseCategories.find((c) => c.name === budgetData.categoryName)
        if (category) {
          try {
            await addBudget({
              categoryId: category._id,
              budgetType: 'monthly',
              periodStart: startOfMonth.toISOString(),
              periodEnd: endOfMonth.toISOString(),
              amount: budgetData.amount || 0,
              percent: budgetData.percent || 0,
            })
          } catch (err) {
            console.warn('Failed to add default budget:', budgetData.categoryName, err)
          }
        }
      }
    }
  }

  // Watch for user changes
  function watchUserChanges() {
    watch(
      () => usersStore.currentUser,
      (newUser) => {
        if (newUser) {
          loadBudgets()
        } else {
          budgets.value = []
        }
      },
      { immediate: true },
    )
  }

  return {
    // State
    budgets,
    isLoading,
    error,

    // Computed
    currentMonthBudgets,

    // Methods
    loadBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetsByCategory,
    getBudgetsByPeriod,
    calculateTotalBudget,
    calculateTotalSpent,
    calculateExpectedTithes,
    getBudgetProgress,
    isBudgetExceeded,
    refreshBudgetSpent,
    initializeDefaultBudgets,
    watchUserChanges,
  }
})
