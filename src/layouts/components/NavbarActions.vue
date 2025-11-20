<script setup>
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';
import AllReposButton from '@/layouts/components/AllReposButton.vue';

const user = ref(null);
const router = useRouter();
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '');

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
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
  }
  catch {
    // ignore errors
  }

  if (email) {
    fetch(`${API_BASE}/api/track_logout`, {
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
  </div>
</template>

<style scoped>
.navbar-actions {
  display: flex;
  align-items: center;
}
</style>
