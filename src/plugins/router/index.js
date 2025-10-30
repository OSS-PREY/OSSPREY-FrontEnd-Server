import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const getStoredUser = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  }
  catch (error) {
    console.warn('Failed to read stored user', error)
    return null
  }
}

router.beforeEach((to, from, next) => {
  const user = getStoredUser()

  if (to.meta?.requiresAuth && !user) {
    next({ path: '/', replace: true })
    return
  }

  if (to.meta?.requiresGuest && user) {
    next({ path: '/dashboard', replace: true })
    return
  }

  next()
})

export default function (app) {
  app.use(router)
}
export { router }
