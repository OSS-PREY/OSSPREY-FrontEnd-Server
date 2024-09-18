<script setup>
import { hexToRgb } from '@core/utils/colorConverter';
import {
  useDisplay,
  useTheme,
} from 'vuetify';

const vuetifyTheme = useTheme()
const display = useDisplay()
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 400px;">
    <VRow no-gutters>
      <VCol
        cols="12"
        sm="12"
        xl="12"
        :class="$vuetify.display.smAndUp ? 'border-e' : 'border-b'"
      >

      <VCardItem class="pb-3">
        <VCardTitle class="text-primary">
          Social Network
        </VCardTitle>
      </VCardItem>

      <!-- Image replacement for the bar chart -->
      <VCardText style="height: 100%;">
        <VRow class="mb-1" style="height: 90%;">
          <VCol cols="12" class="d-flex align-items-center">
            
          </VCol>
        </VRow>
      </VCardText>

      </VCol>
    </VRow>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss"
</style>
