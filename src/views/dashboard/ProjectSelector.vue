<!-- src/components/ProjectSelector.vue -->

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
          <div v-if="projectStore.loading">Loading projects...</div>
          <div v-else>
            <!-- Error Message -->
            <div v-if="projectStore.error" class="text-error">{{ projectStore.error }}</div>
            <!-- Dropdown for selecting a project -->
            <VSelect
              v-model="projectStore.selectedProject"
              :items="projectStore.allDescriptions"
              item-title="project_name" 
              item-value="project_id"
              label="Project"
              class="mb-4"
              outlined
              dense
              :loading="projectStore.loading"
              :error="!!projectStore.error"
              :error-messages="projectStore.error"
              return-object
            />

            <!-- Display project details if a project is selected -->
            <div v-if="projectStore.selectedProject">
              <div class="mt-2">
                <strong>Project Name:</strong> {{ projectStore.selectedProject.project_name }}
              </div>
              <div class="mt-2">
                <strong>Start Date:</strong> {{ formatDate(projectStore.selectedProject.start_date) }}
              </div>
              <div class="mt-2">
                <strong>End Date:</strong> {{ formatDate(projectStore.selectedProject.end_date) }}
              </div>
              <div class="mt-2">
                <strong>GitHub URL:</strong> 
                <a :href="projectStore.github_url" target="_blank">{{ projectStore.github_url }}</a>
              </div>
            </div>

            <!-- Checkbox to toggle between single value and range slider -->
            <VCheckbox
              v-model="projectStore.showRangeSlider"
              label="Enable Range Slider"
              class="mb-4"
            />

            <!-- Conditional rendering based on checkbox state -->
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
              @change="handleSingleValueChange"
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
                  <span class="ml-1">Watch: {{ projectStore.watch_count }}</span>
                </VCol>
                <VCol class="d-flex align-center" cols="auto">
                  <VIcon size="20">fa-solid fa-code-fork</VIcon>
                  <span class="ml-1">Fork: {{ projectStore.fork_count }}</span>
                </VCol>
                <VCol class="d-flex align-center" cols="auto">
                  <VIcon size="20">fa-solid fa-star</VIcon>
                  <span class="ml-1">Star: {{ projectStore.stargazer_count }}</span>
                </VCol>
              </VRow>
            </VCard>

            <!-- Open Parallel Window button -->
            <VBtn variant="tonal" class="mt-6" size="small" @click="openParallelWindow">
              Open Parallel Window
            </VBtn>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

// Function to format dates
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Return original string if invalid date
  return date.toLocaleDateString();
};

// Compute slider min and max based on store's minMonth and maxMonth
const sliderMin = computed(() => projectStore.minMonth);
const sliderMax = computed(() => projectStore.maxMonth);

// Fetch all project information and GitHub stars
const fetchData = async () => {
  await projectStore.fetchAllProjectData();
};

// Handle single slider value change
const handleSingleValueChange = () => {
  projectStore.selectedMonth = projectStore.singleValue;
};

// Watch the selected project and update details
watch(
  () => projectStore.selectedProject,
  async (newProject) => {
    if (newProject) {
      await projectStore.setCurrentProjectDetails(newProject);
    } else {
      projectStore.resetProjectDetails();
    }
  }
);

// Watch for changes in selectedMonth to trigger data fetching in other components
watch(
  () => projectStore.selectedMonth,
  (newMonth) => {
    if (newMonth !== null && newMonth !== undefined) {
      // Optionally, perform any additional actions here
      console.log(`Selected Month updated to: ${newMonth}`);
    }
  }
);

// Open Parallel Window (Implementation as needed)
const openParallelWindow = () => {
  // Implement the logic to open a parallel window if required
  window.open('/some-parallel-route', '_blank');
};

// Fetch data on component mount
onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.metrics-container {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.ml-1 {
  margin-left: 4px;
}
.mt-4 {
  margin-top: 16px;
}
.text-error {
  color: red;
  margin-bottom: 1rem;
}
</style>
