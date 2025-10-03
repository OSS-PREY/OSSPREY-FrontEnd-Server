<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'

const router = useRouter()
const user = ref(null)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '')

const readStoredUser = () => {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem('user')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  }
  catch {
    return null
  }
}

const syncUserFromStorage = () => {
  user.value = readStoredUser()
}

onMounted(() => {
  if (typeof window === 'undefined') return

  syncUserFromStorage()
  window.addEventListener('user-auth-changed', syncUserFromStorage)
})

onUnmounted(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('user-auth-changed', syncUserFromStorage)
})

const userName = computed(() => user.value?.name || user.value?.email || '')

const logout = async () => {
  const email = user.value?.email
  try {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' })
  }
  catch {
    // ignore errors
  }

  if (email) {
    fetch(`${API_BASE}/api/track_logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: email }),
    }).catch(err => {
      console.error('Failed to track logout:', err)
    })
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('user')
    window.dispatchEvent(new Event('user-auth-changed'))
  }

  user.value = null
  router.replace({ path: '/', query: { message: 'You have been logged out.' } })
}
</script>

<template>
  <div class="navbar-actions d-flex align-center">
    <NavbarThemeSwitcher />

    <VTooltip v-if="user" :text="userName" location="bottom">
      <template #activator="{ props }">
        <VBtn v-bind="props" icon class="ms-2">
          <VIcon icon="bx-user" />
        </VBtn>
      </template>
    </VTooltip>

    <VTooltip v-if="user" text="Log Out" location="bottom">
      <template #activator="{ props }">
        <VBtn v-bind="props" icon class="ms-2" @click="logout">
          <VIcon icon="bx-log-out" />
        </VBtn>
      </template>
    </VTooltip>
  </div>
</template>
