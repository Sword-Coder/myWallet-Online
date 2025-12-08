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
        <div class="text-h6">
          {{
            activeWallet === 'all'
              ? 'All Wallets'
              : (storeWallets.value && Array.isArray(storeWallets.value)
                  ? storeWallets.value.find((w) => w._id === activeWallet)?.name
                  : null) || 'No wallet selected'
          }}
        </div>
        <div class="text-h6" :style="{ color: walletBalance >= 0 ? '#4d934e' : '#dc3545' }">
          {{ netTotal.toLocaleString() }} PHP
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
          <div class="text-caption text-grey">Total</div>
          <div class="text-h6" :style="{ color: netTotal >= 0 ? '#4d934e' : '#dc3545' }">
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
const activeWallet = ref('all')
const sharedMembers = ref([])

// State from stores - use storeToRefs to maintain reactivity
const { wallets: storeWallets, totals } = storeToRefs(financesStore)
const { currentUser } = storeToRefs(usersStore)
const { categories } = storeToRefs(categoriesStore)

// Date
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

// Computed values
const walletOptions = computed(() => {
  // Ensure storeWallets is an array before spreading
  const wallets = storeWallets.value && Array.isArray(storeWallets.value) ? storeWallets.value : []
  return [{ name: 'All Wallets', _id: 'all' }, ...wallets]
})

const walletBalance = computed(() => {
  // Ensure storeWallets is an array before calling reduce
  if (!storeWallets.value || !Array.isArray(storeWallets.value)) {
    return 0
  }

  if (activeWallet.value === 'all') {
    return storeWallets.value.reduce((total, wallet) => total + (wallet.balance || 0), 0)
  }
  const wallet = storeWallets.value.find((w) => w._id === activeWallet.value)
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
    try {
      await usersStore.loginUser('demo@example.com', 'password')
    } catch (error) {
      console.warn('Demo login failed:', error)
    }
  }

  // Load all financial data concurrently
  await Promise.all([financesStore.loadAll(), categoriesStore.loadCategories()])

  // Set default to 'all' wallets
  if (!activeWallet.value) {
    activeWallet.value = 'all'
  }
})

// Watch for active wallet changes
watch(activeWallet, (newWallet) => {
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
})

// Watch for wallet changes to update active wallet
watch(
  storeWallets,
  (newWallets) => {
    if (newWallets.length > 0 && !activeWallet.value) {
      activeWallet.value = 'all'
    }
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
