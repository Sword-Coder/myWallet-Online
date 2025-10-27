<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Categories</div>
        <div class="text-caption text-grey">Manage your transaction categories</div>
      </div>
    </div>

    <!-- Expense Categories Section -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="bg-red-1 text-red-9">
        <div class="text-subtitle1 text-weight-medium">
          <q-icon name="arrow_downward" class="q-mr-sm" />
          Expense Categories
        </div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-list separator>
          <q-item
            v-for="category in expenseCategories"
            :key="category._id"
            class="category-item"
            clickable
            @click="editCategory(category)"
          >
            <q-item-section avatar>
              <q-avatar
                :icon="category.icon || 'category'"
                :color="category.color || 'red-5'"
                text-color="white"
                size="40px"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ category.name }}</q-item-label>
              <q-item-label caption>{{ category.description || 'Expense category' }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-grey-8">
                <q-icon name="chevron_right" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Income Categories Section -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="bg-green-1 text-green-9">
        <div class="text-subtitle1 text-weight-medium">
          <q-icon name="arrow_upward" class="q-mr-sm" />
          Income Categories
        </div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-list separator>
          <q-item
            v-for="category in incomeCategories"
            :key="category._id"
            class="category-item"
            clickable
            @click="editCategory(category)"
          >
            <q-item-section avatar>
              <q-avatar
                :icon="category.icon || 'category'"
                :color="category.color || 'green-5'"
                text-color="white"
                size="40px"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ category.name }}</q-item-label>
              <q-item-label caption>{{ category.description || 'Income category' }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-grey-8">
                <q-icon name="chevron_right" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Add New Category Dialog -->
    <q-dialog v-model="showAddDialog" maximized>
      <q-card class="add-category-dialog">
        <q-card-section class="dialog-header">
          <div class="row items-center">
            <div class="text-h6">Add New Category</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <!-- Category Type Selection -->
          <div class="row q-gutter-sm q-mb-lg">
            <q-btn
              :color="form.kind === 'income' ? 'positive' : 'grey-3'"
              :text-color="form.kind === 'income' ? 'white' : 'positive'"
              icon="arrow_upward"
              label="Income"
              class="col"
              @click="form.kind = 'income'"
            />
            <q-btn
              :color="form.kind === 'expense' ? 'negative' : 'grey-3'"
              :text-color="form.kind === 'expense' ? 'white' : 'negative'"
              icon="arrow_downward"
              label="Expense"
              class="col"
              @click="form.kind = 'expense'"
            />
          </div>

          <!-- Category Name Input -->
          <div class="q-mb-lg">
            <q-input
              v-model="form.name"
              label="Category Name"
              filled
              placeholder="Enter category name"
              :rules="[(val) => (val && val.length > 0) || 'Category name is required']"
            />
          </div>

          <!-- Icon Selection -->
          <div class="icon-selection-section">
            <div class="text-subtitle2 q-mb-md">Choose an Icon</div>
            <div class="icon-grid">
              <div
                v-for="icon in availableIcons"
                :key="icon.name"
                class="icon-option"
                :class="{
                  'icon-selected': form.icon === icon.name,
                  'icon-locked': icon.locked && !icon.unlocked,
                }"
                @click="selectIcon(icon)"
              >
                <q-avatar
                  :icon="icon.name"
                  :color="form.kind === 'expense' ? 'red-5' : 'green-5'"
                  text-color="white"
                  size="48px"
                >
                  <q-icon v-if="icon.locked && !icon.unlocked" name="lock" class="lock-icon" />
                </q-avatar>
                <div class="icon-name text-caption text-center q-mt-xs">{{ icon.label }}</div>
                <div v-if="icon.locked && !icon.unlocked" class="pro-badge">PRO</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="dialog-footer">
          <q-btn flat label="Cancel" v-close-popup class="dialog-cancel-btn" />
          <q-btn
            color="primary"
            label="Save Category"
            @click="saveCategory"
            :disable="!form.name || !form.icon"
            class="dialog-save-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Centered Add Category Button -->
    <div class="add-category-section">
      <q-btn
        color="primary"
        icon="add"
        label="Add Category"
        @click="showAddDialog = true"
        unelevated
        class="add-category-btn-centered"
        size="lg"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoriesStore } from 'src/stores/categories.js'
import { storeToRefs } from 'pinia'

// Store
const categoriesStore = useCategoriesStore()
const { categories } = storeToRefs(categoriesStore)

// Dialog state
const showAddDialog = ref(false)

// Form data
const form = ref({
  name: '',
  kind: 'expense',
  icon: '',
  color: '',
})

// Available icons for selection
const availableIcons = ref([
  // Free icons (including all icons used by default categories)
  { name: 'volunteer_activism', label: 'Tithes', kind: 'expense', locked: false, unlocked: true },
  { name: 'local_offer', label: 'Offerings', kind: 'expense', locked: false, unlocked: true },
  { name: 'shopping_cart', label: 'Shopping', kind: 'expense', locked: false, unlocked: true },
  { name: 'restaurant', label: 'Food & Dining', kind: 'expense', locked: false, unlocked: true },
  { name: 'local_gas_station', label: 'Fuel', kind: 'expense', locked: false, unlocked: true },
  { name: 'home', label: 'Housing', kind: 'expense', locked: false, unlocked: true },
  { name: 'school', label: 'Education', kind: 'expense', locked: false, unlocked: true },
  { name: 'local_hospital', label: 'Healthcare', kind: 'expense', locked: false, unlocked: true },
  {
    name: 'card_giftcard',
    label: 'Gifts & Donations',
    kind: 'expense',
    locked: false,
    unlocked: true,
  },
  { name: 'flight', label: 'Travel', kind: 'expense', locked: false, unlocked: true },
  {
    name: 'directions_car',
    label: 'Transportation',
    kind: 'expense',
    locked: false,
    unlocked: true,
  },
  { name: 'bolt', label: 'Utilities', kind: 'expense', locked: false, unlocked: true },
  { name: 'movie', label: 'Entertainment', kind: 'expense', locked: false, unlocked: true },
  { name: 'favorite', label: 'Faith Promise', kind: 'expense', locked: false, unlocked: true },
  { name: 'work', label: 'Salary', kind: 'income', locked: false, unlocked: true },
  { name: 'savings', label: 'Savings', kind: 'income', locked: false, unlocked: true },
  { name: 'account_balance', label: 'Banking', kind: 'income', locked: false, unlocked: true },
  { name: 'category', label: 'General', kind: 'expense', locked: false, unlocked: true },

  // Additional free icons (no duplicates)
  { name: 'attach_money', label: 'Income', kind: 'income', locked: false, unlocked: true },
  { name: 'payment', label: 'Bills & Payments', kind: 'expense', locked: false, unlocked: true },
  { name: 'credit_card', label: 'Credit Cards', kind: 'expense', locked: false, unlocked: true },
  { name: 'store', label: 'Shopping', kind: 'expense', locked: false, unlocked: true },
  { name: 'local_pharmacy', label: 'Pharmacy', kind: 'expense', locked: false, unlocked: true },
  {
    name: 'fitness_center',
    label: 'Fitness & Health',
    kind: 'expense',
    locked: false,
    unlocked: true,
  },
  { name: 'child_care', label: 'Child Care', kind: 'expense', locked: false, unlocked: true },
  { name: 'commute', label: 'Commute', kind: 'expense', locked: false, unlocked: true },
  { name: 'kitchen', label: 'Groceries', kind: 'expense', locked: false, unlocked: true },
  { name: 'cleaning_services', label: 'Services', kind: 'expense', locked: false, unlocked: true },

  // Pro locked icons (premium features)
  { name: 'pets', label: 'Pets', kind: 'expense', locked: true, unlocked: false },
  { name: 'sports_soccer', label: 'Sports', kind: 'expense', locked: true, unlocked: false },
  { name: 'music_note', label: 'Music', kind: 'expense', locked: true, unlocked: false },
  { name: 'palette', label: 'Art & Hobbies', kind: 'expense', locked: true, unlocked: false },
  { name: 'computer', label: 'Technology', kind: 'expense', locked: true, unlocked: false },
  { name: 'business', label: 'Business', kind: 'income', locked: true, unlocked: false },
  { name: 'trending_up', label: 'Investments', kind: 'income', locked: true, unlocked: false },
  { name: 'security', label: 'Insurance', kind: 'expense', locked: true, unlocked: false },
])

// Computed properties
const expenseCategories = computed(() => categories.value.filter((cat) => cat.kind === 'expense'))

const incomeCategories = computed(() => categories.value.filter((cat) => cat.kind === 'income'))

// Methods
function selectIcon(icon) {
  if (icon.locked && !icon.unlocked) {
    // Show pro upgrade message
    console.log('Pro feature - upgrade required')
    return
  }

  form.value.icon = icon.name
  form.value.color = form.value.kind === 'expense' ? 'red-5' : 'green-5'
}

function saveCategory() {
  if (!form.value.name || !form.value.icon) return

  const success = categoriesStore.addCategory({
    name: form.value.name,
    kind: form.value.kind,
    icon: form.value.icon,
    color: form.value.color,
    description: `${form.value.kind} category`,
  })

  if (success) {
    // Reset form and close dialog
    form.value = {
      name: '',
      kind: 'expense',
      icon: '',
      color: '',
    }
    showAddDialog.value = false
  } else {
    // Show error message for duplicate category
    console.log('Category already exists')
    // You could add a notification here using Quasar's notify
  }
}

function editCategory(category) {
  // For now, just log - can be expanded later
  console.log('Edit category:', category)
}

onMounted(() => {
  categoriesStore.loadCategories()
})
</script>

<style scoped>
/* Page Layout */
.q-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Header Styles */
.add-category-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
}

/* Category Cards */
.category-item {
  transition: all 0.2s ease;
  border-radius: 0;
}

.category-item:hover {
  background-color: #f0f2f5;
  transform: translateX(4px);
}

/* Dialog Styles */
.add-category-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
}

.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Icon Selection Grid */
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
  position: relative;
}

.icon-option:hover {
  border-color: #4d934e;
  background-color: #f0f8f0;
}

.icon-selected {
  border-color: #4d934e;
  background-color: #e8f5e8;
}

.icon-locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
  color: #ffa500;
}

.pro-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ffa500;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.icon-name {
  margin-top: 8px;
  color: #666;
  font-weight: 500;
}

/* Dialog Footer */
.dialog-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
  gap: 12px;
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

/* Responsive Design */
@media (max-width: 768px) {
  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }

  .icon-option {
    padding: 8px;
  }

  .dialog-content {
    padding: 16px;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .dialog-footer {
    padding: 12px 16px;
    flex-direction: column;
  }

  .dialog-footer .q-btn {
    width: 100%;
    margin-bottom: 8px;
  }
}

/* Category Section Headers */
.q-card-section {
  padding: 16px 20px !important;
}

.q-card-section.bg-red-1 {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
}

.q-card-section.bg-green-1 {
  background: linear-gradient(135deg, #4d934e 0%, #3d7e3f 100%) !important;
}

/* List Items */
.q-item {
  padding: 16px 20px;
}

.q-item__section--avatar {
  min-width: 60px;
}

/* Custom Scrollbar Styling */
.q-page {
  scrollbar-width: thin;
  scrollbar-color: #4d934e #f1f1f1;
}

/* Webkit browsers (Chrome, Safari, Edge) */
.q-page::-webkit-scrollbar {
  width: 8px;
}

.q-page::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}

.q-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  border-radius: 4px;
  border: 1px solid #f8f9fa;
}

.q-page::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3d7e3f 0%, #5a8a5f 100%);
}

/* For dialog content areas */
.dialog-content {
  scrollbar-width: thin;
  scrollbar-color: #4d934e #f1f1f1;
}

.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  border-radius: 3px;
  border: 1px solid #f8f9fa;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3d7e3f 0%, #5a8a5f 100%);
}

/* Icon grid scrollbar */
.icon-grid {
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4d934e #e9ecef;
}

.icon-grid::-webkit-scrollbar {
  width: 4px;
}

.icon-grid::-webkit-scrollbar-track {
  background: #e9ecef;
  border-radius: 2px;
}

.icon-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  border-radius: 2px;
}

/* Centered Add Category Section */
.add-category-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 16px;
  margin-top: 24px;
}

.add-category-btn-centered {
  border-radius: 12px;
  padding: 16px 32px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(77, 147, 78, 0.3);
  min-width: 220px;
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
}

/* Mobile responsive for centered button */
@media (max-width: 768px) {
  .add-category-section {
    padding: 24px 16px;
    margin-top: 16px;
  }

  .add-category-btn-centered {
    width: 100%;
    max-width: 300px;
    padding: 14px 24px;
  }
}
</style>
