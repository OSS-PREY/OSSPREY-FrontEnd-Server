<script setup>
import Footer from '@/layouts/components/Footer.vue';
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue';
</script>

<template>
  <div class="layout-container">
    <div class="layout-background"></div> 
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
