<script setup>
import { computed, onMounted, ref } from 'vue'
import { setUser } from '@/utils/useAuth'
import { useRouter, useRoute } from 'vue-router'
import { recordView } from '@/utils/viewTracking'
import { getApiBaseUrl } from '@/utils/apiBase'
import { apiFetch } from '@/utils/apiFetch';

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
    const res = await apiFetch(`${API_BASE}/api/login`, {
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

    setUser(userData, data.access_token || data.token)

    // Track login event
    apiFetch(`${API_BASE}/api/track_login`, {
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
    const res = await apiFetch(`${API_BASE}/api/google_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Google login failed.')

    const userData = data.user || { name: data.name, email: data.email }

    setUser(userData, data.access_token || data.token)
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = `Google login failed: ${err.message}`
  }
}

// ------------------ GITHUB LOGIN ------------------
// GitHub OAuth is a browser redirect flow: send the user to GitHub, which
// returns them to /github/callback with a code that page exchanges at the
// backend. The client id is public; the secret never leaves the backend.
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID

const githubLogin = () => {
  if (!GITHUB_CLIENT_ID) {
    errorMessage.value = 'GitHub login is not configured on this deployment.'
    return
  }
  const redirectUri = `${window.location.origin}/github/callback`
  window.location.href =
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`
}

// ------------------ FORGOT PASSWORD ------------------
const forgotDialogOpen = ref(false)
const forgotEmail = ref('')
const forgotSubmitting = ref(false)
const forgotMessage = ref('')
const forgotError = ref('')

const openForgotDialog = () => {
  // Prefill with whatever the user already typed into the login form.
  forgotEmail.value = email.value
  forgotMessage.value = ''
  forgotError.value = ''
  forgotDialogOpen.value = true
}

const submitForgotPassword = async () => {
  forgotMessage.value = ''
  forgotError.value = ''

  if (!forgotEmail.value.trim()) {
    forgotError.value = 'Please enter your email address.'
    return
  }

  forgotSubmitting.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/forgot_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail.value.trim() }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok)
      throw new Error(data.message || `Server returned ${res.status} ${res.statusText}`)

    // The backend replies with the same generic message whether or not the
    // address is registered; show it verbatim.
    forgotMessage.value = data.message || 'If an account exists for that address, a reset link is on its way.'
  }
  catch (err) {
    const message = err instanceof TypeError ? `Network error: ${err.message}` : err.message
    forgotError.value = message || 'Could not request a password reset.'
  }
  finally {
    forgotSubmitting.value = false
  }
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

      <VBtn block variant="text" class="mb-4" @click="openForgotDialog">
        Forgot Password?
      </VBtn>

      <VDivider class="my-6" />

      <!-- Google Login Button -->
      <div id="google-login-btn" class="mb-4"></div>

      <!-- GitHub Login -->
      <VBtn block color="grey-darken-3" size="large" @click="githubLogin">
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

    <VDialog v-model="forgotDialogOpen" max-width="420">
      <VCard class="pa-6">
        <VCardTitle class="text-h5 mb-2">
          Reset Password
        </VCardTitle>
        <VCardText>
          <p class="mb-4">
            Enter the email address of your account and we will send you a password reset link.
          </p>
          <VForm @submit.prevent="submitForgotPassword">
            <VTextField
              v-model="forgotEmail"
              label="Email"
              type="email"
              required
              class="mb-4"
              :disabled="forgotSubmitting"
            />
            <VAlert v-if="forgotMessage" type="success" density="compact" class="mb-4" :text="forgotMessage" />
            <VAlert v-if="forgotError" type="error" density="compact" class="mb-4" :text="forgotError" />
            <VBtn type="submit" block size="large" :loading="forgotSubmitting" class="mb-2">
              Send Reset Link
            </VBtn>
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="forgotDialogOpen = false">
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>
  