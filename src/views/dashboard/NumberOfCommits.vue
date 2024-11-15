<script setup>
import { ref, onMounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardText, VCol, VRow } from 'vuetify/components';

const { global } = useTheme();
const projectStore = useProjectStore();

// State variables
const loading = ref(true);
const error = ref(null);
const totalCommits = ref(0);

// Correct API Base URL
const apiBaseUrl = 'https://oss-backend-8stu.onrender.com';

// Watch for changes in the selected project to fetch commit data
watch(
  () => projectStore.selectedProject,
  (newProject) => {
    if (newProject) {
      fetchCommitData();
    }
  },
  { immediate: true }
);

// Function to fetch commit data for the selected project
const fetchCommitData = async () => {
  loading.value = true;
  error.value = null; // Reset error state

  try {
    // Construct the correct API endpoint
    const projectName = projectStore.selectedProject.toLowerCase().replace(/\s+/g, '-');
    const response = await fetch(`${apiBaseUrl}/api/tech_net/other/${projectName}?month_index=0`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Project not found.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    totalCommits.value = data.total_commits;
  } catch (err) {
    console.error('Error fetching commit data:', err);
    error.value = err.message || 'Failed to fetch commit data.';
  } finally {
    loading.value = false;
  }
};

// Fetch commit data when the component mounts if a project is already selected
onMounted(() => {
  if (projectStore.selectedProject) {
    fetchCommitData();
  }
});
</script>

<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Number of Commits</h6>
            <br>
          </div>
          <div class="d-flex">
            <span v-if="loading">Loading...</span>
            <span v-else-if="error" class="text-error">{{ error }}</span>
            <span v-else>{{ totalCommits }}</span>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
