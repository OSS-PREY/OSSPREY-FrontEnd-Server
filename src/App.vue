<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ChatWidget from '@/components/ChatWidget.vue';

const route = useRoute();
const isAuthenticated = ref(false);

const updateAuthenticationState = () => {
  try {
    isAuthenticated.value = Boolean(localStorage.getItem('user'));
  }
  catch (error) {
    console.error('Failed to read authentication state', error);
    isAuthenticated.value = false;
  }
};

onMounted(() => {
  updateAuthenticationState();
  window.addEventListener('storage', updateAuthenticationState);
  window.addEventListener('user-auth-changed', updateAuthenticationState);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateAuthenticationState);
  window.removeEventListener('user-auth-changed', updateAuthenticationState);
});

watch(
  () => route.fullPath,
  () => {
    updateAuthenticationState();
  },
);

const shouldShowChat = computed(() => isAuthenticated.value);
</script>

<template>
  <VApp>
    <RouterView />
    <ChatWidget v-if="shouldShowChat" />
    <!-- <UpgradeToPro /> -->
  </VApp>
</template>
