import MainLayout from 'layouts/MainLayout.vue'
import HomePage from 'pages/HomePage.vue'
import RecordsPage from 'pages/RecordsPage.vue'
import AnalysisPage from 'pages/AnalysisPage.vue'
import BudgetsPage from 'pages/BudgetsPage.vue'
import AccountsPage from 'pages/AccountsPage.vue'
import CategoriesPage from 'pages/CategoriesPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: HomePage, name: 'home' }, // ✅ Use HomePage here
      { path: 'records', component: RecordsPage, name: 'records' },
      { path: 'analysis', component: AnalysisPage, name: 'analysis' },
      { path: 'budgets', component: BudgetsPage, name: 'budgets' },
      { path: 'accounts', component: AccountsPage, name: 'accounts' },
      { path: 'categories', component: CategoriesPage, name: 'categories' },
    ],
  },

  // 404 fallback
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
