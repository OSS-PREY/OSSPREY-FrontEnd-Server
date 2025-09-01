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

const socialLogin = provider => {
  alert('The feature is currently under development')
}

const forgotPassword = () => {
  alert('Password reset is currently under development')
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
        <VTextField v-model="userId" label="User ID" required class="mb-4" />
        <VTextField v-model="password" label="Password" type="password" required class="mb-4" />
        <VBtn type="submit" block size="large" class="mb-4 py-4">Login</VBtn>
      </VForm>

      <VBtn block variant="outlined" size="large" class="mb-4 py-4" to="/register">
        Register
      </VBtn>

      <VBtn block variant="text" class="mb-4" @click="forgotPassword">
        Forgot Password?
      </VBtn>

      <VDivider class="my-6" />

      <VBtn
        block
        color="red-darken-1"
        size="large"
        class="mb-4"
        @click="socialLogin('Google')"
      >
        <template #prepend>
          <VImg
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            height="24"
            width="24"
            class="mr-2"
          />
        </template>
        Login with Google
      </VBtn>
      <VBtn
        block
        color="grey-darken-3"
        size="large"
        @click="socialLogin('GitHub')"
      >
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
