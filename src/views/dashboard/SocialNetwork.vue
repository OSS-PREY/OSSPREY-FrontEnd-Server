<script setup>
import { hexToRgb } from '@core/utils/colorConverter';
import {
  useDisplay,
  useTheme,
} from 'vuetify';

const vuetifyTheme = useTheme()
const display = useDisplay()

const balanceData = [
  {
    icon: 'bx-dollar',
    amount: '$2.54k',
    year: '2023',
    color: 'primary',
  },
  {
    icon: 'bx-wallet',
    amount: '$4.21k',
    year: '2022',
    color: 'info',
  },
]

const moreList = [
  {
    title: 'Share',
    value: 'Share',
  },
  {
    title: 'Refresh',
    value: 'Refresh',
  },
  {
    title: 'Update',
    value: 'Update',
  },
]
</script>

<template>
  <VCard>
    <VRow no-gutters>
      <VCol
        cols="12"
        sm="12"
        xl="12"
        :class="$vuetify.display.smAndUp ? 'border-e' : 'border-b'"
      >
        <VCardItem class="pb-0">
          <VCardTitle>Social Network</VCardTitle>

          <template #append>
            <MoreBtn :menu-list="moreList" />
          </template>
        </VCardItem>

        <!-- Image replacement for the bar chart -->
        <VCardText class="pb-0">
          <img 
            src="/social_net.png" 
            alt="Social Network Diagram"
            style="width: 100%; height: auto; object-fit: contain;" 
          />
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss"
</style>
