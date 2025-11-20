<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { recordView } from '@/utils/viewTracking'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '')

const user = ref(null)
const editDialog = ref(false)
const nameInput = ref('')
const affiliationInput = ref('')
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

const displayName = computed(() => user.value?.name || 'Unknown user')
const displayEmail = computed(() => user.value?.email || 'Not provided')
const displayAffiliation = computed(() => user.value?.affiliation || 'Not provided')
const hasProfile = computed(() => Boolean(user.value))

const openEditor = () => {
  if (!hasProfile.value) {
    errorMessage.value = 'Please log in to edit your profile.'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  nameInput.value = user.value?.name || ''
  affiliationInput.value = user.value?.affiliation || ''
  editDialog.value = true
}

const closeEditor = () => {
  editDialog.value = false
}

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const name = nameInput.value.trim()
  const affiliation = affiliationInput.value.trim()

  if (!name || !affiliation) {
    errorMessage.value = 'Name and affiliation are required.'
    return
  }

  saving.value = true

  try {
    const res = await fetch(`${API_BASE}/api/update_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        affiliation,
        email: user.value?.email,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok)
      throw new Error(data.message || `Server returned ${res.status} ${res.statusText}`)

    user.value = {
      ...user.value,
      name,
      affiliation,
    }
    localStorage.setItem('user', JSON.stringify(user.value))
    window.dispatchEvent(new Event('user-auth-changed'))

    successMessage.value = data.message || 'Profile updated successfully.'
    editDialog.value = false
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
    <VRow justify="center">
      <VCol cols="12" md="8" lg="6">
        <VCard elevation="8">
          <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <div class="text-h5">Account Settings</div>
              <div class="text-subtitle-1 text-medium-emphasis">Manage your OSSPREY profile details</div>
            </div>
            <VBtn
              color="primary"
              prepend-icon="mdi-account-edit"
              :disabled="!hasProfile"
              @click="openEditor"
            >
              Edit Profile
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VAlert
              v-if="!hasProfile"
              type="info"
              variant="tonal"
              title="No profile data"
              text="Log in to view and edit your profile information."
              class="mb-4"
            />

            <div v-else>
              <VList lines="one" density="comfortable">
                <VListItem prepend-icon="mdi-account">
                  <VListItemTitle class="text-subtitle-1 font-weight-medium">
                    Name
                  </VListItemTitle>
                  <VListItemSubtitle>{{ displayName }}</VListItemSubtitle>
                </VListItem>
                <VDivider />
                <VListItem prepend-icon="mdi-domain">
                  <VListItemTitle class="text-subtitle-1 font-weight-medium">
                    Affiliation
                  </VListItemTitle>
                  <VListItemSubtitle>{{ displayAffiliation }}</VListItemSubtitle>
                </VListItem>
                <VDivider />
                <VListItem prepend-icon="mdi-email">
                  <VListItemTitle class="text-subtitle-1 font-weight-medium">
                    Email
                  </VListItemTitle>
                  <VListItemSubtitle>{{ displayEmail }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </div>

            <VAlert
              v-if="errorMessage"
              type="error"
              density="comfortable"
              class="mt-4"
              :text="errorMessage"
            />
            <VAlert
              v-if="successMessage"
              type="success"
              density="comfortable"
              class="mt-4"
              :text="successMessage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="editDialog" max-width="520">
      <VCard>
        <VCardTitle class="text-h6">Edit Profile</VCardTitle>
        <VCardText>
          <p class="mb-4">Update how your name and affiliation appear across OSSPREY.</p>
          <VForm @submit.prevent="saveProfile">
            <VTextField
              v-model="nameInput"
              label="Name"
              required
              class="mb-4"
            />
            <VTextField
              v-model="affiliationInput"
              label="Affiliation"
              required
              class="mb-4"
            />

            <VCardActions class="px-0">
              <VSpacer />
              <VBtn variant="text" @click="closeEditor">
                Cancel
              </VBtn>
              <VBtn color="primary" type="submit" :loading="saving">
                Save Changes
              </VBtn>
            </VCardActions>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>
  </VContainer>
</template>
