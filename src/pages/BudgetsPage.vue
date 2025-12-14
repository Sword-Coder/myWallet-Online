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
                {{ getCategoryName(b.categoryId) }}
              </div>
              <div class="text-caption text-grey">
                <template v-if="b.amount > 0">
                  ₱{{ Number(b.amount || 0).toLocaleString() }} limit
                </template>
                <template v-else-if="b.percent > 0"> {{ b.percent }}% of income </template>
                <template v-else> No budget set </template>
              </div>
            </div>

            <div class="text-subtitle2 text-right">
              <template v-if="isTithesCategory(b)">
                <!-- Special display for Tithes: show actual vs expected -->
                <div class="text-right">
                  <div>
                    ₱{{ Number(b.spent || 0).toLocaleString() }} / Expected ₱{{
                      Number(getExpectedTithes()).toLocaleString()
                    }}
                  </div>
                  <div class="text-caption text-grey">(10% of salary)</div>
                </div>
              </template>
              <template v-else>
                <!-- Debug info for non-tithes budgets -->
                <template v-if="b.amount > 0">
                  ₱{{ Number(b.spent || 0).toLocaleString() }} / ₱{{
                    Number(b.amount || 0).toLocaleString()
                  }}
                </template>
                <template v-else-if="b.percent > 0">
                  ₱{{ Number(b.spent || 0).toLocaleString() }} / {{ b.percent }}%
                </template>
                <template v-else> ₱{{ Number(b.spent || 0).toLocaleString() }} </template>
              </template>
            </div>
          </div>

          <q-linear-progress
            :value="getBudgetProgress(b)"
            :color="isBudgetExceeded(b) ? 'negative' : 'primary'"
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
          <!-- Category Selector -->
          <q-select
            filled
            use-input
            input-debounce="0"
            v-model="form.categoryId"
            :options="categoryOptions"
            option-label="name"
            option-value="_id"
            label="Category"
            emit-value
            map-options
            hint="Select or type to create"
            @new-value="createNewCategory"
          />

          <!-- Budget Type -->
          <q-option-group
            v-model="form.budgetType"
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
            v-if="form.budgetType === 'fixed'"
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
          <q-btn flat label="Cancel" color="grey" v-close-popup @click="resetForm" />
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
import { useBudgetsStore } from 'src/stores/budgets'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'

// Stores
const $q = useQuasar()
const financesStore = useFinancesStore()
const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()

// State from stores
const { wallets } = financesStore
const { budgets, calculateExpectedTithes } = budgetsStore
const { categories, addCategory } = categoriesStore
const { currentUser } = usersStore

// Tithes-related state
const expectedTithes = ref(0)

// Dialog state
const showDialog = ref(false)
const editingBudget = ref(null)
const selectedWallet = ref(null)

const form = ref({
  categoryId: '',
  budgetType: 'fixed',
  amount: 0,
  percent: 0,
})

// Computed values
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() =>
  (wallets.value || []).map((w) => ({ label: w.name, _id: w._id })),
)

const categoryOptions = computed(() => categories.value || [])

const filteredBudgets = computed(() => {
  if (!selectedWallet.value) return budgets.value || []

  return (budgets.value || []).filter(() => {
    // For now, budgets are user-based, not wallet-based
    // This would need to be adjusted based on your business logic
    return true
  })
})

// Helper functions
function getCategoryName(categoryId) {
  const category = (categories.value || []).find((c) => c._id === categoryId)
  return category ? category.name : 'Unknown Category'
}

function getBudgetProgress(budget) {
  if (budget.amount > 0) {
    return Math.min(budget.spent / budget.amount, 1)
  }
  return 0
}

function isBudgetExceeded(budget) {
  return budget.spent > budget.amount && budget.amount > 0
}

// Check if budget is for Tithes category
function isTithesCategory(budget) {
  const category = (categories.value || []).find((c) => c._id === budget.categoryId)
  return category && category.name.toLowerCase() === 'tithes'
}

// Get expected tithes amount
function getExpectedTithes() {
  return expectedTithes.value
}

// Load expected tithes
async function loadExpectedTithes() {
  try {
    expectedTithes.value = await calculateExpectedTithes()

    // Always ensure we have a value, even if it's 0
    if (expectedTithes.value === undefined || expectedTithes.value === null) {
      expectedTithes.value = 0
    }
  } catch (error) {
    console.error('Failed to load expected tithes:', error)
    expectedTithes.value = 0
  }
}

// Save or update budget
async function saveBudget() {
  if (!form.value.categoryId) {
    $q.notify({ type: 'warning', message: 'Please select a category' })
    return
  }

  if (form.value.budgetType === 'fixed' && !form.value.amount) {
    $q.notify({ type: 'warning', message: 'Please enter a budget amount' })
    return
  }

  if (form.value.budgetType === 'percentage' && !form.value.percent) {
    $q.notify({ type: 'warning', message: 'Please enter a budget percentage' })
    return
  }

  try {
    // Get current month period
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const budgetData = {
      categoryId: form.value.categoryId,
      budgetType: form.value.budgetType,
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString(),
      amount: form.value.budgetType === 'fixed' ? form.value.amount : 0,
      percent: form.value.budgetType === 'percentage' ? form.value.percent : 0,
      isShared: false,
      sharedWithUserIds: [],
    }

    if (editingBudget.value) {
      await budgetsStore.updateBudget(editingBudget.value._id, budgetData)
      $q.notify({ type: 'positive', message: 'Budget updated successfully!' })
    } else {
      await budgetsStore.addBudget(budgetData)
      $q.notify({ type: 'positive', message: 'Budget added successfully!' })
    }

    resetForm()
    showDialog.value = false
  } catch (error) {
    console.error('Error saving budget:', error)
    $q.notify({ type: 'negative', message: 'Failed to save budget' })
  }
}

function resetForm() {
  form.value = {
    categoryId: '',
    budgetType: 'fixed',
    amount: 0,
    percent: 0,
  }
  editingBudget.value = null
}

async function createNewCategory(newCategory) {
  if (!newCategory.trim()) return

  try {
    const category = await addCategory({
      name: newCategory,
      kind: 'expense', // Default to expense for budgets
      icon: 'category',
      color: 'red-5',
      description: `${newCategory} expenses`,
      isShared: true,
    })

    form.value.categoryId = category._id
  } catch (error) {
    console.error('Error creating category:', error)
    $q.notify({ type: 'negative', message: 'Failed to create category' })
  }
}

// Load data on mount
onMounted(async () => {
  // Initialize user if not logged in (for demo purposes)
  if (!currentUser.value) {
    // Check if user is authenticated
    if (!currentUser.value) {
      console.warn('No user logged in - budgets require authentication')
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

  // Set default wallet
  if (wallets.value.length > 0) {
    selectedWallet.value = wallets.value[0]._id
  }
})

// Watch for changes
watch(
  [wallets],
  ([newWallets]) => {
    if (newWallets.length > 0 && !selectedWallet.value) {
      selectedWallet.value = newWallets[0]._id
    }
  },
  { immediate: true },
)

// Watch for budget and category changes to refresh expected tithes
watch(
  [budgets, categories],
  async () => {
    await loadExpectedTithes()
  },
  { deep: true },
)
</script>

<style scoped>
/* Page Layout */
.q-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Budget Cards */
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
