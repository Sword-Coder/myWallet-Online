<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Budgets</div>
        <div class="text-subtitle2 text-grey">{{ currentMonth }}</div>
      </div>

      <!-- Wallet Selector -->
      <q-select
        v-model="selectedWallet"
        :options="walletOptions"
        label="Select Wallet"
        emit-value
        map-options
        dense
        outlined
        style="min-width: 180px"
      />
    </div>

    <!-- Add Budget Button -->
    <q-btn
      color="primary"
      icon="add"
      label="Add Budget"
      class="q-mb-md full-width"
      @click="showDialog = true"
    />

    <!-- Budgets List -->
    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="b in filteredBudgets" :key="b._id" flat bordered class="q-mb-sm q-pa-sm">
        <q-card-section>
          <div class="row justify-between items-center q-mb-xs">
            <div>
              <div class="text-subtitle2 text-weight-medium">
                {{ b.category }}
              </div>
              <div class="text-caption text-grey">
                <template v-if="b.type === 'fixed'">
                  ₱{{ Number(b.amount || 0).toLocaleString() }} limit
                </template>
                <template v-else> {{ b.percent }}% of income </template>
              </div>
            </div>

            <div class="text-subtitle2 text-right">
              <template v-if="b.type === 'fixed'">
                ₱{{ Number(b.spent || 0).toLocaleString() }} / ₱{{
                  Number(b.amount || 0).toLocaleString()
                }}
              </template>
              <template v-else>
                {{ Number(b.spent || 0).toLocaleString() }} / {{ b.percent }}%
              </template>
            </div>
          </div>

          <q-linear-progress
            :value="b.progress"
            :color="b.spent > b.amount ? 'negative' : 'primary'"
            rounded
            size="10px"
          />
        </q-card-section>
      </q-card>
    </transition-group>

    <!-- Empty State -->
    <div v-if="!filteredBudgets.length" class="text-grey text-center q-mt-lg">
      No budgets set for this wallet yet.
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 380px">
        <q-card-section>
          <div class="text-h6">
            {{ editingBudget ? 'Edit Budget' : 'Add Budget' }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Wallet Selector -->
          <q-select
            filled
            v-model="form.wallet_id"
            :options="walletOptions"
            label="Wallet"
            emit-value
            map-options
          />

          <!-- Category Selector -->
          <q-select
            filled
            use-input
            input-debounce="0"
            v-model="form.category"
            :options="categoryOptions"
            label="Category"
            hint="Select or type to create"
            @new-value="(val) => (form.category = val)"
          />

          <!-- Budget Type -->
          <q-option-group
            v-model="form.type"
            :options="[
              { label: 'Fixed Amount (₱)', value: 'fixed' },
              { label: 'Percentage (%)', value: 'percentage' },
            ]"
            color="primary"
            inline
          />

          <!-- Fixed / Percentage Inputs -->
          <q-input
            filled
            v-if="form.type === 'fixed'"
            v-model.number="form.amount"
            label="Amount (PHP)"
            type="number"
            min="0"
          />

          <q-input
            filled
            v-else
            v-model.number="form.percent"
            label="Percentage (%)"
            type="number"
            min="0"
            max="100"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveBudget" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useFinancesStore } from 'src/stores/finances'
import { useWalletsStore } from 'src/stores/wallets'
import { useCategoriesStore } from 'src/stores/categories'
import { useBudgetsStore } from 'src/stores/budgets'
import { storeToRefs } from 'pinia'

// --- Store setup ---
const $q = useQuasar()
const store = useFinancesStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const budgetsStore = useBudgetsStore()

const { transactions } = storeToRefs(store)
const { wallets, activeWallet } = storeToRefs(walletsStore)
const { categories } = storeToRefs(categoriesStore)
const { budgets } = storeToRefs(budgetsStore)
const showDialog = ref(false)
const editingBudget = ref(null)
const selectedWallet = ref(null)

const form = ref({
  wallet_id: '',
  category: '',
  type: 'fixed',
  amount: 0,
  percent: 0,
})

// --- Computed values ---
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => wallets.value.map((w) => ({ label: w.name, value: w._id })))

const categoryOptions = computed(
  () => categories.value.map((c) => ({ label: c.name, value: c.name })) || [],
)

const budgetsWithProgress = computed(() =>
  budgets.value.map((b) => {
    const spent = transactions.value
      .filter(
        (t) => t.walletId === b.wallet_id && t.category === b.category && t.kind === 'expense',
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const progress = b.type === 'fixed' && b.amount > 0 ? Math.min(spent / b.amount, 1) : 0
    return { ...b, spent, progress }
  }),
)

const filteredBudgets = computed(() => {
  if (!selectedWallet.value || !budgetsWithProgress.value) return []
  return budgetsWithProgress.value.filter((b) => b.wallet_id === selectedWallet.value)
})

// --- Save or update budget ---
function saveBudget() {
  if (!form.value.wallet_id || !form.value.category) {
    $q.notify({ type: 'warning', message: 'Please fill in all fields' })
    return
  }

  if (form.value.type === 'fixed' && !form.value.amount) {
    $q.notify({ type: 'warning', message: 'Please enter an amount' })
    return
  }

  if (form.value.type === 'percentage' && !form.value.percent) {
    $q.notify({ type: 'warning', message: 'Please enter a percentage' })
    return
  }

  const existing = budgets.value.find(
    (b) => b.wallet_id === form.value.wallet_id && b.category === form.value.category,
  )
  if (!editingBudget.value && existing) {
    $q.notify({ type: 'warning', message: 'Budget already exists for this category.' })
    return
  }

  const newBudget = {
    _id: editingBudget.value?._id || new Date().toISOString(),
    wallet_id: form.value.wallet_id,
    category: form.value.category,
    type: form.value.type,
    amount: form.value.type === 'fixed' ? form.value.amount : 0,
    percent: form.value.type === 'percentage' ? form.value.percent : 0,
    spent: 0,
  }

  if (editingBudget.value) {
    budgetsStore.updateBudget(editingBudget.value._id, newBudget)
  } else {
    budgetsStore.addBudget(newBudget)
  }
  showDialog.value = false
  editingBudget.value = null

  form.value = {
    wallet_id: activeWallet.value || '',
    category: '',
    type: 'fixed',
    amount: 0,
    percent: 0,
  }

  $q.notify({ type: 'positive', message: 'Budget saved successfully!' })
}

// --- Lifecycle ---
onMounted(async () => {
  await walletsStore.loadWallets()
  await categoriesStore.loadCategories()
  await store.loadAll()
  await budgetsStore.loadBudgets()

  // Ensure we have an active wallet
  if (wallets.value.length > 0) {
    if (!activeWallet.value) {
      walletsStore.setActiveWallet(wallets.value[0]._id)
    }
    selectedWallet.value = activeWallet.value
    form.value.wallet_id = activeWallet.value
  }
})

// --- Watchers: keep store, dropdown, and form in sync ---
watch(selectedWallet, (val) => {
  if (val) {
    walletsStore.setActiveWallet(val)
    form.value.wallet_id = val
  }
})

watch(activeWallet, (val) => {
  if (val && selectedWallet.value !== val) {
    selectedWallet.value = val
    form.value.wallet_id = val
  }
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
</style>
