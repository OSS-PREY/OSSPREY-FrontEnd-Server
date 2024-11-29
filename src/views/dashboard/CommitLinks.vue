<!-- src/components/CommitLinks.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: 120px;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12" order="2" order-sm="1">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Commit Summary
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <VRow class="d-flex align-center">
            <VCol cols="auto" class="d-flex align-center">
              <span>Total Commits:</span>
            </VCol>
            <VCol cols="auto" class="d-flex align-center">
              <VBtn
                color="primary"
                variant="outlined"
                class="ms-2"
                style="border-radius: 12px;"
                @click="viewCommits"
                :disabled="!commitMeasuresData"
              >
                Node
              </VBtn>
            </VCol>
          </VRow>
          <VRow class="mt-2">
            <VCol>
              <span v-if="commitMeasuresData">
                {{ commitMeasuresData.num_commits }}
              </span>
              <span v-else-if="commitMeasuresLoading">
                Loading...
              </span>
              <span v-else-if="commitMeasuresError" class="text-error">
                {{ commitMeasuresError }}
              </span>
              <span v-else>
                No Data
              </span>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup>
import { useTheme } from 'vuetify';
import { VBtn } from 'vuetify/components';

const { global } = useTheme();
import { computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';

const projectStore = useProjectStore();

const commitMeasuresData = computed(() => projectStore.commitMeasuresData);
const commitMeasuresLoading = computed(() => projectStore.commitMeasuresLoading);
const commitMeasuresError = computed(() => projectStore.commitMeasuresError);

// Placeholder function for viewing commits
const viewCommits = () => {
  // Implement navigation or modal to show commit links if available
  // For example, navigate to a detailed commits page
  alert('View Commits feature is not implemented yet.');
};
</script>
