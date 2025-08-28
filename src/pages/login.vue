<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const userId = ref('')
const password = ref('')
const router = useRouter()

const submit = () => {
  // Placeholder authentication logic
  router.push('/dashboard')
}
</script>

<template>
  <VContainer class="d-flex align-center justify-center" style="height: 100vh;">
    <VCard class="pa-8" max-width="400">
      <VCardTitle class="text-h5 text-center mb-6">Login</VCardTitle>
      <VForm @submit.prevent="submit">
        <VTextField v-model="userId" label="User ID" required class="mb-4" />
        <VTextField v-model="password" label="Password" type="password" required class="mb-4" />
        <VBtn type="submit" block class="mb-4">Login</VBtn>
      </VForm>
      <div class="text-center">
        <RouterLink to="/register">Need an account? Register</RouterLink>
      </div>
    </VCard>
  </VContainer>
</template>
