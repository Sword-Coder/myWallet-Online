<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>myWallet</q-toolbar-title>
        <q-btn flat round icon="logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-primary shadow-2">
      <q-tabs
        v-model="tab"
        dense
        align="justify"
        class="text-primary"
        @update:model-value="goToTab"
      >
        <q-tab name="home" icon="home" label="Home" />
        <q-tab name="records" icon="receipt_long" label="Records" />
        <q-tab name="analysis" icon="insights" label="Analysis" />
        <q-tab name="budgets" icon="account_balance_wallet" label="Budgets" />
        <q-tab name="accounts" icon="account_balance" label="Accounts" />
        <q-tab name="categories" icon="category" label="Categories" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWalletsStore } from 'src/stores/wallets'
import { useCategoriesStore } from 'src/stores/categories'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const route = useRoute()
const tab = ref(route.name || 'home')

watch(route, () => (tab.value = route.name))

const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()

onMounted(() => {
  walletsStore.loadWallets()
  categoriesStore.loadCategories()
})

function goToTab(name) {
  router.push({ name })
}

function logout() {
  authStore.logout()
  router.push('/landing')
}
</script>
