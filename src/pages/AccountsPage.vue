<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-h6 text-weight-bold q-mb-sm">Accounts</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="a in accounts" :key="a._id" flat bordered class="q-mb-sm">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon :name="a.icon" size="32px" class="q-mr-sm" color="primary" />
              <div>
                <div class="text-subtitle2">{{ a.name }}</div>
                <div class="text-caption text-grey">{{ a.type }}</div>
              </div>
            </div>
            <div :class="a.balance >= 0 ? 'text-primary' : 'text-negative'" class="text-h6">
              {{ a.balance.toLocaleString() }} PHP
            </div>
          </div>
        </q-card-section>
      </q-card>
    </transition-group>

    <div v-if="!accounts.length" class="text-grey text-center q-mt-lg">No accounts added yet.</div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="addAccount" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

const accounts = ref([
  { _id: 'acc1', name: 'Cash', type: 'Wallet', balance: 2500, icon: 'account_balance_wallet' },
  { _id: 'acc2', name: 'Bank', type: 'Savings', balance: 12000, icon: 'account_balance' },
  { _id: 'acc3', name: 'Credit Card', type: 'Debt', balance: -3500, icon: 'credit_card' },
])

function addAccount() {
  accounts.value.push({
    _id: 'acc' + (accounts.value.length + 1),
    name: 'New Account',
    type: 'Wallet',
    balance: 0,
    icon: 'account_balance_wallet',
  })
}

const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)
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
