<script setup>
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { VCard, VCardText, VCol, VRow, VBtn } from 'vuetify/components';
import { defineEmits } from 'vue';

const { global } = useTheme();

// Define emits for the component
const emit = defineEmits(['toggleCollapse']);

// State to track the collapse state
const isCollapsed = ref(false);

// Function to toggle the collapse state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('toggleCollapse'); // Emit the event to notify parent components
};
</script>

<template>
  <VCard class="statistics-card">
    <!-- Card Header with Collapse Button -->
    <VCardText class="text-center d-flex align-center justify-center" style="height: 100%;">
      <VRow class="w-100 align-center justify-center">
        <VCol cols="auto">
          <h6 class="text-h6 font-weight-medium mb-0 text-center">See Advanced Analytics</h6>
        </VCol>
        <!-- Arrow Button to Toggle Collapse -->
        <VCol class="text-right" cols="auto">
          <VBtn icon @click="toggleCollapse">
            <i :class="isCollapsed ? 'bx bx-chevron-up' : 'bx bx-chevron-down'"></i>
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
