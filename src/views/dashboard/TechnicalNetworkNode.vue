<template>
    <VCard class="text-center text-sm-start" style="height: 120px;"> <!-- Reduced height to 30% -->
      <VRow no-gutters style="height: 100%;">
        <VCol
          cols="12"
          sm="12"
          order="2"
          order-sm="1"
        >
          <VCardItem class="pb-3">
            <VCardTitle class="text-primary">
              Commit Links
            </VCardTitle>
          </VCardItem>
  
          <VCardText>
            <VRow class="d-flex align-center">
              <VCol cols="auto" class="d-flex align-center">
                <span>You are exploring the node:</span>
              </VCol>
              <VCol cols="auto" class="d-flex align-center">
                <VBtn
                  color="primary"
                  variant="outlined"
                  class="ms-2"
                  style="border-radius: 12px;"
                >
                  {{ projectName }}
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCol>
      </VRow>
    </VCard>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useProjectStore } from '@/stores/projectStore';
  import { VCard, VCardText, VCol, VRow, VBtn } from 'vuetify/components';
  
  const projectStore = useProjectStore();
  
  // Extract the `project_name` or provide a fallback if `selectedProject` is null/undefined
  const projectName = computed(() => {
    return projectStore.selectedProject?.project_name || 'No Project Selected';
  });
  </script>
  