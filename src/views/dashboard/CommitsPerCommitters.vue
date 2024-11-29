<!-- src/components/CommitsPerCommitter.vue -->

<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Commits per Committer</h6>
            <br>
          </div>
          <div class="d-flex">
            <span v-if="commitsPerCommitter !== null">{{ commitsPerCommitter }}</span>
            <span v-else-if="commitMeasuresLoading">N/A</span>
            <span v-else-if="commitMeasuresError" class="text-error">
              {{ commitMeasuresError }}
            </span>
            <span v-else>
              Data Unavailable
            </span>
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
  return commitMeasuresData.value ? commitMeasuresData.value.commit_per_dev : null;
});
</script>
