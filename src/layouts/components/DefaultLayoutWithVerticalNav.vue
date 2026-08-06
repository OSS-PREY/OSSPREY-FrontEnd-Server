<script setup>
import AppNavbar from '@/layouts/components/AppNavbar.vue'
import Footer from '@/layouts/components/Footer.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
</script>

<template>
  <div class="layout-container">
    <div class="layout-background"></div>

    <!-- Lets keyboard and screen-reader users jump past the navbar. Visible
         only while focused. -->
    <a class="skip-to-content" href="#main-content">Skip to main content</a>

    <VerticalNavLayout>
      <!-- 👉 Navbar: every page on this layout gets the same navigation.
           Previously each page rendered its own header, so pages that forgot
           to (profile, account settings) had no way out. -->
      <template #navbar>
        <AppNavbar />
      </template>

      <!-- 👉 Pages -->
      <slot />

      <!-- 👉 Footer -->
      <template #footer>
        <Footer />
      </template>
    </VerticalNavLayout>
  </div>
</template>

<style scoped>
.skip-to-content {
  position: absolute;
  z-index: 1000;
  padding: 0.5rem 1rem;
  border-radius: 0 0 6px 0;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  transform: translateY(-150%);
}

.skip-to-content:focus {
  transform: translateY(0);
}
</style>
