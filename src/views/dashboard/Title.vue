<script setup>
import NavbarActions from '@/layouts/components/NavbarActions.vue';
import NavbarBranding from '@/layouts/components/NavbarBranding.vue';
</script>

<template>
  <VCard class="statistics-card hover-elevate">
    <VCardText class="header-container" style="height: 80px;">
      
      <!-- Logo + Title -->
      <div class="title-container">
        <VCardTitle class="d-flex align-center mb-0">
          <NavbarBranding />
        </VCardTitle>
      </div>

      <!-- Action Icons -->
      <div class="actions-container">
        <NavbarActions />
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

.actions-container {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .title-container {
    padding-right: 120px;
  }
}
</style>