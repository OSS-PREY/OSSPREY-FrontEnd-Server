<script setup>
import { useTheme } from 'vuetify';
import { ref, onMounted, onUnmounted } from 'vue';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';
import { VCol } from 'vuetify/components';

const { global } = useTheme();

// Reactive variable to track viewport width
const isMobileView = ref(window.innerWidth < 768);

// Function to update viewport state
const updateViewport = () => {
  isMobileView.value = window.innerWidth < 768;
};

// Add and remove event listener on component lifecycle
onMounted(() => {
  window.addEventListener('resize', updateViewport);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport);
});
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
      
      <!-- Theme Switcher -->
      <div class="theme-switcher-container">
        <NavbarThemeSwitcher />
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

.theme-switcher-container {
  position: absolute;
  right: 16px; 
  top: 50%;
  transform: translateY(-50%);
}

@media (max-width: 767px) {
  .title-container {
    padding-right: 48px;
  }
}
</style>