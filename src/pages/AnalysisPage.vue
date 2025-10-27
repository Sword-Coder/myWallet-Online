<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Spending Analysis</div>
        <div class="text-subtitle2 text-grey">{{ currentMonth }}</div>
      </div>

      <!-- Wallet Selector -->
      <q-select
        outlined
        dense
        v-model="activeWallet"
        :options="walletOptions"
        option-label="name"
        option-value="_id"
        label="Wallet"
        style="min-width: 160px"
        emit-value
        map-options
      />
    </div>

    <!-- Monthly Summary -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row justify-around text-center">
        <div>
          <div class="text-caption text-grey">Income</div>
          <div class="text-h6" style="color: #4d934e">{{ incomeTotal.toLocaleString() }} PHP</div>
        </div>
        <div>
          <div class="text-caption text-grey">Expense</div>
          <div class="text-h6" style="color: #dc3545">{{ expenseTotal.toLocaleString() }} PHP</div>
        </div>
        <div>
          <div class="text-caption text-grey">Total</div>
          <div class="text-h6" :style="{ color: netTotal >= 0 ? '#4d934e' : '#dc3545' }">
            {{ netTotal.toLocaleString() }} PHP
          </div>
        </div>
      </div>
    </q-card>

    <!-- Filter Row -->
    <div class="row q-gutter-sm q-mb-md items-center">
      <q-select
        dense
        outlined
        v-model="activeCategory"
        :options="categoryOptions"
        label="Category"
        style="min-width: 160px"
      />
      <q-input
        dense
        outlined
        v-model="dateRange"
        label="Date Range (MM/YYYY)"
        style="min-width: 180px"
      />

      <q-btn
        color="grey-7"
        icon="refresh"
        label="Clear Filters"
        flat
        dense
        class="q-ml-sm"
        @click="clearFilters"
      />
    </div>

    <!-- Chart Section -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- Expense Categories List -->
      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Expense Overview</div>

        <!-- Total Expense Summary -->
        <div class="text-center q-mb-lg">
          <div class="text-h6 text-weight-bold">{{ expenseTotal.toLocaleString() }} PHP</div>
          <div class="text-caption text-grey">Total Expenses</div>
        </div>

        <!-- Expense Categories List -->
        <div class="expense-categories-list">
          <div
            v-for="(amount, category) in spendingByCategory"
            :key="category"
            class="expense-category-item q-mb-md"
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">{{ category }}</div>
              <div class="expense-category-info">
                <span class="text-subtitle2 expense-amount">
                  -{{ amount.toLocaleString() }} PHP
                </span>
                <span class="text-caption text-grey q-ml-sm">
                  {{ ((amount / expenseTotal) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>

            <!-- Progress Bar -->
            <q-linear-progress
              :value="amount / expenseTotal"
              :color="getProgressColor((amount / expenseTotal) * 100)"
              size="8px"
              class="expense-progress-bar"
            />

            <!-- Progress Info -->
            <div class="row items-center justify-between q-mt-xs">
              <div class="text-caption text-grey">{{ amount.toLocaleString() }} PHP</div>
              <div class="text-caption text-grey">
                {{ ((amount / expenseTotal) * 100).toFixed(1) }}% of total
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="Object.keys(spendingByCategory).length === 0"
          class="text-center q-pa-lg text-grey"
        >
          <div class="q-mb-md">No expenses recorded yet.</div>
          <div class="text-caption">Add some expenses to see the breakdown here.</div>
        </div>
      </q-card>

      <!-- Spending vs Budget Bar Chart -->
      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle1 text-weight-medium q-mb-sm">Spending vs Budget</div>
        <div class="chart-container">
          <BarChart :data="barChartData" :options="chartOptions" />
        </div>
      </q-card>
    </div>

    <!-- Budget Overrun Calendar -->
    <q-card flat bordered class="q-pa-md q-mt-lg">
      <div class="text-subtitle1 text-weight-medium q-mb-md">Budget Overrun Calendar</div>
      <div class="calendar-container">
        <!-- Calendar Header -->
        <div class="calendar-header row items-center justify-between q-mb-md">
          <q-btn flat dense icon="chevron_left" @click="previousMonth" size="sm" />
          <div class="text-h6">{{ calendarMonth }}</div>
          <q-btn flat dense icon="chevron_right" @click="nextMonth" size="sm" />
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <!-- Days of week header -->
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-day-header text-center text-caption text-grey"
          >
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-day text-center q-pa-sm"
            :class="{
              'calendar-day-other-month': day.isOtherMonth,
              'calendar-day-today': day.isToday,
              'calendar-day-overrun': day.hasOverrun,
              'calendar-day-no-spending': !day.hasSpending,
            }"
            @click="showDayDetails(day)"
          >
            <div class="calendar-day-number">{{ day.day }}</div>
            <div v-if="day.hasSpending" class="calendar-day-indicator">
              <q-icon
                :name="day.hasOverrun ? 'warning' : 'check_circle'"
                :color="day.hasOverrun ? 'negative' : 'positive'"
                size="xs"
              />
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="calendar-legend row items-center justify-center q-mt-md q-gutter-sm">
          <div class="row items-center q-gutter-xs">
            <q-icon name="check_circle" color="positive" size="xs" />
            <span class="text-caption">Within Budget</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-icon name="warning" color="negative" size="xs" />
            <span class="text-caption">Over Budget</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div class="calendar-day-no-spending text-caption">No Spending</div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Summary -->
    <q-card flat bordered class="q-pa-md q-mt-lg">
      <div class="text-subtitle1 text-weight-medium q-mb-md">Summary</div>
      <div class="grid sm:grid-cols-3 gap-2">
        <div v-for="stat in summaryStats" :key="stat.label" class="text-center">
          <div class="text-h6 text-weight-bold">{{ stat.value }}</div>
          <div class="text-caption text-grey">{{ stat.label }}</div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFinancesStore } from 'src/stores/finances.js'
import { useWalletsStore } from 'src/stores/wallets.js'
import { storeToRefs } from 'pinia'

// ✅ Chart.js + Vue-ChartJS
import { Bar as BarChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale)

const store = useFinancesStore()
const walletsStore = useWalletsStore()
const { transactions, wallets } = storeToRefs(store)
const { activeWallet } = storeToRefs(walletsStore)
const activeCategory = ref('All')
const dateRange = ref('')
const budgets = ref([])

// 📅 Calendar state
const currentCalendarDate = ref(new Date())
const selectedDay = ref(null)

const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const walletOptions = computed(() => [{ name: 'All Wallets', _id: 'all' }, ...wallets.value])

// 💰 Income, Expense, Total calculations
const incomeTotal = computed(() =>
  transactions.value
    .filter((t) => {
      const matchWallet = !activeWallet.value || t.walletId === activeWallet.value
      return t.kind === 'income' && matchWallet
    })
    .reduce((sum, t) => sum + t.amount, 0),
)

const expenseTotal = computed(() =>
  transactions.value
    .filter((t) => {
      const matchWallet = !activeWallet.value || t.walletId === activeWallet.value
      return t.kind === 'expense' && matchWallet
    })
    .reduce((sum, t) => sum + t.amount, 0),
)

const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

// 🎨 Progress bar color based on percentage
function getProgressColor(percentage) {
  if (percentage <= 30) return 'positive' // Green for low percentage
  if (percentage <= 60) return 'warning' // Yellow for medium percentage
  if (percentage <= 80) return 'orange' // Orange for high percentage
  return 'negative' // Red for very high percentage
}

// 📅 Calendar computed properties
const calendarMonth = computed(() => {
  return currentCalendarDate.value.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarDays = computed(() => {
  const year = currentCalendarDate.value.getFullYear()
  const month = currentCalendarDate.value.getMonth()

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  // Start from Sunday of the first week
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const current = new Date(startDate)

  // Generate 42 days (6 weeks) for the calendar grid
  for (let i = 0; i < 42; i++) {
    const dayDate = new Date(current)
    const dayTransactions = getTransactionsForDate(dayDate)
    const daySpending = dayTransactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate daily budget (monthly budget / days in month)
    const daysInMonth = lastDay.getDate()
    let walletBudgets = []

    if (activeWallet.value === 'all') {
      // For 'all' wallets, group budgets by category and sum amounts
      const categoryBudgets = {}
      budgets.value.forEach((b) => {
        if (!categoryBudgets[b.category]) {
          categoryBudgets[b.category] = { category: b.category, amount: 0 }
        }
        categoryBudgets[b.category].amount += b.amount
      })
      walletBudgets = Object.values(categoryBudgets)
    } else {
      // For specific wallet, filter normally
      walletBudgets = budgets.value.filter((b) => b.wallet_id === activeWallet.value)
    }

    const totalMonthlyBudget = walletBudgets.reduce((sum, b) => sum + b.amount, 0)
    const dailyBudget = totalMonthlyBudget / daysInMonth

    const hasOverrun = daySpending > dailyBudget && daySpending > 0
    const isToday = isSameDay(dayDate, new Date())

    days.push({
      date: dayDate.toISOString().split('T')[0],
      day: dayDate.getDate(),
      isOtherMonth: dayDate.getMonth() !== month,
      isToday,
      hasSpending: daySpending > 0,
      hasOverrun,
      spending: daySpending,
      dailyBudget,
      transactions: dayTransactions,
    })

    current.setDate(current.getDate() + 1)
  }

  return days
})

// Helper functions for calendar
function getTransactionsForDate(date) {
  const dateStr = date.toISOString().split('T')[0]
  return transactions.value.filter((t) => {
    const transactionDate = t.date.split('T')[0]
    return transactionDate === dateStr && (!activeWallet.value || t.walletId === activeWallet.value)
  })
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function previousMonth() {
  currentCalendarDate.value = new Date(
    currentCalendarDate.value.getFullYear(),
    currentCalendarDate.value.getMonth() - 1,
    1,
  )
}

function nextMonth() {
  currentCalendarDate.value = new Date(
    currentCalendarDate.value.getFullYear(),
    currentCalendarDate.value.getMonth() + 1,
    1,
  )
}

function showDayDetails(day) {
  selectedDay.value = day
  // You can add a dialog here to show detailed transactions for the selected day
  console.log('Selected day:', day)
}
const categoryOptions = computed(() => {
  const cats = [...new Set(transactions.value.map((t) => t.category))]
  return ['All', ...cats]
})

// 🔄 Load budgets + persisted filters
function loadBudgets() {
  budgets.value = JSON.parse(localStorage.getItem('budgets') || '[]')

  const savedFilters = JSON.parse(localStorage.getItem('analysisFilters') || '{}')
  // Default to 'all' wallets for analysis, but respect saved preference
  if (!activeWallet.value) {
    activeWallet.value = savedFilters.wallet || 'all'
  }
  activeCategory.value = savedFilters.category || 'All'
  dateRange.value = savedFilters.range || ''
}

// 💾 Persist filters locally
watch([activeWallet, activeCategory, dateRange], ([wallet, category, range]) => {
  localStorage.setItem('analysisFilters', JSON.stringify({ wallet, category, range }))
})

// 🧹 Clear filters
function clearFilters() {
  localStorage.removeItem('analysisFilters')
  // Default to 'all' wallets for analysis
  activeWallet.value = 'all'
  activeCategory.value = 'All'
  dateRange.value = ''
}

// 💰 Spending by category (filtered)
const spendingByCategory = computed(() => {
  return transactions.value
    .filter((t) => {
      const matchWallet = !activeWallet.value || t.walletId === activeWallet.value
      const matchCategory = activeCategory.value === 'All' || t.category === activeCategory.value
      const matchDate =
        !dateRange.value ||
        new Date(t.date).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }) ===
          dateRange.value
      return t.kind === 'expense' && matchWallet && matchCategory && matchDate
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
})

// 📊 Chart Data (Bar)
const chartData = computed(() => {
  let walletBudgets = []

  if (activeWallet.value === 'all') {
    // For 'all' wallets, group budgets by category and sum amounts
    const categoryBudgets = {}
    budgets.value.forEach((b) => {
      if (!categoryBudgets[b.category]) {
        categoryBudgets[b.category] = { category: b.category, amount: 0 }
      }
      categoryBudgets[b.category].amount += b.amount
    })
    walletBudgets = Object.values(categoryBudgets)
  } else {
    // For specific wallet, filter normally
    walletBudgets = budgets.value.filter((b) => b.wallet_id === activeWallet.value)
  }

  return walletBudgets.map((b) => ({
    category: b.category,
    budget: b.amount,
    spent: spendingByCategory.value[b.category] || 0,
  }))
})

const barChartData = computed(() => ({
  labels: chartData.value.map((d) => d.category),
  datasets: [
    {
      label: 'Spent',
      backgroundColor: '#42A5F5',
      data: chartData.value.map((d) => d.spent),
    },
    {
      label: 'Budget',
      backgroundColor: '#9CCC65',
      data: chartData.value.map((d) => d.budget),
    },
  ],
}))

// 📈 Summary stats
const summaryStats = computed(() => {
  const totalBudget = chartData.value.reduce((s, b) => s + b.budget, 0)
  const totalSpent = chartData.value.reduce((s, b) => s + b.spent, 0)
  const remaining = Math.max(totalBudget - totalSpent, 0)

  return [
    { label: 'Total Budget', value: `${totalBudget.toLocaleString()} PHP` },
    { label: 'Total Spent', value: `${totalSpent.toLocaleString()} PHP` },
    { label: 'Remaining', value: `${remaining.toLocaleString()} PHP` },
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
}

onMounted(async () => {
  await Promise.all([store.loadAll(), walletsStore.loadWallets()])
  loadBudgets()
})
</script>

<style scoped>
.grid {
  display: grid;
}
.chart-container {
  position: relative;
  height: 220px; /* ✅ Adjust this value to control chart size */
  width: 100%;
}

@media (max-width: 768px) {
  .chart-container {
    height: 180px; /* smaller height for mobile */
  }
}

/* Calendar Styles */
.calendar-container {
  max-width: 100%;
}

.calendar-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day-header {
  padding: 8px 4px;
  font-weight: 500;
}

.calendar-day {
  min-height: 60px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.calendar-day:hover {
  background-color: #f8f9fa;
  border-color: #42a5f5;
}

.calendar-day-other-month {
  opacity: 0.3;
  cursor: default;
}

.calendar-day-today {
  background-color: #e3f2fd;
  border-color: #42a5f5;
  font-weight: bold;
}

.calendar-day-overrun {
  border-color: #dc3545;
  background-color: #ffebee;
}

.calendar-day-no-spending {
  opacity: 0.5;
}

.calendar-day-number {
  font-size: 14px;
  margin-bottom: 4px;
}

.calendar-day-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.calendar-legend {
  padding: 8px 0;
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 50px;
  }

  .calendar-day-number {
    font-size: 12px;
  }

  .calendar-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .calendar-legend .row {
    margin-bottom: 2px;
  }
}

/* Expense Categories List Styles */
.expense-categories-list {
  max-width: 100%;
}

.expense-category-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.expense-category-item:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.expense-category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-amount {
  font-weight: 600;
  color: #dc3545; /* Expense red color */
}

.expense-progress-bar {
  border-radius: 4px;
  margin: 8px 0;
}

/* Progress bar color overrides */
.expense-progress-bar :deep(.q-linear-progress__track) {
  border-radius: 4px;
}

.expense-progress-bar :deep(.q-linear-progress__model) {
  border-radius: 4px;
}

/* Additional responsive improvements */
@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .expense-category-item {
    padding: 8px;
  }

  .expense-category-info {
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .expense-amount {
    font-size: 0.9rem;
  }
}
</style>
