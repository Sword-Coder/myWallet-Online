import HomePage from 'pages/HomePage.vue'
import RecordsPage from 'pages/RecordsPage.vue'
import AnalysisPage from 'pages/AnalysisPage.vue'
import BudgetsPage from 'pages/BudgetsPage.vue'
import AccountsPage from 'pages/AccountsPage.vue'
import CategoriesPage from 'pages/CategoriesPage.vue'
import LandingPage from 'pages/LandingPage.vue'
import LoginPage from 'pages/LoginPage.vue'
import SignupPage from 'pages/SignupPage.vue'
import VerifyEmailPage from 'pages/VerifyEmailPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/landing',
  },
  {
    path: '/home',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: HomePage, name: 'home' },
      { path: 'records', component: RecordsPage, name: 'records' },
      { path: 'analysis', component: AnalysisPage, name: 'analysis' },
      { path: 'budgets', component: BudgetsPage, name: 'budgets' },
      { path: 'accounts', component: AccountsPage, name: 'accounts' },
      { path: 'categories', component: CategoriesPage, name: 'categories' },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: '/landing',
    component: LandingPage,
    name: 'landing',
  },
  {
    path: '/login',
    component: LoginPage,
    name: 'login',
  },
  {
    path: '/signup',
    component: SignupPage,
    name: 'signup',
  },
  {
    path: '/verify-email',
    component: VerifyEmailPage,
    name: 'verify-email',
  },

  // 404 fallback
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
