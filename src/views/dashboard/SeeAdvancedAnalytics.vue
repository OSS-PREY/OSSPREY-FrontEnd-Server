<script setup>
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { VCard, VCardText, VCol, VRow, VBtn } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="statistics-card" style="width: 100%; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <!-- Card Header with Collapse Button -->
    <VCardText class="text-center d-flex align-center justify-center" style="height: 100%;">
      <VRow class="w-100 align-center justify-center">
        <VCol cols="auto">
          <h6 class="text-h6 font-weight-medium mb-0 text-center">See Advanced Analytics</h6>
        </VCol>
        <!-- Arrow Button to Toggle Collapse -->
        <VCol class="text-right" cols="auto">
          <VBtn icon @click="$emit('toggleCollapse')">
            <i :class="isCollapsed ? 'bx bx-chevron-down' : 'bx bx-chevron-up'"></i>
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.statistics-card {
  height: auto;
}
.text-center {
  text-align: center;
  font-style: italic;
}
</style>
