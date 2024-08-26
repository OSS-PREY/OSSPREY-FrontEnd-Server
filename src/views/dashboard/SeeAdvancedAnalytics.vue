<script setup>
import { useTheme } from 'vuetify';
import { VCard, VCardText, VCol, VRow } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="statistics-card" style="width: 100%; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText class="text-center d-flex align-center justify-center" style="height: 100%;">
      <VRow justify="center" class="w-100">
        <VCol cols="auto" class="text-center">
          <h6 class="text-h6 font-weight-medium mb-0">See Advanced Analytics</h6>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.statistics-card {
  height: 100%;
}

.text-center {
  text-align: center;
  font-style: italic;
}
</style>
