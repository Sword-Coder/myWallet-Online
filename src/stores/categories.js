// src/stores/categories.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])

  function loadCategories() {
    const saved = JSON.parse(localStorage.getItem('categories') || '[]')
    console.log('Loading categories from localStorage:', saved)

    if (saved.length === 0) {
      // Initialize with default categories including Faith Promise
      categories.value = [
        {
          _id: '1',
          name: 'Tithes',
          kind: 'expense',
          icon: 'volunteer_activism',
          color: 'red-5',
          description: 'Religious giving',
        },
        {
          _id: '2',
          name: 'Offerings',
          kind: 'expense',
          icon: 'local_offer',
          color: 'red-5',
          description: 'Church offerings',
        },
        {
          _id: '3',
          name: 'Groceries',
          kind: 'expense',
          icon: 'shopping_cart',
          color: 'red-5',
          description: 'Food and groceries',
        },
        {
          _id: '4',
          name: 'Salary',
          kind: 'income',
          icon: 'work',
          color: 'green-5',
          description: 'Employment income',
        },
        {
          _id: '5',
          name: 'Gifts/ Grants',
          kind: 'income',
          icon: 'card_giftcard',
          color: 'green-5',
          description: 'Gifts and grants',
        },
        {
          _id: '6',
          name: 'Faith Promise',
          kind: 'expense',
          icon: 'favorite',
          color: 'red-5',
          description: 'Missionary support',
        },
        {
          _id: '7',
          name: 'Transportation',
          kind: 'expense',
          icon: 'directions_car',
          color: 'red-5',
          description: 'Travel and transport',
        },
        {
          _id: '8',
          name: 'Utilities',
          kind: 'expense',
          icon: 'bolt',
          color: 'red-5',
          description: 'Bills and utilities',
        },
        {
          _id: '9',
          name: 'Entertainment',
          kind: 'expense',
          icon: 'movie',
          color: 'red-5',
          description: 'Movies and fun',
        },
        {
          _id: '10',
          name: 'Healthcare',
          kind: 'expense',
          icon: 'local_hospital',
          color: 'red-5',
          description: 'Medical expenses',
        },
      ]
      console.log('Initialized with default categories including Faith Promise:', categories.value)
      saveCategories()
    } else {
      categories.value = saved
      console.log('Loaded existing categories:', categories.value)

      // Ensure Faith Promise exists in case it was missing from old data
      const faithPromiseExists = categories.value.some((cat) => cat.name === 'Faith Promise')
      if (!faithPromiseExists) {
        categories.value.push({
          _id: new Date().toISOString(),
          name: 'Faith Promise',
          kind: 'expense',
          icon: 'favorite',
          color: 'red-5',
          description: 'Missionary support',
        })
        console.log('Added missing Faith Promise category')
        saveCategories()
      }
    }
  }

  function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories.value))
  }

  function addCategory(categoryData) {
    const {
      name,
      kind = 'expense',
      icon = 'category',
      color = 'grey-5',
      description = '',
    } = categoryData

    const exists = categories.value.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (exists) return false // Return false if category already exists

    categories.value.push({
      _id: new Date().toISOString(),
      name,
      kind,
      icon,
      color,
      description,
    })
    saveCategories()
    return true // Return true if category was added successfully
  }

  return {
    categories,
    loadCategories,
    saveCategories,
    addCategory,
  }
})
