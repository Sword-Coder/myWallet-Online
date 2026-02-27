<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="text-h5 text-weight-bold q-mb-md">{{ welcomeMessage }}</div>
    <div class="text-subtitle2 text-grey q-mb-lg">{{ currentMonth }}</div>

    <!-- 🆕 Initial Balance Setup Dialog for New Users -->
    <q-dialog v-model="showInitialBalanceDialog" persistent>
      <q-card class="initial-balance-card">
        <q-card-section class="dialog-header text-white">
          <div class="text-h6">
            <q-icon name="account_balance_wallet" class="q-mr-sm" />
            Welcome to myWallet! 🎉
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg text-center">
          <div class="text-subtitle1 q-mb-md">
            Let's set up your starting balance to begin tracking your finances.
          </div>

          <div class="text-caption text-grey q-mb-lg">
            How much do you currently have in your wallet or bank account?
          </div>

          <q-input
            v-model.number="initialBalance"
            type="number"
            filled
            prefix="₱"
            label="Current Balance"
            class="balance-input q-mb-md"
            :rules="[(val) => (val !== null && val !== undefined) || 'Please enter your balance']"
          />

          <div class="text-caption text-grey-6">
            Don't worry, you can change this anytime from the Accounts page.
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-lg">
          <q-btn
            color="primary"
            label="Start Tracking!"
            size="lg"
            unelevated
            @click="setInitialBalance"
            :disable="initialBalance === null"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 🆕 Shared Wallet Alert -->
    <q-card
      v-if="activeWallet && activeWallet !== 'all'"
      flat
      bordered
      class="q-pa-md q-mb-md"
      :class="isSharedWallet ? 'bg-blue-1 text-blue-9' : 'bg-grey-1 text-grey-8'"
    >
      <div class="row items-center q-gutter-sm">
        <q-icon
          :name="isSharedWallet ? 'people_alt' : 'person'"
          :color="isSharedWallet ? 'blue-8' : 'grey-6'"
          size="sm"
        />
        <div>
          <div class="text-subtitle2">
            {{ isSharedWallet ? 'Shared Wallet' : 'Personal Wallet' }}
          </div>
          <div v-if="isSharedWallet" class="text-caption text-blue-8 q-mt-xs">
            Shared with:
            <span v-for="(member, i) in sharedMembers" :key="member.id">
              {{ member.name || member.email }}
              <span v-if="i < sharedMembers.length - 1">, </span>
            </span>
          </div>
          <div v-else class="text-caption text-grey-6 q-mt-xs">
            Only you have access to this wallet.
          </div>
        </div>
      </div>
    </q-card>

    <!-- Wallet Summary -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="text-subtitle2 text-grey">Active Wallet</div>
      <div class="row items-center justify-between q-mt-sm">
        <div class="text-h6" :key="`wallet-${dataVersion}-${isDataReady ? 'ready' : 'loading'}`">
          <span v-if="isDataReady && validActiveWallet">
            {{
              activeWallet === 'all'
                ? 'All Wallets'
                : (() => {
                    const wallet = typeof validActiveWallet === 'object' ? validActiveWallet : null
                    console.log('🔍 HomePage: Wallet display debug:', {
                      validActiveWallet,
                      validActiveWalletType: typeof validActiveWallet,
                      walletName: wallet?.name || 'No wallet found',
                    })
                    console.log('✅ HomePage: Displaying wallet:', wallet?.name)
                    return wallet?.name || 'No wallet selected'
                  })()
            }}
          </span>
          <span v-else class="text-grey">Loading wallet...</span>
        </div>
        <div class="text-h6" :style="{ color: netTotal >= 0 ? '#10b981' : '#dc3545' }">
          ₱ {{ netTotal.toLocaleString() }}
        </div>
      </div>
      <q-select
        v-if="storeWallets.value && storeWallets.value.length > 0"
        v-model="activeWallet"
        :options="walletOptions"
        option-label="name"
        option-value="_id"
        dense
        outlined
        label="Switch Wallet"
        class="q-mt-md"
        emit-value
        map-options
      />
    </q-card>

    <!-- Monthly Summary -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row justify-around text-center">
        <div>
          <div class="text-caption text-grey">Income</div>
          <div class="text-h6" style="color: #4d934e">{{ incomeTotal.toLocaleString() }} PHP</div>
        </div>
        <div>
          <div class="text-caption text-grey">Expense</div>
          <div class="text-h6" style="color: #dc3545">{{ expenseTotal.toLocaleString() }} PHP</div>
        </div>
        <div>
          <div class="text-caption text-grey">Total Remaining</div>
          <div class="text-h6" :style="{ color: netTotal >= 0 ? '#10b981' : '#dc3545' }">
            {{ netTotal.toLocaleString() }} PHP
          </div>
        </div>
      </div>
      <!-- Debug info - remove in production
      <div class="text-caption text-grey q-mt-sm" style="font-size: 10px">
        Debug: walletBal={{ walletBalance }}, total={{ netTotal }}
      </div>
      -->
    </q-card>

    <!-- Recent Transactions -->
    <div class="text-subtitle1 text-weight-bold q-mt-lg q-mb-sm">Recent Transactions</div>
    <transition-group name="fade-slide-up" tag="div">
      <q-card
        v-for="tx in recentTransactions"
        :key="tx._id"
        flat
        bordered
        class="q-mb-sm q-pa-sm transaction-card"
        @click="navigateToTransaction(tx)"
      >
        <div class="row items-center justify-between">
          <div>
            <div class="text-subtitle2">
              {{ getCategoryName(tx.categoryId, tx) }}
            </div>
            <div class="text-caption text-grey">{{ formatDate(tx.datetime) }}</div>
          </div>
          <div :style="{ color: getAmountColor(tx) }" class="text-subtitle2">
            {{ getAmountDisplay(tx) }}
          </div>
        </div>
      </q-card>
    </transition-group>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useFinancesStore } from 'src/stores/finances'
import { useUsersStore } from 'src/stores/users'
import { useCategoriesStore } from 'src/stores/categories'

const router = useRouter()
const route = useRoute()

// Quasar UI
const $q = useQuasar()

// Stores
const financesStore = useFinancesStore()
const usersStore = useUsersStore()
const categoriesStore = useCategoriesStore()

// UI state
const sharedMembers = ref([])
const showInitialBalanceDialog = ref(false)
const initialBalance = ref(null)

// Connect to store's active wallet - use store's activeWalletId as the source of truth
const activeWallet = computed({
  get: () => activeWalletId.value,
  set: (newWalletId) => {
    if (newWalletId) {
      financesStore.setActiveWallet(newWalletId)
    }
  },
})

// State from stores - use storeToRefs to maintain reactivity
const { wallets: storeWallets, activeWalletId } = storeToRefs(financesStore)
const { currentUser } = storeToRefs(usersStore)
const { categories } = storeToRefs(categoriesStore)

// Force reactivity trigger when data becomes available
const dataVersion = ref(0)

// Access computed properties directly from store instance
// totals is no longer used directly as we use walletBalance which already includes all calculations

// Data readiness check
const isDataReady = computed(() => {
  const ready =
    !!storeWallets.value &&
    Array.isArray(storeWallets.value) &&
    storeWallets.value.length > 0 &&
    !!activeWalletId.value

  console.log('🔍 HomePage: isDataReady check:', {
    storeWalletsExists: !!storeWallets.value,
    storeWalletsIsArray: storeWallets.value && Array.isArray(storeWallets.value),
    storeWalletsLength: storeWallets.value?.length || 0,
    activeWalletIdExists: !!activeWalletId.value,
    isReady: ready,
    storeWalletsValue: storeWallets.value,
    activeWalletIdValue: activeWalletId.value,
    walletIds: storeWallets.value?.map((w) => w._id) || [],
    activeWalletIdMatches: storeWallets.value?.some((w) => w._id === activeWalletId.value) || false,
  })

  return ready
})

// Date
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

// Computed values
const walletOptions = computed(() => {
  // Ensure storeWallets is an array before spreading
  const wallets = storeWallets.value && Array.isArray(storeWallets.value) ? storeWallets.value : []

  console.log('🔍 HomePage: walletOptions computed:', {
    walletsCount: wallets.length,
    wallets: wallets.map((w) => ({ _id: w._id, name: w.name })),
    storeWallets: storeWallets.value,
    isArray: Array.isArray(storeWallets.value),
  })

  // Only show "All Wallets" if user has multiple wallets AND sharing is enabled
  const hasMultipleWallets = wallets.length > 1
  const isSharingEnabled = currentUser.value?.isSharingEnabled === true
  const shouldShowAllWallets = hasMultipleWallets && isSharingEnabled

  if (shouldShowAllWallets) {
    return [{ name: 'All Wallets', _id: 'all' }, ...wallets]
  } else {
    return wallets
  }
})

// Ensure we always have a valid active wallet
const validActiveWallet = computed(() => {
  const wallets = storeWallets.value && Array.isArray(storeWallets.value) ? storeWallets.value : []

  console.log('🔍 HomePage: validActiveWallet computed:', {
    activeWallet: activeWallet.value,
    walletsCount: wallets.length,
    wallets: wallets.map((w) => ({ _id: w._id, name: w.name })),
  })

  // If activeWallet is null or invalid, use first wallet
  if (!activeWallet.value || activeWallet.value === 'all') {
    if (wallets.length > 0) {
      console.log('🔧 HomePage: Using first wallet:', wallets[0]._id, wallets[0].name)
      return wallets[0]
    }
    console.log('❌ HomePage: No wallets available')
    return null
  }

  // Check if the active wallet still exists
  const walletExists = wallets.find((w) => w._id === activeWallet.value)
  console.log('🔍 HomePage: ValidActiveWallet debug:', {
    activeWalletValue: activeWallet.value,
    walletsCount: wallets.length,
    walletExists: !!walletExists,
    walletExistsName: walletExists?.name,
    walletIds: wallets.map((w) => w._id),
  })
  if (walletExists) {
    console.log('✅ HomePage: Active wallet exists:', activeWallet.value, walletExists.name)
    return walletExists
  }

  // If active wallet doesn't exist, fallback to first wallet
  if (wallets.length > 0) {
    console.log(
      '🔄 HomePage: Active wallet not found, using first wallet:',
      wallets[0]._id,
      wallets[0].name,
    )
    return wallets[0]
  }

  console.log('❌ HomePage: No wallets available for fallback')
  return null
})

// Wallet balance - uses the calculated balance from the store for consistency
const walletBalance = computed(() => {
  // Ensure storeWallets is an array before calling reduce
  if (!storeWallets.value || !Array.isArray(storeWallets.value)) {
    console.log('🔍 HomePage: walletBalance returning 0 - no wallets')
    return 0
  }

  if (activeWallet.value === 'all') {
    const total = storeWallets.value.reduce((total, wallet) => {
      return total + financesStore.calculateWalletBalance(wallet._id)
    }, 0)
    console.log('🔍 HomePage: walletBalance (all wallets):', total)
    return total
  }

  // Calculate balance from store (includes initialBalance + transactions)
  const calculatedBalance = financesStore.calculateWalletBalance(activeWallet.value)
  console.log('🔍 HomePage: walletBalance:', {
    activeWallet: activeWallet.value,
    calculatedBalance,
  })
  return calculatedBalance
})

// Watches - defined AFTER computed properties they depend on
// Force reactivity trigger when wallet data changes
watch(
  () => storeWallets.value,
  (newWallets, oldWallets) => {
    console.log('🔄 HomePage: Wallets changed, incrementing dataVersion:', {
      oldWalletsCount: oldWallets?.length || 0,
      newWalletsCount: newWallets?.length || 0,
    })
    dataVersion.value++
  },
  { deep: true },
)

// Force reactivity when wallet balance specifically changes
watch(
  () => walletBalance.value,
  (newBalance, oldBalance) => {
    console.log('🔄 HomePage: Wallet balance changed:', {
      oldBalance,
      newBalance,
      difference: newBalance - (oldBalance || 0),
    })
    dataVersion.value++
  },
)

// Deep watch on validActiveWallet to catch balance changes within the object
watch(
  () => validActiveWallet.value,
  (newWallet, oldWallet) => {
    if (newWallet) {
      console.log('🔄 HomePage: Active wallet object changed or updated:', {
        id: newWallet._id,
        balance: newWallet.balance,
        oldBalance: oldWallet?.balance,
        balanceChanged: oldWallet && newWallet.balance !== oldWallet.balance,
      })
      dataVersion.value++
    }
  },
  { deep: true },
)

// Force reactivity trigger when data becomes available
watch([isDataReady, validActiveWallet], ([ready, wallet]) => {
  if (ready && wallet) {
    dataVersion.value++
    console.log('🔄 HomePage: Forcing reactivity update:', dataVersion.value)
  }
})

const incomeTotal = computed(() => {
  // Filter out balance change transactions from income
  const allTransactions = financesStore.transactions
  const regularTransactions = allTransactions.filter((t) => !t.isBalanceChange)
  return regularTransactions
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})
const expenseTotal = computed(() => {
  // Filter out balance change transactions from expenses
  const allTransactions = financesStore.transactions
  const regularTransactions = allTransactions.filter((t) => !t.isBalanceChange)
  return regularTransactions
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})
const netTotal = computed(() => {
  // Get wallet balance - this already includes initialBalance + all transactions
  // So we return it directly without adding regularNet again (which would double-count)
  const walletBal = walletBalance.value || 0

  console.log('🔍 HomePage: netTotal calculation:', {
    walletBalance: walletBal,
  })

  return walletBal
})

const recentTransactions = computed(() => {
  try {
    return financesStore.getRecentTransactions(5) || []
  } catch (error) {
    console.warn('Error getting recent transactions:', error)
    return []
  }
})

// Check if user is new (no transactions yet and wallet has 0 balance)
const isNewUser = computed(() => {
  return financesStore.transactions.length === 0
})

// Check if initial balance prompt should be shown
const shouldShowInitialBalancePrompt = computed(() => {
  if (!isNewUser.value) return false

  // Check if wallet exists
  if (validActiveWallet.value) {
    // Check if initialBalance has been explicitly set (even if it's 0)
    // If initialBalance is defined, the user has already set their starting balance
    // We check for !== undefined AND !== null to ensure it was explicitly set
    const hasInitialBalance =
      validActiveWallet.value.initialBalance !== undefined &&
      validActiveWallet.value.initialBalance !== null

    // Only show prompt if initialBalance was never set (user hasn't configured starting balance)
    return !hasInitialBalance
  }

  // No wallet yet
  return true
})

// Dynamic welcome message based on user status
const welcomeMessage = computed(() => {
  return isNewUser.value ? 'Welcome! 👋' : 'Welcome Back! 👋'
})

// Helper functions
function getCategoryName(categoryId, transaction = null) {
  // Handle balance change transactions (check both flag and special categoryId)
  if ((transaction && transaction.isBalanceChange) || categoryId === 'balance_change') {
    return 'Wallet Balance'
  }

  const category = (categories.value || []).find((c) => c._id === categoryId)
  return category ? category.name : 'Uncategorized'
}

// Get amount display with sign
function getAmountDisplay(transaction) {
  if (transaction.isBalanceChange || transaction.categoryId === 'balance_change') {
    // For balance change transactions, show positive sign for increase
    return `+${transaction.amount.toLocaleString()} PHP`
  }
  return `${transaction.kind === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()} PHP`
}

// Get amount color
function getAmountColor(transaction) {
  if (transaction.isBalanceChange || transaction.categoryId === 'balance_change') {
    return '#6c757d' // Grey for balance changes
  }
  return transaction.kind === 'income' ? '#4d934e' : '#dc3545'
}

function formatDate(datetime) {
  const date = new Date(datetime)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Navigation function
function navigateToTransaction(transaction) {
  router.push({
    name: 'records',
    query: {
      transactionId: transaction._id,
      walletId: transaction.walletId,
    },
  })
}

// Shared wallet
const isSharedWallet = computed(() => {
  if (activeWallet.value === 'all') return false
  // Ensure storeWallets is an array before calling find
  if (!storeWallets.value || !Array.isArray(storeWallets.value)) {
    return false
  }
  const wallet = storeWallets.value.find((w) => w._id === activeWallet.value)
  return wallet?.sharedWithUserIds && wallet.sharedWithUserIds.length > 1
})

// Load data on mount
onMounted(async () => {
  // Initialize user if not logged in (for demo purposes)
  if (!currentUser || !currentUser.value) {
    // Check if user is authenticated
    if (!currentUser.value) {
      console.warn('No user logged in - redirect to login required')
      return
    }
  }

  console.log('🚀 HomePage: Starting data load...')

  // Load all financial data concurrently
  await Promise.all([financesStore.loadAll(), categoriesStore.loadCategories()])

  console.log('✅ HomePage: Data load completed', {
    walletsCount: storeWallets.value?.length || 0,
    activeWalletId: activeWalletId.value,
  })

  // Check if we should show the initial balance dialog
  nextTick(() => {
    if (shouldShowInitialBalancePrompt.value) {
      setTimeout(() => {
        showInitialBalanceDialog.value = true
      }, 500) // Small delay for better UX
    }
  })

  // Refresh data when page becomes visible (user returns from Accounts page)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// Handle visibility change - refresh data when page becomes visible
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    console.log('🔄 HomePage: Page became visible, refreshing data...')
    financesStore.loadAll()
  }
}

// Watch for wallet changes to update shared members when active wallet changes
watch(
  activeWallet,
  (newWallet) => {
    if (newWallet && newWallet !== 'all') {
      // Ensure storeWallets is an array before calling find
      const wallet =
        storeWallets.value && Array.isArray(storeWallets.value)
          ? storeWallets.value.find((w) => w._id === newWallet)
          : null
      if (wallet?.sharedWithUserIds) {
        sharedMembers.value = wallet.sharedWithUserIds
      } else {
        sharedMembers.value = []
      }
    } else {
      sharedMembers.value = []
    }
  },
  { immediate: true },
)

// Force template update when data becomes ready
watch(
  [isDataReady, validActiveWallet],
  ([dataReady, walletId]) => {
    console.log('🔄 HomePage: Data readiness changed:', {
      dataReady,
      walletId:
        (typeof walletId === 'string'
          ? walletId?.substring(0, 10)
          : walletId?._id?.substring(0, 10)) + '...',
      shouldShowWallet: dataReady && !!walletId,
    })
  },
  { immediate: true },
)

// Refresh data when navigating back to this page
watch(
  () => route.name,
  (newRoute) => {
    if (newRoute === 'home' || newRoute === 'HomePage') {
      console.log('🔄 HomePage: Route changed to home, refreshing data...')
      financesStore.loadAll()
    }
  },
)

// Set initial balance for new user
async function setInitialBalance() {
  if (initialBalance.value === null || initialBalance.value === undefined) {
    $q.notify({
      type: 'warning',
      message: 'Please enter your current balance',
    })
    return
  }

  const newBalance = Number(initialBalance.value) || 0

  try {
    // Load categories first to ensure we have the latest data
    await categoriesStore.loadCategories()

    // Initialize default categories for new user if none exist
    if (categoriesStore.categories.length === 0) {
      console.log('Initializing default categories for new user...')
      await categoriesStore.initializeDefaultCategories()
    }

    // If wallet exists, update its balance AND initialBalance
    if (validActiveWallet.value) {
      const oldBalance = validActiveWallet.value.balance || 0

      // 🔧 FIX: Also update initialBalance to preserve the starting amount
      await financesStore.updateWallet(
        validActiveWallet.value._id,
        {
          balance: newBalance,
          initialBalance: newBalance, // Set initialBalance so future calculations are correct
        },
        oldBalance,
      )
      // Note: We don't create a balance change transaction here because
      // setting initial balance is NOT a transaction - it's just telling the app your starting amount
    } else {
      // Create new wallet with the initial balance
      await financesStore.addWallet({
        name: 'Main Wallet',
        initialBalance: newBalance, // Set initialBalance for new wallet
        balance: newBalance,
        walletType: 'personal',
      })
    }

    // Reload data to refresh
    await financesStore.loadAll()

    // Close dialog
    showInitialBalanceDialog.value = false

    $q.notify({
      type: 'positive',
      message: 'Starting balance set successfully! 🎉',
      caption: `Your wallet balance is now ₱${newBalance.toLocaleString()}`,
    })
  } catch (error) {
    console.error('Failed to set initial balance:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to set starting balance',
    })
  }
}
</script>

<style scoped>
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Transaction card styling */
.transaction-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  border-left: 4px solid transparent;
}

.transaction-card:hover {
  background-color: #f8f9fa;
  border-left-color: #4d934e;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Initial Balance Dialog Styling */
.initial-balance-card {
  border-radius: 16px;
  overflow: hidden;
  max-width: 450px;
  width: 90vw;
}

.initial-balance-card .dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  padding: 24px;
  text-align: center;
}

.initial-balance-card .q-input {
  font-size: 1.2rem;
}

.initial-balance-card .q-input :deep(.q-field__control) {
  font-size: 1.2rem;
  font-weight: 600;
}

.initial-balance-card .balance-input {
  font-size: 1.5rem;
}

.initial-balance-card .q-btn {
  min-width: 200px;
  border-radius: 25px;
}
</style>
