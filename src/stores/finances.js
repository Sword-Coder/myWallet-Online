// src/stores/finances.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from 'src/composables/useDatabase'

export const useFinancesStore = defineStore('finances', () => {
  const { getAllDocs, localDB } = useDatabase()

  // 🪙 Reactive state
  const wallets = ref([])
  const transactions = ref([])

  // 🧾 Load all wallets and transactions
  async function loadAll() {
    try {
      wallets.value = await getAllDocs('wallet')
      transactions.value = await getAllDocs('transaction')
    } catch (err) {
      console.error('Failed to load data from DB:', err)
    }
  }

  // 💰 Add wallet
  async function addWallet(wallet) {
    const doc = {
      _id: `wallet_${Date.now()}`,
      type: 'wallet',
      ...wallet,
      updatedAt: new Date().toISOString(),
    }
    try {
      await localDB.put(doc)
      wallets.value.push(doc)
    } catch (err) {
      console.error('Error adding wallet:', err)
    }
  }

  // ➕ Add transaction
  async function addTransaction(tx) {
    const doc = {
      _id: tx._id || `transaction_${Date.now()}`,
      type: 'transaction',
      walletId: tx.walletId || tx.wallet_id || null,
      kind: tx.kind,
      amount: Number(tx.amount),
      category: tx.category || '',
      notes: tx.notes || '',
      date: tx.date || new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString(),
    }

    try {
      await localDB.put(doc)
      transactions.value.push(doc)
    } catch (err) {
      console.error('Error adding transaction:', err)
    }
  }

  // 🔁 Update wallet
  async function updateWallet(id, changes) {
    try {
      const existing = await localDB.get(id)
      const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() }
      await localDB.put(updated)
      const index = wallets.value.findIndex((w) => w._id === id)
      if (index !== -1) wallets.value[index] = updated
    } catch (err) {
      console.error('Error updating wallet:', err)
    }
  }

  // 🗑️ Delete transaction
  async function deleteTransaction(id) {
    try {
      const doc = await localDB.get(id)
      await localDB.remove(doc)
      transactions.value = transactions.value.filter((t) => t._id !== id)
    } catch (err) {
      console.error('Error deleting transaction:', err)
    }
  }

  // 🧩 Sync transactions manually
  async function setTransactions(list) {
    transactions.value = list
  }

  // 🧩 Sync wallets manually
  async function setWallets(list) {
    wallets.value = list
  }

  // 🌐 Listen to database changes (optional)
  function watchChanges() {
    localDB
      .changes({ since: 'now', live: true, include_docs: true })
      .on('change', async (change) => {
        if (change.doc.type === 'wallet') {
          await loadAll()
        } else if (change.doc.type === 'transaction') {
          await loadAll()
        }
      })
  }

  return {
    wallets,
    transactions,
    loadAll,
    addWallet,
    addTransaction,
    updateWallet,
    deleteTransaction,
    setTransactions,
    setWallets,
    watchChanges,
  }
})
