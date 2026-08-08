// One reactive copy of the signed-in user, shared by every component.
//
// Each consumer used to keep its own ref and resync it from a `user-auth-changed`
// window event. Any component that mounted at the wrong moment, or whose
// listener was added after the event fired, held a stale copy -- which is how
// the navbar ended up offering "Login" to someone who was already signed in.
// A module-scoped ref cannot drift: there is only one.

import { computed, ref } from 'vue'

const STORAGE_KEY = 'user'
const TOKEN_KEY = 'access_token'

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    return raw ? JSON.parse(raw) : null
  } catch {
    // Corrupt JSON would otherwise strand the session: clear it so the next
    // sign-in starts clean rather than throwing on every read.
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing to do */ }

    return null
  }
}

const user = ref(read())

/** Re-read from storage. Call after anything writes the key directly. */
export const refreshUser = () => {
  user.value = read()
}

/** Sign in: persist the user (and token, when the API returned one). */
export const setUser = (nextUser, token) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    if (token) localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to persist the signed-in user', error)
  }
  user.value = nextUser
  // Other tabs still need the event; this one is already up to date.
  window.dispatchEvent(new Event('user-auth-changed'))
}

/** Sign out: drop both keys together so no token outlives its user. */
export const clearUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear the signed-in user', error)
  }
  user.value = null
  window.dispatchEvent(new Event('user-auth-changed'))
}

// A `storage` event only fires in *other* tabs, so this keeps tabs in step;
// same-tab updates go through setUser/clearUser above.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (!event || event.key === STORAGE_KEY || event.key === TOKEN_KEY)
      refreshUser()
  })
  window.addEventListener('user-auth-changed', refreshUser)
}

export const useAuth = () => ({
  user,
  isAuthenticated: computed(() => Boolean(user.value)),
  userName: computed(() => user.value?.name || user.value?.email || ''),
  setUser,
  clearUser,
  refreshUser,
})
