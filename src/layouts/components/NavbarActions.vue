<script setup>
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';
import AllReposButton from '@/layouts/components/AllReposButton.vue';
import { getApiBaseUrl } from '@/utils/apiBase';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/utils/useAuth';

// Shared state, not a private copy: the navbar previously resynced from a
// window event, so any missed event left it offering "Login" to a signed-in
// user.
const { user, userName, clearUser } = useAuth();

const router = useRouter();
const API_BASE = getApiBaseUrl();

const logout = async () => {
  const email = user.value?.email;

  try {
    await apiFetch(`${API_BASE}/api/logout`, { method: 'POST' });
  }
  catch {
    // ignore errors
  }

  if (email) {
    apiFetch(`${API_BASE}/api/track_logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: email }),
    }).catch(err => {
      console.error('Failed to track logout:', err);
    });
  }

  clearUser();
  router.push('/');
};
</script>

<template>
  <div class="navbar-actions">
    <NavbarThemeSwitcher />
    <AllReposButton />

    <VTooltip v-if="user" :text="userName" location="bottom">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          icon
          class="ms-2"
          aria-label="User account"
          @click="router.push('/profile')"
        >
          <VIcon icon="bx-user" />
        </VBtn>
      </template>
    </VTooltip>

    <VTooltip v-if="user" text="Log Out" location="bottom">
      <template #activator="{ props }">
        <VBtn v-bind="props" icon class="ms-2" aria-label="Log out" @click="logout">
          <VIcon icon="bx-log-out" />
        </VBtn>
      </template>
    </VTooltip>

    <!-- Signed out, the profile and log-out controls above are hidden; without
         this there is no way back to the sign-in page from the navbar. -->
    <VBtn v-else to="/login" variant="tonal" color="primary" class="ms-2" style="text-transform: none;">
      <template #prepend><VIcon icon="bx-log-in" /></template>
      Login
    </VBtn>
  </div>
</template>

<style scoped>
.navbar-actions {
  display: flex;
  align-items: center;
}
</style>
