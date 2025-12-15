// Add this code to BudgetsPage.vue to fix the timing issue

// Add after the other refs
const budgetsLoaded = ref(false)

// Modify the filteredBudgets computed to include budgetsLoaded
const filteredBudgets = computed(() => {
  // Debug logging
  console.log('filteredBudgets computed called:', {
    selectedWallet: selectedWallet.value,
    budgetsLength: budgets.value?.length || 0,
    budgets: budgets.value,
    budgetsLoaded: budgetsLoaded.value,
  })

  // Always return all budgets for now (user-based, not wallet-based)
  const result = budgets.value || []
  console.log('filteredBudgets result:', result.length, 'budgets')
  console.log('Actual budgets array:', result)
  console.log('Sample budget data:', result[0])

  return result
})

// Add this watch to set budgetsLoaded when budgets change
watch(
  budgets,
  (newBudgets, oldBudgets) => {
    console.log('Budgets changed:', {
      newLength: newBudgets?.length || 0,
      oldLength: oldBudgets?.length || 0,
    })
    budgetsLoaded.value = true
  },
  { immediate: true },
)

// In the onMounted section, after loadBudgets(), add:
// budgetsLoaded.value = true
