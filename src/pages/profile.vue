<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { recordView } from '@/utils/viewTracking'
import { getApiBaseUrl } from '@/utils/apiBase'
import { apiFetch } from '@/utils/apiFetch'

const API_BASE = getApiBaseUrl()

const user = ref(null)
const nameInput = ref('')
const affiliationInput = ref('')
const roleInput = ref('')
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem('user')
    user.value = stored ? JSON.parse(stored) : null
  }
  catch {
    user.value = null
  }
}

const handleStorage = event => {
  if (!event || event.key === 'user')
    loadUserFromStorage()
}

onMounted(() => {
  recordView()
  loadUserFromStorage()
  window.addEventListener('storage', handleStorage)
  window.addEventListener('user-auth-changed', loadUserFromStorage)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('user-auth-changed', loadUserFromStorage)
})

const hasProfile = computed(() => Boolean(user.value))
const displayName = computed(() => user.value?.name || 'Unknown user')
const displayEmail = computed(() => user.value?.email || 'Not provided')
const displayAffiliation = computed(() => user.value?.affiliation || 'Not provided')
const displayRole = computed(() => user.value?.role || 'Not provided')

watch(user, value => {
  if (!value) {
    nameInput.value = ''
    affiliationInput.value = ''
    roleInput.value = ''
    return
  }

  nameInput.value = value.name || ''
  affiliationInput.value = value.affiliation || ''
  roleInput.value = value.role || ''
})

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const name = nameInput.value.trim()
  const affiliation = affiliationInput.value.trim()
  const role = roleInput.value.trim()

  if (!name || !affiliation) {
    errorMessage.value = 'Name and affiliation are required.'
    return
  }

  saving.value = true

  try {
    const res = await apiFetch(`${API_BASE}/api/update_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        affiliation,
        role,
        email: user.value?.email,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (res.status === 401)
        throw new Error('Your session has expired. Please sign in again.')

      throw new Error(data.message || `Server returned ${res.status} ${res.statusText}`)
    }

    // Prefer the server's copy of the profile over the values typed here.
    user.value = data.user
      ? { ...user.value, ...data.user }
      : { ...user.value, name, affiliation, role }

    localStorage.setItem('user', JSON.stringify(user.value))
    window.dispatchEvent(new Event('user-auth-changed'))

    successMessage.value = data.message || 'Profile updated successfully.'
  }
  catch (err) {
    errorMessage.value = `Unable to update profile: ${err.message}`
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VContainer class="py-8">
    <VRow class="mb-4" justify="center">
      <VCol cols="12" lg="10">
        <VCard elevation="12" class="pa-6 gradient-card">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
              <div class="text-h5 font-weight-bold">Profile</div>
              <div class="text-subtitle-1 text-medium-emphasis">
                Personalize how your information appears across the OSSPREY dashboard.
              </div>
            </div>
            <VChip color="primary" variant="elevated" class="text-button">
              <VIcon icon="mdi-account-circle" start />
              {{ hasProfile ? 'Profile Active' : 'Sign in required' }}
            </VChip>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <VRow justify="center" class="gy-6">
      <VCol cols="12" lg="4">
        <VCard elevation="10" class="pa-6 h-100">
          <div class="d-flex align-center mb-4">
            <VAvatar color="primary" size="56" class="me-3">
              <VIcon icon="mdi-account" size="32" />
            </VAvatar>
            <div>
              <div class="text-subtitle-1 font-weight-medium">{{ displayName }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ displayEmail }}</div>
            </div>
          </div>

          <VDivider class="my-4" />

          <VList lines="one" density="comfortable" class="profile-list">
            <VListItem prepend-icon="mdi-account-box">
              <VListItemTitle class="text-subtitle-2 text-high-emphasis">Name</VListItemTitle>
              <VListItemSubtitle>{{ displayName }}</VListItemSubtitle>
            </VListItem>
            <VDivider />
            <VListItem prepend-icon="mdi-domain">
              <VListItemTitle class="text-subtitle-2 text-high-emphasis">Affiliation</VListItemTitle>
              <VListItemSubtitle>{{ displayAffiliation }}</VListItemSubtitle>
            </VListItem>
            <VDivider />
            <VListItem prepend-icon="mdi-briefcase">
              <VListItemTitle class="text-subtitle-2 text-high-emphasis">Role</VListItemTitle>
              <VListItemSubtitle>{{ displayRole }}</VListItemSubtitle>
            </VListItem>
            <VDivider />
            <VListItem prepend-icon="mdi-email">
              <VListItemTitle class="text-subtitle-2 text-high-emphasis">Email</VListItemTitle>
              <VListItemSubtitle>{{ displayEmail }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCard>
      </VCol>

      <VCol cols="12" lg="6">
        <VCard elevation="10" class="pa-6 h-100">
          <VCardTitle class="px-0 d-flex align-center justify-space-between flex-wrap gap-2">
            <span class="text-h6">Edit profile</span>
            <VChip v-if="saving" color="primary" variant="tonal" size="small">
              Saving changes...
            </VChip>
          </VCardTitle>

          <VCardText class="px-0">
            <VAlert
              v-if="!hasProfile"
              type="info"
              variant="tonal"
              class="mb-4"
              text="Sign in to update your profile information."
            />

            <VForm @submit.prevent="saveProfile">
              <VTextField
                v-model="nameInput"
                label="Full name"
                :disabled="!hasProfile"
                prepend-inner-icon="mdi-account"
                class="mb-4"
                required
              />

              <VTextField
                v-model="affiliationInput"
                label="Affiliation"
                :disabled="!hasProfile"
                prepend-inner-icon="mdi-domain"
                class="mb-4"
                required
              />

              <VTextField
                v-model="roleInput"
                label="Role (optional)"
                :disabled="!hasProfile"
                prepend-inner-icon="mdi-briefcase"
                class="mb-4"
              />

              <VTextField
                :model-value="displayEmail"
                label="Email"
                readonly
                aria-readonly="true"
                hint="Your email is your account identifier and cannot be changed."
                persistent-hint
                prepend-inner-icon="mdi-email"
                class="mb-4"
              />

              <div class="d-flex flex-wrap gap-3 justify-end">
                <VBtn variant="outlined" color="secondary" :disabled="!hasProfile || saving" @click="loadUserFromStorage">
                  Reset
                </VBtn>
                <VBtn color="primary" type="submit" :loading="saving" :disabled="!hasProfile">
                  Save changes
                </VBtn>
              </div>
            </VForm>

            <VAlert
              v-if="errorMessage"
              type="error"
              role="alert"
              class="mt-4"
              density="comfortable"
              :text="errorMessage"
            />
            <VAlert
              v-if="successMessage"
              type="success"
              role="status"
              aria-live="polite"
              class="mt-4"
              density="comfortable"
              :text="successMessage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.gradient-card {
  background: linear-gradient(135deg, rgba(58, 134, 255, 0.12), rgba(0, 210, 190, 0.12));
  backdrop-filter: blur(6px);
}

.profile-list .v-list-item-title {
  font-weight: 600;
}
</style>
