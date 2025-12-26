// Simple script to delete the specific budget causing the issue
// Run this in your browser console on the MyWallet app

;(async function deleteBudgetAndRefresh() {
  try {
    console.log('🔍 Looking for budget records...')

    // This assumes PouchDB is available (it should be in MyWallet)
    const db = new PouchDB('mywallet')
    const result = await db.allDocs({ include_docs: true })

    // Find budget records
    const budgets = result.rows.filter((row) => row.doc._id.startsWith('budget_'))

    console.log(
      `Found ${budgets.length} budget(s):`,
      budgets.map((b) => ({
        id: b.doc._id,
        amount: b.doc.amount,
        categoryId: b.doc.categoryId,
      })),
    )

    if (budgets.length > 0) {
      const confirmDelete = confirm(
        `Found ${budgets.length} budget(s). Delete them all to restore your balance to ₱1,530?`,
      )

      if (confirmDelete) {
        console.log('🗑️ Deleting budgets...')

        for (let row of budgets) {
          await db.remove(row.doc)
          console.log('✅ Deleted budget:', row.doc._id)
        }

        console.log('🎉 All budgets deleted! Refreshing data...')

        // Try to refresh the page or trigger a data reload
        if (window.location.reload) {
          window.location.reload()
        } else {
          console.log('Please refresh the page manually to see updated balances.')
        }
      }
    } else {
      console.log('✅ No budgets found! Your balance should already be correct.')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    alert('Error: ' + error.message)
  }
})()
