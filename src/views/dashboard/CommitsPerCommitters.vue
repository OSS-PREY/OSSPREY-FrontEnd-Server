<!-- src/components/CommitsPerCommitter.vue -->

<template>
  <VCard class="mx-auto hover-elevate" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); height: 150px;">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Commits per Committer</h6>
            <br>
          </div>
          <div class="d-flex">
            <span v-if="commitsPerCommitter !== null">{{ commitsPerCommitter }}</span>
            <span v-else-if="commitMeasuresLoading"></span>
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

const commitsPerCommitter = computed(() => {
  if (projectStore.isLocalMode) {
    // Both halves come from the commit links, so this is commits per person
    // rather than file changes per network node.
    const committers = projectStore.monthCommitterCount;

    return committers > 0 ? Math.round(projectStore.monthCommitCount / committers) : 0;
  }

  // Foundation Mode: Use API Data
  return commitMeasuresData.value ? commitMeasuresData.value.commit_per_dev : null;
});
</script>
