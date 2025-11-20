<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getApiBaseUrl } from '@/utils/apiBase'

const fullName = ref('')
const email = ref('')
const affiliation = ref('')
const password = ref('')
const confirmPassword = ref('')
const referral = ref('')
const referralOptions = [
  'Search engine',
  'Social media',
  'Friend or colleague',
  'Online advertisement',
  'Conference or event',
  'Blog or article',
  'Other',
]
const agreeToTerms = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const router = useRouter()

// Naive math captcha variables
const captchaA = ref(0)
const captchaB = ref(0)
const captchaInput = ref('')

const generateCaptcha = () => {
  captchaA.value = Math.floor(Math.random() * 10) + 1
  captchaB.value = Math.floor(Math.random() * 10) + 1
  captchaInput.value = ''
}

// Initialize captcha on component setup
generateCaptcha()

const API_BASE = getApiBaseUrl()

const passwordLengthValid = computed(() => password.value.length >= 8)
const passwordHasLower = computed(() => /[a-z]/.test(password.value))
const passwordHasUpper = computed(() => /[A-Z]/.test(password.value))
const passwordHasNumber = computed(() => /\d/.test(password.value))
const passwordHasSpecial = computed(() => /[^A-Za-z0-9]/.test(password.value))
const passwordCategoriesValid = computed(() =>
  [passwordHasLower.value, passwordHasUpper.value, passwordHasNumber.value, passwordHasSpecial.value].filter(Boolean).length >= 3,
)
const requiredFieldsFilled = computed(() =>
  [fullName, email, affiliation, password, confirmPassword].every(field => field.value.trim().length > 0),
)
const canRegister = computed(() =>
  requiredFieldsFilled.value && agreeToTerms.value && captchaInput.value.trim().length > 0,
)

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  if (!(passwordLengthValid.value && passwordCategoriesValid.value)) {
    errorMessage.value = 'Password must be at least 8 characters long and include at least three of the following: lower case letters, upper case letters, numbers, and special characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (!agreeToTerms.value) {
    errorMessage.value = 'You must agree to the Terms of Service.'
    return
  }

  if (Number.parseInt(captchaInput.value, 10) !== captchaA.value + captchaB.value) {
    errorMessage.value = 'Captcha answer is incorrect.'
    generateCaptcha()
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
    generateCaptcha()
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
        <VTextField v-model="fullName" required class="mb-4">
          <template #label>Full Name <span class="text-error">*</span></template>
        </VTextField>
        <VTextField v-model="email" type="email" required class="mb-4">
          <template #label>Email <span class="text-error">*</span></template>
        </VTextField>
        <VTextField v-model="affiliation" required class="mb-4">
          <template #label>Affiliation <span class="text-error">*</span></template>
        </VTextField>
        <VTextField v-model="password" type="password" required class="mb-4">
          <template #label>Password <span class="text-error">*</span></template>
        </VTextField>
        <VTextField v-model="confirmPassword" type="password" required class="mb-4">
          <template #label>Confirm Password <span class="text-error">*</span></template>
        </VTextField>
        <VSelect v-model="referral" :items="referralOptions" label="How did you hear about this app?" class="mb-4" />
        <div class="mb-4">
          <p>Your password must contain:</p>
          <ul class="pl-4">
            <li>
              <VIcon icon="mdi-check" :color="passwordLengthValid ? 'success' : 'error'" class="mr-1" />
              <span :class="passwordLengthValid ? 'text-success' : 'text-error'">At least 8 characters</span>
            </li>
            <li>
              <VIcon icon="mdi-check" :color="passwordCategoriesValid ? 'success' : 'error'" class="mr-1" />
              <span :class="passwordCategoriesValid ? 'text-success' : 'text-error'">At least 3 of the following:</span>
              <ul class="pl-4">
                <li>
                  <VIcon icon="mdi-check" :color="passwordHasLower ? 'success' : 'error'" class="mr-1" />
                  <span :class="passwordHasLower ? 'text-success' : 'text-error'">Lower case letters (a-z)</span>
                </li>
                <li>
                  <VIcon icon="mdi-check" :color="passwordHasUpper ? 'success' : 'error'" class="mr-1" />
                  <span :class="passwordHasUpper ? 'text-success' : 'text-error'">Upper case letters (A-Z)</span>
                </li>
                <li>
                  <VIcon icon="mdi-check" :color="passwordHasNumber ? 'success' : 'error'" class="mr-1" />
                  <span :class="passwordHasNumber ? 'text-success' : 'text-error'">Numbers (0-9)</span>
                </li>
                <li>
                  <VIcon icon="mdi-check" :color="passwordHasSpecial ? 'success' : 'error'" class="mr-1" />
                  <span :class="passwordHasSpecial ? 'text-success' : 'text-error'">Special characters (e.g. !@#$%^&*)</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <VTextField v-model="captchaInput" type="number" required class="mb-4">
          <template #label>
            What is {{ captchaA }} + {{ captchaB }}? <span class="text-error">*</span>
          </template>
        </VTextField>
        <VCheckbox v-model="agreeToTerms" required class="mb-4">
          <template #label>
            <span>
              By registering, I agree to the
              <a
                href="https://oss-prey.github.io/OSSPREY-Website/terms-of-service.html"
                target="_blank"
                rel="noopener"
              >Terms of Service</a>
              <span class="text-error">*</span>.
            </span>
          </template>
        </VCheckbox>
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
        <VBtn
          type="submit"
          block
          size="large"
          class="mb-4 py-4"
          :disabled="!canRegister"
        >
          <template #prepend>
          <VIcon icon="bx-user-plus" />
          </template>
          Register
        </VBtn>
      </VForm>
      <VBtn block variant="outlined" size="large" class="mb-4 py-4" to="/">
        <template #prepend>
          <VIcon icon="bx-log-in" />
        </template>
        Back to Login
      </VBtn>
    </VCard>
  </VContainer>
</template>
