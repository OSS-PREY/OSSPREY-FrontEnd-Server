<template>
  <div class="section-header d-flex align-center">
    <VTooltip
      :text="tooltip"
      location="top"
      open-delay="150"
      transition="fade-transition"
    >
      <template #activator="{ props }">
        <h2 class="section-title mb-0" v-bind="props" :title="tooltip">
          {{ title }}
        </h2>
      </template>
    </VTooltip>
  </div>
</template>

<script setup>
import { VTooltip } from 'vuetify/components';

defineProps({
  title: {
    type: String,
    required: true,
  },
  tooltip: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.section-header {
  gap: 8px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-heading));
}
</style>
