<script setup>
import { ref } from 'vue'
import { getApiBaseUrl } from '@/utils/apiBase'

const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const submitting = ref(false)

const API_BASE = getApiBaseUrl()

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address.'

    return
  }

  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/api/forgot_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))

      throw new Error(data.message || `Server returned ${res.status} ${res.statusText}`)
    }

    // Deliberately generic: never reveal whether the address is registered.
    successMessage.value = 'If an account exists for that address, a reset link is on its way. Check your inbox and spam folder.'
    email.value = ''
  } catch (err) {
    errorMessage.value =
      err instanceof TypeError
        ? `Network error: ${err.message}`
        : err.message || 'Could not send the reset link.'
  } finally {
    submitting.value = false
  }
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
      <VCardTitle class="text-h4 text-center mb-2">Forgot Password</VCardTitle>
      <VCardSubtitle class="text-center mb-8">
        Enter your email and we'll send you a link to reset your password.
      </VCardSubtitle>

      <VForm @submit.prevent="submit">
        <VTextField v-model="email" label="Email" type="email" required class="mb-4" />

        <VAlert v-if="successMessage" type="success" density="compact" class="mb-4" :text="successMessage" />
        <VAlert v-if="errorMessage" type="error" density="compact" class="mb-4" :text="errorMessage" />

        <VBtn type="submit" block size="large" :loading="submitting" class="mb-4 py-4">
          <template #prepend><VIcon icon="bx-envelope" /></template>
          Send Reset Link
        </VBtn>
      </VForm>

      <VBtn block variant="text" to="/login">Back to Login</VBtn>
    </VCard>
  </VContainer>
</template>
