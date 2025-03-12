<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); height: 150px;">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Number of Commits</h6>
            <br>
          </div>
          <div class="d-flex">
            <span v-if="numCommits !== null">{{ numCommits }}</span>
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

const commitMeasuresData = computed(() => projectStore.commitMeasuresData);
const commitMeasuresLoading = computed(() => projectStore.commitMeasuresLoading);
const commitMeasuresError = computed(() => projectStore.commitMeasuresError);

// Compute the total number of commits, adapting for local and foundation modes
const numCommits = computed(() => {
  if (projectStore.isLocalMode) {
    if (!projectStore.reducedCommits || projectStore.reducedCommits.length === 0) return 0;
    return projectStore.reducedCommits.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  }

  // Foundation Mode: Use API Data
  return commitMeasuresData.value ? commitMeasuresData.value.num_commits : null;
});
</script>
