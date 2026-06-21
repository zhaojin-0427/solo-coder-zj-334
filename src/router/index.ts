import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'

const routes: import('vue-router').RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/packages',
    redirect: '/?tab=packages',
  },
  {
    path: '/listening-packages',
    redirect: '/?tab=packages',
  },
  {
    path: '/review-packages',
    redirect: '/?tab=packages',
  },
  {
    path: '/emergency-items',
    redirect: '/?tab=emergency',
  },
  {
    path: '/emergency',
    redirect: '/?tab=emergency',
  },
  {
    path: '/family-share',
    redirect: '/?tab=share',
  },
  {
    path: '/follow-ups',
    redirect: '/?tab=followups',
  },
  {
    path: '/statistics',
    redirect: '/?tab=stats',
  },
  {
    path: '/stats',
    redirect: '/?tab=stats',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
