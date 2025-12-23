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

    <!-- Action Buttons -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn color="primary" icon="add" label="Add Budget" @click="showDialog = true" />
      <q-btn color="primary" icon="auto_fix_high" label="Auto-Budget" @click="autoBudget" />
      <q-btn
        color="secondary"
        icon="refresh"
        label="Refresh"
        :loading="isRefreshing"
        @click="refreshBudgets"
      />
      <q-btn
        color="info"
        icon="bug_report"
        label="Debug Info"
        @click="showDebugInfo = !showDebugInfo"
      />
    </div>

    <!-- Debug Info Panel -->
    <q-card v-if="showDebugInfo" class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Debug Information</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-caption">
          <strong>Authentication:</strong><br />
          User ID: {{ authStore.user?._id || 'Not logged in' }}<br />
          Is Authenticated: {{ authStore.isAuthenticated ? 'Yes' : 'No' }}<br />
          Users Store User: {{ usersStore.currentUser?._id || 'None' }}<br />
          <br />
          <strong>Data Status:</strong><br />
          Budgets count: {{ budgets?.length || 0 }}<br />
          Filtered budgets count: {{ filteredBudgets?.length || 0 }}<br />
          Categories count: {{ categories?.length || 0 }}<br />
          Wallets count: {{ wallets?.length || 0 }}<br />
          <br />
          <strong>Categories Debug:</strong><br />
          Categories loaded: {{ categories?.length || 0 }}<br />
          Sample category: {{ categories?.[0] ? categories[0].name : 'None' }}<br />
          Looking for category ID: {{ budgets?.[0]?.categoryId || 'No budget' }}<br />
          <br />
          <strong>Budgets Store:</strong><br />
          Is Loading: {{ budgetsStore.isLoading ? 'Yes' : 'No' }}<br />
          Has Error: {{ budgetsStore.error ? 'Yes' : 'No' }}<br />
          Error Message: {{ budgetsStore.error || 'None' }}<br />
          <br />
          <strong>Sample Budget Data:</strong><br />
          <pre>{{ JSON.stringify(budgets?.[0], null, 2) }}</pre>
        </div>
      </q-card-section>
    </q-card>

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

            <div class="row items-center q-gutter-sm">
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

              <!-- Edit and Delete Buttons -->
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                size="sm"
                @click="editBudget(b)"
                title="Edit Budget"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                size="sm"
                @click="confirmDeleteBudget(b)"
                title="Delete Budget"
              />
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
    <div
      v-if="!filteredBudgets.length && !budgetsStore.isLoading"
      class="text-grey text-center q-mt-lg"
    >
      <div class="q-mb-md">
        <q-icon name="account_balance_wallet" size="64px" class="text-grey-4" />
      </div>
      <div class="text-h6 q-mb-sm">No budgets set yet</div>
      <div class="text-body2 q-mb-md">Create your first budget to start tracking your spending</div>
      <q-btn color="primary" icon="add" label="Add Your First Budget" @click="showDialog = true" />
    </div>

    <!-- Loading State -->
    <div v-if="budgetsStore.isLoading" class="text-center q-mt-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey q-mt-sm">Loading budgets...</div>
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
          <!-- Category Input -->
          <q-input
            filled
            v-model="form.categoryName"
            label="Category"
            hint="Enter category name (e.g., motorcycle, groceries)"
            @blur="handleCategoryInput"
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
import { storeToRefs } from 'pinia'
import { useFinancesStore } from 'src/stores/finances'
import { useBudgetsStore } from 'src/stores/budgets'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'
import { useAuthStore } from 'src/stores/auth'

// Stores
const $q = useQuasar()
const financesStore = useFinancesStore()
const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

// 🔧 FIXED: Use storeToRefs for ALL stores (like Analysis page) for consistent reactivity
const { wallets } = storeToRefs(financesStore)
const { budgets } = storeToRefs(budgetsStore)
const { categories } = storeToRefs(categoriesStore) // 🔧 FIXED: Using storeToRefs for categories too!
const addCategory = categoriesStore.addCategory // Keep method reference

// Tithes-related state
const expectedTithes = ref(0)

// UI State
const showDialog = ref(false)
const editingBudget = ref(null)
const selectedWallet = ref(null)
const showDebugInfo = ref(false)
const isRefreshing = ref(false)

const form = ref({
  categoryName: '',
  budgetType: 'fixed',
  amount: 0,
  percent: 0,
})

// Computed values
const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() =>
  (wallets.value || []).map((w) => ({ label: w.name, value: w._id })),
)

// 🔧 FIXED: Simplified filteredBudgets computed (like Analysis page)
const filteredBudgets = computed(() => {
  console.log('🔍 BudgetsPage: filteredBudgets computed called:', {
    budgetsLength: budgets.value?.length || 0,
    budgets: budgets.value,
  })

  // Simple return all budgets (like Analysis page does)
  const result = budgets.value || []
  console.log('✅ BudgetsPage: filteredBudgets result:', result.length, 'budgets')

  return result
})

// 🔧 FIXED: Enhanced getCategoryName function with better debugging
function getCategoryName(categoryId) {
  console.log('🏷️ BudgetsPage: getCategoryName called:', {
    categoryId,
    categoriesLength: categories.value?.length || 0,
    categories: categories.value,
  })

  if (!categoryId) {
    console.log('❌ No categoryId provided')
    return 'No Category'
  }

  if (!categories.value || !Array.isArray(categories.value)) {
    console.log('❌ Categories not loaded or not an array')
    return 'Loading Categories...'
  }

  const category = categories.value.find((c) => c._id === categoryId)

  if (category) {
    console.log('✅ Found category:', category.name)
    return category.name
  } else {
    console.log('❌ Category not found, showing ID')
    // Return a shortened version of the ID for debugging
    return `Category (${categoryId.substring(0, 8)}...)`
  }
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

// Delete budget with confirmation
async function confirmDeleteBudget(budget) {
  const categoryName = getCategoryName(budget.categoryId)

  $q.dialog({
    title: 'Delete Budget',
    message: `Are you sure you want to delete the budget for "${categoryName}"?\n\nThis action cannot be undone.`,
    cancel: true,
    persistent: true,
    color: 'negative',
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(async () => {
    try {
      $q.loading.show({ message: 'Deleting budget...' })

      await budgetsStore.deleteBudget(budget._id)

      $q.notify({
        type: 'positive',
        message: `Budget for "${categoryName}" deleted successfully!`,
      })

      // Refresh the budgets to update the UI
      await budgetsStore.loadBudgets()
    } catch (error) {
      console.error('Failed to delete budget:', error)

      $q.notify({
        type: 'negative',
        message: 'Failed to delete budget',
        caption: error.message || 'Unknown error occurred',
        timeout: 5000,
      })
    } finally {
      $q.loading.hide()
    }
  })
}

// Edit budget
function editBudget(budget) {
  try {
    console.log('Editing budget:', budget)

    // Get the category name for the budget
    const categoryName = getCategoryName(budget.categoryId)

    // Determine budget type based on whether amount or percent is set
    const budgetType = budget.amount > 0 ? 'fixed' : 'percentage'

    // Populate the form with the budget's current data
    form.value = {
      categoryName: categoryName,
      budgetType: budgetType,
      amount: budget.amount || 0,
      percent: budget.percent || 0,
    }

    // Set the editing budget
    editingBudget.value = budget

    // Open the dialog
    showDialog.value = true

    console.log('Budget form populated for editing:', form.value)
  } catch (error) {
    console.error('Failed to edit budget:', error)

    $q.notify({
      type: 'negative',
      message: 'Failed to open budget editor',
      caption: error.message || 'Unknown error occurred',
    })
  }
}

// Load expected tithes
async function loadExpectedTithes() {
  try {
    expectedTithes.value = await budgetsStore.calculateExpectedTithes()

    // Always ensure we have a value, even if it's 0
    if (expectedTithes.value === undefined || expectedTithes.value === null) {
      expectedTithes.value = 0
    }
  } catch (error) {
    console.error('Failed to load expected tithes:', error)
    expectedTithes.value = 0
  }
}

// Auto-Budget functionality
async function autoBudget() {
  try {
    $q.dialog({
      title: 'Enable Auto-Budget?',
      message:
        'This feature will automatically give you the option to pre-delegate when you add a transaction "Increase". This helps you proactively allocate incoming funds to specific budgets before you spend them.',
      persistent: true,
      color: 'primary',
      ok: {
        label: 'Enable',
        color: 'primary',
      },
      cancel: {
        label: 'Not Now',
        color: 'grey',
      },
    })
      .onOk(() => {
        // Show budget frequency selection dialog
        $q.dialog({
          title: 'Choose Budget Frequency',
          message: 'How often would you like to budget your funds?',
          persistent: true,
          color: 'primary',
          options: {
            type: 'radio',
            model: 'monthly',
            items: [
              { label: 'Monthly Budget', value: 'monthly', color: 'primary' },
              { label: 'Weekly Budget', value: 'weekly', color: 'primary' },
            ],
          },
          cancel: {
            label: 'Cancel',
            color: 'grey',
          },
          ok: {
            label: 'Confirm',
            color: 'primary',
          },
        })
          .onOk((frequency) => {
            // Show amount input dialog
            $q.dialog({
              title: 'Set Average Income',
              message: `On average how much money do you get ${frequency} that you want pre-delegated?`,
              prompt: {
                model: '',
                type: 'number',
                label: `Average ${frequency} income (₱)`,
                min: 0,
                isValid: (val) => val > 0,
              },
              cancel: {
                label: 'Cancel',
                color: 'grey',
              },
              ok: {
                label: 'Confirm',
                color: 'primary',
              },
              persistent: true,
            })
              .onOk((totalAmount) => {
                // Show fullscreen budget allocation dialog
                showBudgetAllocationDialog(frequency, Number(totalAmount))
              })
              .onCancel(() => {
                $q.notify({
                  type: 'info',
                  message: 'Average income amount cancelled.',
                })
              })
          })
          .onCancel(() => {
            $q.notify({
              type: 'info',
              message: 'Budget frequency selection cancelled.',
            })
          })
      })
      .onCancel(() => {
        $q.notify({
          type: 'info',
          message: 'Auto-Budget disabled. You can enable it anytime from this page.',
        })
      })
  } catch (error) {
    console.error('Auto-Budget error:', error)
    $q.notify({
      type: 'negative',
      message: 'Auto-Budget feature error',
      caption: error.message || 'Unknown error occurred',
    })
  }
}

// Budget allocation dialog
function showBudgetAllocationDialog(frequency, totalAmount) {
  // Pre-defined categories from template
  const categories = [
    { name: 'Tithes', amount: 0, percent: 10, locked: true },
    { name: 'Rent/Housing', amount: 0, percent: 0, locked: false },
    { name: 'Food', amount: 0, percent: 0, locked: false },
    { name: 'Transportation', amount: 0, percent: 0, locked: false },
    { name: 'Utilities', amount: 0, percent: 0, locked: false },
    { name: 'Insurance', amount: 0, percent: 0, locked: false },
    { name: 'Medical/Health', amount: 0, percent: 0, locked: false },
    { name: 'Clothing', amount: 0, percent: 0, locked: false },
    { name: 'Education/Learning', amount: 0, percent: 0, locked: false },
    { name: 'Entertainment/Recreation', amount: 0, percent: 0, locked: false },
    { name: 'Savings', amount: 0, percent: 0, locked: false },
    { name: 'Emergency Fund', amount: 0, percent: 0, locked: false },
    { name: 'Debt Payments', amount: 0, percent: 0, locked: false },
    { name: 'Miscellaneous', amount: 0, percent: 0, locked: false },
  ]

  // Set tithes to 10% (locked)
  const tithesIndex = categories.findIndex((cat) => cat.name === 'Tithes')
  if (tithesIndex !== -1) {
    categories[tithesIndex].amount = (totalAmount * 0.1).toFixed(0)
    categories[tithesIndex].percent = 10
  }

  // Create fullscreen dialog with custom layout
  const dialogHtml = `
    <div class="fullscreen-budget-dialog" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 9999;
      display: flex;
      flex-direction: column;
    ">
      <!-- Header -->
      <div class="dialog-header" style="
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
      ">
        <div class="text-h5 text-weight-bold">Budget Allocation - ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}</div>
        <div class="text-subtitle1 text-grey-7">Total ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Income: ₱${totalAmount.toLocaleString()}</div>
      </div>

      <!-- Content -->
      <div class="dialog-content" style="
        flex: 1;
        padding: 20px;
        padding-bottom: 100px;
        overflow-y: auto;
      ">
        <div class="budget-table">
          <div class="budget-header" style="
            display: grid;
            grid-template-columns: 50% 25% 25%;
            gap: 10px;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 4px;
            font-weight: bold;
            margin-bottom: 10px;
          ">
            <div>Category</div>
            <div style="text-align: right;">Amount (₱)</div>
            <div style="text-align: right;">Percentage</div>
          </div>
          ${categories
            .map(
              (category, index) => `
            <div class="budget-row" style="
              display: grid;
              grid-template-columns: 50% 25% 25%;
              gap: 10px;
              padding: 12px;
              border-bottom: 1px solid #eee;
              background: white;
              align-items: center;
            ">
              <div>
                ${
                  category.locked
                    ? `<div style="color: #1976d2; font-weight: 500; font-size: 16px;">${category.name} (10% - Locked)</div>`
                    : `<div style="font-weight: 500; font-size: 16px; margin-bottom: 8px;">${category.name}</div>
                       <input type="number" class="category-amount" data-index="${index}" value="${category.amount}"
                         placeholder="Enter amount for ${category.name}" style="
                           width: 100%;
                           padding: 12px 15px;
                           border: 2px solid #e0e0e0;
                           border-radius: 8px;
                           font-size: 16px;
                           font-weight: 500;
                           box-sizing: border-box;
                           background: #fafafa;
                           transition: all 0.2s ease;
                           cursor: pointer;
                         "
                         onfocus="this.style.borderColor='#2196f3'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(33, 150, 243, 0.1)'"
                         onblur="this.style.borderColor='#e0e0e0'; this.style.background='#fafafa'; this.style.boxShadow='none'"
                         onmouseover="this.style.borderColor='#2196f3'"
                         onmouseout="this.style.borderColor='#e0e0e0'"
                         >`
                }
              </div>
              <div style="text-align: right;">
                ${
                  category.locked
                    ? `<span style="font-weight: 500;">₱${Number(category.amount).toLocaleString()}</span>`
                    : `<span class="amount-display">₱${Number(category.amount).toLocaleString()}</span>`
                }
              </div>
              <div style="text-align: right;">
                <span class="percent-display">${category.percent.toFixed(1)}%</span>
              </div>
            </div>
          `,
            )
            .join('')}

          <!-- Summary Section -->
          <div class="budget-summary" style="margin-top: 20px;">
            <div class="budget-total" style="
              display: grid;
              grid-template-columns: 50% 25% 25%;
              gap: 10px;
              padding: 16px;
              background: #e3f2fd;
              border: 2px solid #2196f3;
              border-radius: 8px;
              margin-bottom: 10px;
              align-items: center;
            ">
              <div style="font-weight: bold;">Total Allocated:</div>
              <div style="text-align: right; font-weight: bold;">₱<span id="total-allocated">0</span></div>
              <div style="text-align: right; font-weight: bold;"><span id="total-percent">0.0</span>%</div>
            </div>
            <div class="budget-remaining" style="
              display: grid;
              grid-template-columns: 50% 25% 25%;
              gap: 10px;
              padding: 16px;
              background: #fff3e0;
              border: 2px solid #ff9800;
              border-radius: 8px;
              align-items: center;
            ">
              <div style="font-weight: bold;">Remaining:</div>
              <div style="text-align: right; font-weight: bold; color: #ff9800;">₱<span id="remaining-amount">${totalAmount.toLocaleString()}</span></div>
              <div style="text-align: right; font-weight: bold; color: #ff9800;"><span id="remaining-percent">100.0</span>%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div class="dialog-actions" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 12px;
        z-index: 10000;
      ">
        <button class="cancel-btn" style="
          padding: 12px 24px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Cancel</button>
        <button class="save-btn" style="
          padding: 12px 24px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Save Budget Allocation</button>
      </div>
    </div>
  `

  // Insert the dialog into the page
  document.body.insertAdjacentHTML('beforeend', dialogHtml)

  // Add event listeners
  const cancelBtn = document.querySelector('.cancel-btn')
  const saveBtn = document.querySelector('.save-btn')

  cancelBtn.addEventListener('click', () => {
    document.querySelector('.fullscreen-budget-dialog').remove()
    $q.notify({
      type: 'info',
      message: 'Budget allocation cancelled.',
    })
  })

  saveBtn.addEventListener('click', () => {
    const allocationData = {
      frequency,
      totalAmount,
      categories: categories.map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percent: cat.percent,
        locked: cat.locked,
      })),
    }

    document.querySelector('.fullscreen-budget-dialog').remove()

    $q.notify({
      type: 'positive',
      message: `Auto-Budget enabled with ${frequency} frequency!`,
      caption: `₱${totalAmount.toLocaleString()} allocated across ${categories.length} categories`,
    })

    console.log('Budget allocation saved:', allocationData)
  })

  // Add event listeners for amount inputs
  setTimeout(() => {
    const amountInputs = document.querySelectorAll('.category-amount')
    amountInputs.forEach((input) => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index)
        const amount = Number(e.target.value) || 0
        const percent = ((amount / totalAmount) * 100).toFixed(1)

        categories[index].amount = amount
        categories[index].percent = percent

        // Update displays
        const row = e.target.closest('.budget-row')
        const amountDisplay = row.querySelector('.amount-display')
        const percentDisplay = row.querySelector('.percent-display')

        if (amountDisplay) amountDisplay.textContent = `₱${amount.toLocaleString()}`
        if (percentDisplay) percentDisplay.textContent = `${percent}%`

        updateTotals()
      })
    })

    // Initial calculation
    updateTotals()
  }, 100)

  function updateTotals() {
    const totalAllocated = categories.reduce((sum, cat) => sum + Number(cat.amount), 0)
    const totalPercent = categories.reduce((sum, cat) => sum + Number(cat.percent), 0)
    const remaining = totalAmount - totalAllocated
    const remainingPercent = 100 - totalPercent

    const totalAllocatedEl = document.getElementById('total-allocated')
    const totalPercentEl = document.getElementById('total-percent')
    const remainingAmountEl = document.getElementById('remaining-amount')
    const remainingPercentEl = document.getElementById('remaining-percent')

    if (totalAllocatedEl) totalAllocatedEl.textContent = totalAllocated.toLocaleString()
    if (totalPercentEl) totalPercentEl.textContent = totalPercent.toFixed(1)
    if (remainingAmountEl) remainingAmountEl.textContent = Math.max(0, remaining).toLocaleString()
    if (remainingPercentEl)
      remainingPercentEl.textContent = Math.max(0, remainingPercent).toFixed(1)
  }
}

// Refresh budgets manually
async function refreshBudgets() {
  console.log('🔄 Manual budget refresh triggered...')
  isRefreshing.value = true

  try {
    // 🔧 FIXED: Refresh both budgets AND categories to ensure category names are available
    await Promise.all([budgetsStore.forceRefreshBudgets(), categoriesStore.loadCategories()])
    await loadExpectedTithes()

    $q.notify({
      type: 'positive',
      message: 'Budgets and categories refreshed successfully!',
    })
  } catch (error) {
    console.error('Failed to refresh budgets:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh data',
      caption: error.message,
    })
  } finally {
    isRefreshing.value = false
  }
}

// Handle category input processing
async function handleCategoryInput() {
  if (!form.value.categoryName.trim()) return

  try {
    // Check if categories are loaded first
    if (!categories.value || !Array.isArray(categories.value)) {
      console.log('Categories not loaded yet, skipping category check')
      return
    }

    // Check if category already exists
    const categoriesArray = Array.isArray(categories.value) ? categories.value : []
    const existingCategory = categoriesArray.find(
      (c) => c.name.toLowerCase() === form.value.categoryName.toLowerCase(),
    )

    if (existingCategory) {
      console.log('Using existing category:', existingCategory)
      return
    }

    // Simple authentication check - access stores directly
    const isAuth = authStore.isAuthenticated && authStore.user?._id
    if (!isAuth) {
      $q.notify({ type: 'warning', message: 'Please log in to create categories' })
      return
    }

    console.log('Creating new category:', form.value.categoryName)
  } catch (error) {
    console.error('Error processing category input:', error)
  }
}

// Enhanced authentication check function
async function checkAuthentication() {
  console.log('=== AUTHENTICATION CHECK ===')

  // Method 1: Check auth store directly
  const authStoreUser = authStore.user
  const authStoreAuthenticated = authStore.isAuthenticated

  // Method 2: Check users store directly
  const usersStoreUser = usersStore.currentUser

  // Method 3: Try to re-initialize if needed
  let reinitializedAuth = false
  if (!authStoreAuthenticated || !authStoreUser) {
    console.log('Auth store not ready, attempting re-initialization...')
    reinitializedAuth = authStore.checkAuth()
    console.log('Re-initialization result:', reinitializedAuth)
  }

  // Method 4: Force users store initialization
  usersStore.initialize()

  const finalAuthUser = authStore.user || usersStore.currentUser
  const finalAuthenticated = authStore.isAuthenticated || !!usersStore.currentUser?._id

  console.log('Final auth state:', {
    authStoreUser: authStoreUser?._id,
    authStoreAuthenticated,
    usersStoreUser: usersStoreUser?._id,
    reinitializedAuth,
    finalAuthUser: finalAuthUser?._id,
    finalAuthenticated,
    localStorage: localStorage.getItem('currentUser') ? 'Has data' : 'No data',
  })

  return {
    isAuthenticated: finalAuthenticated,
    user: finalAuthUser,
    source: reinitializedAuth
      ? 'reinitialized'
      : authStoreAuthenticated
        ? 'authStore'
        : usersStoreUser
          ? 'usersStore'
          : 'none',
  }
}

// Save or update budget
async function saveBudget() {
  try {
    console.log('Starting budget save process...')

    // Enhanced authentication check with multiple fallback methods
    const authResult = await checkAuthentication()

    if (!authResult.isAuthenticated || !authResult.user?._id) {
      $q.notify({
        type: 'negative',
        message: 'You must be logged in to save budgets',
        caption: `Authentication failed - ${authResult.source}`,
        timeout: 5000,
      })
      return
    }

    console.log('Authentication successful, proceeding with save...')

    // Basic validation
    if (!form.value.categoryName.trim()) {
      $q.notify({
        type: 'negative',
        message: 'Category name is required',
        timeout: 3000,
      })
      return
    }

    if (form.value.budgetType === 'fixed') {
      if (!form.value.amount || form.value.amount <= 0) {
        $q.notify({
          type: 'negative',
          message: 'Budget amount must be greater than 0',
          timeout: 3000,
        })
        return
      }
    } else if (form.value.budgetType === 'percentage') {
      if (!form.value.percent || form.value.percent <= 0 || form.value.percent > 100) {
        $q.notify({
          type: 'negative',
          message: 'Budget percentage must be between 1 and 100',
          timeout: 3000,
        })
        return
      }
    }

    console.log('Validation passed, proceeding with budget save...')

    // Ensure categories are loaded before proceeding
    if (!categories.value || !Array.isArray(categories.value)) {
      console.log('Categories not loaded, loading them first...')
      await categoriesStore.loadCategories()

      // Wait a bit for categories to be fully loaded
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Show loading state (check if $q and loading exist)
    if ($q && $q.loading) {
      $q.loading.show({ message: 'Saving budget...' })
    }

    // Get or create category
    let categoryId = null
    let categoryName = form.value.categoryName.trim()

    try {
      // Ensure categories array exists and is an array
      const categoriesArray = Array.isArray(categories.value) ? categories.value : []

      // Check if category already exists (case-insensitive)
      const existingCategory = categoriesArray.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      )

      if (existingCategory) {
        categoryId = existingCategory._id
        console.log('Using existing category:', existingCategory.name)
      } else {
        console.log('Creating new category:', categoryName)

        // Create new category
        const newCategory = await addCategory({
          name: categoryName,
          kind: 'expense',
          icon: 'category',
          color: 'red-5',
          description: `${categoryName} expenses`,
          isShared: true,
        })

        if (!newCategory || !newCategory._id) {
          throw new Error('Failed to create category - no ID returned')
        }

        categoryId = newCategory._id
        console.log('New category created:', newCategory.name)

        $q.notify({
          type: 'positive',
          message: `Category created: ${newCategory.name}`,
        })
      }
    } catch (categoryError) {
      console.error('Category creation/selection failed:', categoryError)
      throw new Error(`Failed to process category: ${categoryError.message}`)
    }

    if (!categoryId) {
      throw new Error('Failed to get or create category')
    }

    // Get current month period
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Prepare budget data
    const budgetData = {
      categoryId: categoryId,
      budgetType: 'monthly', // Always use 'monthly' as expected by the store
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString(),
      amount: form.value.budgetType === 'fixed' ? Number(form.value.amount) : 0,
      percent: form.value.budgetType === 'percentage' ? Number(form.value.percent) : 0,
      isShared: false,
      sharedWithUserIds: [],
    }

    console.log('Budget data prepared:', budgetData)

    // Save budget
    if (editingBudget.value) {
      console.log('Updating existing budget:', editingBudget.value._id)
      await budgetsStore.updateBudget(editingBudget.value._id, budgetData)
      $q.notify({
        type: 'positive',
        message: 'Budget updated successfully!',
      })
    } else {
      console.log('Creating new budget...')
      const savedBudget = await budgetsStore.addBudget(budgetData)

      if (!savedBudget) {
        throw new Error('Budget save returned no data')
      }

      console.log('Budget saved successfully:', savedBudget._id)
      $q.notify({
        type: 'positive',
        message: 'Budget added successfully!',
      })
    }

    // Reset form and close dialog
    resetForm()
    showDialog.value = false

    // Refresh budgets to show updated data
    await budgetsStore.loadBudgets()

    console.log('Budget save process completed successfully')
  } catch (error) {
    console.error('Critical error in saveBudget:', error)

    // Provide detailed error feedback
    let errorMessage = 'Failed to save budget'
    let errorDetails = ''

    if (error.message) {
      errorMessage = error.message
      errorDetails = `Details: ${error.message}`
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: errorDetails,
      timeout: 7000,
      actions: [
        {
          label: 'Dismiss',
          color: 'white',
          handler: () => {},
        },
      ],
    })

    // Debug info (always show for debugging)
    console.group('Budget Save Debug Info')
    console.log('Auth store user:', authStore.user?._id)
    console.log('Auth store authenticated:', authStore.isAuthenticated)
    console.log('Users store currentUser:', usersStore.currentUser?._id)
    console.log('Categories count:', categories.value?.length || 0)
    console.log('Budgets store error:', budgetsStore.error)
    console.log('Full error object:', error)
    console.groupEnd()
  } finally {
    // Always hide loading indicator (check if $q and loading exist)
    if ($q && $q.loading) {
      $q.loading.hide()
    }
  }
}

function resetForm() {
  form.value = {
    categoryName: '',
    budgetType: 'fixed',
    amount: 0,
    percent: 0,
  }
  editingBudget.value = null
}

// Load data on mount
onMounted(async () => {
  console.log('BudgetsPage: Component mounted, initializing...')

  // Check authentication using the improved auth store
  const isAuth = authStore.checkAuth()

  console.log('Authentication check result:', isAuth)

  if (!isAuth) {
    console.warn('No user logged in - budgets require authentication')
    return
  }

  console.log('User authenticated, loading data...')

  // 🔧 FIXED: Load categories BEFORE budgets to ensure category names are available
  await Promise.all([
    financesStore.loadAll(),
    categoriesStore.loadCategories(), // Load categories first
    budgetsStore.loadBudgets(), // Then load budgets
  ])

  // Load expected tithes
  await loadExpectedTithes()

  // Set default wallet
  if (wallets.value.length > 0) {
    selectedWallet.value = wallets.value[0]._id
  }

  console.log('BudgetsPage: Initialization complete')
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
