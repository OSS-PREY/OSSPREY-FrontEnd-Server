<script setup>
import Footer from '@/layouts/components/Footer.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
</script>

<template>
  <div class="layout-container">
    <div class="layout-background"></div>
    <VerticalNavLayout>
      <!-- 👉 Pages -->
      <slot />

      <!-- 👉 Footer -->
      <template #footer>
        <Footer />
      </template>
    </VerticalNavLayout>
  </div>
</template>
