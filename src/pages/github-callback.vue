<script setup>
// GitHub OAuth callback: GitHub redirects here with ?code=... (or
// ?error=access_denied when the user cancels). The code is exchanged at the
// backend, which returns the same token/user shape as the Google login.
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { setUser } from '@/utils/useAuth'
import { getApiBaseUrl } from '@/utils/apiBase'
import { apiFetch } from '@/utils/apiFetch'

const router = useRouter()
const route = useRoute()
const errorMessage = ref('')

onMounted(async () => {
  if (route.query.error) {
    // e.g. error=access_denied: the user clicked Cancel on GitHub's page.
    errorMessage.value = 'GitHub sign-in was cancelled.'
    return
  }

  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code) {
    errorMessage.value = 'GitHub did not return a login code.'
    return
  }

  try {
    const res = await apiFetch(`${getApiBaseUrl()}/api/github_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Server returned ${res.status}`)

    // The code is single-use; drop it from the address bar before moving on.
    router.replace({ query: {} })

    const userData = data.user || { name: data.name, email: data.email }
    setUser(userData, data.access_token || data.token)

    // Track login event, same as the password and Google paths.
    apiFetch(`${getApiBaseUrl()}/api/track_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userData.email }),
    }).catch(err => console.error('Failed to track login:', err))

    router.push('/dashboard')
  } catch (err) {
    const message =
      err instanceof TypeError
        ? `Network error: ${err.message}`
        : err.message || 'Login failed.'
    errorMessage.value = `GitHub login failed: ${message}`
  }
})
</script>

<template>
  <VContainer class="d-flex align-center justify-center" style="height: 100vh;">
    <VCard class="pa-12 text-center" max-width="500" elevation="8">
      <VImg
        src="https://oss-prey.github.io/OSSPREY-Website/static/images/favicon.ico"
        alt="OSSPREY Logo"
        height="64"
        class="mx-auto mb-6"
      />
      <template v-if="errorMessage">
        <VCardTitle class="text-h5 mb-2">GitHub sign-in</VCardTitle>
        <VAlert type="error" density="compact" class="mb-4" :text="errorMessage" />
        <VBtn block variant="outlined" to="/login">
          Back to Login
        </VBtn>
      </template>
      <template v-else>
        <VProgressCircular indeterminate color="primary" class="mb-4" />
        <VCardTitle class="text-h5">Signing you in with GitHub…</VCardTitle>
      </template>
    </VCard>
  </VContainer>
</template>
