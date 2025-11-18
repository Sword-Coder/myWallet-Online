// src/utils/pdfExport.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Format date for PDF display
 * @param {string} dateStr - YYYY-MM-DD format
 * @param {string} timeStr - HH:MM format
 * @returns {string} formatted date for PDF
 */
export function formatDateForPDF(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)

  const date = new Date(year, month - 1, day, hours, minutes)

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
  hours12 = hours12 ? hours12 : 12

  return `${monthName} ${dayNum}, ${yearNum} ${hours12}:${minutesStr} ${ampm}`
}

/**
 * Format transaction type for PDF
 * @param {string} kind - transaction kind (income, expense, transfer)
 * @returns {string} formatted type with color
 */
export function formatTypeForPDF(kind) {
  const typeMap = {
    income: { text: 'Income', color: [77, 147, 78] },
    expense: { text: 'Expense', color: [220, 53, 69] },
    transfer: { text: 'Transfer', color: [0, 123, 255] },
  }
  return typeMap[kind.toLowerCase()] || { text: kind, color: [0, 0, 0] }
}

/**
 * Format amount for PDF with currency symbol - compatible version
 * @param {number} amount
 * @returns {string} formatted amount
 */
export function formatAmountForPDF(amount) {
  const numAmount = Number(amount) || 0
  const formattedAmount = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Use "P" instead of ₱ symbol for better PDF compatibility
  return `P ${formattedAmount}`
}

/**
 * Get account name from walletId
 * @param {string} walletId
 * @param {Array} wallets
 * @returns {string} account name
 */
export function getAccountNameForPDF(walletId, wallets) {
  if (!walletId) return 'Cash'

  const wallet = wallets.find((w) => w._id === walletId)
  return wallet ? wallet.name : 'Cash'
}

/**
 * Truncate text to fit in PDF cell
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} truncated text
 */
export function truncateTextForPDF(text, maxLength = 30) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Generate PDF filename with timestamp
 * @returns {string} filename like "export_19_10_25_958.pdf"
 */
export function generatePDFFilename() {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')

  return `wallet_report_${day}_${month}_${year}_${hours}${minutes}${seconds}.pdf`
}

/**
 * Create beautifully formatted PDF report
 * @param {Array} transactions
 * @param {Array} wallets
 * @param {Object} userInfo - optional user info {name, email}
 * @returns {Object} { success: boolean, filename?: string, error?: string }
 */
export function exportToPDF(transactions, wallets, userInfo = {}) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4') // Portrait, millimeters, A4
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Add support for Unicode characters by setting font
    doc.setFont('helvetica')

    // Header with myWallet branding
    doc.setFillColor(77, 147, 78) // Primary green color
    doc.rect(0, 0, pageWidth, 25, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('myWallet', 15, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Financial Report', 15, 21)

    // Report generation info
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    doc.text(`Generated: ${currentDate}`, pageWidth - 15, 16, { align: 'right' })

    if (userInfo.name) {
      doc.text(`User: ${userInfo.name}`, pageWidth - 15, 21, { align: 'right' })
    }

    // Summary section
    let currentY = 35
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 15, currentY)

    currentY += 8

    // Calculate totals
    const incomeTotal = transactions
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const expenseTotal = transactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const netTotal = incomeTotal - expenseTotal

    // Summary data - ensure amounts are properly formatted
    const summaryData = [
      ['Income', formatAmountForPDF(incomeTotal)],
      ['Expenses', formatAmountForPDF(expenseTotal)],
      ['Net Total', formatAmountForPDF(netTotal)],
    ]

    // Create summary table with proper column widths
    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Category column
        1: { cellWidth: 35, halign: 'right' }, // Amount column - right aligned
      },
      margin: { left: 15, right: 15 },
      tableWidth: 75, // Ensure table fits
    })

    currentY = doc.lastAutoTable.finalY + 10

    // Transactions section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction History', 15, currentY)

    currentY += 8

    // Prepare table data with proper formatting
    const tableData = transactions.map((transaction) => {
      const dateTime = formatDateForPDF(transaction.date, transaction.time)
      const type = formatTypeForPDF(transaction.kind).text
      const amount = formatAmountForPDF(transaction.amount)
      const category = truncateTextForPDF(transaction.category || 'N/A', 15)
      const account = truncateTextForPDF(getAccountNameForPDF(transaction.walletId, wallets), 10)
      const notes = truncateTextForPDF(transaction.notes || '', 25) // Truncate notes to fit

      return [dateTime, type, amount, category, account, notes]
    })

    // Create transactions table with better column distribution
    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'Type', 'Amount', 'Category', 'Account', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [77, 147, 78],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 1,
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Date & Time
        1: { cellWidth: 20 }, // Type
        2: { cellWidth: 25 }, // Amount
        3: { cellWidth: 25 }, // Category
        4: { cellWidth: 20 }, // Account
        5: { cellWidth: 35 }, // Notes
      },
      styles: {
        overflow: 'linebreak', // Allow text to wrap within cells
        valign: 'top',
        minCellHeight: 6, // Ensure minimum cell height
      },
      margin: { left: 15, right: 15 },
      tableWidth: 160, // Ensure table fits within page
      didDrawCell: function (data) {
        // Color code transaction types
        if (data.column.index === 1 && data.section === 'body') {
          const transaction = transactions[data.row.index]
          const typeInfo = formatTypeForPDF(transaction.kind)
          doc.setTextColor(...typeInfo.color)
        }
      },
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Page ${i} of ${pageCount} | Generated by myWallet`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' },
      )
    }

    // Save the PDF
    const filename = generatePDFFilename()
    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('PDF export failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Export transactions as both CSV and PDF
 * @param {Array} transactions
 * @param {Array} wallets
 * @param {Object} userInfo - optional user info
 * @returns {Object} results for both exports
 */
export function exportBothFormats(transactions, wallets, userInfo = {}) {
  try {
    const results = {
      csv: { success: false },
      pdf: { success: false },
    }

    // Export CSV (using existing function)
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('./csvExport')
        .then(({ exportTransactions }) => {
          results.csv = exportTransactions(transactions, wallets)
        })
        .catch((err) => {
          console.error('CSV export failed:', err)
          results.csv = { success: false, error: err.message }
        })
    }

    // Export PDF
    results.pdf = exportToPDF(transactions, wallets, userInfo)

    return results
  } catch (error) {
    console.error('Export failed:', error)
    return {
      csv: { success: false, error: error.message },
      pdf: { success: false, error: error.message },
    }
  }
}
