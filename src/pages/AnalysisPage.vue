<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Spending Analysis</div>
        <div class="text-subtitle2 text-grey">{{ currentMonth }}</div>
      </div>

      <!-- Wallet Selector -->
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
                <span class="text-subtitle2 expense-amount"> -₱{{ amount.toLocaleString() }} </span>
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
          v-if="Object.keys(spendingByCategory).length === 0"
          class="text-center q-pa-lg text-grey"
        >
          <div class="q-mb-md">No expenses recorded yet.</div>
          <div class="text-caption">Add some expenses to see the breakdown here.</div>
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
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

import { useFinancesStore } from 'src/stores/finances'
import { useBudgetsStore } from 'src/stores/budgets'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'

// Stores
const financesStore = useFinancesStore()
const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()

// State from stores
const { wallets } = financesStore
const { budgets } = budgetsStore
const { categories } = categoriesStore
const { currentUser } = usersStore

// Local state
const selectedWallet = ref(null)
const activeCategory = ref('All')
const dateRange = ref('')

// Computed values
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => [
  { name: 'All Wallets', _id: 'all' },
  ...(wallets.value || []).map((w) => ({ name: w.name, _id: w._id })),
])

const categoryOptions = computed(() => {
  const categoryList = [
    { label: 'All Categories', value: 'All' },
    ...(categories.value || []).map((c) => ({ label: c.name, value: c._id })),
  ]
  return categoryList
})

// Income, Expense, Total calculations
const transactions = computed(() => {
  const userTransactions =
    currentUser.value?.transactionIds
      ?.map((id) => (financesStore.transactions.value || []).find((t) => t._id === id))
      .filter(Boolean) || []

  return userTransactions
})

const filteredTransactions = computed(() => {
  return (transactions.value || []).filter((t) => {
    const matchWallet =
      !selectedWallet.value || selectedWallet.value === 'all' || t.walletId === selectedWallet.value
    const matchCategory = activeCategory.value === 'All' || t.categoryId === activeCategory.value
    const matchDate =
      !dateRange.value ||
      new Date(t.datetime).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }) ===
        dateRange.value
    return matchWallet && matchCategory && matchDate
  })
})

const incomeTotal = computed(() =>
  filteredTransactions.value
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
)

const expenseTotal = computed(() =>
  filteredTransactions.value
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0),
)

const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

// Spending by category (grouped by categoryId, then resolved to names)
const spendingByCategory = computed(() => {
  return (filteredTransactions.value || [])
    .filter((t) => t.kind === 'expense')
    .reduce((acc, t) => {
      const categoryId = t.categoryId
      acc[categoryId] = (acc[categoryId] || 0) + t.amount
      return acc
    }, {})
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

// Filter management
function clearFilters() {
  selectedWallet.value = 'all'
  activeCategory.value = 'All'
  dateRange.value = ''
}

// Load data on mount
onMounted(async () => {
  // Initialize user if not logged in (for demo purposes)
  if (!currentUser.value) {
    // Check if user is authenticated
    if (!currentUser.value) {
      console.warn('No user logged in - analysis requires authentication')
      return
    }
  }

  // Load all data
  await Promise.all([
    financesStore.loadAll(),
    budgetsStore.loadBudgets(),
    categoriesStore.loadCategories(),
  ])

  // Set default wallet
  selectedWallet.value = 'all'
})

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
