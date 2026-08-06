<script setup>
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';
import AllReposButton from '@/layouts/components/AllReposButton.vue';
import { getApiBaseUrl } from '@/utils/apiBase';
import { apiFetch } from '@/utils/apiFetch';

const user = ref(null);
const router = useRouter();
const API_BASE = getApiBaseUrl();

const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem('user');
    user.value = stored ? JSON.parse(stored) : null;
  }
  catch {
    user.value = null;
  }
};

const handleStorage = event => {
  if (!event || event.key === 'user')
    loadUserFromStorage();
};

onMounted(() => {
  loadUserFromStorage();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('user-auth-changed', loadUserFromStorage);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorage);
  window.removeEventListener('user-auth-changed', loadUserFromStorage);
});

const userName = computed(() => user.value?.name || user.value?.email || '');

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

  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  window.dispatchEvent(new Event('user-auth-changed'));
  user.value = null;
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
