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
            <div class="text-caption text-grey">Total</div>
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
            <q-avatar
              :color="transaction.kind === 'income' ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
            >
              {{ transaction.kind === 'income' ? '↑' : '↓' }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{
              getCategoryName(transaction.categoryId)
            }}</q-item-label>
            <q-item-label caption>{{ formatDateTime(transaction.datetime) }}</q-item-label>
            <q-item-label caption v-if="transaction.notes">{{ transaction.notes }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div
              class="text-subtitle2 text-weight-bold"
              :class="transaction.kind === 'income' ? 'income-text' : 'expense-text'"
            >
              {{ transaction.kind === 'income' ? '+' : '-' }}₱{{
                transaction.amount.toLocaleString()
              }}
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

          <!-- Account & Category Selection -->
          <div class="account-category-row q-mb-md">
            <div class="account-category-container">
              <q-select
                v-model="form.walletId"
                :options="walletOptions"
                option-label="name"
                option-value="_id"
                label="Account"
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
                label="Category"
                filled
                emit-value
                map-options
                class="category-select"
              />
            </div>
          </div>

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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFinancesStore } from 'src/stores/finances'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'
import { useBudgetsStore } from 'src/stores/budgets'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

// Stores
const financesStore = useFinancesStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()
const budgetsStore = useBudgetsStore()

// State from stores - use storeToRefs to maintain reactivity
const { wallets, transactions } = storeToRefs(financesStore)
const { categories } = storeToRefs(categoriesStore)
const { currentUser } = storeToRefs(usersStore)

// Access computed properties directly from store instance
const totals = computed(() => financesStore.totals)
const spiritualGiving = computed(() => financesStore.spiritualGiving)

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

// UI state
const activeWallet = ref(null)

// Expected tithes state
const expectedTithes = ref(0)

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

const categoryOptions = computed(() => categories.value || [])

// Recent transactions (at least 3, up to 10) - Most recent first
const recentTransactions = computed(() => financesStore.getRecentTransactions(10))

// Current month totals
const incomeTotal = computed(() => totals.value.income)
const expenseTotal = computed(() => totals.value.expenses)
const netTotal = computed(() => totals.value.net)

// Helper functions
function getCategoryName(categoryId) {
  const category = (categories.value || []).find((c) => c._id === categoryId)
  return category ? category.name : 'Uncategorized'
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

// Dialog control methods
function openTransactionDialog() {
  resetCalculator()

  form.value.kind = 'expense'
  form.value.amount = ''
  form.value.categoryId = ''
  form.value.notes = ''
  form.value.walletId = wallets[0]?._id || ''
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

    if (selectedTransaction.value) {
      // Update existing transaction
      console.log('Updating transaction:', selectedTransaction.value._id, transactionData)
      await financesStore.updateTransaction(selectedTransaction.value._id, transactionData)
      $q.notify({ type: 'positive', message: 'Transaction updated successfully!' })
    } else {
      // Create new transaction
      console.log('Creating new transaction:', transactionData)
      await financesStore.addTransaction(transactionData)
      $q.notify({ type: 'positive', message: 'Transaction added successfully!' })
    }

    showTransactionDialog.value = false
    selectedTransaction.value = null
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
  await Promise.all([financesStore.loadAll(), categoriesStore.loadCategories()])

  // Load expected tithes
  await loadExpectedTithes()

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

.net-text {
  color: #10b981 !important;
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
