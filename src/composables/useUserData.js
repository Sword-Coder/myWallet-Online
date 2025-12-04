import { useDatabase } from './useDatabase'

export function useUserData() {
  const { saveDoc } = useDatabase()

  async function initializeUserData(userId) {
    // Create default wallet
    const defaultWallet = {
      _id: `wallet_${Date.now()}_default`,
      type: 'wallet',
      userId: userId,
      name: 'My Wallet',
      balance: 0,
      currency: 'PHP',
      createdAt: new Date().toISOString(),
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', type: 'expense' },
      { name: 'Transportation', icon: 'directions_car', color: '#4ECDC4', type: 'expense' },
      { name: 'Shopping', icon: 'shopping_cart', color: '#45B7D1', type: 'expense' },
      { name: 'Entertainment', icon: 'movie', color: '#96CEB4', type: 'expense' },
      { name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7', type: 'expense' },
      { name: 'Healthcare', icon: 'local_hospital', color: '#DDA0DD', type: 'expense' },
      { name: 'Education', icon: 'school', color: '#98D8C8', type: 'expense' },
      { name: 'Salary', icon: 'work', color: '#6BCF7F', type: 'income' },
      { name: 'Freelance', icon: 'computer', color: '#4ECDC4', type: 'income' },
      { name: 'Investment', icon: 'trending_up', color: '#45B7D1', type: 'income' },
    ].map((cat, index) => ({
      _id: `category_${Date.now()}_${index}`,
      type: 'category',
      userId: userId,
      ...cat,
      createdAt: new Date().toISOString(),
    }))

    // Save all default data
    await saveDoc(defaultWallet)
    for (const category of defaultCategories) {
      await saveDoc(category)
    }

    return {
      wallet: defaultWallet,
      categories: defaultCategories,
    }
  }

  return {
    initializeUserData,
  }
}
