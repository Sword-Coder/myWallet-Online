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
              : storeWallets.find((w) => w._id === activeWallet)?.name || 'No wallet selected'
          }}
        </div>
        <div class="text-h6" :style="{ color: walletBalance >= 0 ? '#4d934e' : '#dc3545' }">
          {{ netTotal.toLocaleString() }} PHP
        </div>
      </div>
      <q-select
        v-if="storeWallets.length"
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
            <div class="text-subtitle2">{{ tx.category || 'Uncategorized' }}</div>
            <div class="text-caption text-grey">{{ tx.date }}</div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDatabase, useTransactions } from 'src/composables/useDatabase.js'
import { useFinancesStore } from 'src/stores/finances'
import { useWalletsStore } from 'src/stores/wallets'
import { storeToRefs } from 'pinia'

const { localDB } = useDatabase()
const { getRecentTransactions } = useTransactions()
const router = useRouter()

// state
const activeWallet = ref('all') // Default to 'all' wallets
const sharedMembers = ref([])

// stores
const store = useFinancesStore()
const walletsStore = useWalletsStore()
const { transactions } = storeToRefs(store)
const { wallets: storeWallets } = storeToRefs(walletsStore)

// date
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

// computed
const walletOptions = computed(() => [{ name: 'All Wallets', _id: 'all' }, ...storeWallets.value])

const walletBalance = computed(() => {
  if (activeWallet.value === 'all') {
    // Calculate total balance across all wallets
    return storeWallets.value.reduce((total, wallet) => total + (wallet.balance || 0), 0)
  }

  // Individual wallet balance
  const wallet = storeWallets.value.find((w) => w._id === activeWallet.value)
  return wallet ? wallet.balance : 0
})

const incomeTotal = computed(() =>
  transactions.value.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0),
)
const expenseTotal = computed(() =>
  transactions.value.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0),
)
const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

const recentTransactions = computed(() =>
  getRecentTransactions(transactions.value, activeWallet.value, 5),
)

// Navigation function
function navigateToTransaction(transaction) {
  console.log('HomePage navigating to transaction:', {
    transactionId: transaction._id,
    walletId: transaction.walletId,
    transactionCategory: transaction.category,
    transactionAmount: transaction.amount,
    transactionIdType: typeof transaction._id,
    walletIdType: typeof transaction.walletId,
  })

  const navigationPromise = router.push({
    name: 'records',
    query: {
      transactionId: transaction._id,
      walletId: transaction.walletId,
    },
  })

  navigationPromise
    .then(() => {
      console.log('Navigation successful')
    })
    .catch((error) => {
      console.error('Navigation failed:', error)
    })
}

// Shared wallet
const isSharedWallet = computed(() => {
  if (activeWallet.value === 'all') return false
  const wallet = storeWallets.value.find((w) => w._id === activeWallet.value)
  return wallet?.members && wallet.members.length > 1
})

async function loadAll() {
  // Load data from stores
  await Promise.all([store.loadAll(), walletsStore.loadWallets()])

  // Keep default as 'all' wallets
  if (!activeWallet.value) {
    activeWallet.value = 'all'
  }

  // For shared wallet info, we need a specific wallet selected
  if (activeWallet.value && activeWallet.value !== 'all') {
    const wallet = storeWallets.value.find((w) => w._id === activeWallet.value)
    if (wallet?.members) {
      sharedMembers.value = wallet.members
    } else {
      sharedMembers.value = []
    }
  } else {
    sharedMembers.value = []
  }
}

onMounted(async () => {
  await Promise.all([store.loadAll(), walletsStore.loadWallets()])

  // Set default to 'all' wallets
  if (!activeWallet.value) {
    activeWallet.value = 'all'
  }

  // Watch for changes
  store.watchChanges()
  localDB.changes({ since: 'now', live: true, include_docs: true }).on('change', loadAll)
})
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
  border-left: 4px solid transparent;
}

.transaction-card:hover {
  background-color: #f8f9fa;
  border-left-color: #4d934e;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
