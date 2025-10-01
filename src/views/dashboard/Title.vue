<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';

const user = ref(null);
const router = useRouter();
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ossprey.ngrok.app').replace(/\/$/, '');

// Reactive variable to track viewport width
const isMobileView = ref(window.innerWidth < 768);

// Function to update viewport state
const updateViewport = () => {
  isMobileView.value = window.innerWidth < 768;
};

// Add and remove event listener on component lifecycle
onMounted(() => {
  window.addEventListener('resize', updateViewport);
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      user.value = JSON.parse(stored);
    }
    catch {
      // ignore parse errors
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport);
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
  user.value = null;
  router.push('/');
};
</script>

<template>
  <VCard class="statistics-card">
    <VCardText class="header-container" style="height: 80px;">
      
      <!-- Logo + Title -->
      <div class="title-container">
        <VCardTitle class="text-primary font-weight-bold d-flex align-center mb-0">
          <img
            src="/ospex-logo.png"
            alt="OSPEx Logo"
            style="height: 32px; width: auto; margin-right: 10px;"
          />

          <span v-if="isMobileView">OSSPREY</span>
          <span v-else>OSSPREY (Open Source Software PRojEct sustainabilitY tracker)</span>
        </VCardTitle>
      </div>

      <!-- Action Icons -->
      <div class="actions-container">
        <NavbarThemeSwitcher />

        <VTooltip v-if="user" :text="userName" location="bottom">
          <template #activator="{ props }">
            <VBtn v-bind="props" icon class="ms-2">
              <VIcon icon="bx-user" />
            </VBtn>
          </template>
        </VTooltip>

        <VTooltip v-if="user" text="Log Out" location="bottom">
          <template #activator="{ props }">
            <VBtn v-bind="props" icon class="ms-2" @click="logout">
              <VIcon icon="bx-log-out" />
            </VBtn>
          </template>
        </VTooltip>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.header-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.title-container {
  text-align: center;
}

.actions-container {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .title-container {
    padding-right: 120px;
  }
}
</style>