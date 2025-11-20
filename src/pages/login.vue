<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { recordView } from '@/utils/viewTracking'
import { getApiBaseUrl } from '@/utils/apiBase'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const passwordFieldType = computed(() => (showPassword.value ? 'text' : 'password'))
const passwordVisibilityIcon = computed(() => (showPassword.value ? 'bx-show' : 'bx-hide'))
const errorMessage = ref('')
const successMessage = ref('')
const router = useRouter()
const route = useRoute()

const API_BASE = getApiBaseUrl()

// ------------------ MOUNT ------------------
onMounted(() => {
  recordView()

  const msg = typeof route.query.message === 'string' ? route.query.message : ''
  if (msg) successMessage.value = msg
  if (Object.keys(route.query).length) router.replace({ query: {} })

  // Initialize Google Login
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })

    window.google.accounts.id.renderButton(
      document.getElementById('google-login-btn'),
      { theme: 'outline', size: 'large', text: 'continue_with' }
    )
  }
})

// ------------------ LOGIN FUNCTION ------------------
const submit = async () => {
  errorMessage.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      let msg = data.message
      if (!msg) {
        if (res.status === 400) msg = 'Missing email or password.'
        else if (res.status === 401) msg = 'Invalid email or password.'
        else if (res.status === 404) msg = 'Endpoint not found.'
        else msg = `Server returned ${res.status} ${res.statusText}`
      }
      throw new Error(msg)
    }

    const userData = data.user || { name: data.name || email.value, email: email.value }
    localStorage.setItem('user', JSON.stringify(userData))
    window.dispatchEvent(new Event('user-auth-changed'))

    // Track login event
    fetch(`${API_BASE}/api/track_login`, {
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
    errorMessage.value = `Login failed: ${message}`
  }
}

// ------------------ GOOGLE LOGIN ------------------
const handleGoogleResponse = async (response) => {
  try {
    const res = await fetch(`${API_BASE}/api/google_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Google login failed.')

    const userData = data.user || { name: data.name, email: data.email }
    localStorage.setItem('user', JSON.stringify(userData))
    window.dispatchEvent(new Event('user-auth-changed'))
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = `Google login failed: ${err.message}`
  }
}

const forgotPassword = () => {
  alert('Password reset is currently under development')
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <VContainer class="d-flex align-center justify-center" style="height: 100vh;">
    <VCard class="pa-12" max-width="500" elevation="8">
      <VImg
        src="https://oss-prey.github.io/OSSPREY-Website/static/images/favicon.ico"
        alt="OSSPREY Logo"
        height="64"
        class="mx-auto mb-6"
      />
      <VCardTitle class="text-h4 text-center mb-2">Welcome Back</VCardTitle>
      <VCardSubtitle class="text-center mb-8">Sign in to continue to OSSPREY</VCardSubtitle>

      <VForm @submit.prevent="submit">
        <VTextField v-model="email" label="Email" type="email" required class="mb-4" />
        <VTextField
          v-model="password"
          label="Password"
          :type="passwordFieldType"
          :append-inner-icon="passwordVisibilityIcon"
          @click:append-inner="togglePasswordVisibility"
          required
          class="mb-4"
        />

        <VAlert v-if="successMessage" type="success" density="compact" class="mb-4" :text="successMessage" />
        <VAlert v-if="errorMessage" type="error" density="compact" class="mb-4" :text="errorMessage" />

        <VBtn type="submit" block size="large" class="mb-4 py-4">
          <template #prepend><VIcon icon="bx-log-in" /></template>
          Login
        </VBtn>
      </VForm>

      <VBtn block variant="outlined" size="large" class="mb-4 py-4" to="/register">
        <template #prepend><VIcon icon="bx-user-plus" /></template>
        Register
      </VBtn>

      <VBtn block variant="text" class="mb-4" @click="forgotPassword">
        Forgot Password?
      </VBtn>

      <VDivider class="my-6" />

      <!-- Google Login Button -->
      <div id="google-login-btn" class="mb-4"></div>

      <!-- GitHub Login (still in development) -->
      <VBtn block color="grey-darken-3" size="large" @click="() => alert('GitHub login under development')">
        <template #prepend>
          <VImg
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub logo"
            height="24"
            width="24"
            class="mr-2"
          />
        </template>
        Login with GitHub
      </VBtn>
    </VCard>
  </VContainer>
</template>
  