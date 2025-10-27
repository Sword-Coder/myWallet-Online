// src/stores/wallets.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWalletsStore = defineStore('wallets', () => {
  const wallets = ref([])
  const activeWallet = ref(null)

  // function loadWallets() {
  //   const saved = JSON.parse(localStorage.getItem('wallets') || '[]')

  //   // ✅ If no wallets, create a default one
  //   if (saved.length === 0) {
  //     const defaultWallet = {
  //       _id: new Date().toISOString(),
  //       name: 'Default Wallet',
  //       balance: 0,
  //     }
  //     wallets.value = [defaultWallet]
  //     localStorage.setItem('wallets', JSON.stringify(wallets.value))
  //   } else {
  //     wallets.value = saved
  //   }

  //   // ✅ Always make sure activeWallet is set
  //   if (!activeWallet.value && wallets.value.length > 0) {
  //     activeWallet.value = wallets.value[0]._id
  //   }
  // }
  function loadWallets() {
    const saved = JSON.parse(localStorage.getItem('wallets') || '[]')
    wallets.value = saved
    if (!activeWallet.value && wallets.value.length > 0) {
      activeWallet.value = wallets.value[0]._id
    }
    return wallets.value
  }

  function saveWallets() {
    localStorage.setItem('wallets', JSON.stringify(wallets.value))
  }

  function addWallet(name, initialBalance = 0) {
    const newWallet = {
      _id: new Date().toISOString(),
      name,
      balance: initialBalance,
    }
    wallets.value.push(newWallet)
    saveWallets()

    // ✅ Set new wallet as active
    activeWallet.value = newWallet._id
  }

  function updateBalance(walletId, delta) {
    const wallet = wallets.value.find((w) => w._id === walletId)
    if (wallet) {
      wallet.balance += delta
      saveWallets()
    }
  }

  function setActiveWallet(id) {
    activeWallet.value = id
  }

  return {
    wallets,
    activeWallet,
    loadWallets,
    saveWallets,
    addWallet,
    updateBalance,
    setActiveWallet,
  }
})
