// Budget Category Fix
// This script specifically fixes the category display issue

console.log('🏷️ Budget Category Fix - Starting...')

// Enhanced category name resolver
function getCategoryNameEnhanced(categoryId, categories) {
  console.log('🔍 Looking for category:', categoryId)
  console.log('📋 Available categories:', categories?.length || 0)

  if (!categoryId) {
    console.log('❌ No categoryId provided')
    return 'No Category'
  }

  if (!categories || !Array.isArray(categories)) {
    console.log('❌ Categories not loaded or not an array')
    return 'Loading...'
  }

  const category = categories.find((c) => c._id === categoryId)

  if (category) {
    console.log('✅ Found category:', category.name)
    return category.name
  } else {
    console.log('❌ Category not found, showing ID')
    // Return a shortened version of the ID for debugging
    return `Category (${categoryId.substring(0, 8)}...)`
  }
}

// Function to manually load categories and budgets
async function loadBudgetData() {
  console.log('📊 Manually loading budget data...')

  try {
    // Check current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    console.log('👤 Current user:', currentUser._id)

    if (!currentUser._id) {
      console.log('❌ No user authenticated')
      return
    }

    // Try to access stores if available
    if (window.$pinia) {
      const budgetsStore = window.$pinia._s.get('budgets')
      const categoriesStore = window.$pinia._s.get('categories')

      if (budgetsStore) {
        console.log('✅ Budgets store found, loading...')
        await budgetsStore.loadBudgets()
        console.log('✅ Budgets loaded')
      }

      if (categoriesStore) {
        console.log('✅ Categories store found, loading...')
        await categoriesStore.loadCategories()
        console.log('✅ Categories loaded')
      }
    }

    // Check PouchDB directly
    if (typeof PouchDB !== 'undefined') {
      const db = new PouchDB('finance_local')

      // Load categories first
      const categoriesResult = await db.find({
        selector: { type: 'category' },
      })
      console.log('🏷️ Categories from DB:', categoriesResult.docs.length)

      // Load budgets
      const budgetsResult = await db.find({
        selector: {
          type: 'budget',
          userId: currentUser._id,
        },
      })
      console.log('💰 Budgets from DB:', budgetsResult.docs.length)

      // Show budget-category mapping
      budgetsResult.docs.forEach((budget) => {
        const category = categoriesResult.docs.find((c) => c._id === budget.categoryId)
        console.log(
          `📋 Budget ${budget._id.substring(0, 8)}... -> Category: ${category ? category.name : 'NOT FOUND'}`,
        )
      })
    }
  } catch (error) {
    console.error('❌ Error loading budget data:', error)
  }
}

// Function to fix budget display
function fixBudgetDisplay() {
  console.log('🔧 Fixing budget display...')

  // Force page reload after a short delay
  setTimeout(() => {
    console.log('🔄 Reloading page to refresh all data...')
    window.location.reload()
  }, 500)
}

// Export functions
window.CategoryFix = {
  getName: getCategoryNameEnhanced,
  loadData: loadBudgetData,
  fix: fixBudgetDisplay,
}

console.log('✅ Budget Category Fix loaded')
console.log('💡 Available functions:')
console.log('   - CategoryFix.getName(categoryId, categories)')
console.log('   - CategoryFix.loadData() - Load budget data manually')
console.log('   - CategoryFix.fix() - Reload page to fix display')
console.log('')
console.log('🎯 To debug your budget:')
console.log('1. Open browser console (F12)')
console.log('2. Type: CategoryFix.loadData()')
console.log('3. Check the output for category mapping')
console.log('4. If category is missing, type: CategoryFix.fix()')
