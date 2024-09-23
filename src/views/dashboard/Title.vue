<script setup>
import { useTheme } from 'vuetify';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'; // Import the theme switcher component
import { VCol } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 80px;">
    <VRow no-gutters style="height: 100%;" class="align-center">
      
      <!-- Center-aligned Title -->
      <VCol class="d-flex align-items-center justify-content-center flex-grow-1">
        <VCardTitle class="text-primary">
          ASFI Project Explorer (APEX)
        </VCardTitle>
      </VCol>

      <!-- Right-aligned Theme Switcher button -->
      <VCol class="d-flex align-items-center justify-content-end" style="max-width: 50px;">
        <NavbarThemeSwitcher class="me-2" />
      </VCol>

    </VRow>
  </VCard>
</template>
