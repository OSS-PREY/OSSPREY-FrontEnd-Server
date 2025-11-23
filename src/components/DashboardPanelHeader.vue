<template>
  <div class="section-header d-flex align-center">
    <h2 class="section-title mb-0">{{ title }}</h2>
    <VBtn
      class="tooltip-btn"
      variant="text"
      size="small"
      icon
      :title="tooltip"
      :aria-label="`${title} info`"
    >
      <VIcon icon="mdi-information-outline" />
      <VTooltip
        activator="parent"
        :text="tooltip"
        location="top"
        open-delay="150"
        transition="fade-transition"
      />
    </VBtn>
  </div>
</template>

<script setup>
import { VBtn, VIcon, VTooltip } from 'vuetify/components';

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
  color: rgb(var(--v-theme-primary));
}

.tooltip-btn {
  color: rgb(var(--v-theme-primary));
  min-width: 0;
}
</style>
