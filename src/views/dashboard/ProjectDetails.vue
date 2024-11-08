<script setup>
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

const { global } = useTheme();
const projectStore = useProjectStore();
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 400px;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project Details
          </VCardTitle>
        </VCardItem>

        <VCardText style="height: 100%;">
          <!-- About (Description) -->
          <VRow class="mb-1" style="height: 49%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>About:</strong>&nbsp; {{ projectStore.description || 'N/A' }}
            </VCol>
          </VRow>

          <!-- Status -->
          <VRow class="mb-1" style="height: 14%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>Status:</strong>&nbsp; {{ projectStore.status || 'N/A' }}
            </VCol>
          </VRow>

          <!-- Sponsor -->
          <VRow class="mb-1" style="height: 19%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>Sponsor:</strong>&nbsp; {{ projectStore.sponsor || 'N/A' }}
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>