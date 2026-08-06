<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiBaseUrl } from '@/utils/apiBase'
import { PASSWORD_RULE_TEXT, isPasswordValid } from '@/utils/password'

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const submitting = ref(false)
const router = useRouter()
const route = useRoute()

const API_BASE = getApiBaseUrl()

// The reset link mails the user back here as /reset-password?token=...
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const passwordFieldType = computed(() => (showPassword.value ? 'text' : 'password'))
const passwordVisibilityIcon = computed(() => (showPassword.value ? 'bx-show' : 'bx-hide'))

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const submit = async () => {
  errorMessage.value = ''

  if (!isPasswordValid(password.value)) {
    errorMessage.value = PASSWORD_RULE_TEXT

    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'

    return
  }

  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/api/reset_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, password: password.value }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      let msg = data.message
      if (!msg) {
        if (res.status === 400 || res.status === 401)
          msg = 'This reset link is invalid or has expired. Please request a new one.'
        else msg = `Server returned ${res.status} ${res.statusText}`
      }

      throw new Error(msg)
    }

    router.push({ path: '/login', query: { message: 'Your password has been reset. Please sign in.' } })
  } catch (err) {
    errorMessage.value =
      err instanceof TypeError
        ? `Network error: ${err.message}`
        : err.message || 'Password reset failed.'
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
      <VCardTitle class="text-h4 text-center mb-2">Reset Password</VCardTitle>
      <VCardSubtitle class="text-center mb-8">Choose a new password for your account.</VCardSubtitle>

      <VAlert v-if="!token" type="error" density="compact" class="mb-4">
        This reset link is missing its token. Please request a new link.
      </VAlert>

      <VForm v-else @submit.prevent="submit">
        <VTextField
          v-model="password"
          label="New Password"
          :type="passwordFieldType"
          :append-inner-icon="passwordVisibilityIcon"
          @click:append-inner="togglePasswordVisibility"
          required
          class="mb-4"
        />
        <VTextField
          v-model="confirmPassword"
          label="Confirm New Password"
          :type="passwordFieldType"
          required
          class="mb-2"
        />
        <p class="text-caption text-medium-emphasis mb-4">{{ PASSWORD_RULE_TEXT }}</p>

        <VAlert v-if="errorMessage" type="error" density="compact" class="mb-4" :text="errorMessage" />

        <VBtn type="submit" block size="large" :loading="submitting" class="mb-4 py-4">
          <template #prepend><VIcon icon="bx-lock-alt" /></template>
          Reset Password
        </VBtn>
      </VForm>

      <VBtn block variant="text" to="/forgot-password">Request a New Link</VBtn>
      <VBtn block variant="text" to="/login">Back to Login</VBtn>
    </VCard>
  </VContainer>
</template>
