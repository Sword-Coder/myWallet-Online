// Budget Display Fix Script
// This script helps debug and fix the budget display issue

console.log('🔧 Budget Display Fix - Starting diagnostic...')

// Function to check budget and category data
async function diagnoseBudgetIssue() {
  console.log('=== BUDGET DIAGNOSTIC START ===')

  try {
    // Check if user is authenticated
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    console.log('👤 Current user:', currentUser._id)

    if (!currentUser._id) {
      console.log('❌ No user authenticated')
      return
    }

    // Check budgets in localStorage (if any)
    const budgetIds = currentUser.budgetIds || []
    console.log('📊 Budget IDs in user profile:', budgetIds.length)

    // Since we can't directly access the Vue stores from here,
    // let's check if we can find budget data in the PouchDB
    if (typeof PouchDB !== 'undefined') {
      const db = new PouchDB('finance_local')

      // Find all budgets for this user
      const budgets = await db.find({
        selector: {
          type: 'budget',
          userId: currentUser._id,
        },
      })

      console.log('💰 Found budgets:', budgets.docs.length)

      if (budgets.docs.length > 0) {
        const budget = budgets.docs[0]
        console.log('📋 Sample budget:', {
          _id: budget._id,
          categoryId: budget.categoryId,
          amount: budget.amount,
          budgetType: budget.budgetType,
        })

        // Find the category for this budget
        const categories = await db.find({
          selector: {
            type: 'category',
            _id: budget.categoryId,
          },
        })

        console.log('🏷️ Found category for budget:', categories.docs.length > 0)

        if (categories.docs.length > 0) {
          const category = categories.docs[0]
          console.log('✅ Category details:', {
            _id: category._id,
            name: category.name,
            kind: category.kind,
          })
        } else {
          console.log('❌ Category not found for budget! This is the issue.')
          console.log('Missing category ID:', budget.categoryId)
        }
      }
    }
  } catch (error) {
    console.error('❌ Diagnostic error:', error)
  }

  console.log('=== BUDGET DIAGNOSTIC END ===')
}

// Function to manually refresh budgets (simulated)
function simulateBudgetRefresh() {
  console.log('🔄 Simulating budget refresh...')

  // Check if we're in a Vue app context
  if (window.__VUE__) {
    console.log('✅ Vue app detected')

    // Try to access the budgets store (this might not work in all contexts)
    const budgetsStore = window.__VUE__.config.globalProperties.$pinia?._s.get('budgets')
    if (budgetsStore) {
      console.log('✅ Budgets store found')
      budgetsStore
        .loadBudgets()
        .then(() => {
          console.log('✅ Budgets refreshed manually')
        })
        .catch((err) => {
          console.error('❌ Budget refresh failed:', err)
        })
    } else {
      console.log('❌ Budgets store not accessible')
    }
  }

  // Fallback: just refresh the page after a delay
  setTimeout(() => {
    console.log('🔄 Refreshing page to reload budgets...')
    window.location.reload()
  }, 1000)
}

// Function to check localStorage data
function checkLocalStorageData() {
  console.log('💾 Checking localStorage data...')

  const keys = Object.keys(localStorage)
  console.log('localStorage keys:', keys)

  const currentUser = localStorage.getItem('currentUser')
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser)
      console.log('👤 User data:', {
        _id: user._id,
        name: user.name,
        email: user.email,
        budgetIds: user.budgetIds || [],
      })
    } catch (e) {
      console.log('❌ Failed to parse user data')
    }
  }

  // Check for any budget-related data
  keys.forEach((key) => {
    if (key.includes('budget') || key.includes('finance')) {
      console.log(`📊 Found budget-related key: ${key}`)
    }
  })
}

// Auto-run diagnostic on script load
diagnoseBudgetIssue()
checkLocalStorageData()

// Export functions for manual use
window.BudgetFix = {
  diagnose: diagnoseBudgetIssue,
  refresh: simulateBudgetRefresh,
  checkStorage: checkLocalStorageData,
}

console.log('✅ Budget Display Fix script loaded')
console.log('💡 Manual functions available:')
console.log('   - BudgetFix.diagnose() - Run full diagnostic')
console.log('   - BudgetFix.refresh() - Refresh budgets')
console.log('   - BudgetFix.checkStorage() - Check localStorage data')
console.log('')
console.log('🎯 Next steps:')
console.log('1. Open browser console (F12)')
console.log('2. Type: BudgetFix.diagnose()')
console.log('3. If category is missing, refresh the page')
console.log('4. Try BudgetFix.refresh() to manually reload budgets')
