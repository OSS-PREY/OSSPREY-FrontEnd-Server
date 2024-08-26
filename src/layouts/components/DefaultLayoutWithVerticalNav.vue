<script setup>
import Footer from '@/layouts/components/Footer.vue';
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue';
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue';
</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 w-100 align-center position-relative">
        
        <!-- Left-aligned empty space for centering -->
        <div class="d-flex align-center">
          <!-- Empty div to balance the left side -->
        </div>

        <!-- 👉 Project Title -->
        <div class="flex-grow-1 d-flex align-center justify-center position-absolute w-100">
          <span class="app-logo-title">ASFI Project Explorer (APEX)</span>
        </div>

        <VSpacer />

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
        <div class="d-flex align-center ms-auto">
          <NavbarThemeSwitcher class="me-1" />
        </div>
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.75rem;
}

.app-logo-title {
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.75rem;
  text-transform: uppercase;
}
</style>
