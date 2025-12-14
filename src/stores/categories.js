// src/stores/categories.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDatabase } from 'src/composables/useDatabase'
import { useUsersStore } from 'src/stores/users'
import { generateId } from 'src/utils/schemas'

export const useCategoriesStore = defineStore('categories', () => {
  const { getUserCategories, saveDoc } = useDatabase()
  const usersStore = useUsersStore()

  // State
  const categories = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Load categories for current user
  async function loadCategories() {
    if (!usersStore.currentUser) {
      console.warn('No user logged in, cannot load categories')
      categories.value = []
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const userCategories = await getUserCategories(usersStore.currentUser._id)
      categories.value = userCategories
      console.log('Loaded categories:', userCategories.length)
    } catch (err) {
      error.value = err.message
      console.error('Failed to load categories:', err)
      categories.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Add new category
  async function addCategory(categoryData) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      // Check if category already exists
      const exists = categories.value.find(
        (c) => c.name.toLowerCase() === categoryData.name.toLowerCase(),
      )
      if (exists) {
        throw new Error('Category already exists')
      }

      const newCategory = {
        _id: generateId('category'),
        type: 'category',
        name: categoryData.name,
        kind: categoryData.kind || 'expense',
        icon: categoryData.icon || 'category',
        color: categoryData.color || (categoryData.kind === 'expense' ? 'red-5' : 'green-5'),
        description: categoryData.description || `${categoryData.kind} category`,
        isShared: categoryData.isShared !== undefined ? categoryData.isShared : true,
        createdByUserId: usersStore.currentUser._id,
        sharedWithUserIds: categoryData.sharedWithUserIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(newCategory)
      categories.value.push(newCategory)

      console.log('Category added:', newCategory.name)
      return newCategory
    } catch (err) {
      error.value = err.message
      console.error('Failed to add category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update category
  async function updateCategory(categoryId, updates) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const categoryIndex = categories.value.findIndex((c) => c._id === categoryId)
      if (categoryIndex === -1) {
        throw new Error('Category not found')
      }

      const updatedCategory = {
        ...categories.value[categoryIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await saveDoc(updatedCategory)
      categories.value[categoryIndex] = updatedCategory

      console.log('Category updated:', updatedCategory.name)
      return updatedCategory
    } catch (err) {
      error.value = err.message
      console.error('Failed to update category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete category
  async function deleteCategory(categoryId) {
    if (!usersStore.currentUser) {
      throw new Error('No user logged in')
    }

    isLoading.value = true
    error.value = null

    try {
      const category = categories.value.find((c) => c._id === categoryId)
      if (!category) {
        throw new Error('Category not found')
      }

      // Check if category is being used in transactions
      // This would need to be implemented with transaction checking
      // For now, we'll just remove it

      await saveDoc({ ...category, _deleted: true })
      categories.value = categories.value.filter((c) => c._id !== categoryId)

      console.log('Category deleted:', category.name)
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get categories by type
  function getCategoriesByType(type) {
    return categories.value.filter((c) => c.kind === type)
  }

  // Get expense categories
  const expenseCategories = computed(() => categories.value.filter((c) => c.kind === 'expense'))

  // Get income categories
  const incomeCategories = computed(() => categories.value.filter((c) => c.kind === 'income'))

  // Find category by ID
  function getCategoryById(categoryId) {
    return categories.value.find((c) => c._id === categoryId)
  }

  // Find category by name
  function getCategoryByName(name) {
    return categories.value.find((c) => c.name.toLowerCase() === name.toLowerCase())
  }

  // Initialize with default categories if none exist
  async function initializeDefaultCategories() {
    if (categories.value.length === 0 && usersStore.currentUser) {
      const defaultCategories = [
        {
          name: 'Tithes',
          kind: 'expense',
          icon: 'volunteer_activism',
          color: 'red-5',
          description: 'Religious giving - 10% of income',
          isShared: true,
        },
        {
          name: 'Offerings',
          kind: 'expense',
          icon: 'local_offer',
          color: 'red-5',
          description: 'Church offerings and donations',
          isShared: true,
        },
        {
          name: 'Faith Promise',
          kind: 'expense',
          icon: 'favorite',
          color: 'red-5',
          description: 'Missionary support and faith promises',
          isShared: true,
        },
        {
          name: 'Groceries',
          kind: 'expense',
          icon: 'shopping_cart',
          color: 'red-5',
          description: 'Food and groceries',
          isShared: true,
        },
        {
          name: 'Transportation',
          kind: 'expense',
          icon: 'directions_car',
          color: 'red-5',
          description: 'Travel and transport expenses',
          isShared: true,
        },
        {
          name: 'Utilities',
          kind: 'expense',
          icon: 'bolt',
          color: 'red-5',
          description: 'Bills and utilities',
          isShared: true,
        },
        {
          name: 'Entertainment',
          kind: 'expense',
          icon: 'movie',
          color: 'red-5',
          description: 'Movies, fun, and entertainment',
          isShared: true,
        },
        {
          name: 'Healthcare',
          kind: 'expense',
          icon: 'local_hospital',
          color: 'red-5',
          description: 'Medical expenses and healthcare',
          isShared: true,
        },
        {
          name: 'Salary',
          kind: 'income',
          icon: 'work',
          color: 'green-5',
          description: 'Employment income and salary',
          isShared: true,
        },
        {
          name: 'Gifts/Grants',
          kind: 'income',
          icon: 'card_giftcard',
          color: 'green-5',
          description: 'Gifts, grants, and other income',
          isShared: true,
        },
      ]

      // Add all default categories
      for (const categoryData of defaultCategories) {
        try {
          await addCategory(categoryData)
        } catch (err) {
          console.warn('Failed to add default category:', categoryData.name, err)
        }
      }
    }
  }

  // Watch for user changes
  function watchUserChanges() {
    // Watch for current user changes
    watch(
      () => usersStore.currentUser,
      (newUser) => {
        if (newUser) {
          loadCategories()
        } else {
          categories.value = []
        }
      },
      { immediate: true },
    )
  }

  return {
    // State
    categories,
    isLoading,
    error,

    // Computed
    expenseCategories,
    incomeCategories,

    // Methods
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getCategoryById,
    getCategoryByName,
    initializeDefaultCategories,
    watchUserChanges,
  }
})
