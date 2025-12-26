<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Records</div>
        <div class="text-subtitle2 text-grey">Transactions For {{ currentMonth }}</div>
      </div>

      <!-- Wallet selector -->
      <q-select
        outlined
        dense
        v-model="activeWallet"
        :options="walletOptions"
        option-label="name"
        option-value="_id"
        label="Wallet"
        emit-value
        map-options
        style="min-width: 160px"
      />
    </div>

    <!-- Summary Cards - 2x3 Grid -->
    <div class="summary-cards-container q-mb-md">
      <!-- Row 1: Core Financials -->
      <div class="summary-row q-mb-sm">
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold income-text">
              ₱{{ incomeTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Income</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold expense-text">
              ₱{{ expenseTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Expenses</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div
              class="text-h6 text-weight-bold net-text"
              :class="{ 'income-text': netTotal >= 0, 'expense-text': netTotal < 0 }"
            >
              ₱{{ netTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Available</div>
          </q-card>
        </div>
      </div>

      <!-- Row 2: Spiritual Giving -->
      <div class="summary-row">
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold tithes-text">
              ₱{{ spiritualGiving.tithes.toLocaleString() }} / Expected ₱{{
                expectedTithes.toLocaleString()
              }}
            </div>
            <div class="text-caption text-grey">(10% of salary|increase)</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold offerings-text">
              ₱{{ spiritualGiving.offerings.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Offerings</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold faith-promise-text">
              ₱{{ spiritualGiving.faithPromise.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Faith Promise</div>
          </q-card>
        </div>
      </div>

      <!-- Row 3: Budget Summary -->
      <div class="summary-row">
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold budget-text">
              ₱{{ budgetTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Budget</div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Recent Transactions</div>

      <q-list separator>
        <q-item
          v-for="transaction in recentTransactions"
          :key="transaction._id"
          class="q-py-md transaction-item"
          clickable
          @click="openEditDialog(transaction)"
        >
          <q-item-section avatar>
            <q-avatar :color="getTransactionColor(transaction)" text-color="white" size="sm">
              {{ getTransactionIcon(transaction) }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{
              getCategoryName(transaction.categoryId, transaction)
            }}</q-item-label>
            <q-item-label caption>{{ formatDateTime(transaction.datetime) }}</q-item-label>
            <q-item-label caption v-if="transaction.notes">{{ transaction.notes }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="text-subtitle2 text-weight-bold" :class="getAmountColor(transaction)">
              {{ getAmountDisplay(transaction) }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Empty state -->
      <div v-if="!recentTransactions.length" class="text-grey text-center q-pa-lg">
        <div class="q-mb-md">No transactions yet.</div>
        <div class="text-caption">Tap the + button to add your first transaction.</div>
        <div class="q-mt-md">
          <!-- Show sample transactions in 3-column layout -->
          <div class="summary-cards-container">
            <div class="summary-row">
              <div class="summary-col">
                <q-card flat bordered class="q-pa-sm text-center">
                  <div class="text-h6 income-text">₱0</div>
                  <div class="text-caption text-grey">Sample Income</div>
                </q-card>
              </div>
              <div class="summary-col">
                <q-card flat bordered class="q-pa-sm text-center">
                  <div class="text-h6 expense-text">₱0</div>
                  <div class="text-caption text-grey">Sample Expense</div>
                </q-card>
              </div>
              <div class="summary-col">
                <q-card flat bordered class="q-pa-sm text-center">
                  <div class="text-h6 tithes-text">₱0</div>
                  <div class="text-caption text-grey">Sample Tithes</div>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        color="primary"
        icon="add"
        size="lg"
        class="fab-button"
        @click="openTransactionDialog"
      />
    </q-page-sticky>

    <!-- Transaction Creation Dialog -->
    <q-dialog v-model="showTransactionDialog" maximized>
      <q-card class="full-screen-dialog">
        <q-card-section class="dialog-header">
          <div class="row items-center">
            <div class="text-h6">Add Transaction</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <!-- Transaction Type Selection -->
          <div class="row q-gutter-sm q-mb-md">
            <q-btn
              :color="form.kind === 'income' ? 'positive' : 'grey-3'"
              :text-color="form.kind === 'income' ? 'white' : 'primary'"
              icon="arrow_upward"
              label="Income"
              class="col"
              @click="form.kind = 'income'"
            />
            <q-btn
              :color="form.kind === 'expense' ? 'negative' : 'grey-3'"
              :text-color="form.kind === 'expense' ? 'white' : 'primary'"
              icon="arrow_downward"
              label="Expense"
              class="col"
              @click="form.kind = 'expense'"
            />
            <q-btn
              :color="form.kind === 'transfer' ? 'info' : 'grey-3'"
              :text-color="form.kind === 'transfer' ? 'white' : 'primary'"
              icon="swap_horiz"
              label="Transfer"
              class="col"
              @click="form.kind = 'transfer'"
            />
          </div>

          <!-- Transfer Direction Selector -->
          <div v-if="form.kind === 'transfer'" class="q-mb-md">
            <q-option-group
              v-model="transferFromBudget"
              :options="[
                { label: 'Transfer from wallet to budget', value: false },
                { label: 'Transfer from budget to current wallet', value: true },
              ]"
              color="primary"
              type="radio"
            />
          </div>

          <!-- Account & Category Selection -->
          <div class="account-category-row q-mb-md">
            <div class="account-category-container">
              <q-select
                v-model="form.walletId"
                :options="
                  transferFromBudget && form.kind === 'transfer'
                    ? budgetWalletOptions
                    : walletOptions
                "
                option-label="name"
                option-value="_id"
                :label="
                  transferFromBudget && form.kind === 'transfer' ? 'Select Budget' : 'Account'
                "
                filled
                emit-value
                map-options
                class="account-select"
              />
            </div>
            <div class="account-category-container">
              <q-select
                v-model="form.categoryId"
                :options="categoryOptions"
                option-label="name"
                option-value="_id"
                :label="
                  form.kind === 'transfer'
                    ? transferFromBudget
                      ? 'Select Wallet'
                      : 'Select Budget'
                    : 'Category'
                "
                filled
                emit-value
                map-options
                class="category-select"
              />
            </div>
          </div>

          <!-- Transfer Help Text -->
          <q-banner
            v-if="form.kind === 'transfer' && !transferFromBudget && categoryOptions.length === 0"
            class="q-mb-md"
            dense
            rounded
            icon="info"
            color="orange-7"
            text-color="white"
          >
            <div class="text-body2">
              No active budgets found. Create budgets first on the Budgets page to transfer funds to
              budgets.
            </div>
          </q-banner>

          <q-banner
            v-if="form.kind === 'transfer' && !transferFromBudget && categoryOptions.length > 0"
            class="q-mb-md"
            dense
            rounded
            icon="account_balance_wallet"
            color="info"
            text-color="white"
          >
            <div class="text-body2">
              Select an active budget to transfer funds to. This will be recorded as a budget
              allocation.
            </div>
          </q-banner>

          <q-banner
            v-if="
              form.kind === 'transfer' && transferFromBudget && budgetWalletOptions.length === 0
            "
            class="q-mb-md"
            dense
            rounded
            icon="info"
            color="orange-7"
            text-color="white"
          >
            <div class="text-body2">
              No active budgets found. Create budgets first on the Budgets page to transfer funds
              from budgets.
            </div>
          </q-banner>

          <q-banner
            v-if="form.kind === 'transfer' && transferFromBudget && budgetWalletOptions.length > 0"
            class="q-mb-md"
            dense
            rounded
            icon="account_balance_wallet"
            color="info"
            text-color="white"
          >
            <div class="text-body2">
              Select an active budget to transfer funds from. This will move money from the budget
              back to your wallet.
            </div>
          </q-banner>

          <!-- Notes Field -->
          <div class="q-mb-lg">
            <q-input
              v-model="form.notes"
              label="Notes (optional)"
              filled
              type="textarea"
              rows="2"
              placeholder="Add a note..."
            />
          </div>

          <!-- Auto-Budget Checkbox for Income Transactions -->
          <div v-if="form.kind === 'income' && hasAutoBudgeters" class="q-mb-lg">
            <q-banner
              dense
              rounded
              icon="auto_fix_high"
              color="info"
              text-color="white"
              class="q-mb-md"
            >
              <div class="text-body2">
                💡 Auto-Budget available! Automatically allocate this income to your preset budgets.
              </div>
            </q-banner>

            <q-card flat bordered class="auto-budget-card">
              <q-card-section class="q-pa-md">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">
                  <q-icon name="auto_fix_high" class="q-mr-sm" />
                  Auto-Budget This Income?
                </div>
                <div class="text-caption text-grey-7 q-mb-md">
                  Select a budget allocation plan to automatically distribute this income
                </div>

                <q-option-group
                  v-model="selectedAutoBudgeter"
                  :options="
                    activeAutoBudgeters.map((ab) => ({
                      label: ab.label,
                      value: ab.id,
                    }))
                  "
                  color="primary"
                  type="radio"
                />

                <div v-if="selectedAutoBudgeter" class="q-mt-md">
                  <div class="text-caption text-primary">
                    <q-icon name="info" size="sm" class="q-mr-xs" />
                    This income will be automatically allocated according to your
                    {{
                      activeAutoBudgeters.find((ab) => ab.id === selectedAutoBudgeter)?.frequency
                    }}
                    budget plan.
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Calculator Section -->
          <div class="text-center q-mb-lg">
            <!-- Amount Display -->
            <div class="text-h3 text-weight-bold q-mb-md calculator-display">
              ₱{{ form.amount || '0' }}
            </div>

            <!-- Calculator Keypad -->
            <div class="calculator-keypad">
              <!-- Row 1: Operations and Numbers -->
              <div class="row q-gutter-xs justify-center">
                <q-btn color="secondary" round size="lg" label="+" @click="setOperation('+')" />
                <q-btn flat round size="lg" label="7" @click="appendNumber('7')" />
                <q-btn flat round size="lg" label="8" @click="appendNumber('8')" />
                <q-btn flat round size="lg" label="9" @click="appendNumber('9')" />
              </div>

              <!-- Row 2: Operations and Numbers -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="lg" label="-" @click="setOperation('-')" />
                <q-btn flat round size="lg" label="4" @click="appendNumber('4')" />
                <q-btn flat round size="lg" label="5" @click="appendNumber('5')" />
                <q-btn flat round size="lg" label="6" @click="appendNumber('6')" />
              </div>

              <!-- Row 3: Operations and Numbers -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="lg" label="×" @click="setOperation('×')" />
                <q-btn flat round size="lg" label="1" @click="appendNumber('1')" />
                <q-btn flat round size="lg" label="2" @click="appendNumber('2')" />
                <q-btn flat round size="lg" label="3" @click="appendNumber('3')" />
              </div>

              <!-- Row 4: Operations, Zero, Double Zero, Decimal -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="lg" label="÷" @click="setOperation('÷')" />
                <q-btn flat round size="lg" label="0" @click="appendNumber('0')" />
                <q-btn flat round size="lg" label="00" @click="appendNumber('00')" />
                <q-btn flat round size="lg" label="." @click="appendDecimal" />
              </div>

              <!-- Row 5: Backspace, Equals, Clear, Done -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="orange" round size="lg" icon="backspace" @click="backspace" />
                <q-btn color="positive" round size="lg" label="=" @click="calculate" />
                <q-btn color="negative" round size="lg" label="C" @click="clearAmount" />
                <q-btn color="primary" round size="lg" label="Done" @click="finishTransaction" />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="dialog-footer">
          <q-btn flat label="Cancel" v-close-popup class="dialog-cancel-btn" />
          <q-btn
            color="primary"
            label="Save Transaction"
            @click="finishTransaction"
            :disable="!form.amount || !form.categoryId || !form.walletId"
            class="dialog-save-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFinancesStore } from 'src/stores/finances'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'
import { useBudgetsStore } from 'src/stores/budgets'
import { useDatabase } from 'src/composables/useDatabase'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

// Database access
const { localDB } = useDatabase()

// Stores
const financesStore = useFinancesStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()
const budgetsStore = useBudgetsStore()

// State from stores - use storeToRefs to maintain reactivity
const { wallets, transactions } = storeToRefs(financesStore)
const { categories } = storeToRefs(categoriesStore)
const { budgets } = storeToRefs(budgetsStore)
const { currentUser } = storeToRefs(usersStore)

// Access computed properties directly from store instance
const totals = computed(() => financesStore.totals)
const spiritualGiving = computed(() => financesStore.spiritualGiving)

// 🔧 NEW: Calculate available amount for Records page (after budgets) - FIXED to account for withdrawals
const availableAmount = computed(() => {
  console.log('=== AVAILABLE AMOUNT CALCULATION ===')
  const allTransactions = financesStore.transactions

  const income = allTransactions
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = allTransactions
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const budgetAllocations = allTransactions
    .filter((t) => t.isBudgetAllocation === true)
    .reduce((sum, t) => sum + t.amount, 0)

  const budgetWithdrawals = allTransactions
    .filter((t) => t.isBudgetWithdrawal === true)
    .reduce((sum, t) => sum + t.amount, 0)

  console.log('Available amount components:', {
    income,
    expenses,
    budgetAllocations,
    budgetWithdrawals,
  })

  // Available = Income - Expenses - Allocations + Withdrawals
  // This means: money coming in - money spent - money allocated to budgets + money returned from budgets
  const available = income - expenses - budgetAllocations + budgetWithdrawals
  console.log('Final available amount:', available)

  return available
})

// Dialog state
const showTransactionDialog = ref(false)
const selectedTransaction = ref(null)

// Calculator state
const calculator = ref({
  display: '',
  equation: '',
  previousValue: 0,
  operation: null,
  waitingForNewValue: false,
})

// Form data for new transaction
const form = ref({
  kind: 'expense',
  amount: '',
  categoryId: '',
  notes: '',
  walletId: '',
})

// Transfer direction state
const transferFromBudget = ref(false)

// UI state
const activeWallet = ref(null)

// Expected tithes state
const expectedTithes = ref(0)

// Auto-budget state
const activeAutoBudgeters = ref([])
const selectedAutoBudgeter = ref(null)
const hasAutoBudgeters = computed(() => activeAutoBudgeters.value.length > 0)

// Watch for transaction type changes to reset category selection
watch(
  () => form.value.kind,
  (newKind, oldKind) => {
    if (newKind !== oldKind) {
      form.value.categoryId = ''
      // Reset transfer direction when switching away from transfer
      if (newKind !== 'transfer') {
        transferFromBudget.value = false
      }
      // Reset auto-budget selection when switching away from income
      if (newKind !== 'income') {
        selectedAutoBudgeter.value = null
      }
    }
  },
)

// Computed properties
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => {
  // Only show "All Wallets" if user has multiple wallets AND sharing is enabled
  const hasMultipleWallets = (wallets.value || []).length > 1
  const isSharingEnabled = currentUser.value?.isSharingEnabled === true
  const shouldShowAllWallets = hasMultipleWallets && isSharingEnabled

  if (shouldShowAllWallets) {
    return [{ name: 'All Wallets', _id: 'all' }, ...(wallets.value || [])]
  } else {
    return wallets.value || []
  }
})

// Budget wallet options for transfer from budget to wallet
const budgetWalletOptions = computed(() => {
  const activeBudgets = (budgets.value || []).filter((budget) => {
    const now = new Date()
    const budgetStart = new Date(budget.periodStart)
    const budgetEnd = new Date(budget.periodEnd)
    return budgetStart <= now && budgetEnd >= now
  })

  return activeBudgets.map((budget) => {
    const category = (categories.value || []).find((c) => c._id === budget.categoryId)
    return {
      _id: budget._id,
      name: category ? `${category.name} (Budget)` : `Budget (${budget._id.substring(0, 8)}...)`,
      budgetId: budget._id,
      categoryId: budget.categoryId,
    }
  })
})

// Dynamic category options based on transaction type and transfer direction
const categoryOptions = computed(() => {
  if (form.value.kind === 'transfer') {
    if (transferFromBudget.value) {
      // When transferring from budget to wallet, show wallets as category options
      return (wallets.value || []).map((wallet) => ({
        _id: wallet._id,
        name: wallet.name,
        type: 'wallet',
      }))
    } else {
      // When transferring from wallet to budget, show active budgets as before
      const activeBudgets = (budgets.value || []).filter((budget) => {
        const now = new Date()
        const budgetStart = new Date(budget.periodStart)
        const budgetEnd = new Date(budget.periodEnd)
        return budgetStart <= now && budgetEnd >= now
      })

      return activeBudgets.map((budget) => {
        const category = (categories.value || []).find((c) => c._id === budget.categoryId)
        return {
          _id: budget._id,
          name: category
            ? `${category.name} (Budget)`
            : `Budget (${budget._id.substring(0, 8)}...)`,
          budgetId: budget._id,
          categoryId: budget.categoryId,
          type: 'budget',
        }
      })
    }
  } else {
    // For income/expense, show regular categories
    return categories.value || []
  }
})

// Recent transactions (at least 3, up to 10) - Most recent first
const recentTransactions = computed(() => financesStore.getRecentTransactions(10))

// Current month totals
const incomeTotal = computed(() => totals.value.income)
const expenseTotal = computed(() => totals.value.expenses)
// 🔧 CHANGED: Show available amount (after budgets) instead of gross net
const netTotal = computed(() => availableAmount.value)

// 🔧 FIXED: Calculate total of all current budget amounts (not net transactions)
const budgetTotal = computed(() => {
  console.log('=== BUDGET TOTAL CALCULATION ===')
  console.log('All budgets:', budgets.value?.length || 0)
  console.log('Budgets data:', budgets.value)

  // Sum all current budget amounts from the database
  const total = (budgets.value || []).reduce((sum, budget) => {
    console.log('Budget check:', {
      id: budget._id,
      amount: budget.amount,
      categoryId: budget.categoryId,
    })

    return sum + Number(budget.amount || 0)
  }, 0)

  console.log('Budget total calculated:', total)

  return total
})

// Helper functions
function getCategoryName(categoryId, transaction = null) {
  console.log('🔍 getCategoryName called with:', { categoryId, transaction })

  // 🔧 FIXED: For budget allocation transactions, show the actual budget category name with "Budget" suffix
  if (transaction && transaction.budgetId) {
    // Find the budget to get the actual category
    const budget = budgetsStore.budgets.find((b) => b._id === transaction.budgetId)
    console.log('📊 Found budget:', budget)

    if (budget) {
      const category = (categories.value || []).find((c) => c._id === budget.categoryId)
      console.log('🏷️ Found category:', category)

      if (transaction.isBudgetAllocation) {
        const result = category ? `${category.name} Budget` : 'Budget'
        console.log('✅ Budget allocation display:', result)
        return result
      } else if (transaction.isBudgetWithdrawal) {
        // For budget withdrawals, show format: "Category budget to Wallet Name"
        const wallet = (wallets.value || []).find((w) => w._id === transaction.walletId)
        const walletName = wallet ? wallet.name : 'Wallet'
        const result = category
          ? `${category.name} budget to ${walletName}`
          : `Budget to ${walletName}`
        console.log('✅ Budget withdrawal display:', result)
        return result
      }
    }
  }

  const category = (categories.value || []).find((c) => c._id === categoryId)
  const result = category ? category.name : 'Uncategorized'
  console.log('📝 Regular category display:', result)
  return result
}

function getTransactionIcon(transaction) {
  if (transaction.isBudgetAllocation) {
    return '⇄' // Budget allocation icon
  }

  if (transaction.isBudgetWithdrawal) {
    return '↶' // Budget withdrawal icon
  }

  if (transaction.kind === 'income') {
    return '↑'
  } else if (transaction.kind === 'expense') {
    return '↓'
  } else if (transaction.kind === 'transfer') {
    return '⇄' // Transfer icon
  }
  return '?'
}

function getTransactionColor(transaction) {
  if (transaction.isBudgetAllocation) {
    return 'info' // Blue for budget allocations
  }

  if (transaction.isBudgetWithdrawal) {
    return 'orange' // Orange for budget withdrawals
  }

  if (transaction.kind === 'income') {
    return 'positive'
  } else if (transaction.kind === 'expense') {
    return 'negative'
  } else if (transaction.kind === 'transfer') {
    return 'info'
  }
  return 'grey'
}

function getAmountDisplay(transaction) {
  const amount = transaction.amount.toLocaleString()

  if (transaction.isBudgetAllocation) {
    return `₱${amount}` // Budget allocations show without +/- sign
  }

  if (transaction.kind === 'income') {
    return `+₱${amount}`
  } else if (transaction.kind === 'expense') {
    return `-₱${amount}`
  } else if (transaction.kind === 'transfer') {
    return `₱${amount}` // Transfers show without +/- sign
  }
  return `₱${amount}`
}

function getAmountColor(transaction) {
  if (transaction.isBudgetAllocation) {
    return 'budget-text'
  }

  if (transaction.isBudgetWithdrawal) {
    return 'budget-text'
  }

  if (transaction.kind === 'income') {
    return 'income-text'
  } else if (transaction.kind === 'expense') {
    return 'expense-text'
  } else if (transaction.kind === 'transfer') {
    return 'budget-text'
  }
  return 'text-grey'
}

function formatDateTime(datetime) {
  const date = new Date(datetime)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Load expected tithes (10% of all salary)
async function loadExpectedTithes() {
  try {
    expectedTithes.value = await budgetsStore.calculateExpectedTithes()
  } catch {
    expectedTithes.value = 0
  }
}

// Check for active auto-budgeters
async function checkActiveAutoBudgeters() {
  try {
    const userId = currentUser.value?._id
    if (!userId) {
      activeAutoBudgeters.value = []
      return
    }

    const userDoc = await localDB.get(userId)
    const budgeters = []

    if (userDoc['budgeter-weekly']) {
      const weeklyBudget = await localDB.get(userDoc['budgeter-weekly'])
      if (weeklyBudget) {
        budgeters.push({
          id: weeklyBudget._id,
          frequency: 'weekly',
          label: 'Weekly Budget',
          data: weeklyBudget,
        })
      }
    }

    if (userDoc['budgeter-monthly']) {
      const monthlyBudget = await localDB.get(userDoc['budgeter-monthly'])
      if (monthlyBudget) {
        budgeters.push({
          id: monthlyBudget._id,
          frequency: 'monthly',
          label: 'Monthly Budget',
          data: monthlyBudget,
        })
      }
    }

    activeAutoBudgeters.value = budgeters
    console.log('Active auto-budgeters found:', budgeters.length)
  } catch (error) {
    console.error('Failed to check auto-budgeters:', error)
    activeAutoBudgeters.value = []
  }
}

// Handle auto-budget allocation for income transactions
async function handleAutoBudgetAllocation(transactionData, amount) {
  if (!selectedAutoBudgeter.value || !hasAutoBudgeters.value) {
    return // No auto-budget selected
  }

  try {
    const autoBudgeter = activeAutoBudgeters.value.find(
      (ab) => ab.id === selectedAutoBudgeter.value,
    )

    if (!autoBudgeter) {
      console.warn('Selected auto-budgeter not found')
      return
    }

    const budgetData = autoBudgeter.data
    console.log('Creating auto-budget allocations for:', budgetData.frequency)
    console.log('Income amount:', amount)

    let successfulAllocations = 0
    let totalAllocated = 0

    // Create budget allocation transactions for each category based on percentage
    for (const category of budgetData.categories) {
      if (category.percent > 0) {
        // Calculate actual amount based on percentage of income
        const calculatedAmount = Math.round((Number(category.percent) / 100) * amount)

        console.log(
          `Category: ${category.name}, Percent: ${category.percent}%, Calculated: ₱${calculatedAmount}`,
        )

        if (calculatedAmount > 0) {
          try {
            // Special handling for Tithes - create as regular expense transaction
            if (category.name.toLowerCase() === 'tithes') {
              await createTithesTransaction(calculatedAmount)
            } else {
              // Regular categories - create as budget allocation
              await createAutoBudgetAllocationTransaction(
                category.name,
                calculatedAmount,
                budgetData._id,
              )
            }
            successfulAllocations++
            totalAllocated += calculatedAmount
          } catch (error) {
            console.error(`Failed to allocate for ${category.name}:`, error)
          }
        }
      }
    }

    if (successfulAllocations > 0) {
      $q.notify({
        type: 'positive',
        message: `Auto-budget allocation completed for ${autoBudgeter.label}`,
        caption: `₱${amount.toLocaleString()} income → ₱${totalAllocated.toLocaleString()} allocated across ${successfulAllocations} categories`,
      })
    } else {
      $q.notify({
        type: 'warning',
        message: 'No categories with percentages found',
        caption: 'Please check your auto-budget configuration',
      })
    }
  } catch (error) {
    console.error('Auto-budget allocation failed:', error)
    $q.notify({
      type: 'warning',
      message: 'Auto-budget allocation failed',
      caption: 'Transaction saved but budget allocation was not completed',
    })
  }
}

// Create individual budget allocation transaction
async function createAutoBudgetAllocationTransaction(categoryName, amount, allocationId) {
  try {
    // Find the category
    let category = (categories.value || []).find((c) => c.name === categoryName)

    if (!category) {
      // Create the category if it doesn't exist
      category = await categoriesStore.addCategory({
        name: categoryName,
        kind: 'expense',
        icon: 'category',
        color: 'blue-5',
        description: `${categoryName} expenses`,
        isShared: true,
      })
    }

    if (!category || !category._id) {
      throw new Error(`Failed to find or create category: ${categoryName}`)
    }

    // Create or update budget record for this category
    await createOrUpdateBudget(category._id, categoryName, amount)

    // Create budget allocation transaction
    const allocationTransaction = {
      walletId: form.value.walletId,
      kind: 'transfer',
      amount: Number(amount),
      categoryId: category._id,
      notes: `Auto-budget allocation for ${categoryName}`,
      datetime: new Date().toISOString(),
      isBudgetAllocation: true,
      isTransfer: true,
      autoBudgetAllocationId: allocationId,
    }

    await financesStore.addTransaction(allocationTransaction)
    console.log(`Created budget allocation: ${categoryName} - ₱${amount}`)
  } catch (error) {
    console.error(`Failed to create budget allocation for ${categoryName}:`, error)
    throw error
  }
}

// Create tithes transaction (as regular expense, not budget allocation)
async function createTithesTransaction(amount) {
  try {
    // Find or create Tithes category
    let tithesCategory = (categories.value || []).find((c) => c.name.toLowerCase() === 'tithes')

    if (!tithesCategory) {
      tithesCategory = await categoriesStore.addCategory({
        name: 'Tithes',
        kind: 'expense',
        icon: 'church',
        color: 'green-5',
        description: 'Tithes and offerings',
        isShared: true,
      })
    }

    if (!tithesCategory || !tithesCategory._id) {
      throw new Error('Failed to find or create Tithes category')
    }

    // Create regular expense transaction for tithes
    const tithesTransaction = {
      walletId: form.value.walletId,
      kind: 'expense',
      amount: Number(amount),
      categoryId: tithesCategory._id,
      notes: `Auto-budget tithes (10% of income)`,
      datetime: new Date().toISOString(),
      isTithesTransaction: true,
    }

    await financesStore.addTransaction(tithesTransaction)
    console.log(`Created tithes transaction: ₱${amount}`)
  } catch (error) {
    console.error('Failed to create tithes transaction:', error)
    throw error
  }
}

// Create or update budget record for auto-budget allocation
async function createOrUpdateBudget(categoryId, categoryName, amount) {
  try {
    // Check if budget already exists for this category in current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Look for existing budget for this category
    const existingBudget = budgets.value.find((budget) => {
      const budgetStart = new Date(budget.periodStart)
      const budgetEnd = new Date(budget.periodEnd)
      return (
        budget.categoryId === categoryId && budgetStart <= endOfMonth && budgetEnd >= startOfMonth
      )
    })

    if (existingBudget) {
      // Update existing budget
      const newAmount = existingBudget.amount + Number(amount)
      await budgetsStore.updateBudget(existingBudget._id, {
        amount: newAmount,
        updatedAt: new Date().toISOString(),
      })
      console.log(
        `Updated existing budget for ${categoryName}: ₱${existingBudget.amount} → ₱${newAmount}`,
      )
    } else {
      // Create new budget
      const newBudget = {
        categoryId: categoryId,
        budgetType: 'monthly',
        periodStart: startOfMonth.toISOString(),
        periodEnd: endOfMonth.toISOString(),
        amount: Number(amount),
        percent: 0,
        isShared: false,
        sharedWithUserIds: [],
      }

      await budgetsStore.addBudget(newBudget)
      console.log(`Created new budget for ${categoryName}: ₱${amount}`)
    }
  } catch (error) {
    console.error(`Failed to create/update budget for ${categoryName}:`, error)
    // Don't throw - budget creation failure shouldn't stop transaction creation
  }
}

// Dialog control methods
function openTransactionDialog() {
  resetCalculator()

  form.value.kind = 'expense'
  form.value.amount = ''
  form.value.categoryId = ''
  form.value.notes = ''
  form.value.walletId = wallets[0]?._id || ''
  transferFromBudget.value = false // Reset transfer direction
  selectedAutoBudgeter.value = null // Reset auto-budget selection

  // Ensure budgets are loaded for transfer functionality
  if (budgets.value.length === 0) {
    budgetsStore.loadBudgets()
  }

  // Check for active auto-budgeters
  checkActiveAutoBudgeters()

  showTransactionDialog.value = true
}

function openEditDialog(transaction) {
  selectedTransaction.value = transaction
  // Pre-populate form with current transaction data
  form.value = {
    kind: transaction.kind,
    amount: transaction.amount.toString(),
    categoryId: transaction.categoryId,
    notes: transaction.notes || '',
    walletId: transaction.walletId,
  }
  selectedAutoBudgeter.value = null // Reset auto-budget selection for editing

  showTransactionDialog.value = true
}

async function finishTransaction() {
  if (!form.value.amount || !form.value.categoryId || !form.value.walletId) {
    $q.notify({ type: 'negative', message: 'Please fill in all required fields' })
    return
  }

  const amount = parseFloat(form.value.amount)
  if (amount < 0) {
    $q.notify({
      type: 'negative',
      message: 'Cannot save negative amounts. Please check your calculation.',
    })
    return
  }

  try {
    const transactionData = {
      walletId: form.value.walletId,
      kind: form.value.kind,
      amount: amount,
      categoryId: form.value.categoryId,
      notes: form.value.notes,
      datetime: new Date().toISOString(),
    }

    // If this is a transfer, set transfer-specific fields
    if (form.value.kind === 'transfer' && form.value.categoryId) {
      if (transferFromBudget.value) {
        // Budget to wallet transfer
        const selectedBudget = budgetWalletOptions.value.find(
          (opt) => opt._id === form.value.walletId,
        )
        if (selectedBudget && selectedBudget.budgetId) {
          // Find the actual budget to get its category
          const budget = budgets.value.find((b) => b._id === selectedBudget.budgetId)
          if (budget) {
            // Use the budget's original category ID for proper categorization
            transactionData.categoryId = budget.categoryId
            transactionData.walletId = form.value.categoryId // Use selected wallet
            transactionData.budgetId = selectedBudget.budgetId
            transactionData.isBudgetAllocation = false // This is a withdrawal from budget
            transactionData.isTransfer = true
            transactionData.isBudgetWithdrawal = true
            // Update notes to indicate it's a budget withdrawal
            if (!transactionData.notes || transactionData.notes.trim() === '') {
              transactionData.notes = 'Transfer from budget to wallet'
            }
          }
        }
      } else {
        // Wallet to budget transfer (budget allocation)
        const selectedOption = categoryOptions.value.find(
          (opt) => opt._id === form.value.categoryId,
        )
        if (selectedOption && selectedOption.budgetId) {
          transactionData.budgetId = selectedOption.budgetId
          transactionData.isBudgetAllocation = true
          transactionData.isTransfer = true
          // Update notes to indicate it's a budget allocation
          if (!transactionData.notes || transactionData.notes.trim() === '') {
            transactionData.notes = 'Transfer to budget allocation'
          }
        }
      }
    }

    if (selectedTransaction.value) {
      // Update existing transaction
      console.log('Updating transaction:', selectedTransaction.value._id, transactionData)
      await financesStore.updateTransaction(selectedTransaction.value._id, transactionData)
      $q.notify({ type: 'positive', message: 'Transaction updated successfully!' })
    } else {
      // Create new transaction
      console.log('Creating new transaction:', transactionData)
      await financesStore.addTransaction(transactionData)

      // Handle auto-budget allocation for income transactions
      if (form.value.kind === 'income' && selectedAutoBudgeter.value) {
        await handleAutoBudgetAllocation(transactionData, amount)
      }

      $q.notify({ type: 'positive', message: 'Transaction added successfully!' })
    }

    showTransactionDialog.value = false
    selectedTransaction.value = null

    // 🔧 ENHANCED: Refresh all related data when transfers happen
    if (form.value.kind === 'transfer') {
      console.log('🔄 Transfer completed, refreshing all related data...')

      // 🔧 NEW: Update budget document if this is a budget withdrawal or allocation
      if (transactionData.budgetId) {
        console.log('💰 Budget transaction detected, updating budget document...')

        const budgetToUpdate = budgets.value.find((b) => b._id === transactionData.budgetId)
        if (budgetToUpdate) {
          let newBudgetAmount = budgetToUpdate.amount

          if (transactionData.isBudgetWithdrawal) {
            // Money leaving budget: reduce budget amount
            newBudgetAmount = Math.max(0, budgetToUpdate.amount - amount)
            console.log(`💸 Budget withdrawal: ${budgetToUpdate.amount} → ${newBudgetAmount}`)
          } else if (transactionData.isBudgetAllocation) {
            // Money going to budget: increase budget amount
            newBudgetAmount = budgetToUpdate.amount + amount
            console.log(`💰 Budget allocation: ${budgetToUpdate.amount} → ${newBudgetAmount}`)
          }

          try {
            await budgetsStore.updateBudget(transactionData.budgetId, {
              amount: newBudgetAmount,
              updatedAt: new Date().toISOString(),
            })

            const action = transactionData.isBudgetWithdrawal ? 'withdrawal' : 'allocation'
            console.log(
              `✅ Budget ${action} completed: ${budgetToUpdate.amount} → ${newBudgetAmount}`,
            )

            $q.notify({
              type: 'positive',
              message: `Budget ${action}: ₱${budgetToUpdate.amount.toLocaleString()} → ₱${newBudgetAmount.toLocaleString()}`,
              timeout: 3000,
            })
          } catch (budgetUpdateError) {
            console.error('❌ Failed to update budget document:', budgetUpdateError)
            $q.notify({
              type: 'warning',
              message: 'Transfer completed but budget update failed',
              caption: 'Please refresh budgets manually',
            })
          }
        }
      }

      await Promise.all([
        budgetsStore.refreshBudgetSpent(),
        budgetsStore.loadBudgets(), // Force reload budgets with updated amounts
        financesStore.loadAll(), // Reload transactions to update calculations
      ])
      console.log('✅ All data refreshed after transfer')
    }
  } catch (error) {
    console.error('Error saving transaction:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status,
      reason: error.reason,
    })

    let errorMessage = 'Failed to save transaction'
    let showRetry = false

    if (error.message) {
      if (
        error.message.includes('Document update conflict') ||
        error.message.includes('modified elsewhere')
      ) {
        errorMessage = 'This transaction was modified elsewhere. Please refresh and try again.'
        showRetry = true
      } else {
        errorMessage += `: ${error.message}`
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      timeout: showRetry ? 8000 : 5000,
      actions: showRetry
        ? [
            {
              label: 'Retry',
              color: 'white',
              handler: () => {
                finishTransaction()
              },
            },
            {
              label: 'Refresh',
              color: 'white',
              handler: () => {
                financesStore.loadAll()
                $q.notify({ type: 'info', message: 'Data refreshed. Please try editing again.' })
              },
            },
          ]
        : [],
    })
  }
}

// Calculator functions
function resetCalculator() {
  calculator.value.display = ''
  calculator.value.equation = ''
  calculator.value.previousValue = 0
  calculator.value.operation = null
  calculator.value.waitingForNewValue = false
}

function appendNumber(num) {
  if (calculator.value.waitingForNewValue) {
    form.value.amount = num
    calculator.value.waitingForNewValue = false
  } else if (form.value.amount === '0' || form.value.amount === '') {
    form.value.amount = num
  } else {
    form.value.amount += num
  }
}

function appendDecimal() {
  if (calculator.value.waitingForNewValue) {
    form.value.amount = '0.'
    calculator.value.waitingForNewValue = false
  } else if (form.value.amount.indexOf('.') === -1) {
    form.value.amount += '.'
  }
}

function backspace() {
  if (calculator.value.waitingForNewValue) {
    calculator.value.waitingForNewValue = false
    form.value.amount = '0'
  } else {
    form.value.amount = form.value.amount.slice(0, -1) || '0'
  }
}

function clearAmount() {
  resetCalculator()
  form.value.amount = '0'
}

function calculate() {
  const current = parseFloat(form.value.amount) || 0
  const previous = calculator.value.previousValue

  if (calculator.value.operation && !calculator.value.waitingForNewValue) {
    switch (calculator.value.operation) {
      case '+':
        form.value.amount = (previous + current).toString()
        break
      case '-':
        form.value.amount = (previous - current).toString()
        break
      case '×':
        form.value.amount = (previous * current).toString()
        break
      case '÷':
        form.value.amount = current !== 0 ? (previous / current).toString() : '0'
        break
    }
  }
}

function setOperation(operation) {
  const current = parseFloat(form.value.amount) || 0

  if (calculator.value.operation && !calculator.value.waitingForNewValue) {
    calculate()
  }

  calculator.value.previousValue = current
  calculator.value.operation = operation
  calculator.value.waitingForNewValue = true
}

// Load data on mount
onMounted(async () => {
  // Initialize user if not logged in (for demo purposes)
  if (!currentUser.value) {
    // Check if user is authenticated
    if (!currentUser.value) {
      console.warn('No user logged in - records require authentication')
      return
    }
  }

  // Load all data
  await Promise.all([
    financesStore.loadAll(),
    categoriesStore.loadCategories(),
    budgetsStore.loadBudgets(),
  ])

  // Load expected tithes
  await loadExpectedTithes()

  // Check for active auto-budgeters
  await checkActiveAutoBudgeters()

  // Set default wallet
  if (wallets.value.length > 0) {
    form.value.walletId = wallets.value[0]._id

    // Also ensure activeWallet is set properly for single users
    if (!activeWallet.value || activeWallet.value === 'all') {
      const hasMultipleWallets = wallets.value.length > 1
      const isSharingEnabled = currentUser.value?.isSharingEnabled === true

      if (hasMultipleWallets && isSharingEnabled) {
        activeWallet.value = 'all'
      } else {
        activeWallet.value = wallets.value[0]._id
      }
    }
  }

  // Handle transaction navigation from HomePage
  const transactionId = route.query.transactionId
  const walletId = route.query.walletId

  if (transactionId && transactions.value.length > 0) {
    const transaction = transactions.value.find((t) => t._id === transactionId)
    if (transaction) {
      if (walletId && walletId !== 'all') {
        activeWallet.value = walletId
      }
      nextTick(() => {
        openEditDialog(transaction)
        router.replace({ name: 'records', query: {} })
      })
    }
  }
})
</script>

<style scoped>
/* Summary Cards Layout */
.summary-cards-container {
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-col {
  flex: 1;
  min-width: 0;
}

.summary-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  height: 100%;
  width: 100%;
  min-height: 80px;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Transaction item hover effect */
.transaction-item:hover {
  background-color: #f5f5f5;
}

/* Calculator prominence and styling */
.calculator-keypad {
  max-width: 360px;
  margin: 0 auto;
}

.calculator-keypad .q-btn {
  min-width: 70px;
  min-height: 70px;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 12px;
}

.calculator-keypad .q-btn[color='secondary'] {
  background-color: #f8f9fa;
  color: #495057;
  border: 2px solid #e9ecef;
}

.calculator-keypad .q-btn[color='secondary']:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

/* Number buttons styling */
.calculator-keypad .q-btn:not([color]) {
  background-color: #ffffff;
  color: #212529;
  border: 2px solid #e9ecef;
}

.calculator-keypad .q-btn:not([color]):hover {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

/* Calculator display prominence */
.calculator-display {
  font-size: 2rem;
  color: #4d934e;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 16px 24px;
  border-radius: 16px;
  border: 2px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Account and Category side-by-side layout */
.account-category-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.account-category-container {
  flex: 1;
  min-width: 0;
}

.account-select,
.category-select {
  width: 100%;
}

/* Ensure proper side-by-side layout for Add Transaction dialog */
.account-category-row .account-category-container {
  flex-basis: calc(50% - 8px);
  min-width: 200px;
}

.account-category-row {
  display: flex !important;
  flex-direction: row !important;
}

.account-category-container {
  display: block !important;
}

/* Full-screen dialog design */
.full-screen-dialog {
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
}

.dialog-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
  margin-top: auto;
  justify-content: center !important;
}

.dialog-cancel-btn {
  color: #6c757d;
  min-width: 120px;
}

.dialog-save-btn {
  background: #4d934e !important;
  color: white;
  min-width: 120px;
}

/* Color-coded text classes */
.income-text {
  color: #4d934e !important;
}

.expense-text {
  color: #dc3545 !important;
}

.tithes-text {
  color: #4d934e !important;
}

.offerings-text {
  color: #ffc107 !important;
}

.faith-promise-text {
  color: #6f42c1 !important;
}

.budget-text {
  color: #2196f3 !important;
}

.net-text {
  color: #10b981 !important;
}

/* Auto-budget card styling */
.auto-budget-card {
  border: 2px solid #2196f3 !important;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  transition: all 0.3s ease;
}

.auto-budget-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);
}

/* Mobile responsive design */
@media (max-width: 600px) {
  .summary-card {
    min-height: 70px;
  }

  .summary-card .q-card {
    padding: 8px;
  }

  .summary-card .text-h6 {
    font-size: 0.9rem;
    line-height: 1.2;
  }

  .summary-card .text-caption {
    font-size: 0.75rem;
  }

  .calculator-keypad {
    max-width: 300px;
  }

  .calculator-keypad .q-btn {
    min-width: 60px;
    min-height: 60px;
    font-size: 1.1rem;
  }

  .full-screen-dialog {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
  }

  .dialog-content {
    padding: 16px;
  }

  .dialog-footer {
    padding: 12px 16px;
    gap: 8px;
  }

  .dialog-footer .q-btn {
    min-width: 100px;
    flex: 1;
    max-width: 140px;
  }
}
</style>
