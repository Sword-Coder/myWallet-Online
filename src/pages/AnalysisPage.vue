<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Spending Analysis</div>
        <div class="text-subtitle2 text-grey">{{ currentMonth }}</div>
      </div>

      <!-- Wallet Selector -->
      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh Data"
          dense
          :loading="isLoading"
          @click="refreshData"
        />
        <q-select
          outlined
          dense
          v-model="selectedWallet"
          :options="walletOptions"
          option-label="name"
          option-value="_id"
          label="Wallet"
          style="min-width: 160px"
          emit-value
          map-options
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-subtitle2 text-grey q-mt-md">Loading your financial data...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error" size="48px" color="negative" />
      <div class="text-h6 text-negative q-mt-md">Error Loading Data</div>
      <div class="text-caption text-grey q-mb-md">{{ error }}</div>
      <q-btn color="primary" label="Try Again" @click="refreshData" />
    </div>

    <!-- No User State -->
    <div v-else-if="!currentUser" class="text-center q-pa-lg">
      <q-icon name="person" size="48px" color="grey" />
      <div class="text-h6 text-grey q-mt-md">Please log in to view your analysis</div>
      <div class="text-caption text-grey">Sign in to see your spending breakdown</div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Monthly Summary -->
      <q-card flat bordered class="q-pa-md q-mb-md">
        <div class="row justify-around text-center">
          <div>
            <div class="text-caption text-grey">Income</div>
            <div class="text-h6" style="color: #4d934e">₱{{ incomeTotal.toLocaleString() }}</div>
          </div>
          <div>
            <div class="text-caption text-grey">Expense</div>
            <div class="text-h6" style="color: #dc3545">₱{{ expenseTotal.toLocaleString() }}</div>
          </div>
          <div>
            <div class="text-caption text-grey">Total</div>
            <div class="text-h6" :style="{ color: netTotal >= 0 ? '#4d934e' : '#dc3545' }">
              ₱{{ netTotal.toLocaleString() }}
            </div>
          </div>
        </div>
      </q-card>

      <!-- Filter Row -->
      <div class="row q-gutter-sm q-mb-md items-center">
        <q-select
          dense
          outlined
          v-model="activeCategory"
          :options="categoryOptions"
          label="Category"
          style="min-width: 160px"
          emit-value
          map-options
        />
        <q-input
          dense
          outlined
          v-model="dateRange"
          label="Date Range (MM/YYYY)"
          style="min-width: 180px"
        />

        <q-btn
          color="grey-7"
          icon="refresh"
          label="Clear Filters"
          flat
          dense
          class="q-ml-sm"
          @click="clearFilters"
        />
      </div>

      <!-- Data Status Debug (only in development) -->
      <div v-if="isDevelopment" class="q-mb-md">
        <q-card flat bordered class="q-pa-sm">
          <div class="text-caption">
            Debug: User transactions: {{ userTransactions.length }} | Filtered:
            {{ filteredTransactions.length }} | Income: ₱{{ incomeTotal }} | Expenses: ₱{{
              expenseTotal
            }}
          </div>
        </q-card>
      </div>

      <!-- Chart Section -->
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Expense Categories List -->
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Expense Overview</div>

          <!-- Total Expense Summary -->
          <div class="text-center q-mb-lg">
            <div class="text-h6 text-weight-bold">₱{{ expenseTotal.toLocaleString() }}</div>
            <div class="text-caption text-grey">Total Expenses</div>
          </div>

          <!-- Expense Categories List -->
          <div class="expense-categories-list">
            <div
              v-for="(amount, categoryId) in spendingByCategory"
              :key="categoryId"
              class="expense-category-item q-mb-md"
            >
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-weight-medium">
                  {{ getCategoryName(categoryId) }}
                </div>
                <div class="expense-category-info">
                  <span class="text-subtitle2 expense-amount">
                    -₱{{ amount.toLocaleString() }}
                  </span>
                  <span class="text-caption text-grey q-ml-sm">
                    {{ expenseTotal > 0 ? ((amount / expenseTotal) * 100).toFixed(1) : 0 }}%
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <q-linear-progress
                :value="expenseTotal > 0 ? amount / expenseTotal : 0"
                :color="getProgressColor(expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0)"
                size="8px"
                class="expense-progress-bar"
              />

              <!-- Progress Info -->
              <div class="row items-center justify-between q-mt-xs">
                <div class="text-caption text-grey">₱{{ amount.toLocaleString() }}</div>
                <div class="text-caption text-grey">
                  {{ expenseTotal > 0 ? ((amount / expenseTotal) * 100).toFixed(1) : 0 }}% of total
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="Object.keys(spendingByCategory).length === 0 && !isLoading"
            class="text-center q-pa-lg text-grey"
          >
            <div class="q-mb-md">
              {{
                userTransactions.length === 0
                  ? 'No transactions recorded yet.'
                  : 'No expenses match your current filters.'
              }}
            </div>
            <div class="text-caption">
              {{
                userTransactions.length === 0
                  ? 'Add some transactions to see the breakdown here.'
                  : 'Try adjusting your filters to see more data.'
              }}
            </div>
          </div>
        </q-card>

        <!-- Budget Overview -->
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Budget Overview</div>
          <div v-if="budgets.length === 0" class="text-center q-pa-lg text-grey">
            <div class="q-mb-md">No budgets set yet.</div>
            <div class="text-caption">Create budgets to track your spending.</div>
          </div>

          <div v-else class="budget-list">
            <div
              v-for="budget in filteredBudgets"
              :key="budget._id"
              class="budget-item q-mb-md q-pa-sm"
            >
              <div class="row items-center justify-between q-mb-xs">
                <div class="text-subtitle2 text-weight-medium">
                  {{ getCategoryName(budget.categoryId) }}
                </div>
                <div class="text-subtitle2 text-right">
                  <template v-if="budget.amount > 0">
                    ₱{{ Number(budget.spent || 0).toLocaleString() }} / ₱{{
                      Number(budget.amount || 0).toLocaleString()
                    }}
                  </template>
                  <template v-else> ₱{{ Number(budget.spent || 0).toLocaleString() }} </template>
                </div>
              </div>

              <q-linear-progress
                :value="getBudgetProgress(budget)"
                :color="isBudgetExceeded(budget) ? 'negative' : 'primary'"
                rounded
                size="10px"
                class="q-mt-xs"
              />

              <div class="row justify-between q-mt-xs">
                <div class="text-caption text-grey">
                  {{ budget.amount > 0 ? 'Fixed Budget' : 'No Budget' }}
                </div>
                <div class="text-caption text-grey">
                  {{ budget.amount > 0 ? ((budget.spent / budget.amount) * 100).toFixed(1) : 0 }}%
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Summary Statistics -->
      <q-card flat bordered class="q-pa-md q-mt-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Summary Statistics</div>
        <div class="grid sm:grid-cols-3 gap-4">
          <div v-for="stat in summaryStats" :key="stat.label" class="text-center">
            <div class="text-h6 text-weight-bold">{{ stat.value }}</div>
            <div class="text-caption text-grey">{{ stat.label }}</div>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'

import { useFinancesStore } from 'src/stores/finances'
import { useBudgetsStore } from 'src/stores/budgets'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'

// Stores - Use storeToRefs to maintain reactivity
const financesStore = useFinancesStore()
const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()

// State from stores - use storeToRefs for reactive state
const { wallets, transactions } = storeToRefs(financesStore)
const { budgets } = storeToRefs(budgetsStore)
const { categories } = storeToRefs(categoriesStore)
const { currentUser } = storeToRefs(usersStore)

// Local state
const selectedWallet = ref('all')
const activeCategory = ref('All')
const dateRange = ref('')
const isLoading = ref(false)
const error = ref(null)

// Development flag for debug info
const isDevelopment = import.meta.env.DEV

// Computed values
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => [
  { name: 'All Wallets', _id: 'all' },
  ...(wallets.value || []),
])

const categoryOptions = computed(() => {
  const categoryList = [
    { label: 'All Categories', value: 'All' },
    ...(categories.value || []).map((c) => ({ label: c.name, value: c._id })),
  ]
  return categoryList
})

// Transaction filtering
const userTransactions = computed(() => {
  console.log('Analysis: Computing user transactions...', {
    currentUser: !!currentUser.value,
    userTransactionIds: currentUser.value?.transactionIds?.length || 0,
    storeTransactions: transactions.value.length,
  })

  if (!currentUser.value) {
    console.log('Analysis: No current user')
    return []
  }

  if (!currentUser.value.transactionIds || currentUser.value.transactionIds.length === 0) {
    console.log('Analysis: User has no transaction IDs')
    return []
  }

  if (!transactions.value || transactions.value.length === 0) {
    console.log('Analysis: No transactions loaded in store')
    return []
  }

  const userTransactions =
    currentUser.value.transactionIds
      ?.map((id) => transactions.value.find((t) => t._id === id))
      .filter(Boolean) || []

  console.log('Analysis: Computed transactions:', {
    userTransactionIds: currentUser.value.transactionIds.length,
    storeTransactions: transactions.value.length,
    matchedTransactions: userTransactions.length,
  })

  return userTransactions
})

const filteredTransactions = computed(() => {
  console.log('Analysis: Computing filtered transactions...', {
    totalTransactions: userTransactions.value.length,
    selectedWallet: selectedWallet.value,
    activeCategory: activeCategory.value,
    dateRange: dateRange.value,
  })

  return (userTransactions.value || []).filter((t) => {
    const matchWallet = selectedWallet.value === 'all' || t.walletId === selectedWallet.value
    const matchCategory = activeCategory.value === 'All' || t.categoryId === activeCategory.value
    const matchDate =
      !dateRange.value ||
      new Date(t.datetime).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }) ===
        dateRange.value
    return matchWallet && matchCategory && matchDate
  })
})

const incomeTotal = computed(() => {
  const total = filteredTransactions.value
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  console.log('Analysis: Computing income total...', {
    filteredTransactions: filteredTransactions.value.length,
    incomeTransactions: filteredTransactions.value.filter((t) => t.kind === 'income').length,
    total,
  })

  return total
})

const expenseTotal = computed(() => {
  const total = filteredTransactions.value
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  console.log('Analysis: Computing expense total...', {
    filteredTransactions: filteredTransactions.value.length,
    expenseTransactions: filteredTransactions.value.filter((t) => t.kind === 'expense').length,
    total,
  })

  return total
})

const netTotal = computed(() => {
  const total = incomeTotal.value - expenseTotal.value
  console.log('Analysis: Computing net total...', {
    incomeTotal: incomeTotal.value,
    expenseTotal: expenseTotal.value,
    netTotal: total,
  })
  return total
})

// Spending by category (grouped by categoryId, then resolved to names)
const spendingByCategory = computed(() => {
  const spending = (filteredTransactions.value || [])
    .filter((t) => t.kind === 'expense')
    .reduce((acc, t) => {
      const categoryId = t.categoryId
      acc[categoryId] = (acc[categoryId] || 0) + t.amount
      return acc
    }, {})

  console.log('Analysis: Computing spending by category...', {
    filteredTransactions: filteredTransactions.value.length,
    expenseTransactions: filteredTransactions.value.filter((t) => t.kind === 'expense').length,
    spendingByCategory: spending,
  })

  return spending
})

// Helper functions
function getCategoryName(categoryId) {
  const category = (categories.value || []).find((c) => c._id === categoryId)
  return category ? category.name : 'Unknown Category'
}

function getProgressColor(percentage) {
  if (percentage <= 30) return 'positive' // Green for low percentage
  if (percentage <= 60) return 'warning' // Yellow for medium percentage
  if (percentage <= 80) return 'orange' // Orange for high percentage
  return 'negative' // Red for very high percentage
}

function getBudgetProgress(budget) {
  if (budget.amount > 0) {
    return Math.min((budget.spent || 0) / budget.amount, 1)
  }
  return 0
}

function isBudgetExceeded(budget) {
  return (budget.spent || 0) > budget.amount && budget.amount > 0
}

// Budget filtering
const filteredBudgets = computed(() => {
  return (budgets.value || []).filter((b) => {
    const matchCategory = activeCategory.value === 'All' || b.categoryId === activeCategory.value
    return matchCategory
  })
})

// Summary statistics
const summaryStats = computed(() => {
  const totalBudget = filteredBudgets.value.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = expenseTotal.value
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const budgetCount = filteredBudgets.value.length

  return [
    { label: 'Total Budget', value: `₱${totalBudget.toLocaleString()}` },
    { label: 'Total Spent', value: `₱${totalSpent.toLocaleString()}` },
    { label: 'Active Budgets', value: budgetCount.toString() },
    { label: 'Remaining', value: `₱${remaining.toLocaleString()}` },
    {
      label: 'Budget Usage',
      value: totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%',
    },
  ]
})

// Enhanced data loading with retry logic and proper initialization
async function loadDataWithRetry(retryCount = 0) {
  const maxRetries = 3

  try {
    console.log(`Analysis: Loading data (attempt ${retryCount + 1}/${maxRetries + 1})`)

    // Ensure user store is initialized first
    console.log('Analysis: Checking user store initialization...')
    const hasUser = await usersStore.waitForInitialization()

    if (!hasUser) {
      throw new Error('No user logged in - please sign in to view your analysis')
    }

    console.log('Analysis: User store initialized, user found:', {
      id: currentUser.value?._id,
      name: currentUser.value?.name,
      transactionIdsCount: currentUser.value?.transactionIds?.length || 0,
    })

    // Load all data with error handling
    await Promise.all([
      financesStore.loadAll(),
      budgetsStore.loadBudgets(),
      categoriesStore.loadCategories(),
    ])

    console.log('Analysis: Data loaded successfully', {
      wallets: wallets.length,
      transactions: transactions.value.length,
      budgets: budgets.value.length,
      categories: categories.value.length,
    })

    error.value = null
  } catch (err) {
    console.error('Analysis: Failed to load data:', err)

    if (retryCount < maxRetries) {
      console.log(`Analysis: Retrying in 1 second... (${retryCount + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return loadDataWithRetry(retryCount + 1)
    }

    error.value = err.message || 'Failed to load financial data'
    throw err
  }
}

// Manual refresh function
async function refreshData() {
  isLoading.value = true
  error.value = null

  try {
    await loadDataWithRetry()

    // Ensure default wallet is set after loading
    await nextTick()
    if (!selectedWallet.value) {
      selectedWallet.value = 'all'
    }
  } catch (err) {
    console.error('Analysis: Refresh failed:', err)
  } finally {
    isLoading.value = false
  }
}

// Filter management
function clearFilters() {
  selectedWallet.value = 'all'
  activeCategory.value = 'All'
  dateRange.value = ''
}

// Load data on mount with proper initialization handling
onMounted(async () => {
  console.log('Analysis: Component mounted')

  // Initialize user store first if not already done
  if (!usersStore.isInitialized) {
    console.log('Analysis: Initializing user store...')
    usersStore.initialize()
  }

  // Wait for user store to be ready
  console.log('Analysis: Waiting for user store initialization...')
  const hasUser = await usersStore.waitForInitialization()

  if (!hasUser) {
    console.log('Analysis: No user found after initialization')
    return
  }

  console.log('Analysis: User store ready, proceeding with data loading...')

  try {
    await refreshData()
  } catch (err) {
    console.error('Analysis: Initial load failed:', err)
  }
})

// Watch for user changes and auto-refresh
watch(currentUser, async (newUser, oldUser) => {
  console.log('Analysis: User changed:', { newUser: !!newUser, oldUser: !!oldUser })

  if (newUser && (!oldUser || newUser._id !== oldUser._id)) {
    // User changed, reload data
    await refreshData()
  }
})

// Watch for store changes and debug
watch(
  () => transactions.value.length,
  (newCount, oldCount) => {
    if (isDevelopment) {
      console.log('Analysis: Store transactions changed:', { newCount, oldCount })
    }
  },
)

// Watch for changes and persist filters
watch([selectedWallet, activeCategory, dateRange], ([wallet, category, range]) => {
  // Could persist filters to localStorage if needed
  localStorage.setItem('analysisFilters', JSON.stringify({ wallet, category, range }))
})
</script>

<style scoped>
/* Page Layout */
.q-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Grid Layout */
.grid {
  display: grid;
}

/* Expense Categories List Styles */
.expense-categories-list {
  max-width: 100%;
}

.expense-category-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.expense-category-item:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.expense-category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-amount {
  font-weight: 600;
  color: #dc3545; /* Expense red color */
}

.expense-progress-bar {
  border-radius: 4px;
  margin: 8px 0;
}

/* Budget List Styles */
.budget-list {
  max-height: 400px;
  overflow-y: auto;
}

.budget-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.budget-item:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

/* Progress bar color overrides */
.expense-progress-bar :deep(.q-linear-progress__track) {
  border-radius: 4px;
}

.expense-progress-bar :deep(.q-linear-progress__model) {
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .expense-category-item {
    padding: 8px;
  }

  .expense-category-info {
    flex-direction: column;
    align-items: end;
    gap: 4px;
  }

  .expense-amount {
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Custom Scrollbar for budget list */
.budget-list {
  scrollbar-width: thin;
  scrollbar-color: #4d934e #f1f1f1;
}

.budget-list::-webkit-scrollbar {
  width: 6px;
}

.budget-list::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.budget-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  border-radius: 3px;
  border: 1px solid #f8f9fa;
}

.budget-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3d7e3f 0%, #5a8a5f 100%);
}
</style>
