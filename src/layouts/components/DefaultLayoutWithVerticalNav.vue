<script setup>
import Footer from '@/layouts/components/Footer.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const user = ref(null)
const router = useRouter()
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '')

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      user.value = JSON.parse(stored)
    }
    catch {
      // ignore parse errors
    }
  }
})

const userName = computed(() => user.value?.name || user.value?.email || '')

const logout = async () => {
  try {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' })
  }
  catch {
    // ignore errors
  }
  localStorage.removeItem('user')
  user.value = null
  router.push('/login')
}
</script>

<template>
  <div class="layout-container">
    <div class="layout-background"></div> 
    <VerticalNavLayout>
      <template #navbar>
        <div class="d-flex align-center ms-auto">
          <VTooltip v-if="user" :text="userName" location="bottom">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon>
                <VIcon icon="bx-user" />
              </VBtn>
            </template>
          </VTooltip>

          <VBtn v-if="user" icon @click="logout">
            <VIcon icon="bx-log-out" />
          </VBtn>
        </div>
      </template>

      <!-- 👉 Pages -->
      <slot />

      <!-- 👉 Footer -->
      <template #footer>
        <Footer />
      </template>
    </VerticalNavLayout>
  </div>
</template>
