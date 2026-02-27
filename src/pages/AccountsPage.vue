<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Accounts</div>
        <div class="text-subtitle2 text-grey">{{ currentMonth }}</div>
      </div>

      <!-- Add Account Button -->
      <q-btn
        color="primary"
        icon="add"
        label="Add Account"
        @click="showAddDialog = true"
        unelevated
        :disable="!usersStore.currentUser || !usersStore.currentUser._id"
        :title="
          !usersStore.currentUser || !usersStore.currentUser._id
            ? 'Please log in to add accounts'
            : 'Add a new account'
        "
      />
    </div>

    <!-- Accounts List -->
    <transition-group name="fade-slide-up" tag="div">
      <q-card
        v-for="wallet in wallets"
        :key="wallet._id"
        flat
        bordered
        class="q-mb-sm wallet-card clickable-card"
        :class="{ 'wallet-card-hover': wallet._id !== usersStore.currentUser?.walletId }"
        @click="editWallet(wallet)"
      >
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar
                :icon="wallet.icon || 'account_balance_wallet'"
                size="48px"
                color="primary"
                text-color="white"
                class="q-mr-md"
              />
              <div>
                <div class="text-subtitle1 text-weight-medium">{{ wallet.name }}</div>
                <div class="text-caption text-grey">{{ wallet.typeLabel || 'Wallet' }}</div>
                <div class="text-caption text-grey">
                  {{ formatDate(wallet.createdAt) }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div :class="getBalanceClass(wallet.balance)" class="text-h6">
                ₱{{ formatBalance(getCalculatedBalance(wallet._id)) }}
              </div>
              <div class="text-caption text-grey">Current Balance</div>
              <div
                v-if="wallet.initialBalance !== undefined"
                class="text-caption q-mt-xs text-grey-6"
              >
                Started: ₱{{ formatBalance(wallet.initialBalance) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Account Actions -->
        <q-card-actions
          v-if="wallet._id !== usersStore.currentUser?.walletId"
          align="right"
          @click.stop
        >
          <q-btn flat dense color="grey" icon="edit" label="Edit" @click="editWallet(wallet)" />
          <q-btn
            flat
            dense
            color="negative"
            icon="delete"
            label="Delete"
            @click="deleteWallet(wallet)"
          />
        </q-card-actions>
      </q-card>
    </transition-group>

    <!-- Empty State -->
    <div v-if="!wallets.length" class="text-grey text-center q-mt-lg">
      <q-icon name="account_balance_wallet" size="64px" class="q-mb-md" />
      <div v-if="!usersStore.currentUser || !usersStore.currentUser._id" class="text-h6 q-mb-sm">
        Please log in
      </div>
      <div v-else class="text-h6 q-mb-sm">No accounts added yet</div>
      <div class="text-caption">
        {{
          !usersStore.currentUser || !usersStore.currentUser._id
            ? 'Log in to manage your accounts'
            : 'Add your first account to get started!'
        }}
      </div>
    </div>

    <!-- Add/Edit Account Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 400px; max-width: 90vw">
        <q-card-section class="dialog-header">
          <div class="row items-center">
            <div class="text-h6">{{ editingWallet ? 'Edit Account' : 'Add New Account' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup @click="resetForm" />
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Account Name -->
          <q-input
            filled
            v-model="form.name"
            label="Account Name"
            placeholder="Enter account name"
            :rules="[(val) => (val && val.length > 0) || 'Account name is required']"
          />

          <!-- Account Type -->
          <q-select
            filled
            v-model="form.typeLabel"
            :options="accountTypes"
            label="Account Type"
            emit-value
            map-options
          />

          <!-- Current Balance (calculated from transactions) -->
          <q-input
            filled
            readonly
            :model-value="calculatedBalance"
            label="Current Balance (PHP)"
            type="number"
            prefix="₱"
            class="text-positive"
          />

          <!-- Initial Balance -->
          <q-input
            filled
            v-model.number="form.initialBalance"
            label="Started With (PHP)"
            type="number"
            min="-999999"
            max="999999"
            prefix="₱"
            hint="Set your starting balance"
          />

          <!-- Icon Selection -->
          <div class="icon-selection-section">
            <div class="text-subtitle2 q-mb-md">Choose an Icon</div>
            <div class="icon-grid">
              <div
                v-for="icon in iconOptions"
                :key="icon.value"
                class="icon-option"
                :class="{ 'icon-selected': form.icon === icon.value }"
                @click="form.icon = icon.value"
              >
                <q-avatar :icon="icon.value" color="primary" text-color="white" size="48px" />
                <div class="icon-name text-caption text-center q-mt-xs">{{ icon.label }}</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup @click="resetForm" />
          <q-btn
            color="primary"
            :label="editingWallet ? 'Update' : 'Save'"
            @click="saveWallet"
            :disable="!form.name"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useFinancesStore } from 'src/stores/finances'
import { useUsersStore } from 'src/stores/users'

// Stores
const $q = useQuasar()
const financesStore = useFinancesStore()
const usersStore = useUsersStore()

// State from stores - use storeToRefs to maintain reactivity
const { wallets } = storeToRefs(financesStore)

// Dialog state
const showAddDialog = ref(false)
const editingWallet = ref(null)

// Form data
const form = ref({
  name: '',
  typeLabel: 'Wallet',
  balance: 0,
  initialBalance: 0,
  icon: 'account_balance_wallet',
  ownerUserId: '',
})

// Computed: Show calculated balance for the wallet being edited
const calculatedBalance = computed(() => {
  if (!form.value._id) return 0
  return financesStore.calculateWalletBalance(form.value._id)
})

// Options
const accountTypes = [
  { label: 'Wallet', value: 'Wallet' },
  { label: 'Savings', value: 'Savings' },
  { label: 'Debt', value: 'Debt' },
  { label: 'Investment', value: 'Investment' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Bank Account', value: 'Bank Account' },
]

const iconOptions = [
  { label: 'Wallet', value: 'account_balance_wallet' },
  { label: 'Savings', value: 'savings' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Money', value: 'attach_money' },
  { label: 'Bank', value: 'account_balance' },
  { label: 'Business', value: 'business' },
  { label: 'Investment', value: 'trending_up' },
  { label: 'Home', value: 'home' },
]

// Computed values
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

// Helper functions
function formatBalance(balance) {
  return Number(balance || 0).toLocaleString()
}

function getBalanceClass(balance) {
  const numBalance = Number(balance || 0)
  if (numBalance > 0) return 'text-positive'
  if (numBalance < 0) return 'text-negative'
  return 'text-grey-8'
}

function getCalculatedBalance(walletId) {
  return financesStore.calculateWalletBalance(walletId)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Helper function to map typeLabel to walletType
function mapTypeToWalletType(typeLabel) {
  const typeMap = {
    Wallet: 'personal',
    Savings: 'savings',
    Debt: 'debt',
    Investment: 'investment',
    'Credit Card': 'credit',
    'Bank Account': 'bank',
  }
  return typeMap[typeLabel] || 'personal'
}

async function saveWallet() {
  if (!form.value.name) {
    $q.notify({ type: 'warning', message: 'Please enter an account name' })
    return
  }

  // Check if user is logged in
  if (!usersStore.currentUser || !usersStore.currentUser._id) {
    $q.notify({
      type: 'negative',
      message: 'You must be logged in to manage accounts',
    })
    return
  }

  try {
    if (editingWallet.value) {
      // Get original values before update
      const originalInitialBalance =
        editingWallet.value.initialBalance !== undefined
          ? editingWallet.value.initialBalance
          : editingWallet.value.balance || 0
      const newInitialBalance = Number(form.value.initialBalance) || 0

      console.log('💰 Saving wallet balance change:', {
        walletId: editingWallet.value._id,
        originalInitialBalance,
        newInitialBalance,
        hasChanged: originalInitialBalance !== newInitialBalance,
      })

      // Create wallet data with new initial balance
      const walletData = {
        name: form.value.name,
        typeLabel: form.value.typeLabel,
        initialBalance: newInitialBalance,
        // Balance will be recalculated from transactions, but we set it to newInitialBalance
        // as the base for future calculations
        balance: newInitialBalance,
        icon: form.value.icon,
        ownerUserId: usersStore.currentUser._id,
        walletType: mapTypeToWalletType(form.value.typeLabel),
        currency: 'PHP',
      }

      // Update existing wallet - pass null to prevent creating balance change transaction
      // When changing initial balance (Started With), we should NOT create a balance change transaction
      // because the initialBalance IS the record of the starting amount
      // Passing null prevents the creation of duplicate balance change transactions
      await financesStore.updateWallet(editingWallet.value._id, walletData, null)

      // Reload all data to ensure consistency
      await financesStore.loadAll()

      // Show notification about balance change
      if (originalInitialBalance !== newInitialBalance) {
        const difference = newInitialBalance - originalInitialBalance
        const changeType = difference > 0 ? 'increased' : 'decreased'
        $q.notify({
          type: 'info',
          message: 'Account updated successfully!',
          caption: `Started With ${changeType} from ₱${originalInitialBalance.toLocaleString()} to ₱${newInitialBalance.toLocaleString()}`,
        })
      } else {
        $q.notify({ type: 'positive', message: 'Account updated successfully!' })
      }
    } else {
      // Add new wallet
      const newWalletData = {
        name: form.value.name,
        typeLabel: form.value.typeLabel,
        initialBalance: Number(form.value.initialBalance) || 0,
        balance: Number(form.value.initialBalance) || 0,
        icon: form.value.icon,
        ownerUserId: usersStore.currentUser._id,
        walletType: mapTypeToWalletType(form.value.typeLabel),
        currency: 'PHP',
      }

      await financesStore.addWallet(newWalletData)

      // REMOVED: Creating a balance change transaction for initial balance causes double counting
      // The initialBalance field in the wallet IS the record of the starting amount
      // No separate transaction needed - the balance is calculated from initialBalance + transactions

      await financesStore.loadAll()

      $q.notify({ type: 'positive', message: 'Account added successfully!' })
    }

    resetForm()
    showAddDialog.value = false
  } catch (error) {
    console.error('Error saving wallet:', error)
    $q.notify({ type: 'negative', message: 'Failed to save account' })
  }
}

function editWallet(wallet) {
  editingWallet.value = wallet
  form.value = {
    _id: wallet._id,
    name: wallet.name,
    typeLabel: wallet.typeLabel || 'Wallet',
    balance: wallet.balance || 0,
    initialBalance: wallet.initialBalance || wallet.balance || 0,
    icon: wallet.icon || 'account_balance_wallet',
    ownerUserId: wallet.ownerUserId,
  }
  showAddDialog.value = true
}

async function deleteWallet(wallet) {
  // Check if user is logged in
  if (!usersStore.currentUser || !usersStore.currentUser._id) {
    $q.notify({
      type: 'negative',
      message: 'You must be logged in to manage accounts',
    })
    return
  }

  // Don't allow deletion of the main wallet
  if (wallet._id === usersStore.currentUser?.walletId) {
    $q.notify({
      type: 'warning',
      message: 'Cannot delete your main wallet account',
    })
    return
  }

  $q.dialog({
    title: 'Delete Account',
    message: `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await financesStore.deleteWallet(wallet._id)
      $q.notify({ type: 'positive', message: 'Account deleted successfully!' })
    } catch (error) {
      console.error('Error deleting wallet:', error)
      $q.notify({ type: 'negative', message: 'Failed to delete account' })
    }
  })
}

function resetForm() {
  form.value = {
    name: '',
    typeLabel: 'Wallet',
    balance: 0,
    initialBalance: 0,
    icon: 'account_balance_wallet',
    ownerUserId: usersStore.currentUser?._id || '',
  }
  editingWallet.value = null
}

// Load data on mount
onMounted(async () => {
  // Initialize users store to load current user from localStorage
  usersStore.initialize()

  // Wait for initialization to complete
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Check if user is authenticated
  if (!usersStore.currentUser || !usersStore.currentUser._id) {
    return
  }

  // Load wallets
  await financesStore.loadAll()

  // Set owner user ID
  form.value.ownerUserId = usersStore.currentUser._id
})

// Watch for user changes to handle login after page load
watch(
  () => usersStore.currentUser,
  (newUser) => {
    if (newUser && newUser._id) {
      console.log('User logged in after page load, loading wallets...')
      financesStore.loadAll()
      form.value.ownerUserId = newUser._id
    }
  },
)

// Watch for wallet changes to refresh the form when needed
watch(
  () => wallets.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      form.value.ownerUserId = usersStore.currentUser?._id || ''
    }
  },
)
</script>

<style scoped>
/* Page Layout */
.q-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Dialog Styles */
.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Icon Selection */
.icon-selection-section {
  margin-top: 16px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-option:hover {
  border-color: #4d934e;
  background-color: #f0f8f0;
}

.icon-selected {
  border-color: #4d934e;
  background-color: #e8f5e8;
}

.icon-name {
  margin-top: 8px;
  color: #666;
  font-weight: 500;
}

/* Transitions */
.fade-slide-up-enter-active {
  transition: all 0.3s ease;
}

.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* Account Cards */
.q-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.q-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Clickable Cards */
.clickable-card {
  cursor: pointer;
}

.wallet-card-hover:hover {
  box-shadow: 0 6px 20px rgba(77, 147, 78, 0.15);
  transform: translateY(-2px);
  border-color: #4d934e;
}

/* Responsive Design */
@media (max-width: 768px) {
  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }

  .icon-option {
    padding: 8px;
  }
}
</style>
