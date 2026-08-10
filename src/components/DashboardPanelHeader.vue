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

      <!-- Panels with more to say than one sentence pass markup here; the
           `tooltip` string still covers the plain case. -->
      <template v-if="$slots.tooltip" #default>
        <div class="section-tooltip"><slot name="tooltip" /></div>
      </template>
    </VTooltip>

    <slot name="action" />
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

/* Room to read a legend or a couple of lines without the tooltip going
   full-width across the dashboard. */
.section-tooltip {
  max-inline-size: 22rem;
  padding-block: 2px;
  line-height: 1.45;
  text-align: start;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-heading));
}
</style>
