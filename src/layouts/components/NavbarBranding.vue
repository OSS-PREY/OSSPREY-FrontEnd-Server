<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isMobileView = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

const updateViewport = () => {
  if (typeof window === 'undefined')
    return;

  isMobileView.value = window.innerWidth < 768;
};

onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport);
});
</script>

<template>
  <div class="navbar-branding" aria-label="OSSPREY branding">
    <img
      src="/ospex-logo.png"
      alt="OSSPREY logo"
      class="navbar-branding__logo"
    />
    <span class="navbar-branding__name">
      {{ isMobileView ? 'OSSPREY' : 'OSSPREY (Open Source Software PRojEct sustainabilitY tracker)' }}
    </span>
  </div>
</template>

<style scoped>
.navbar-branding {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.navbar-branding__logo {
  height: 32px;
  width: auto;
}

.navbar-branding__name {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  line-height: 1.25;
}
</style>
