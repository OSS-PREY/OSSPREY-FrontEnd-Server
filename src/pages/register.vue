<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const fullName = ref('')
const email = ref('')
const affiliation = ref('')
const password = ref('')
const confirmPassword = ref('')
const referral = ref('')
const router = useRouter()

const submit = () => {
  // Placeholder registration logic
  router.push('/')
}
</script>

<template>
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
        <VBtn type="submit" block size="large" class="mb-4 py-4">Register</VBtn>
      </VForm>
      <VBtn block variant="outlined" size="large" class="mb-4 py-4" to="/">
        Back to Login
      </VBtn>
    </VCard>
  </VContainer>
</template>
