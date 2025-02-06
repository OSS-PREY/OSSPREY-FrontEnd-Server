<!-- src/components/TechnicalNetworkNode.vue -->
<template>
  <VCard class="text-center text-sm-start" style="height: 120px;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12" order="2" order-sm="1">
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
                @click="openDialog"
                :disabled="!selectedNodeName"
              >
                {{ selectedNodeName || 'Select a Developer' }}
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  
    <!-- Dialog for displaying commit links -->
    <VDialog v-model="dialog" max-width="800">
      <VCard>
        <VCardTitle class="text-h5">
          Commit Links for {{ selectedNodeName }}
        </VCardTitle>
        <VCardText>
          <VDataTable
            :headers="headers"
            :items="commitLinks"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.commit="{ item }">
              <a :href="item.link" target="_blank" rel="noopener noreferrer">
                Commit
              </a>
            </template>
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
          </VDataTable>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" @click="dialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>
  
<script setup>
import { ref, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardText, VCol, VRow, VBtn, VDialog, VDataTable, VSpacer, VCardTitle, VCardItem, VCardActions } from 'vuetify/components';
  
const projectStore = useProjectStore();
const dialog = ref(false);
const commitLinks = ref([]);
const loading = ref(false);
  
// Define table headers
const headers = [
  { title: 'Commit', key: 'commit' },
  { title: 'Date Time', key: 'date' },
];
  
// Use the dedicated technical developer state
const selectedNodeName = computed(() => projectStore.selectedTechnicalDeveloper);
  
/**
 * Formats the date string to a more readable format.
 * @param {string} dateStr - The original date string from the API.
 * @returns {string} - The formatted date string.
 */
const formatDate = (dateStr) => {
  const options = { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  };
  const date = new Date(dateStr);
  if (isNaN(date)) return 'Invalid Date';
  return date.toLocaleString(undefined, options);
};
  
/**
 * Opens the dialog and fetches commit links for the selected developer.
 */
const openDialog = async () => {
  if (!selectedNodeName.value) return;
  
  dialog.value = true;
  loading.value = true;
  
  try {
    const projectId = projectStore.selectedProject?.project_id;
    const month = projectStore.selectedMonth;
    const developerName = selectedNodeName.value;
  
    if (projectId && month !== null && month !== undefined && !isNaN(month)) {
      await projectStore.fetchCommitLinksData(projectId, month, developerName);
      commitLinks.value = projectStore.commitLinksData || [];
    } else {
      commitLinks.value = [];
    }
  } catch (error) {
    console.error('Error fetching commit links:', error);
    commitLinks.value = [];
  } finally {
    loading.value = false;
  }
};
  
/**
 * Opens the commit link in a new tab.
 * @param {string} link - The URL to open.
 */
const openCommit = (link) => {
  if (link) {
    window.open(link, '_blank');
  }
};
  
// Watch for changes in selectedTechnicalDeveloper to reset commitLinks and fetch new data
watch(
  () => projectStore.selectedTechnicalDeveloper,
  (newDeveloper, oldDeveloper) => {
    console.log(`Selected Technical Developer changed from ${oldDeveloper} to ${newDeveloper}`);
    if (newDeveloper && newDeveloper !== oldDeveloper) {
      commitLinks.value = []; // Clear existing commit links
      openDialog(); // Fetch new commit links for the selected technical developer
    }
  }
);
</script>
  
<style scoped lang="scss">
/* Add any component-specific styles here */
</style>
