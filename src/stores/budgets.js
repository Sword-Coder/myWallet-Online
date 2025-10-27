// src/stores/budgets.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBudgetsStore = defineStore('budgets', () => {
  const budgets = ref([])

  function loadBudgets() {
    const saved = JSON.parse(localStorage.getItem('budgets') || '[]')
    budgets.value = saved
    return budgets.value
  }

  function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets.value))
  }

  function addBudget(budget) {
    const newBudget = {
      _id: budget._id || new Date().toISOString(),
      wallet_id: budget.wallet_id,
      category: budget.category,
      type: budget.type,
      amount: budget.type === 'fixed' ? budget.amount : 0,
      percent: budget.type === 'percentage' ? budget.percent : 0,
      spent: budget.spent || 0,
    }
    budgets.value.push(newBudget)
    saveBudgets()
  }

  function updateBudget(id, updates) {
    const index = budgets.value.findIndex((b) => b._id === id)
    if (index !== -1) {
      budgets.value[index] = { ...budgets.value[index], ...updates }
      saveBudgets()
    }
  }

  function deleteBudget(id) {
    budgets.value = budgets.value.filter((b) => b._id !== id)
    saveBudgets()
  }

  function getBudgetsByWallet(walletId) {
    return budgets.value.filter((b) => b.wallet_id === walletId)
  }

  return {
    budgets,
    loadBudgets,
    saveBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetsByWallet,
  }
})
