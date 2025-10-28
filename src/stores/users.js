import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from 'src/composables/useDatabase'
import CryptoJS from 'crypto-js'

export const useUsersStore = defineStore('users', () => {
  const { getAllDocs, saveDoc } = useDatabase()
  const users = ref([])

  async function loadUsers() {
    try {
      users.value = await getAllDocs('user')
    } catch (error) {
      console.error('Failed to load users:', error)
      users.value = []
    }
  }

  async function findUserByEmail(email) {
    await loadUsers()
    return users.value.find((user) => user.email === email)
  }

  async function createUser(userData) {
    const user = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      email: userData.email,
      name: userData.name || '',
      password: userData.password ? CryptoJS.SHA256(userData.password).toString() : null,
      provider: userData.provider || 'traditional',
      emailVerified: userData.emailVerified || false,
      createdAt: new Date().toISOString(),
      wallets: [],
      categories: [],
      transactions: [],
      budgets: [],
    }

    await saveDoc(user)
    await loadUsers()
    return user
  }

  async function verifyPassword(plainPassword, hashedPassword) {
    const hashedInput = CryptoJS.SHA256(plainPassword).toString()
    return hashedInput === hashedPassword
  }

  async function updateUser(userId, updates) {
    const user = users.value.find((u) => u._id === userId)
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }
      await saveDoc(updatedUser)
      await loadUsers()
      return updatedUser
    }
    throw new Error('User not found')
  }

  return {
    users,
    loadUsers,
    findUserByEmail,
    createUser,
    verifyPassword,
    updateUser,
  }
})
