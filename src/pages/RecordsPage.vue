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
              ₱{{ tithesTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Tithes</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold offerings-text">
              ₱{{ offeringsTotal.toLocaleString() }}
            </div>
            <div class="text-caption text-grey">Offerings</div>
          </q-card>
        </div>
        <div class="summary-col">
          <q-card flat bordered class="text-center q-pa-md summary-card">
            <div class="text-h6 text-weight-bold faith-promise-text">
              ₱{{ faithPromiseTotal.toLocaleString() }}
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
            <q-item-label class="text-weight-medium">{{ transaction.category }}</q-item-label>
            <q-item-label caption>{{
              formatDateTime(transaction.date, transaction.time)
            }}</q-item-label>
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
      <q-btn color="primary" icon="add" size="lg" class="fab-button" @click="openExpenseDialog" />
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
                v-model="form.category"
                :options="categoryOptions"
                label="Category"
                filled
                emit-value
                map-options
                hint="Select or type to create"
                @new-value="createNewCategory"
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
            <!-- Equation Display -->
            <div
              v-if="calculator.equation"
              class="text-h6 text-weight-medium q-mb-sm equation-display"
            >
              {{ calculator.equation }}
            </div>

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

          <!-- Date & Time Selection -->
          <div class="datetime-row">
            <div class="datetime-container">
              <q-input v-model="form.date" label="Date" filled type="date" class="date-input" />
            </div>
            <div class="datetime-container">
              <q-input v-model="form.time" label="Time" filled type="time" class="time-input" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="dialog-footer">
          <q-btn flat label="Cancel" v-close-popup class="dialog-cancel-btn" />
          <q-btn
            color="primary"
            label="Save Transaction"
            @click="finishTransaction"
            :disable="!form.amount || !form.category || !form.walletId"
            class="dialog-save-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Transaction Edit/Delete Dialog -->
    <q-dialog v-model="showEditDialog" :key="dialogKey" maximized>
      <q-card class="full-screen-dialog">
        <q-card-section class="dialog-header">
          <div class="row items-center justify-between">
            <div class="text-h6">Transaction Details</div>
            <div class="action-buttons">
              <q-btn icon="edit" flat round color="white" @click="startEdit" class="edit-btn" />
              <q-btn
                icon="delete"
                flat
                round
                color="negative"
                @click="confirmDelete"
                class="delete-btn"
              />
              <q-btn icon="close" flat round @click="showEditDialog = false" class="close-btn" />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="selectedTransaction" class="dialog-content">
          <!-- Transaction Type -->
          <div class="row items-center justify-center q-mb-md">
            <div class="text-h6 text-weight-bold transaction-type">
              {{ selectedTransaction.kind.toUpperCase() }}
            </div>
          </div>

          <!-- Amount Display -->
          <div class="text-center q-mb-lg">
            <div
              class="text-h4 text-weight-bold"
              :class="selectedTransaction.kind === 'expense' ? 'expense-text' : 'income-text'"
            >
              {{ selectedTransaction.kind === 'expense' ? '-' : '+' }}₱{{
                selectedTransaction.amount.toLocaleString()
              }}
            </div>
          </div>

          <!-- Date and Time -->
          <div class="row q-gutter-md q-mb-md">
            <div class="col-12">
              <div class="text-subtitle2 text-grey">
                {{ formatDateTime(selectedTransaction.date, selectedTransaction.time) }}
              </div>
            </div>
          </div>

          <!-- Account and Category (Side by Side) -->
          <div class="edit-fields-row q-mb-md">
            <div class="edit-field-container">
              <q-select
                v-model="editForm.walletId"
                :options="walletOptions"
                option-label="name"
                option-value="_id"
                label="Account"
                filled
                emit-value
                map-options
                :readonly="!editForm.isEditing"
                class="edit-field"
              />
            </div>
            <div class="edit-field-container">
              <q-select
                v-model="editForm.category"
                :options="categoryOptions"
                label="Category"
                filled
                emit-value
                map-options
                :readonly="!editForm.isEditing"
                class="edit-field"
              />
            </div>
          </div>

          <!-- Notes Section -->
          <div class="q-mb-lg">
            <q-input
              v-model="editForm.notes"
              label="Notes"
              filled
              type="textarea"
              rows="3"
              :readonly="!editForm.isEditing"
              :placeholder="editForm.isEditing ? 'Add or edit notes...' : ''"
            />
          </div>

          <!-- Calculator for editing amount -->
          <div v-if="editForm.isEditing" class="text-center q-mb-lg">
            <div class="text-h5 text-weight-bold calculator-display">
              ₱{{ editForm.amount || '0' }}
            </div>

            <div class="calculator-keypad">
              <!-- Row 1: Numbers and Operations -->
              <div class="row q-gutter-xs justify-center">
                <q-btn color="secondary" round size="md" label="+" @click="editSetOperation('+')" />
                <q-btn flat round size="md" label="7" @click="editAppendNumber('7')" />
                <q-btn flat round size="md" label="8" @click="editAppendNumber('8')" />
                <q-btn flat round size="md" label="9" @click="editAppendNumber('9')" />
              </div>

              <!-- Row 2: Numbers and Operations -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="md" label="-" @click="editSetOperation('-')" />
                <q-btn flat round size="md" label="4" @click="editAppendNumber('4')" />
                <q-btn flat round size="md" label="5" @click="editAppendNumber('5')" />
                <q-btn flat round size="md" label="6" @click="editAppendNumber('6')" />
              </div>

              <!-- Row 3: Numbers and Operations -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="md" label="×" @click="editSetOperation('×')" />
                <q-btn flat round size="md" label="1" @click="editAppendNumber('1')" />
                <q-btn flat round size="md" label="2" @click="editAppendNumber('2')" />
                <q-btn flat round size="md" label="3" @click="editAppendNumber('3')" />
              </div>

              <!-- Row 4: Operations, Zero, Double Zero, Decimal -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="secondary" round size="md" label="÷" @click="editSetOperation('÷')" />
                <q-btn flat round size="md" label="0" @click="editAppendNumber('0')" />
                <q-btn flat round size="md" label="00" @click="editAppendNumber('00')" />
                <q-btn flat round size="md" label="." @click="editAppendDecimal" />
              </div>

              <!-- Row 5: Backspace, Equals, Clear, Done -->
              <div class="row q-gutter-xs justify-center q-mt-xs">
                <q-btn color="orange" round size="md" icon="backspace" @click="editBackspace" />
                <q-btn color="positive" round size="md" label="=" @click="editCalculate" />
                <q-btn color="negative" round size="md" label="C" @click="editClearAmount" />
                <q-btn color="primary" round size="md" label="Done" @click="saveEdit" />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions v-if="selectedTransaction && !editForm.isEditing" class="dialog-footer">
          <q-btn
            flat
            label="Close"
            @click="showEditDialog = false"
            class="dialog-cancel-btn dialog-footer-btn"
          />
        </q-card-actions>

        <q-card-actions v-if="selectedTransaction && editForm.isEditing" class="dialog-footer">
          <q-btn
            flat
            label="Cancel"
            @click="cancelEdit"
            class="dialog-cancel-btn dialog-footer-btn"
          />
          <q-btn
            color="primary"
            label="Save Changes"
            @click="saveEdit"
            class="dialog-save-btn dialog-footer-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar, Dialog } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useFinancesStore } from 'src/stores/finances'
import { useWalletsStore } from 'src/stores/wallets'
import { useCategoriesStore } from 'src/stores/categories'
import { storeToRefs } from 'pinia'
import { useDatabase, useTransactions } from 'src/composables/useDatabase'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = useFinancesStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const { localDB, getAllDocs, deleteDoc } = useDatabase()
const { getRecentTransactions } = useTransactions()

const { transactions, wallets } = storeToRefs(store)
const { activeWallet: storeActiveWallet } = storeToRefs(walletsStore)
const { categories } = storeToRefs(categoriesStore)

// Dialog state
const showTransactionDialog = ref(false)
const showEditDialog = ref(false)
const selectedTransaction = ref(null)
const dialogKey = ref(0) // For forcing dialog re-render

// Calculator state
const calculator = ref({
  display: '',
  equation: '', // Shows the math expression being built
  previousValue: 0,
  operation: null,
  waitingForNewValue: false,
})

// Form data for new transaction
const form = ref({
  kind: 'expense',
  amount: '',
  category: '',
  notes: '',
  walletId: '',
  date: new Date().toISOString().substring(0, 10),
  time: new Date().toISOString().substring(11, 16), // HH:MM format
})

// UI state
const activeWallet = ref('all')

// Edit form state
const editForm = ref({
  walletId: '',
  category: '',
  notes: '',
  amount: '',
  isEditing: false,
})

// Computed properties
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => [{ name: 'All Wallets', _id: 'all' }, ...wallets.value])

const categoryOptions = computed(() => {
  const options = categories.value.map((c) => ({ label: c.name, value: c.name }))
  console.log('RecordsPage - Category options:', options)
  return options
})

// Recent transactions (at least 3, up to 10) - Most recent first
const recentTransactions = computed(() =>
  getRecentTransactions(transactions.value, activeWallet.value, 10),
)

// Current month totals
const currentMonthTransactions = computed(() => {
  const currentMonthStr = new Date().toISOString().substring(0, 7) // YYYY-MM
  return transactions.value.filter((t) => t.date.startsWith(currentMonthStr))
})

const incomeTotal = computed(() => {
  const filtered =
    activeWallet.value === 'all'
      ? currentMonthTransactions.value
      : currentMonthTransactions.value.filter((t) => t.walletId === activeWallet.value)
  return filtered.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0)
})

const expenseTotal = computed(() => {
  const filtered =
    activeWallet.value === 'all'
      ? currentMonthTransactions.value
      : currentMonthTransactions.value.filter((t) => t.walletId === activeWallet.value)
  return filtered.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0)
})

const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

// Category-specific totals
const tithesTotal = computed(() => {
  const filtered =
    activeWallet.value === 'all'
      ? currentMonthTransactions.value
      : currentMonthTransactions.value.filter((t) => t.walletId === activeWallet.value)
  return filtered.filter((t) => t.category === 'Tithes').reduce((s, t) => s + t.amount, 0)
})

const offeringsTotal = computed(() => {
  const filtered =
    activeWallet.value === 'all'
      ? currentMonthTransactions.value
      : currentMonthTransactions.value.filter((t) => t.walletId === activeWallet.value)
  return filtered.filter((t) => t.category === 'Offerings').reduce((s, t) => s + t.amount, 0)
})

const faithPromiseTotal = computed(() => {
  const filtered =
    activeWallet.value === 'all'
      ? currentMonthTransactions.value
      : currentMonthTransactions.value.filter((t) => t.walletId === activeWallet.value)
  return filtered.filter((t) => t.category === 'Faith Promise').reduce((s, t) => s + t.amount, 0)
})

// Dialog control methods
function openExpenseDialog() {
  resetCalculator()

  // Get current date and time
  const now = new Date()

  form.value.kind = 'expense'
  form.value.amount = ''
  form.value.category = ''
  form.value.notes = ''
  form.value.walletId = storeActiveWallet.value || wallets.value[0]?._id || ''
  form.value.date = now.toISOString().substring(0, 10) // YYYY-MM-DD format
  form.value.time = now.toTimeString().substring(0, 5) // HH:MM format from current time
  showTransactionDialog.value = true
}

function openEditDialog(transaction) {
  console.log('openEditDialog called with transaction:', {
    id: transaction._id,
    category: transaction.category,
    amount: transaction.amount,
    walletId: transaction.walletId,
  })

  selectedTransaction.value = transaction
  // Pre-populate edit form with current transaction data
  editForm.value = {
    walletId: transaction.walletId,
    category: transaction.category,
    notes: transaction.notes || '',
    amount: transaction.amount.toString(),
    isEditing: false,
  }

  // Force reactivity update for the dialog
  showEditDialog.value = false
  dialogKey.value++ // Force dialog re-render

  // Use Vue.nextTick to ensure DOM updates
  nextTick(() => {
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      showEditDialog.value = true
      console.log('Edit dialog set to true after timeout:', showEditDialog.value)
      console.log('Dialog key incremented to:', dialogKey.value)

      // Force a Vue update cycle
      nextTick(() => {
        console.log('Final check - Edit dialog value:', showEditDialog.value)
        console.log('Dialog element should be visible now')

        // Additional force update if needed
        if (showEditDialog.value) {
          console.log('Dialog is set to true, should be visible')
        } else {
          console.warn('Dialog is still false, there might be a reactivity issue')
        }
      })
    }, 50) // Small delay to ensure DOM is ready
  })
}

function startEdit() {
  editForm.value.isEditing = true
}

function cancelEdit() {
  // Reset form to original transaction data
  editForm.value = {
    walletId: selectedTransaction.value.walletId,
    category: selectedTransaction.value.category,
    notes: selectedTransaction.value.notes || '',
    amount: selectedTransaction.value.amount.toString(),
    isEditing: false,
  }
}

async function saveEdit() {
  if (!editForm.value.amount || !editForm.value.category || !editForm.value.walletId) {
    $q.notify({ type: 'negative', message: 'Please fill in all required fields' })
    return
  }

  const amount = parseFloat(editForm.value.amount)
  if (amount < 0) {
    $q.notify({
      type: 'negative',
      message: 'Cannot save negative amounts. Please check your calculation.',
    })
    return
  }

  try {
    // Update the transaction in the database
    const updatedTransaction = {
      ...selectedTransaction.value,
      walletId: editForm.value.walletId,
      category: editForm.value.category,
      notes: editForm.value.notes,
      amount: amount,
      updatedAt: new Date().toISOString(),
    }

    await localDB.put(updatedTransaction)
    store.setTransactions(await getAllDocs('transaction'))

    // Update wallet balance
    const oldAmount = selectedTransaction.value.amount
    const newAmount = amount
    const difference = newAmount - oldAmount

    if (selectedTransaction.value.kind === 'expense') {
      walletsStore.updateBalance(editForm.value.walletId, -difference)
    } else if (selectedTransaction.value.kind === 'income') {
      walletsStore.updateBalance(editForm.value.walletId, difference)
    }

    $q.notify({ type: 'positive', message: 'Transaction updated successfully!' })
    showEditDialog.value = false
    editForm.value.isEditing = false
  } catch (error) {
    console.error('Error updating transaction:', error)
    $q.notify({ type: 'negative', message: 'Failed to update transaction' })
  }
}

async function confirmDelete() {
  Dialog.create({
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
    cancel: true,
    persistent: true,
    class: 'text-negative',
  }).onOk(async () => {
    await deleteTransaction()
  })
}

async function deleteTransaction() {
  try {
    // Use the composable delete function which handles both local and server deletion
    await deleteDoc(selectedTransaction.value)
    store.setTransactions(await getAllDocs('transaction'))

    // Update wallet balance
    if (selectedTransaction.value.kind === 'expense') {
      walletsStore.updateBalance(
        selectedTransaction.value.walletId,
        selectedTransaction.value.amount,
      )
    } else if (selectedTransaction.value.kind === 'income') {
      walletsStore.updateBalance(
        selectedTransaction.value.walletId,
        -selectedTransaction.value.amount,
      )
    }

    $q.notify({
      type: 'positive',
      message: 'Transaction deleted successfully from local app and server!',
    })
    showEditDialog.value = false
    selectedTransaction.value = null
  } catch (error) {
    console.error('Error deleting transaction:', error)

    // Handle different types of errors
    if (error.message.includes('deleted locally but failed to delete from server')) {
      // Partial success - deleted locally but not from server
      $q.notify({
        type: 'warning',
        message:
          'Transaction deleted locally but server sync failed. It will be synced when connection is restored.',
        timeout: 5000,
      })

      // Still update the local state since local deletion succeeded
      store.setTransactions(await getAllDocs('transaction'))

      // Update wallet balance
      if (selectedTransaction.value.kind === 'expense') {
        walletsStore.updateBalance(
          selectedTransaction.value.walletId,
          selectedTransaction.value.amount,
        )
      } else if (selectedTransaction.value.kind === 'income') {
        walletsStore.updateBalance(
          selectedTransaction.value.walletId,
          -selectedTransaction.value.amount,
        )
      }

      showEditDialog.value = false
      selectedTransaction.value = null
    } else {
      // Complete failure - couldn't delete locally
      $q.notify({
        type: 'negative',
        message: 'Failed to delete transaction. Please check your connection and try again.',
        timeout: 3000,
      })
    }
  }
}

// Edit calculator functions
function editAppendNumber(num) {
  if (editForm.value.amount === '0' || editForm.value.amount === '') {
    editForm.value.amount = num
  } else {
    editForm.value.amount += num
  }
}

function editAppendDecimal() {
  if (editForm.value.amount.indexOf('.') === -1) {
    editForm.value.amount += '.'
  }
}

function editBackspace() {
  editForm.value.amount = editForm.value.amount.slice(0, -1) || '0'
}

function editClearAmount() {
  editForm.value.amount = '0'
}

// Edit calculator state
const editCalculator = ref({
  previousValue: 0,
  operation: null,
  waitingForNewValue: false,
})

function editSetOperation(operation) {
  const current = parseFloat(editForm.value.amount) || 0

  if (editCalculator.value.operation && !editCalculator.value.waitingForNewValue) {
    editCalculate()
  }

  editCalculator.value.previousValue = current
  editCalculator.value.operation = operation
  editCalculator.value.waitingForNewValue = true
}

function editCalculate() {
  const current = parseFloat(editForm.value.amount) || 0
  const previous = editCalculator.value.previousValue

  if (editCalculator.value.operation && !editCalculator.value.waitingForNewValue) {
    switch (editCalculator.value.operation) {
      case '+':
        editForm.value.amount = (previous + current).toString()
        break
      case '-':
        editForm.value.amount = (previous - current).toString()
        break
      case '×':
        editForm.value.amount = (previous * current).toString()
        break
      case '÷':
        editForm.value.amount = current !== 0 ? (previous / current).toString() : '0'
        break
    }
  }
}

function resetCalculator() {
  calculator.value.display = ''
  calculator.value.equation = ''
  calculator.value.previousValue = 0
  calculator.value.operation = null
  calculator.value.waitingForNewValue = false
}

// Calculator functions
function appendNumber(num) {
  if (calculator.value.waitingForNewValue) {
    form.value.amount = num
    calculator.value.waitingForNewValue = false
    // Add number to equation
    if (calculator.value.equation && calculator.value.operation) {
      calculator.value.equation += ' ' + num
    } else {
      calculator.value.equation = num
    }
  } else if (form.value.amount === '0' || form.value.amount === '') {
    form.value.amount = num
    calculator.value.equation = num
  } else {
    form.value.amount += num
    calculator.value.equation += num
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

  // Add operation to equation display
  if (calculator.value.equation) {
    calculator.value.equation += ' ' + operation
  }
}

// Create new category if it doesn't exist
function createNewCategory(newCategory) {
  const exists = categories.value.find((c) => c.name.toLowerCase() === newCategory.toLowerCase())
  if (!exists) {
    categoriesStore.addCategory(newCategory, form.value.kind === 'income' ? 'income' : 'expense')
  }
  form.value.category = newCategory
}

// Finish transaction creation
async function finishTransaction() {
  if (!form.value.amount || !form.value.category || !form.value.walletId) {
    $q.notify({ type: 'negative', message: 'Please fill in all required fields' })
    return
  }

  const amount = parseFloat(form.value.amount)

  // Check for negative amounts
  if (amount < 0) {
    $q.notify({
      type: 'negative',
      message: 'Cannot save negative amounts. Please check your calculation.',
      position: 'top',
      timeout: 3000,
    })

    // Clear the calculator and amount
    resetCalculator()
    form.value.amount = '0'

    return
  }

  // Combine date and time into a single datetime string
  const dateTimeString = `${form.value.date}T${form.value.time}:00.000Z`

  const transaction = {
    _id: `transaction_${Date.now()}`,
    type: 'transaction',
    walletId: form.value.walletId,
    kind: form.value.kind,
    amount: parseFloat(form.value.amount),
    category: form.value.category,
    notes: form.value.notes,
    date: form.value.date,
    time: form.value.time,
    datetime: dateTimeString,
    updatedAt: new Date().toISOString(),
  }

  try {
    // Save to localDB
    await localDB.put(transaction)

    // Update Pinia store
    store.addTransaction(transaction)

    // Update wallet balance if it's an expense or income
    if (form.value.kind === 'expense') {
      walletsStore.updateBalance(form.value.walletId, -transaction.amount)
    } else if (form.value.kind === 'income') {
      walletsStore.updateBalance(form.value.walletId, transaction.amount)
    }

    $q.notify({ type: 'positive', message: 'Transaction added successfully!' })

    // Close dialog and reset
    showTransactionDialog.value = false
  } catch (error) {
    console.error('Error saving transaction:', error)
    $q.notify({ type: 'negative', message: 'Failed to save transaction' })
  }
}

// Helper function
function formatDateTime(dateStr, timeStr) {
  const date = new Date(`${dateStr}T${timeStr}`)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Handle navigation from HomePage with specific transaction
watch(
  [route, transactions],
  ([newRoute, newTransactions]) => {
    const transactionId = newRoute.query.transactionId
    const walletId = newRoute.query.walletId

    console.log('RecordsPage watcher triggered:', {
      transactionId,
      walletId,
      transactionsCount: newTransactions.length,
      hasTransactions: newTransactions.length > 0,
      currentRoute: newRoute.name,
      currentQuery: newRoute.query,
    })

    if (transactionId && newTransactions.length > 0) {
      // Find the specific transaction
      const transaction = newTransactions.find((t) => t._id === transactionId)
      console.log('Found transaction:', transaction)

      if (transaction) {
        // Set the correct wallet filter
        if (walletId && walletId !== 'all') {
          activeWallet.value = walletId
          console.log('Set active wallet to:', walletId)
        }

        // Open the edit dialog for this transaction
        nextTick(() => {
          console.log('Opening edit dialog for transaction:', transaction._id)
          openEditDialog(transaction)

          // Clear the query parameters after opening the dialog
          router.replace({ name: 'records', query: {} })
        })
      } else {
        console.log('Transaction not found with ID:', transactionId)
        console.log(
          'Available transaction IDs:',
          newTransactions.map((t) => t._id),
        )
      }
    } else if (transactionId && newTransactions.length === 0) {
      console.log('Transaction ID provided but no transactions loaded yet')
    }
  },
  { immediate: true },
)

// Separate watcher for route changes when transactions are already loaded
watch(
  route,
  (newRoute) => {
    const transactionId = newRoute.query.transactionId
    const walletId = newRoute.query.walletId

    if (transactionId && transactions.value.length > 0) {
      console.log('Route watcher - handling transaction navigation:', transactionId)

      const transaction = transactions.value.find((t) => t._id === transactionId)
      if (transaction) {
        console.log('Route watcher found transaction:', transaction)

        if (walletId && walletId !== 'all') {
          activeWallet.value = walletId
          console.log('Route watcher set active wallet to:', walletId)
        }

        nextTick(() => {
          console.log('Route watcher opening edit dialog for transaction:', transaction._id)
          openEditDialog(transaction)
          router.replace({ name: 'records', query: {} })
        })
      } else {
        console.log('Route watcher - Transaction not found with ID:', transactionId)
      }
    }
  },
  { immediate: true },
)

// Persist active wallet filter
watch(activeWallet, (val) => {
  localStorage.setItem('recordsActiveWallet', val)
})

// Function to handle transaction navigation
function handleTransactionNavigation() {
  const transactionId = route.query.transactionId
  const walletId = route.query.walletId

  console.log('handleTransactionNavigation called:', {
    transactionId,
    walletId,
    transactionIdType: typeof transactionId,
    transactionsCount: transactions.value.length,
    sampleTransactionIds: transactions.value
      .slice(0, 3)
      .map((t) => ({ id: t._id, category: t.category })),
  })

  if (transactionId && transactions.value.length > 0) {
    console.log('handleTransactionNavigation - looking for transaction:', transactionId)

    const transaction = transactions.value.find((t) => t._id === transactionId)
    if (transaction) {
      console.log('handleTransactionNavigation found transaction:', transaction)

      if (walletId && walletId !== 'all') {
        activeWallet.value = walletId
      }

      nextTick(() => {
        openEditDialog(transaction)
        router.replace({ name: 'records', query: {} })
      })
    } else {
      console.log('handleTransactionNavigation - Transaction not found:', transactionId)
      console.log(
        'Available transaction IDs:',
        transactions.value.map((t) => t._id),
      )
    }
  }
}

// Load data on mount
onMounted(async () => {
  console.log('RecordsPage onMounted - Loading data...')

  await Promise.all([store.loadAll(), walletsStore.loadWallets(), categoriesStore.loadCategories()])

  console.log('RecordsPage - Categories loaded:', categories.value)
  console.log(
    'RecordsPage - Available category names:',
    categories.value.map((c) => c.name),
  )

  const savedWallet = localStorage.getItem('recordsActiveWallet')
  if (savedWallet) {
    activeWallet.value = savedWallet
  }

  // Set default wallet
  if (wallets.value.length > 0 && !storeActiveWallet.value) {
    walletsStore.setActiveWallet(wallets.value[0]._id)
    form.value.walletId = wallets.value[0]._id
  }

  // Handle transaction navigation after everything is loaded
  nextTick(() => {
    handleTransactionNavigation()
  })

  // Fallback: try again after a short delay to ensure everything is loaded
  setTimeout(() => {
    handleTransactionNavigation()
  }, 100)

  // Final fallback: try one more time after a longer delay
  setTimeout(() => {
    handleTransactionNavigation()
  }, 500)

  // Listen for DB changes
  localDB
    .changes({
      since: 'now',
      live: true,
      include_docs: true,
    })
    .on('change', async (change) => {
      if (change.doc.type === 'transaction') {
        await store.loadAll()
      }
    })
})
</script>

<style scoped>
/* Full-screen dialog design */
.full-screen-dialog {
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

/* Mobile responsive adjustments */
@media (max-width: 600px) {
  .full-screen-dialog {
    width: 100vw;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile */
  }
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

/* Mobile responsive design */
@media (max-width: 600px) {
  .mobile-dialog-card {
    width: calc(100vw - 32px);
    margin: 16px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }

  .calculator-keypad {
    max-width: 300px;
  }

  .calculator-keypad .q-btn {
    min-width: 60px;
    min-height: 60px;
    font-size: 1.1rem;
  }
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

/* Equation display styling */
.equation-display {
  font-size: 1.2rem;
  color: #6c757d;
  background-color: #f1f3f4;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

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

/* Mobile card optimizations */
@media (max-width: 599px) {
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
}

/* Mobile layout - maintain 3-column grid */
@media (max-width: 599px) {
  .summary-row {
    gap: 6px;
    margin-bottom: 8px;
  }

  .summary-col {
    margin-bottom: 6px;
  }

  /* Ensure 3-column layout works on mobile */
  .summary-cards-container {
    padding: 0 4px;
  }

  /* Smaller cards on mobile */
  .summary-card .q-card {
    padding: 6px;
  }

  .summary-card .text-h6 {
    font-size: 0.85rem;
    line-height: 1.1;
  }

  .summary-card .text-caption {
    font-size: 0.7rem;
  }
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
  min-width: 0; /* Allow shrinking */
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

/* Edit dialog fields layout */
.edit-fields-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.edit-field-container {
  flex: 1;
  min-width: 0;
}

.edit-field {
  width: 100%;
}

/* Ensure proper side-by-side layout */
.edit-fields-row .edit-field-container {
  flex-basis: calc(50% - 8px);
  min-width: 200px;
}

/* Override any conflicting styles */
.edit-fields-row {
  display: flex !important;
  flex-direction: row !important;
}

.edit-field-container {
  display: block !important;
}

/* Date and Time side-by-side layout */
.datetime-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.datetime-container {
  flex: 1;
  min-width: 0;
}

.date-input,
.time-input {
  width: 100%;
}

/* Ensure proper side-by-side layout for Date and Time */
.datetime-row .datetime-container {
  flex-basis: calc(50% - 8px);
  min-width: 150px;
}

.datetime-row {
  display: flex !important;
  flex-direction: row !important;
}

.datetime-container {
  display: block !important;
}

/* Ensure proper stacking on very small screens */
@media (max-width: 480px) {
  .account-category-row {
    flex-direction: column;
    gap: 12px;
  }

  .account-category-row .account-category-container {
    flex-basis: auto;
    min-width: 0;
  }

  .datetime-row {
    flex-direction: column;
    gap: 12px;
  }

  .datetime-row .datetime-container {
    flex-basis: auto;
    min-width: 0;
  }

  .edit-fields-row {
    flex-direction: column;
    gap: 12px;
  }

  .edit-fields-row .edit-field-container {
    flex-basis: auto;
    min-width: 0;
  }
}

/* Full-screen Dialog Styling */
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

.amount-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4d934e;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Transaction item hover effect */
.transaction-item:hover {
  background-color: #f5f5f5;
}

/* Mobile responsive for edit dialog */
@media (max-width: 600px) {
  .edit-dialog-card {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    margin: 0;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .action-buttons {
    gap: 8px;
  }

  .edit-fields-row {
    gap: 12px;
  }

  .edit-fields-row .edit-field-container {
    flex-basis: calc(50% - 6px);
    min-width: 150px;
  }
}

/* Edit dialog header layout */
.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-header .row {
  width: 100%;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Make buttons more visible */
.edit-btn,
.delete-btn,
.close-btn {
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.edit-btn:hover,
.delete-btn:hover,
.close-btn:hover {
  opacity: 1;
}

/* White edit button styling */
.edit-btn[color='white'] {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.edit-btn[color='white']:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Edit dialog specific styles */
.edit-dialog-card {
  position: relative;
}

/* Centered transaction type */
.transaction-type {
  text-align: center;
  width: 100%;
  margin: 0 auto;
}

/* Color-coded text classes */
.income-text {
  color: #4d934e !important; /* Favicon green */
}

.expense-text {
  color: #dc3545 !important; /* Alert red */
}

.tithes-text {
  color: #4d934e !important; /* Favicon green */
}

.offerings-text {
  color: #ffc107 !important; /* Caution yellow */
}

.faith-promise-text {
  color: #6f42c1 !important; /* Purple */
}

.net-text {
  color: #4d934e !important; /* Favicon green for positive */
}

/* Full-screen dialog content */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
}

.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Full-screen responsive design */
@media (max-width: 600px) {
  .full-screen-dialog {
    width: 100vw;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height */
  }

  .dialog-content {
    padding: 16px;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .action-buttons {
    gap: 4px;
  }

  .action-buttons .q-btn {
    min-width: 40px;
    width: 40px;
    height: 40px;
  }
}

/* Dialog footer styling */
.dialog-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
  margin-top: auto;
  justify-content: center !important;
}

.dialog-footer-btn {
  min-width: 120px;
}

.dialog-cancel-btn {
  color: #6c757d;
}

.dialog-save-btn {
  background: #4d934e !important;
  color: white;
}

/* Full-screen dialog layout */
.full-screen-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
}

/* Ensure content scrolls properly */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Mobile optimizations for full-screen */
@media (max-width: 600px) {
  .dialog-footer {
    padding: 12px 16px;
    gap: 8px;
  }

  .dialog-footer-btn {
    min-width: 100px;
    flex: 1;
    max-width: 140px;
  }

  .dialog-content {
    padding: 16px;
  }
}
</style>
