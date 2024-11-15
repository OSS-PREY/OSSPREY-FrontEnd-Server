<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

const { global } = useTheme();
const projectStore = useProjectStore();

// State variables
const projects = ref([]);
const loadingProjects = ref(true);
const error = ref(null);

// API Base URL
const apiBaseUrl = 'https://oss-backend-8stu.onrender.com'; // Update to your backend's actual URL

// Fetch projects from backend
const fetchProjects = async () => {
  loadingProjects.value = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    // Use projects with valid GitHub repositories
    projects.value = data.projects.map(project => {
      return {
        ...project,
        name: project.project_name.replace(/^Apache\s+/i, '').trim(),
        github_repo_name: project.github_repo_name || ''
      };
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    error.value = 'Failed to fetch projects.';
  } finally {
    loadingProjects.value = false;
  }
};

// Function to format dates
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr; // Return original string if invalid date
  return date.toLocaleDateString();
};

// Compute slider min and max based on start and end dates
const sliderMin = computed(() => 0);
const sliderMax = computed(() => {
  if (projectStore.startDate && projectStore.endDate) {
    const startDate = new Date(projectStore.startDate);
    const endDate = new Date(projectStore.endDate);
    if (isNaN(startDate) || isNaN(endDate)) {
      return 100; // Default value
    }
    // Calculate the difference in months
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1; // +1 to include both months
    return months - 1; // Since slider starts at 0
  }
  return 100; // Default value if dates are not available
});

// Watch the selected project and update details
watch(
  () => projectStore.selectedProject,
  (newProject) => {
    if (newProject) {
      const selected = projects.value.find(p => p.name === newProject);
      if (selected) {
        projectStore.startDate = selected.start_date || 'N/A';
        projectStore.endDate = selected.end_date || 'N/A';
        projectStore.status = selected.status || 'N/A';
        projectStore.description = selected.description || 'N/A';
        projectStore.sponsor = selected.sponsor || 'N/A';
        projectStore.champion = selected.champion || 'N/A';
        projectStore.mentors = selected.mentors || [];
        projectStore.selectedProjectGithubName = selected.github_repo_name || '';
        projectStore.github_url = selected.github_url || '';

        // Update slider values
        projectStore.rangeValue = [0, sliderMax.value];
        projectStore.singleValue = 0;

        // Placeholder values for GitHub metrics
        projectStore.watchers = 123; // Replace with actual data later
        projectStore.forks = 456;    // Replace with actual data later
        projectStore.stars = 789;    // Replace with actual data later
      }
    } else {
      // Reset metrics if no project is selected
      projectStore.watchers = 0;
      projectStore.forks = 0;
      projectStore.stars = 0;
    }
  }
);

// Fetch projects on component mount
onMounted(() => {
  fetchProjects();
});
</script>


<template>
  <VCard class="text-center text-sm-start" style="height: 450px;">
    <VRow no-gutters>
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project Selector
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <!-- Loading Indicator -->
          <div v-if="loadingProjects">Loading projects...</div>
          <div v-else>
            <!-- Error Message -->
            <div v-if="error" class="text-error">{{ error }}</div>
            <!-- Dropdown for selecting a project -->
            <VSelect
              v-model="projectStore.selectedProject"
              :items="projects.map(p => p.name)"
              label="Project"
              class="mb-4"
              outlined
              dense
            />

            <!-- Display start date and end date -->
            <div v-if="projectStore.selectedProject">
              <div class="mt-2">
                <strong>Start Date:</strong> {{ formatDate(projectStore.startDate) }}
              </div>
              <div class="mt-2">
                <strong>End Date:</strong> {{ formatDate(projectStore.endDate) }}
              </div>
            </div>

            <!-- Checkbox to toggle between single value and range slider -->
            <VCheckbox
              v-model="projectStore.showRangeSlider"
              label="Enable Range Slider"
              class="mb-4"
            />

            <!-- Conditional rendering based on checkbox state -->
            <!-- Update :min and :max based on project data -->
            <VSlider
              v-if="projectStore.showRangeSlider"
              v-model="projectStore.rangeValue"
              range
              :min="sliderMin"
              :max="sliderMax"
              :step="1"
              class="mt-4"
              style="width: calc(100% - 10px); margin-right: 10px;"
              label="Select Range"
              ticks="always"
              tick-size="4"
              thumb-label
            />

            <VSlider
              v-else
              v-model="projectStore.singleValue"
              :min="sliderMin"
              :max="sliderMax"
              :step="1"
              class="mt-4"
              style="width: calc(100% - 10px); margin-right: 10px;"
              label="Select Month"
              ticks="always"
              tick-size="4"
              thumb-label
            />

            <!-- Styled GitHub Metrics -->
            <VCard class="metrics-container mt-4" outlined>
              <VRow align="center" justify="space-around">
                <VCol class="d-flex align-center" cols="auto">
                  <VIcon size="20">fa-solid fa-eye</VIcon>
                  <span class="ml-1">Watch: {{ projectStore.watchers }}</span>
                </VCol>
                <VCol class="d-flex align-center" cols="auto">
                  <VIcon size="20">fa-solid fa-code-fork</VIcon>
                  <span class="ml-1">Fork: {{ projectStore.forks }}</span>
                </VCol>
                <VCol class="d-flex align-center" cols="auto">
                  <VIcon size="20">fa-solid fa-star</VIcon>
                  <span class="ml-1">Star: {{ projectStore.stars }}</span>
                </VCol>
              </VRow>
            </VCard>

            <!-- Open Parallel Window button -->
            <VBtn variant="tonal" class="mt-6" size="small">
              Open Parallel Window
            </VBtn>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style scoped lang="scss">
@use "@configured-variables" as variables;
@use "@core/scss/template/mixins" as templateMixins;

.metrics-container {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  @include templateMixins.custom-elevation(var(--v-theme-primary), "sm");
}

.ml-1 {
  margin-left: 4px;
}
.mt-4 {
  margin-top: 16px;
}
</style>

