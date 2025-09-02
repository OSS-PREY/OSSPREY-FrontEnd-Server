<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const fullName = ref('')
const email = ref('')
const affiliation = ref('')
const password = ref('')
const confirmPassword = ref('')
const referral = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const router = useRouter()

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '')

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordPattern.test(password.value)) {
    errorMessage.value = 'Password must be at least 8 characters long and include at least one number and one uppercase letter.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName.value,
        email: email.value,
        affiliation: affiliation.value,
        password: password.value,
        referral: referral.value,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      let msg = data.message
      if (!msg) {
        if (res.status === 400)
          msg = 'Invalid registration data.'
        else if (res.status === 404)
          msg = 'Endpoint not found.'
        else
          msg = `Server returned ${res.status} ${res.statusText}`
      }
      throw new Error(msg)
    }

    successMessage.value = data.message || 'Registration successful. Please log in.'
    // Optional: redirect after showing success message
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
  catch (err) {
    const message =
      err instanceof TypeError
        ? `Network error: ${err.message}`
        : err.message || 'Registration failed.'
    errorMessage.value = `Registration failed: ${message}`
  }
}
</script>

<template>
  <!-- Keep the template mostly from main, but make referral optional -->
  <VContainer class="d-flex align-center justify-center" style="height: 100vh;">
    <VCard class="pa-12" max-width="600" elevation="8">
      <VImg
        src="https://oss-prey.github.io/OSSPREY-Website/static/images/favicon.ico"
        alt="OSSPREY Logo"
        height="64"
        class="mx-auto mb-6"
      />
      <VCardTitle class="text-h4 text-center mb-2">Create Account</VCardTitle>
      <VCardSubtitle class="text-center mb-8">Join the OSSPREY community today</VCardSubtitle>
      <VForm @submit.prevent="submit">
        <VTextField v-model="fullName" label="Full Name" required class="mb-4" />
        <VTextField v-model="email" label="Email" type="email" required class="mb-4" />
        <VTextField v-model="affiliation" label="Affiliation" required class="mb-4" />
        <VTextField v-model="password" label="Password" type="password" required class="mb-4" />
        <VTextField v-model="confirmPassword" label="Confirm Password" type="password" required class="mb-4" />
        <VTextField v-model="referral" label="How did you hear about this app?" class="mb-4" />
        <VAlert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
          :text="errorMessage"
        />
        <VAlert
          v-if="successMessage"
          type="success"
          density="compact"
          class="mb-4"
          :text="successMessage"
        />
        <VBtn type="submit" block size="large" class="mb-4 py-4">Register</VBtn>
      </VForm>
      <VBtn block variant="outlined" size="large" class="mb-4 py-4" to="/">
        Back to Login
      </VBtn>
    </VCard>
  </VContainer>
</template>
