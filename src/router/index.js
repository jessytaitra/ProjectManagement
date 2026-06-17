import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresLogin: true },
  },
  {
    path: '/mgt',
    name: 'mgt',
    component: () => import('../views/MGTView.vue'),
    meta: { requiresLogin: true, module: 'mgt' },
  },
  {
    path: '/sr30',
    name: 'sr30',
    component: () => import('../views/SR30View.vue'),
    meta: { requiresLogin: true, module: 'sr30' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresLogin: true, module: 'admin' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const store = useAppStore()

  // Restore session on first load
  if (!store.permissionsLoaded && !store.isLoggedIn) {
    await store.restoreSession()
  }

  // Already logged in → skip login page
  if (to.name === 'login' && store.isLoggedIn) {
    return { name: store.isAdmin ? 'admin' : 'dashboard' }
  }

  if (to.meta.requiresLogin && !store.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.meta.module === 'admin' && !store.isAdmin) {
    return { name: 'dashboard' }
  }

  if (to.meta.module && to.meta.module !== 'admin' && !store.canAccessModule(to.meta.module)) {
    return { name: 'dashboard' }
  }
})

export default router
