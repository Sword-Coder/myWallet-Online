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

  // Load all data
  await Promise.all([
    financesStore.loadAll(),
    categoriesStore.loadCategories(),
    budgetsStore.loadBudgets(),
  ])

  // Load expected tithes
  await loadExpectedTithes()

  // Set default wallet
  if (wallets.length > 0) {
    selectedWallet.value = wallets[0]._id
  }

  console.log('BudgetsPage: Initialization complete')

  // Force UI refresh after budgets are loaded
  setTimeout(() => {
    console.log('Forcing UI refresh - budgets should now be loaded')
    console.log('Budgets after timeout:', budgets.value?.length || 0)
  }, 100)
})
