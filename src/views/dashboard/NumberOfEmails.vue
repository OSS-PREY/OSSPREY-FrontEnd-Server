<!-- src/components/NumberOfEmails.vue -->

<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); height: 150px;">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Number of Issues/Emails</h6>
            <br>
          </div>
          <div class="d-flex">
            <span v-if="numEmails !== null">{{ numEmails }}</span>
            <span v-else="commitMeasuresLoading"></span>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup>
import { computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardText, VRow, VCol } from 'vuetify/components';

const projectStore = useProjectStore();

const emailMeasuresData = computed(() => projectStore.emailMeasuresData);
const emailMeasuresLoading = computed(() => projectStore.emailMeasuresLoading);
const emailMeasuresError = computed(() => projectStore.emailMeasuresError);

const numEmails = computed(() => {
  if (projectStore.isLocalMode) {
    if (!projectStore.reducedEmails || projectStore.reducedEmails.length === 0) return 0;
    return projectStore.reducedEmails.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  }

  // Foundation Mode: Use API Data
  return emailMeasuresData.value ? emailMeasuresData.value.num_emails : null;
});
</script>
