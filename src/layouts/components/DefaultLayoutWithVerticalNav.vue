<script setup>
import Footer from '@/layouts/components/Footer.vue';
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue';
</script>

<template>
  <div class="layout-container">
    <VerticalNavLayout>
    <!-- 👉 navbar -->
    <!-- <template #navbar="{ toggleVerticalOverlayNavActive }"> -->
      <!-- <div class="d-flex h-100 w-100 align-center position-relative"> -->
        
        <!-- Left-aligned empty space for centering -->
        <!-- <div class="d-flex align-center">
          <Empty div to balance the left side -->
        <!-- </div> -->

        <!-- 👉 Project Title -->
        <!-- <div class="flex-grow-1 d-flex align-center justify-center position-absolute w-100">
          <span class="app-logo-title">ASFI Project Explorer (APEX)</span>
        </div> -->

        <!-- <VSpacer /> -->

        <!-- 👉 Search (Commented out) -->
        <!-- 
        <div
          class="d-flex align-center cursor-pointer ms-lg-n3"
          style="user-select: none;"
        >
          <IconBtn>
            <VIcon icon="bx-search" />
          </IconBtn>

          <span class="d-none d-md-flex align-center text-disabled ms-2">
            <span class="me-2">Search</span>
            <span class="meta-key">&#8984;K</span>
          </span>
        </div>
        -->

          <!-- Right-aligned section with Theme Switcher -->
          <!-- <div class="d-flex align-center ms-auto">
            <NavbarThemeSwitcher class="me-1" />
          </div> -->
        <!-- </div> -->
      <!-- </template> -->

      <!-- 👉 Pages -->
      <slot />

      <!-- 👉 Footer -->
      <template #footer>
        <Footer />
      </template>
    </VerticalNavLayout>
  </div>
</template>

<style lang="scss" scoped>
/* Container to hold the background */
.layout-container {
  position: relative;
  min-height: 100vh; /* Ensure it covers the viewport height */
  overflow: hidden; /* Hide any overflow from the pseudo-element */
}

/* Pseudo-element for background */
.layout-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/images/component.svg'); /* Ensure this path is correct */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.05; /* Adjust opacity as needed */
  z-index: -1; /* Place it behind the content */
}
</style>
