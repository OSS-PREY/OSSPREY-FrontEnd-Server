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
            <!-- Dropdown for selecting a foundation -->
            <VSelect
              v-model="selectedFoundation"
              :items="foundations"
              label="Foundation"
              class="mb-4"
              outlined
              dense
              @change="handleFoundationChange"
            />

            <!-- Dropdown for selecting a project -->
            <div v-if="selectedFoundation === 'Apache'">
              <VSelect
                v-model="selectedProject"
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
            </div>

            <div v-else-if="selectedFoundation === 'Eclipse'">
              <VSelect
                v-model="selectedProject"
                :items="projectStore.eclipseDescriptions"
                item-title="project_name"
                item-value="project_id"
                label="Eclipse Project"
                class="mb-4"
                outlined
                dense
                :loading="projectStore.loading"
                :error="!!projectStore.error"
                :error-messages="projectStore.error"
                return-object
              />

              <VSelect
                v-model="selectedCategory"
                :items="eclipseCategories"
                label="Category"
                class="mb-4"
                outlined
                dense
              />
            </div>

            <!-- Display project details if a project is selected -->
            <div v-if="projectStore.selectedProject">
              <div class="mt-2">
                <strong>Project Name:</strong> {{ projectStore.selectedProject.project_name }}
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

            <!-- Conditional rendering based on checkbox state and availability of months -->
            <VSlider
              v-if="projectStore.showRangeSlider && hasValidMonths"
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
              @update:modelValue="handleSingleValueChange"
            />

            <VSlider
              v-else-if="!projectStore.showRangeSlider && hasValidMonths"
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
              @update:modelValue="handleSingleValueChange"
            />


            <!-- Display a message if no months are available -->
            <div v-if="projectStore.selectedProject && !hasValidMonths" class="mt-4 text-error">
              No available months for the selected project.
            </div>

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
import { onMounted, watch, computed, ref } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

// Local ref for selectedProject to handle v-model separately
const selectedProject = ref(null);
const selectedFoundation = ref('Apache');
const selectedCategory = ref(null);

const foundations = ['Apache', 'Eclipse'];
const eclipseCategories = ['Tooling', 'Runtime', 'Platform'];

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

// Determine if there are valid months available
const hasValidMonths = computed(() => {
  return projectStore.availableMonths.length > 0;
});

// Fetch all project information and GitHub stars
const fetchData = async () => {
  await projectStore.fetchAllProjectData();
};

const handleFoundationChange = async () => {
  if (selectedFoundation.value === 'Eclipse') {
    await projectStore.fetchEclipseProjects();
  }
};

// Handle single slider value change
const handleSingleValueChange = () => {
  console.log(`Single slider changed. New singleValue: ${projectStore.singleValue}`);
  projectStore.selectedMonth = projectStore.singleValue;
};

// Handle range slider change
const handleRangeChange = () => {
  // For simplicity, set selectedMonth to the first value in the range
  const newMonth = projectStore.rangeValue[0];
  console.log(`Range slider changed. New rangeValue: ${projectStore.rangeValue}, Setting selectedMonth to ${newMonth}`);
  projectStore.selectedMonth = newMonth;
};

// Watch the local selectedProject and update the store accordingly
watch(
  () => selectedProject.value,
  async (newProject) => {
    if (newProject) {
      console.log(`Project selected: ${newProject.project_name}`);
      await projectStore.setCurrentProjectDetails(newProject);
    } else {
      console.log('No project selected. Resetting project details.');
      projectStore.resetProjectDetails();
    }
  }
);

// Open Parallel Window (Implementation as needed)
const openParallelWindow = () => {
  // Implement the logic to open a parallel window if required
  window.open('/some-parallel-route', '_blank');
};

// Initialize selectedProject watcher
watch(
  () => projectStore.selectedProject,
  (newProject) => {
    selectedProject.value = newProject;
    console.log(`Store selectedProject updated to: ${newProject?.project_name}`);
  }
);

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