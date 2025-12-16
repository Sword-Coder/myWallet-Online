<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="text-h5 text-weight-bold q-mb-md">Welcome Back 👋</div>
    <div class="text-subtitle2 text-grey q-mb-lg">{{ currentMonth }}</div>

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
        <div class="text-h6" :style="{ color: walletBalance >= 0 ? '#dc3545' : '#10b981' }">
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
              {{ getCategoryName(tx.categoryId) }}
            </div>
            <div class="text-caption text-grey">{{ formatDate(tx.datetime) }}</div>
          </div>
          <div
            :style="{ color: tx.kind === 'income' ? '#4d934e' : '#dc3545' }"
            class="text-subtitle2"
          >
            {{ tx.kind === 'income' ? '+' : '-' }}{{ tx.amount.toLocaleString() }} PHP
          </div>
        </div>
      </q-card>
    </transition-group>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useFinancesStore } from 'src/stores/finances'
import { useUsersStore } from 'src/stores/users'
import { useCategoriesStore } from 'src/stores/categories'

const router = useRouter()

// Stores
const financesStore = useFinancesStore()
const usersStore = useUsersStore()
const categoriesStore = useCategoriesStore()

// UI state
const sharedMembers = ref([])

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
const totals = computed(() => financesStore.totals)

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

// Force reactivity trigger when data becomes available
watch([isDataReady, validActiveWallet], ([ready, wallet]) => {
  if (ready && wallet) {
    dataVersion.value++
    console.log('🔄 HomePage: Forcing reactivity update:', dataVersion.value)
  }
})

const walletBalance = computed(() => {
  // Ensure storeWallets is an array before calling reduce
  if (!storeWallets.value || !Array.isArray(storeWallets.value)) {
    return 0
  }

  if (activeWallet.value === 'all') {
    return storeWallets.value.reduce((total, wallet) => total + (wallet.balance || 0), 0)
  }
  const wallet = typeof validActiveWallet.value === 'object' ? validActiveWallet : null
  return wallet ? wallet.balance : 0
})

const incomeTotal = computed(() => totals.value?.income || 0)
const expenseTotal = computed(() => totals.value?.expenses || 0)
const netTotal = computed(() => totals.value?.net || 0)

const recentTransactions = computed(() => {
  try {
    return financesStore.getRecentTransactions(5) || []
  } catch (error) {
    console.warn('Error getting recent transactions:', error)
    return []
  }
})

// Helper functions
function getCategoryName(categoryId) {
  const category = (categories.value || []).find((c) => c._id === categoryId)
  return category ? category.name : 'Uncategorized'
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
})

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
</style>
