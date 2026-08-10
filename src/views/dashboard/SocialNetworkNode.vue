<template>
  <VCard class="text-center text-sm-start hover-elevate" style="height: 120px;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12" order="2" order-sm="1">
        <!-- Header -->
        <VCardItem class="pb-3">
          <DashboardPanelHeader
            title="Email Links"
            tooltip="Summarizes communication activity for the selected developer: number of messages, senders involved, and interaction frequency. Useful for understanding individual participation trends over time."
          />
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

    <!-- Dialog for displaying email links -->
    <VDialog v-model="dialog" max-width="800">
      <VCard>
        <VCardTitle class="text-h5">
          Email Links for {{ selectedNodeName }}
        </VCardTitle>
        <VCardText>
          <VDataTable
            :headers="headers"
            :items="emailLinks"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.commit="{ item }">
              <a :href="item.link" target="_blank" rel="noopener noreferrer">
                Mail
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
import DashboardPanelHeader from '@/components/DashboardPanelHeader.vue';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardText, VCol, VRow, VBtn, VDialog, VDataTable, VSpacer, VCardTitle, VCardItem, VCardActions } from 'vuetify/components';

const projectStore = useProjectStore();
const dialog = ref(false);
const emailLinks = ref([]);
const loading = ref(false);

// Define table headers
const headers = [
  { title: 'Mail', key: 'commit' },
  { title: 'Date Time', key: 'date' },
];

// Use the dedicated social developer state
const selectedNodeName = computed(() => projectStore.selectedSocialDeveloper);

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
 * Opens the dialog and fetches email links for the selected developer.
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
      await projectStore.fetchEmailLinksData(projectId, month, developerName);
      emailLinks.value = projectStore.emailLinksData || [];
    } else {
      emailLinks.value = [];
    }
  } catch (error) {
    console.error('Error fetching email links:', error);
    emailLinks.value = [];
  } finally {
    loading.value = false;
  }
};
// Watch for changes in selectedSocialDeveloper to reset emailLinks and fetch new data
watch(
  () => projectStore.selectedSocialDeveloper,
  (newDeveloper, oldDeveloper) => {
    console.log(`Selected Social Developer changed from ${oldDeveloper} to ${newDeveloper}`);
    if (newDeveloper && newDeveloper !== oldDeveloper) {
      emailLinks.value = []; // Clear existing email links
      openDialog(); // Fetch new email links for the selected social developer
    }
  }
);
</script>

<style scoped lang="scss">
a {
  color: rgb(var(--v-theme-link));
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
