<script setup>
import { useTheme } from 'vuetify';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'; // Import the theme switcher component
import { VCol } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="statistics-card">
    <VCardText class="text-center d-flex align-center justify-center" style="height: 80px;">
        <VRow class="w-100 align-center justify-center">
             <!-- Center-aligned Title -->
            <VCol class="auto">
                <VCardTitle class="text-primary font-weight-bold">ASFI Project Explorer (APEX)</VCardTitle>
            </VCol>

            <!-- Right-aligned Theme Switcher button -->
            <VCol class="justify-content-end" style="max-width: 70px;">
                <NavbarThemeSwitcher class="me-2" />
            </VCol>
        
        </VRow>
    </VCardText>
    
  </VCard>
</template>
