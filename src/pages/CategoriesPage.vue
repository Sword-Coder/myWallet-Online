<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Categories</div>
        <div class="text-caption text-grey">Manage your transaction categories</div>
      </div>

      <!-- Add Category Button -->
      <q-btn
        color="primary"
        icon="add"
        label="Add Category"
        @click="showAddDialog = true"
        unelevated
      />
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

    <!-- Add/Edit Category Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="dialog-header">
          <div class="row items-center">
            <div class="text-h6">{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup @click="resetForm" />
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- Category Type Selection -->
          <div class="row q-gutter-sm">
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
          <q-input
            v-model="form.name"
            label="Category Name"
            filled
            placeholder="Enter category name"
            :rules="[(val) => (val && val.length > 0) || 'Category name is required']"
          />

          <!-- Description Input -->
          <q-input
            v-model="form.description"
            label="Description (Optional)"
            filled
            placeholder="Enter category description"
          />

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

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup @click="resetForm" />
          <q-btn
            color="primary"
            :label="editingCategory ? 'Update' : 'Save'"
            @click="saveCategory"
            :disable="!form.name || !form.icon"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Empty State -->
    <div v-if="!categories.length" class="text-grey text-center q-mt-lg">
      No categories found. Add your first category to get started!
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useCategoriesStore } from 'src/stores/categories'
import { useUsersStore } from 'src/stores/users'

// Stores
const $q = useQuasar()
const categoriesStore = useCategoriesStore()
const usersStore = useUsersStore()

// State
const { categories } = categoriesStore
const { currentUser } = usersStore

// Dialog state
const showAddDialog = ref(false)
const editingCategory = ref(null)

// Form data
const form = ref({
  name: '',
  kind: 'expense',
  icon: '',
  color: '',
  description: '',
  isShared: false,
  sharedWithUserIds: [],
})

// Available icons for selection
const availableIcons = ref([
  // Free icons
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

  // Additional free icons
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

  // Pro locked icons
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
const expenseCategories = computed(() => categories.filter((cat) => cat.kind === 'expense'))

const incomeCategories = computed(() => categories.filter((cat) => cat.kind === 'income'))

// Methods
function selectIcon(icon) {
  if (icon.locked && !icon.unlocked) {
    $q.notify({
      type: 'warning',
      message: 'This is a Pro feature. Upgrade to unlock additional icons.',
    })
    return
  }

  form.value.icon = icon.name
  form.value.color = form.value.kind === 'expense' ? 'red-5' : 'green-5'
}

async function saveCategory() {
  if (!form.value.name || !form.value.icon) {
    $q.notify({ type: 'warning', message: 'Please fill in all required fields' })
    return
  }

  try {
    const categoryData = {
      name: form.value.name,
      kind: form.value.kind,
      icon: form.value.icon,
      color: form.value.color,
      description: form.value.description || `${form.value.kind} category`,
      isShared: form.value.isShared,
      sharedWithUserIds: form.value.sharedWithUserIds,
    }

    if (editingCategory.value) {
      await categoriesStore.updateCategory(editingCategory.value._id, categoryData)
      $q.notify({ type: 'positive', message: 'Category updated successfully!' })
    } else {
      await categoriesStore.addCategory(categoryData)
      $q.notify({ type: 'positive', message: 'Category added successfully!' })
    }

    resetForm()
    showAddDialog.value = false
  } catch (error) {
    console.error('Error saving category:', error)
    $q.notify({ type: 'negative', message: 'Failed to save category' })
  }
}

function editCategory(category) {
  editingCategory.value = category
  form.value = {
    name: category.name,
    kind: category.kind,
    icon: category.icon,
    color: category.color,
    description: category.description || '',
    isShared: category.isShared || false,
    sharedWithUserIds: category.sharedWithUserIds || [],
  }
  showAddDialog.value = true
}

function resetForm() {
  form.value = {
    name: '',
    kind: 'expense',
    icon: '',
    color: '',
    description: '',
    isShared: false,
    sharedWithUserIds: [],
  }
  editingCategory.value = null
}

// Load data on mount
onMounted(async () => {
  // Check if user is authenticated
  if (!currentUser.value) {
    // Redirect to login if no user is logged in
    console.warn('No user logged in - categories require authentication')
    return
  }

  // Load categories
  await categoriesStore.loadCategories()
})
</script>

<style scoped>
/* Page Layout */
.q-page {
  background: #f8f9fa;
  min-height: 100vh;
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
.dialog-header {
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  max-height: 300px;
  overflow-y: auto;
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
