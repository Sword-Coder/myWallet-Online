<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="text-h6 text-weight-bold q-mb-sm">Records</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <!-- Summary -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row justify-between items-center">
        <div class="text-center">
          <div class="text-caption text-grey">Income</div>
          <div class="text-positive text-h6">{{ incomeTotal }} PHP</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">Expense</div>
          <div class="text-negative text-h6">{{ expenseTotal }} PHP</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">Total</div>
          <div class="text-h6" :class="netTotal >= 0 ? 'text-primary' : 'text-negative'">
            {{ netTotal }} PHP
          </div>
        </div>
      </div>
    </q-card>

    <!-- Transaction List -->
    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="tx in transactions" :key="tx._id" flat bordered class="q-mb-sm">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="col-grow">
              <div class="text-subtitle2">{{ tx.category }}</div>
              <div class="text-caption text-grey">{{ tx.date }} – {{ tx.notes || 'No notes' }}</div>
            </div>
            <div
              :class="tx.kind === 'income' ? 'text-positive' : 'text-negative'"
              class="text-subtitle1"
            >
              {{ tx.kind === 'income' ? '+' : '-' }}{{ tx.amount }} PHP
            </div>
          </div>
        </q-card-section>
      </q-card>
    </transition-group>

    <!-- Floating Add Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="showAddDialog = true" />
    </q-page-sticky>

    <!-- Add Transaction Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add Transaction</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-select filled v-model="newTx.type" :options="['income', 'expense']" label="Type" />
          <q-input filled v-model="newTx.amount" label="Amount" type="number" />
          <q-input filled v-model="newTx.category" label="Category" />
          <q-input filled v-model="newTx.notes" label="Notes" />
          <q-input filled v-model="newTx.date" label="Date" type="date" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Add" color="primary" @click="addTransaction" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDatabase } from 'src/composables/useDatabase.js'

const { getAllDocs, saveDoc, localDB } = useDatabase()
const transactions = ref([])
const showAddDialog = ref(false)
const newTx = ref({
  type: 'expense',
  amount: 0,
  category: '',
  notes: '',
  date: new Date().toISOString().substring(0, 10),
})

async function loadTransactions() {
  const docs = await getAllDocs('transaction')
  transactions.value = docs.sort((a, b) => b.date.localeCompare(a.date))
}

// Sync changes live
localDB.changes({ since: 'now', live: true, include_docs: true }).on('change', loadTransactions)

onMounted(loadTransactions)

// Add new transaction
async function addTransaction() {
  await saveDoc({
    type: 'transaction',
    category: newTx.value.category,
    amount: Number(newTx.value.amount),
    notes: newTx.value.notes,
    date: newTx.value.date,
    kind: newTx.value.type,
  })
  showAddDialog.value = false
  newTx.value = {
    type: 'expense',
    amount: 0,
    category: '',
    notes: '',
    date: new Date().toISOString().substring(0, 10),
  }
}

// Current month label
const currentMonth = computed(() => {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
})

// Summary totals
const incomeTotal = computed(() =>
  transactions.value.filter((tx) => tx.kind === 'income').reduce((sum, tx) => sum + tx.amount, 0),
)

const expenseTotal = computed(() =>
  transactions.value.filter((tx) => tx.kind === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
)

const netTotal = computed(() => incomeTotal.value - expenseTotal.value)
</script>
