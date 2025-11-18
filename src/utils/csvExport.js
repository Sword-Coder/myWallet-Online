// src/utils/csvExport.js

/**
 * Format date to match the desired CSV format
 * @param {string} dateStr - YYYY-MM-DD format
 * @param {string} timeStr - HH:MM format
 * @returns {string} formatted date like "Oct 13, 2025 5:30 PM"
 */
export function formatDateForCSV(dateStr, timeStr) {
  // Parse the date and time
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)

  const date = new Date(year, month - 1, day, hours, minutes) // month is 0-indexed

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const monthName = months[date.getMonth()]
  const dayNum = date.getDate()
  const yearNum = date.getFullYear()

  let hours12 = date.getHours()
  const minutesStr = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours12 >= 12 ? 'PM' : 'AM'

  hours12 = hours12 % 12
  hours12 = hours12 ? hours12 : 12 // 0 should be 12

  return `${monthName} ${dayNum}, ${yearNum} ${hours12}:${minutesStr} ${ampm}`
}

/**
 * Format transaction type to match CSV format
 * @param {string} kind - transaction kind (income, expense, transfer)
 * @returns {string} formatted type like "(+) Income"
 */
export function formatTypeForCSV(kind) {
  const typeMap = {
    income: '(+) Income',
    expense: '(-) Expense',
    transfer: '(*) Transfer',
  }
  return typeMap[kind.toLowerCase()] || kind
}

/**
 * Format amount for CSV with 2 decimal places
 * @param {number} amount
 * @returns {string} formatted amount
 */
export function formatAmountForCSV(amount) {
  return Number(amount).toFixed(2)
}

/**
 * Get account name from walletId
 * @param {string} walletId
 * @param {Array} wallets
 * @returns {string} account name
 */
export function getAccountName(walletId, wallets) {
  if (!walletId) return 'Cash' // default account

  const wallet = wallets.find((w) => w._id === walletId)
  return wallet ? wallet.name : 'Cash'
}

/**
 * Generate CSV filename with timestamp
 * @returns {string} filename like "export_19_10_25_958.csv"
 */
export function generateCSVFilename() {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')

  return `export_${day}_${month}_${year}_${hours}${minutes}${seconds}.csv`
}

/**
 * Convert transactions to CSV format
 * @param {Array} transactions
 * @param {Array} wallets
 * @returns {string} CSV content
 */
export function convertToCSV(transactions, wallets) {
  const headers = ['TIME', 'TYPE', 'AMOUNT', 'CATEGORY', 'ACCOUNT', 'NOTES']

  const csvRows = [headers.join(',')]

  transactions.forEach((transaction) => {
    // Handle the date/time format correctly
    const time = formatDateForCSV(transaction.date, transaction.time)
    const type = formatTypeForCSV(transaction.kind)
    const amount = formatAmountForCSV(transaction.amount)
    const category = transaction.category || '  -  '
    const account = getAccountName(transaction.walletId, wallets)
    const notes = transaction.notes || ''

    const row = `"${time}","${type}","${amount}","${category}","${account}","${notes}"`
    csvRows.push(row)
  })

  return csvRows.join('\n')
}

/**
 * Download CSV file
 * @param {string} csvContent
 * @param {string} filename
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Main export function
 * @param {Array} transactions
 * @param {Array} wallets
 */
export function exportTransactions(transactions, wallets) {
  try {
    const csvContent = convertToCSV(transactions, wallets)
    const filename = generateCSVFilename()
    downloadCSV(csvContent, filename)
    return { success: true, filename }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: error.message }
  }
}
