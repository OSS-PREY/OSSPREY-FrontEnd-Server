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



<!-- <template>
  <VCard class="statistics-card">
    <VCardText class="text-center d-flex align-center justify-center" style="height: 80px;">
        <VRow class="w-100 align-center justify-center">
            <VCol class="auto">
                <VCardTitle class="text-primary font-weight-bold d-flex align-center">
                    <img
                      src="/ospex-logo.png"
                      alt="OSPEx Logo"
                      style="height: 32px; width: auto; margin-right: 10px;"
                    />
                    OSPEx (Open Source Project Explorer)
                 </VCardTitle>
            </VCol>
            <VCol class="justify-content-end" style="max-width: 70px;">
                <NavbarThemeSwitcher class="me-2" />
            </VCol>
        </VRow>
    </VCardText>
  </VCard>
</template> -->
