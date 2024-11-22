<!-- src/components/CommitsPerCommitter.vue -->

<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Commits per Committer</h6>
            <br />
          </div>
          <div class="d-flex">
            <span v-if="commitsPerCommitter !== null">{{ commitsPerCommitter }}</span>
            <span v-else>Loading...</span>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardText, VCol, VRow } from 'vuetify/components';

const projectStore = useProjectStore();

const commitsPerCommitter = ref(null);

const fetchData = () => {
  if (projectStore.commitMeasuresData && projectStore.commitMeasuresData.commit_per_dev !== undefined) {
    commitsPerCommitter.value = projectStore.commitMeasuresData.commit_per_dev;
  } else {
    commitsPerCommitter.value = null;
  }
};

// Watch for changes in commit measures data
watch(
  () => projectStore.commitMeasuresData,
  () => {
    fetchData();
  }
);

// Watch for changes in selected project and month to fetch new data
watch(
  () => [projectStore.selectedProject, projectStore.selectedMonth],
  ([newProject, newMonth]) => {
    if (newProject && newMonth !== null && newMonth !== undefined && !isNaN(newMonth)) {
      projectStore.fetchCommitMeasuresData(newProject.project_id, newMonth);
    } else {
      commitsPerCommitter.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Add any styles if needed */
</style>
