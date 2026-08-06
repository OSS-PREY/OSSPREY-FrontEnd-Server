<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChatWidget from '@/components/ChatWidget.vue';
import { getApiBaseUrl } from '@/utils/apiBase';
import { apiFetch } from '@/utils/apiFetch';

const route = useRoute();
const router = useRouter();
const isAuthenticated = ref(false);
const showInactivityWarning = ref(false);
const warningCountdown = ref(0);

const INACTIVITY_LIMIT = 5 * 60 * 1000;
const WARNING_DURATION = 30 * 1000;

let warningTimeoutId = null;
let inactivityTimeoutId = null;
let warningIntervalId = null;

const API_BASE = getApiBaseUrl();

const updateAuthenticationState = () => {
  try {
    isAuthenticated.value = Boolean(localStorage.getItem('user'));
  }
  catch (error) {
    console.error('Failed to read authentication state', error);
    isAuthenticated.value = false;
  }
};

const clearWarningState = () => {
  showInactivityWarning.value = false;
  warningCountdown.value = 0;
  if (warningIntervalId) {
    clearInterval(warningIntervalId);
    warningIntervalId = null;
  }
};

const clearInactivityTimers = () => {
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
    warningTimeoutId = null;
  }
  if (inactivityTimeoutId) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = null;
  }
  clearWarningState();
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
  catch (error) {
    console.error('Failed to parse stored user', error);
    return null;
  }
};

const handleAutoLogout = async () => {
  if (!isAuthenticated.value)
    return;

  clearInactivityTimers();

  const storedUser = getStoredUser();
  const email = storedUser?.email;

  try {
    await apiFetch(`${API_BASE}/api/logout`, { method: 'POST' });
  }
  catch (error) {
    console.error('Failed to log out due to inactivity', error);
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
  window.dispatchEvent(new Event('user-auth-changed'));
  updateAuthenticationState();

  try {
    await router.push({
      path: '/login',
      query: { message: 'You have been logged out due to inactivity.' },
    });
  }
  catch (error) {
    console.error('Failed to redirect after inactivity logout', error);
  }
};

const triggerWarning = () => {
  warningCountdown.value = Math.floor(WARNING_DURATION / 1000);
  showInactivityWarning.value = true;
  if (warningIntervalId)
    clearInterval(warningIntervalId);

  warningIntervalId = window.setInterval(() => {
    warningCountdown.value = Math.max(0, warningCountdown.value - 1);
    if (warningCountdown.value === 0 && warningIntervalId) {
      clearInterval(warningIntervalId);
      warningIntervalId = null;
    }
  }, 1000);
};

const startInactivityTimers = () => {
  clearInactivityTimers();

  if (!isAuthenticated.value)
    return;

  if (INACTIVITY_LIMIT > WARNING_DURATION) {
    warningTimeoutId = window.setTimeout(() => {
      triggerWarning();
    }, INACTIVITY_LIMIT - WARNING_DURATION);
  }

  inactivityTimeoutId = window.setTimeout(() => {
    handleAutoLogout();
  }, INACTIVITY_LIMIT);
};

const resetInactivityTimer = () => {
  if (!isAuthenticated.value)
    return;

  startInactivityTimers();
};

const stayLoggedIn = () => {
  resetInactivityTimer();
};

const handleUserActivity = event => {
  if (!isAuthenticated.value)
    return;

  if (event?.type === 'visibilitychange' && document.visibilityState !== 'visible')
    return;

  resetInactivityTimer();
};

onMounted(() => {
  updateAuthenticationState();
  window.addEventListener('storage', updateAuthenticationState);
  window.addEventListener('user-auth-changed', updateAuthenticationState);

  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'visibilitychange'];
  activityEvents.forEach(eventName => {
    window.addEventListener(eventName, handleUserActivity);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateAuthenticationState);
  window.removeEventListener('user-auth-changed', updateAuthenticationState);

  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'visibilitychange'];
  activityEvents.forEach(eventName => {
    window.removeEventListener(eventName, handleUserActivity);
  });

  clearInactivityTimers();
});

watch(
  () => route.fullPath,
  () => {
    updateAuthenticationState();
  },
);

watch(
  isAuthenticated,
  value => {
    if (value)
      startInactivityTimers();
    else
      clearInactivityTimers();
  },
  { immediate: true },
);

const shouldShowChat = computed(() => isAuthenticated.value);
</script>

<template>
  <VApp>
    <RouterView />
    <ChatWidget v-if="shouldShowChat" />
    <VSnackbar
      v-model="showInactivityWarning"
      location="bottom right"
      timeout="0"
      persistent
    >
      <div class="d-flex flex-column">
        <span>You will be logged out in {{ warningCountdown }} seconds due to inactivity.</span>
        <small>Interact with the app to stay signed in.</small>
      </div>
      <template #actions>
        <VBtn variant="text" @click="stayLoggedIn">
          Stay Logged In
        </VBtn>
        <VBtn variant="text" color="error" @click="handleAutoLogout">
          Log Out Now
        </VBtn>
      </template>
    </VSnackbar>
    <!-- <UpgradeToPro /> -->
  </VApp>
</template>
