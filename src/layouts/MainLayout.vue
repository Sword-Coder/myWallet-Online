<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer v-model="leftDrawerOpen" side="left" bordered class="bg-grey-1">
      <q-list>
        <q-item-label header class="text-primary"> Options </q-item-label>

        <q-item
          v-for="link in menuLinks"
          :key="link.title"
          clickable
          @click="handleMenuClick(link.title)"
        >
          <q-item-section avatar v-if="link.icon">
            <q-icon :name="link.icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ link.title }}</q-item-label>
            <q-item-label caption>{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          <span class="wallet-title">myWallet</span>
        </q-toolbar-title>
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

    <!-- Export Format Selection Dialog -->
    <q-dialog v-model="showExportDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Choose Export Format</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-sm">
            <q-btn
              color="primary"
              icon="description"
              label="Export as PDF"
              class="full-width"
              @click="handlePDFExport"
            />
            <q-btn
              color="secondary"
              icon="file_download"
              label="Export as CSV"
              class="full-width"
              @click="handleCSVExport"
            />
            <q-btn
              color="positive"
              icon="file_copy"
              label="Export Both (PDF + CSV)"
              class="full-width"
              @click="handleBothExports"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" @click="showExportDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWalletsStore } from 'src/stores/wallets'
import { useCategoriesStore } from 'src/stores/categories'
import { useAuthStore } from 'src/stores/auth'
import { useFinancesStore } from 'src/stores/finances'
import { exportTransactions } from 'src/utils/csvExport'
import { exportToPDF as generatePDF } from 'src/utils/pdfExport'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const tab = ref(route.name || 'home')
const leftDrawerOpen = ref(false)
const showExportDialog = ref(false)

watch(route, () => (tab.value = route.name))

const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()
const financesStore = useFinancesStore()

// Get reactive data from stores
const { transactions } = storeToRefs(financesStore)
const { categories } = storeToRefs(categoriesStore)
// Note: authStore has 'user' (singular), not 'users' (plural)

const menuLinks = [
  {
    title: 'Preferences',
    caption: 'App settings',
    icon: 'settings',
    action: 'preferences',
  },
  {
    title: 'Export Records',
    caption: 'Export data',
    icon: 'file_download',
    action: 'export',
  },
  {
    title: 'Backup & Restore',
    caption: 'Data management',
    icon: 'backup',
    action: 'backup',
  },
  {
    title: 'Delete & Reset',
    caption: 'Clear all data',
    icon: 'delete_forever',
    action: 'reset',
  },
]

onMounted(() => {
  // Load data from both stores
  walletsStore.loadWallets()
  categoriesStore.loadCategories()
  financesStore.loadAll()
})

function goToTab(name) {
  router.push({ name })
}

function logout() {
  authStore.logout()
  router.push('/landing')
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function handleMenuClick(title) {
  switch (title) {
    case 'Export Records':
      showExportDialog.value = true
      break
    case 'Preferences':
      $q.notify({
        message: 'Preferences feature coming soon!',
        type: 'info',
        position: 'top',
      })
      break
    case 'Backup & Restore':
      $q.notify({
        message: 'Backup & Restore feature coming soon!',
        type: 'info',
        position: 'top',
      })
      break
    case 'Delete & Reset':
      handleDeleteReset()
      break
    default:
      console.log('Unknown menu item:', title)
  }
  // Close drawer after click
  leftDrawerOpen.value = false
}

async function handleCSVExport() {
  try {
    if (transactions.value.length === 0) {
      $q.notify({
        message: 'No transactions to export',
        type: 'warning',
        position: 'top',
      })
      return
    }

    // Use transactions from the store and wallets from localStorage
    const savedWallets = JSON.parse(localStorage.getItem('wallets') || '[]')
    const result = exportTransactions(transactions.value, savedWallets)

    if (result.success) {
      $q.notify({
        message: `CSV exported successfully as ${result.filename}`,
        type: 'positive',
        position: 'top',
        timeout: 3000,
      })
      showExportDialog.value = false
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('CSV export failed:', error)
    $q.notify({
      message: `CSV export failed: ${error.message}`,
      type: 'negative',
      position: 'top',
    })
  }
}

async function handlePDFExport() {
  try {
    if (transactions.value.length === 0) {
      $q.notify({
        message: 'No transactions to export',
        type: 'warning',
        position: 'top',
      })
      return
    }

    // Get wallets and user info
    const savedWallets = JSON.parse(localStorage.getItem('wallets') || '[]')
    const currentUser = authStore.user || {}

    const result = generatePDF(transactions.value, savedWallets, categories.value, {
      name: currentUser.name,
      email: currentUser.email,
    })

    if (result.success) {
      $q.notify({
        message: `PDF report generated successfully as ${result.filename}`,
        type: 'positive',
        position: 'top',
        timeout: 3000,
      })
      showExportDialog.value = false
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('PDF export failed:', error)
    $q.notify({
      message: `PDF export failed: ${error.message}`,
      type: 'negative',
      position: 'top',
    })
  }
}

async function handleBothExports() {
  try {
    if (transactions.value.length === 0) {
      $q.notify({
        message: 'No transactions to export',
        type: 'warning',
        position: 'top',
      })
      return
    }

    $q.loading.show({
      message: 'Generating reports...',
    })

    // Get data
    const savedWallets = JSON.parse(localStorage.getItem('wallets') || '[]')
    const currentUser = authStore.user || {}

    // Export both formats
    const csvResult = exportTransactions(transactions.value, savedWallets, categories.value)
    const pdfResult = generatePDF(transactions.value, savedWallets, categories.value, {
      name: currentUser.name,
      email: currentUser.email,
    })

    $q.loading.hide()

    const results = []
    if (csvResult.success) {
      results.push(`CSV: ${csvResult.filename}`)
    }
    if (pdfResult.success) {
      results.push(`PDF: ${pdfResult.filename}`)
    }

    if (results.length > 0) {
      $q.notify({
        message: `Exports completed successfully!\n${results.join('\n')}`,
        type: 'positive',
        position: 'top',
        timeout: 5000,
        multiLine: true,
      })
      showExportDialog.value = false
    } else {
      throw new Error('Both exports failed')
    }
  } catch (error) {
    $q.loading.hide()
    console.error('Export failed:', error)
    $q.notify({
      message: `Export failed: ${error.message}`,
      type: 'negative',
      position: 'top',
    })
  }
}

function handleDeleteReset() {
  $q.dialog({
    title: 'Confirm Delete & Reset',
    message:
      'This will permanently delete all your data including wallets, transactions, categories, and budgets. This action cannot be undone. Are you sure?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // TODO: Implement data clearing logic
    $q.notify({
      message: 'Delete & Reset feature coming soon!',
      type: 'info',
      position: 'top',
    })
  })
}
</script>

<style scoped>
.wallet-title {
  background: linear-gradient(45deg, #ffffff, #e8f5e8);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: shimmer 3s ease-in-out infinite;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  50% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.q-drawer .q-item {
  border-radius: 8px;
  margin: 4px 8px;
}

.q-drawer .q-item:hover {
  background-color: rgba(77, 147, 78, 0.1);
}

.q-drawer .q-item--active {
  background-color: rgba(77, 147, 78, 0.15);
  color: #4d934e;
}

/* Export dialog styling */
.q-card {
  border-radius: 12px;
}

.q-btn.full-width {
  width: 100%;
  margin-bottom: 8px;
}
</style>
