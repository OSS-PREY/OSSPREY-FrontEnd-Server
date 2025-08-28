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
    <VCard class="pa-8" max-width="500">
      <VCardTitle class="text-h5 text-center mb-6">Register</VCardTitle>
      <VForm @submit.prevent="submit">
        <VTextField v-model="fullName" label="Full Name" required class="mb-4" />
        <VTextField v-model="email" label="Email" type="email" required class="mb-4" />
        <VTextField v-model="affiliation" label="Affiliation" required class="mb-4" />
        <VTextField v-model="password" label="Password" type="password" required class="mb-4" />
        <VTextField v-model="confirmPassword" label="Confirm Password" type="password" required class="mb-4" />
        <VTextField v-model="referral" label="How did you hear about this app?" class="mb-4" />
        <VBtn type="submit" block class="mb-4">Register</VBtn>
      </VForm>
      <div class="text-center">
        <RouterLink to="/">Already have an account? Login</RouterLink>
      </div>
    </VCard>
  </VContainer>
</template>
