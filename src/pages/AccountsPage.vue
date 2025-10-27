<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="text-h6 text-weight-bold q-mb-sm">Accounts</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <!-- Accounts List -->
    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="a in wallets" :key="a._id" flat bordered class="q-mb-sm">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon
                :name="a.icon || 'account_balance_wallet'"
                size="32px"
                class="q-mr-sm"
                color="primary"
              />
              <div>
                <div class="text-subtitle2">{{ a.name }}</div>
                <div class="text-caption text-grey">{{ a.type || 'Wallet' }}</div>
              </div>
            </div>
            <div :class="a.balance >= 0 ? 'text-primary' : 'text-negative'" class="text-h6">
              {{ a.balance?.toLocaleString() || 0 }} PHP
            </div>
          </div>
        </q-card-section>
      </q-card>
    </transition-group>

    <div v-if="!wallets.length" class="text-grey text-center q-mt-lg">No accounts added yet.</div>

    <!-- Floating Add Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="showAddDialog = true" />
    </q-page-sticky>

    <!-- Add Account Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add Account</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input filled v-model="newWallet.name" label="Account Name" />
          <q-select
            filled
            v-model="newWallet.type"
            :options="['Wallet', 'Savings', 'Debt', 'Investment']"
            label="Type"
          />
          <q-input
            filled
            v-model.number="newWallet.balance"
            label="Initial Balance (PHP)"
            type="number"
          />
          <q-select filled v-model="newWallet.icon" :options="iconOptions" label="Icon" emit-value>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt" />
                </q-item-section>
                <q-item-section>{{ scope.opt }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveWallet" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDatabase } from 'src/composables/useDatabase.js'

const { getAllDocs, saveDoc, localDB } = useDatabase()

const wallets = ref([])
const showAddDialog = ref(false)
const newWallet = ref({
  name: '',
  type: 'Wallet',
  balance: 0,
  icon: 'account_balance_wallet',
})

const iconOptions = [
  'account_balance_wallet',
  'savings',
  'credit_card',
  'attach_money',
  'account_balance',
]

const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)

// Load wallets
async function loadWallets() {
  wallets.value = await getAllDocs('wallet')
}

// Save wallet to CouchDB
async function saveWallet() {
  if (!newWallet.value.name) {
    alert('Please provide a wallet name')
    return
  }

  await saveDoc({
    type: 'wallet',
    name: newWallet.value.name,
    typeLabel: newWallet.value.type,
    balance: Number(newWallet.value.balance),
    icon: newWallet.value.icon,
  })

  showAddDialog.value = false
  newWallet.value = {
    name: '',
    type: 'Wallet',
    balance: 0,
    icon: 'account_balance_wallet',
  }

  await loadWallets()
}

// Live updates
localDB.changes({ since: 'now', live: true, include_docs: true }).on('change', loadWallets)
onMounted(loadWallets)
</script>

<style scoped>
.fade-slide-up-enter-active {
  transition: all 0.3s ease;
}
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
