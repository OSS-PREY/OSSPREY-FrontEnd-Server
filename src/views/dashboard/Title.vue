<script setup>
import { useTheme } from 'vuetify';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'; // Import the theme switcher component
import { VCol } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="statistics-card">
    <VCardText class="d-flex align-center justify-center" style="height: 80px;">
      <div class="d-flex align-center justify-center" style="gap: 20px;">
        <!-- Logo + Title -->
        <VCardTitle class="text-primary font-weight-bold d-flex align-center mb-0">
          <img
            src="/ospex-logo.png"
            alt="OSPEx Logo"
            style="height: 32px; width: auto; margin-right: 10px;"
          />
          OSSPREY (Open Source Software PRojEct sustainabilitY tracker)
        </VCardTitle>

        <!-- Theme Switcher -->
        <NavbarThemeSwitcher class="me-2" />
      </div>
    </VCardText>
  </VCard>
</template>
