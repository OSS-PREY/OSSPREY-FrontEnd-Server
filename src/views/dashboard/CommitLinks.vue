<!-- src/components/CommitLinks.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: auto;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Commit Link
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <VRow class="d-flex align-center">
            <VCol cols="auto" class="d-flex align-center">
              <span>Current Node:</span>
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
        </VCardText>
      </VCol>
    </VRow>

    <!-- Dialog for Commit Links -->
    <VDialog v-model="dialogVisible" max-width="800">
      <VCard>
        <VCardTitle>
          Commits by {{ selectedDeveloper }}
        </VCardTitle>
        <VCardText>
          <div v-if="commitLinksLoading">
            <VProgressCircular indeterminate color="primary" size="50"></VProgressCircular>
            Loading commits...
          </div>
          <div v-else-if="commitLinksError">
            {{ commitLinksError }}
          </div>
          <div v-else-if="commitLinksData && commitLinksData.length">
            <VSimpleTable>
              <thead>
                <tr>
                  <th>Date and Time</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="commit in commitLinksData" :key="commit.link">
                  <td>{{ commit.human_date_time }}</td>
                  <td>
                    <a :href="commit.link" target="_blank">{{ commit.link }}</a>
                  </td>
                </tr>
              </tbody>
            </VSimpleTable>
          </div>
          <div v-else>
            No commits found for {{ selectedDeveloper }}.
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer></VSpacer>
          <VBtn color="primary" text @click="closeDialog">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { useTheme } from 'vuetify';
import {
  VBtn,
  VCard,
  VCardTitle,
  VCardText,
  VCardItem,
  VRow,
  VCol,
  VDialog,
  VCardActions,
  VSpacer,
  VProgressCircular,
} from 'vuetify/components';

const { global } = useTheme();
import { ref, computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';

const projectStore = useProjectStore();

const commitMeasuresData = computed(() => projectStore.commitMeasuresData);
const commitMeasuresLoading = computed(() => projectStore.commitMeasuresLoading);
const commitMeasuresError = computed(() => projectStore.commitMeasuresError);

const commitLinksData = computed(() => projectStore.commitLinksData);
const commitLinksLoading = computed(() => projectStore.commitLinksLoading);
const commitLinksError = computed(() => projectStore.commitLinksError);
const selectedDeveloper = computed(() => projectStore.selectedDeveloper);

const dialogVisible = ref(false);

const viewCommits = () => {
  console.log("something", selectedDeveloper);
  if (selectedDeveloper.value) {
    console.log("something", selectedDeveloper);
    // Dialog is displayed, data should be fetched via watcher in store
    dialogVisible.value = true;
  } else {
    alert('Please select a developer in the Technical Network.');
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};
</script>
