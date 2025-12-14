// src/utils/schemas.js
// Data validation schemas for the new user-centric structure

/**
 * Generate UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate ID with type prefix
 */
export function generateId(type) {
  return `${type}_${generateUUID()}`
}

/**
 * Schema definitions for data validation
 */
export const schemas = {
  user: {
    required: [
      '_id',
      'type',
      'email',
      'name',
      'password',
      'walletId',
      'categoryIds',
      'transactionIds',
      'budgetIds',
    ],
    optional: [
      'provider',
      'emailVerified',
      'sharedWithUserIds',
      'sharedWalletIds',
      'isSharingEnabled',
      'sharingStatus',
      'createdAt',
      'updatedAt',
      'lastSyncAt',
    ],
    type: 'user',
  },

  wallet: {
    required: ['_id', 'type', 'ownerUserId', 'name', 'balance', 'walletType'],
    optional: [
      'sharedWithUserIds',
      'sharedWithWalletIds',
      'currency',
      'icon',
      'createdAt',
      'updatedAt',
    ],
    type: 'wallet',
  },

  category: {
    required: ['_id', 'type', 'name', 'kind', 'isShared', 'createdByUserId'],
    optional: ['icon', 'color', 'description', 'sharedWithUserIds', 'createdAt', 'updatedAt'],
    type: 'category',
  },

  transaction: {
    required: ['_id', 'type', 'walletId', 'userId', 'kind', 'amount', 'categoryId', 'datetime'],
    optional: ['notes', 'tags', 'splitPayment', 'createdAt', 'updatedAt'],
    type: 'transaction',
  },

  budget: {
    required: ['_id', 'type', 'userId', 'categoryId', 'budgetType', 'periodStart', 'periodEnd'],
    optional: [
      'amount',
      'percent',
      'spent',
      'isShared',
      'sharedWithUserIds',
      'createdAt',
      'updatedAt',
    ],
    type: 'budget',
  },
}

/**
 * Validate document against schema
 */
export function validateDocument(doc, schemaName) {
  const schema = schemas[schemaName]
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName}`)
  }

  const errors = []

  // Check required fields
  schema.required.forEach((field) => {
    if (!(field in doc) || doc[field] === null || doc[field] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Check type consistency
  if (doc.type !== schema.type) {
    errors.push(`Invalid type: expected ${schema.type}, got ${doc.type}`)
  }

  // Additional validations
  switch (schemaName) {
    case 'user':
      if (doc.email && !isValidEmail(doc.email)) {
        errors.push('Invalid email format')
      }
      if (doc.sharedWithUserIds && !Array.isArray(doc.sharedWithUserIds)) {
        errors.push('sharedWithUserIds must be an array')
      }
      break

    case 'transaction':
      if (typeof doc.amount !== 'number' || doc.amount < 0) {
        errors.push('Amount must be a positive number')
      }
      if (!['income', 'expense', 'transfer'].includes(doc.kind)) {
        errors.push('Invalid transaction kind')
      }
      break

    case 'budget':
      if (doc.amount && (typeof doc.amount !== 'number' || doc.amount < 0)) {
        errors.push('Budget amount must be a positive number')
      }
      if (
        doc.percent &&
        (typeof doc.percent !== 'number' || doc.percent < 0 || doc.percent > 100)
      ) {
        errors.push('Budget percent must be between 0 and 100')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Create default categories for new user
 */
export function createDefaultCategories(userId) {
  const categories = [
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Tithes',
      kind: 'expense',
      icon: 'volunteer_activism',
      color: 'red-5',
      description: 'Religious giving - 10% of income',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Offerings',
      kind: 'expense',
      icon: 'local_offer',
      color: 'red-5',
      description: 'Church offerings and donations',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Faith Promise',
      kind: 'expense',
      icon: 'favorite',
      color: 'red-5',
      description: 'Missionary support and faith promises',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Groceries',
      kind: 'expense',
      icon: 'shopping_cart',
      color: 'red-5',
      description: 'Food and groceries',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Transportation',
      kind: 'expense',
      icon: 'directions_car',
      color: 'red-5',
      description: 'Travel and transport expenses',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Utilities',
      kind: 'expense',
      icon: 'bolt',
      color: 'red-5',
      description: 'Bills and utilities',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Entertainment',
      kind: 'expense',
      icon: 'movie',
      color: 'red-5',
      description: 'Movies, fun, and entertainment',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Healthcare',
      kind: 'expense',
      icon: 'local_hospital',
      color: 'red-5',
      description: 'Medical expenses and healthcare',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Salary',
      kind: 'income',
      icon: 'work',
      color: 'green-5',
      description: 'Employment income and salary',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId('category'),
      type: 'category',
      name: 'Gifts/Grants',
      kind: 'income',
      icon: 'card_giftcard',
      color: 'green-5',
      description: 'Gifts, grants, and other income',
      isShared: true,
      createdByUserId: userId,
      sharedWithUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  return categories
}

/**
 * Create default budget structures for new user
 */
export function createDefaultBudgets(userId, categoryIds) {
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const budgets = [
    // Find category IDs by name
    {
      categoryName: 'Groceries',
      amount: 3000,
      type: 'fixed',
    },
    {
      categoryName: 'Transportation',
      amount: 1500,
      type: 'fixed',
    },
    {
      categoryName: 'Utilities',
      amount: 2500,
      type: 'fixed',
    },
    {
      categoryName: 'Tithes',
      amount: 10, // 10% of income
      type: 'percentage',
    },
  ]

  return budgets.map((budget) => {
    const categoryId = categoryIds[0] // Placeholder - will be properly linked later

    return {
      _id: generateId('budget'),
      type: 'budget',
      userId: userId,
      categoryId: categoryId || 'placeholder',
      budgetType: 'monthly',
      amount: budget.type === 'fixed' ? budget.amount : 0,
      percent: budget.type === 'percentage' ? budget.amount : 0,
      spent: 0,
      isShared: false,
      sharedWithUserIds: [],
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize document before saving
 */
export function sanitizeDocument(doc, schemaName) {
  const schema = schemas[schemaName]
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName}`)
  }

  const sanitized = { ...doc }

  // Ensure required fields exist
  schema.required.forEach((field) => {
    if (!(field in sanitized)) {
      throw new Error(`Missing required field: ${field}`)
    }
  })

  // Set defaults for optional fields
  schema.optional.forEach((field) => {
    if (!(field in sanitized)) {
      switch (field) {
        case 'createdAt':
        case 'updatedAt':
        case 'lastSyncAt':
          sanitized[field] = new Date().toISOString()
          break
        case 'sharedWithUserIds':
        case 'sharedWithWalletIds':
          sanitized[field] = []
          break
        case 'isSharingEnabled':
          sanitized[field] = true
          break
        case 'sharingStatus':
          sanitized[field] = 'single'
          break
        case 'currency':
          sanitized[field] = 'USD'
          break
        case 'icon':
          sanitized[field] = 'category'
          break
        case 'color':
          sanitized[field] =
            schemaName === 'category'
              ? sanitized.kind === 'expense'
                ? 'red-5'
                : 'green-5'
              : 'grey-5'
          break
        case 'description':
          sanitized[field] = `${schemaName} description`
          break
        case 'tags':
          sanitized[field] = []
          break
        case 'splitPayment':
          sanitized[field] = { isSplit: false, splitDetails: {} }
          break
      }
    }
  })

  // Add timestamps
  sanitized.updatedAt = new Date().toISOString()
  if (!sanitized.createdAt) {
    sanitized.createdAt = new Date().toISOString()
  }

  return sanitized
}
