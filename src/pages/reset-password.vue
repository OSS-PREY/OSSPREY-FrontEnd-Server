<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiBaseUrl } from '@/utils/apiBase'
import { apiFetch } from '@/utils/apiFetch';

const route = useRoute()
const router = useRouter()
const API_BASE = getApiBaseUrl()

// The token arrives in the reset link: /reset-password?token=...
const token = typeof route.query.token === 'string' ? route.query.token : ''

const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const submitting = ref(false)

// Same rule the register page shows and the backend enforces.
const passwordLengthValid = computed(() => password.value.length >= 8)
const passwordHasLower = computed(() => /[a-z]/.test(password.value))
const passwordHasUpper = computed(() => /[A-Z]/.test(password.value))
const passwordHasNumber = computed(() => /\d/.test(password.value))
const passwordHasSpecial = computed(() => /[^A-Za-z0-9]/.test(password.value))
const passwordCategoriesValid = computed(() =>
  [passwordHasLower.value, passwordHasUpper.value, passwordHasNumber.value, passwordHasSpecial.value]
    .filter(Boolean).length >= 3,
)
const passwordRuleMessage = 'Password must be at least 8 characters long and include at least three of the following: lower case letters, upper case letters, numbers, and special characters.'

const canSubmit = computed(() =>
  Boolean(token)
  && passwordLengthValid.value
  && passwordCategoriesValid.value
  && password.value === confirmPassword.value
  && !submitting.value,
)

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token) {
    errorMessage.value = 'This reset link is missing its token. Please request a new one.'
    return
  }
  if (!(passwordLengthValid.value && passwordCategoriesValid.value)) {
    errorMessage.value = passwordRuleMessage
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/reset_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: password.value }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok)
      throw new Error(data.message || `Server returned ${res.status} ${res.statusText}`)

    // The login page displays this message from its query string.
    router.push({ path: '/login', query: { message: data.message || 'Password has been reset. Please log in.' } })
  }
  catch (err) {
    const message = err instanceof TypeError ? `Network error: ${err.message}` : err.message
    errorMessage.value = message || 'Password reset failed.'
  }
  finally {
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
      <VCardTitle class="text-h4 text-center mb-2">
        Reset Password
      </VCardTitle>
      <VCardSubtitle class="text-center mb-8">
        Choose a new password for your OSSPREY account
      </VCardSubtitle>

      <VAlert
        v-if="!token"
        type="warning"
        density="compact"
        class="mb-4"
        text="This reset link is invalid. Please request a new one from the login page."
      />

      <VForm @submit.prevent="submit">
        <VTextField v-model="password" type="password" label="New Password" required class="mb-4" />
        <VTextField v-model="confirmPassword" type="password" label="Confirm New Password" required class="mb-4" />

        <div class="mb-4">
          <p>Your password must contain:</p>
          <ul class="pl-4">
            <li>
              <VIcon icon="mdi-check" :color="passwordLengthValid ? 'success' : 'error'" class="mr-1" />
              <span :class="passwordLengthValid ? 'text-success' : 'text-error'">At least 8 characters</span>
            </li>
            <li>
              <VIcon icon="mdi-check" :color="passwordCategoriesValid ? 'success' : 'error'" class="mr-1" />
              <span :class="passwordCategoriesValid ? 'text-success' : 'text-error'">At least 3 of: lower case, upper case, numbers, special characters</span>
            </li>
          </ul>
        </div>

        <VAlert v-if="errorMessage" type="error" density="compact" class="mb-4" :text="errorMessage" />
        <VAlert v-if="successMessage" type="success" density="compact" class="mb-4" :text="successMessage" />

        <VBtn type="submit" block size="large" class="mb-4 py-4" :disabled="!canSubmit" :loading="submitting">
          <template #prepend>
            <VIcon icon="bx-lock-open" />
          </template>
          Set New Password
        </VBtn>
      </VForm>

      <VBtn block variant="outlined" size="large" class="py-4" to="/login">
        <template #prepend>
          <VIcon icon="bx-log-in" />
        </template>
        Back to Login
      </VBtn>
    </VCard>
  </VContainer>
</template>
