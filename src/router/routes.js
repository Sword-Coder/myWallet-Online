import MainLayout from 'layouts/MainLayout.vue'
import RecordsPage from 'pages/RecordsPage.vue'
import AnalysisPage from 'pages/AnalysisPage.vue'
import BudgetsPage from 'pages/BudgetsPage.vue'
import AccountsPage from 'pages/AccountsPage.vue'
import CategoriesPage from 'pages/CategoriesPage.vue'

const routes = [
  {
    path: '/',
    // component: () => import('layouts/MainLayout.vue'),
    component: MainLayout,
    children: [
      { path: '', redirect: '/records' },
      { path: '/records', component: RecordsPage, name: 'records' },
      { path: '/analysis', component: AnalysisPage, name: 'analysis' },
      { path: '/budgets', component: BudgetsPage, name: 'budgets' },
      { path: '/accounts', component: AccountsPage, name: 'accounts' },
      { path: '/categories', component: CategoriesPage, name: 'categories' },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
