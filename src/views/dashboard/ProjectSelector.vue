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
            
            <!-- Foundation Dropdown -->
            <VSelect
              v-model="projectStore.selectedFoundation"
              :items="foundations"
              label="Foundation"
              class="mb-4"
              outlined
              dense
              @change="handleFoundationChange"
            />

            <!-- If Apache is selected -->
            <div v-if="projectStore.selectedFoundation === 'Apache'">
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

            <!-- If Eclipse is selected -->
            <div v-else-if="projectStore.selectedFoundation === 'Eclipse'">
              <!-- Eclipse Category Dropdown -->
              <VSelect
                v-model="selectedCategory"
                :items="eclipseCategories"
                label="Category"
                class="mb-4"
                outlined
                dense
                @change="handleCategoryChange"
              />

              <!-- Eclipse Project Dropdown (only after category is selected) -->
              <div v-if="selectedCategory">
                <VSelect
                  v-model="selectedProject"
                  :items="filteredEclipseProjects"
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
              </div>
            </div>

            <!-- Display project details if a project is selected -->
            <div v-if="projectStore.selectedProject">
              <div class="mt-2">
                <strong>Project Name:</strong> {{ projectStore.selectedProject.project_name }}
              </div>
              <div class="mt-2">
                <strong>Project URL:</strong> 
                <a :href="projectStore.github_url" target="_blank">{{ projectStore.github_url }}</a>
              </div>
            </div>

            <!-- Checkbox for Range Slider -->
            <VCheckbox
              v-model="projectStore.showRangeSlider"
              label="Enable Range Slider"
              class="mb-4"
            />

            <!-- Range Slider -->
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
              @update:modelValue="handleRangeChange"
            />

            <!-- Single Value Slider -->
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

            <!-- No months available message -->
            <div v-if="projectStore.selectedProject && !hasValidMonths" class="mt-4 text-error">
              No available months for the selected project.
            </div>

            <!-- Apache GitHub Metrics -->
            <VCard v-if="projectStore.selectedFoundation === 'Apache' && projectStore.selectedProject" class="metrics-container mt-4" outlined>
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

const selectedProject = ref(null);
const selectedCategory = ref(null);

// Static list of foundations
const foundations = ['Apache', 'Eclipse'];

// Static list of Eclipse categories
const eclipseCategories = [
  'Modeling', 'IoT', 'Tools', 'Technology', 'Web Tools Platforms', 'Science', 'Digital Twin', 
  'Automotive', 'Cloud Development', 'Adoptium', 'EE4J', 'Eclipse Project', 'Oniro', 'RT', 
  'SOA Platform', 'PolarSys', 'LocationTech', 'OpenHW Group', 'AsciiDoc'
];

// Filtered Eclipse projects by category
const filteredEclipseProjects = computed(() => {
  if (!selectedCategory.value) return [];
  // Ensure case-insensitive comparison if necessary
  return projectStore.eclipseDescriptions.filter(project => 
    project.tech.toLowerCase() === selectedCategory.value.toLowerCase()
  );
});

// Slider boundaries
const sliderMin = computed(() => projectStore.minMonth);
const sliderMax = computed(() => projectStore.maxMonth);

// Whether months are available
const hasValidMonths = computed(() => {
  return projectStore.availableMonths.length > 0;
});

// Fetch initial data on mount
const fetchData = async () => {
  console.log('Fetching initial project data for both Apache and Eclipse...');
  // Fetch both foundations' data
  await Promise.all([
    projectStore.fetchAllProjectData(),
    projectStore.fetchEclipseProjects()
  ]);
  console.log('Initial project data fetched.');
};

// Handle foundation change
const handleFoundationChange = async () => {
  console.log(`Foundation changed to: ${projectStore.selectedFoundation}`);
  if (projectStore.selectedFoundation === 'Eclipse') {
    // Fetch Eclipse projects if not already fetched
    if (projectStore.eclipseDescriptions.length === 0) {
      await projectStore.fetchEclipseProjects();
    }
    // Reset category and project selections
    selectedCategory.value = null;
    selectedProject.value = null;
    await projectStore.resetProjectDetails();
  } else if (projectStore.selectedFoundation === 'Apache') {
    // Fetch Apache projects if not already fetched
    if (projectStore.allDescriptions.length === 0) {
      await projectStore.fetchAllProjectData();
    }
    // Reset project selections
    selectedProject.value = null;
    await projectStore.resetProjectDetails();
  }
};

// Handle category change
const handleCategoryChange = () => {
  console.log(`Category changed to: ${selectedCategory.value}`);
  selectedProject.value = null;
  projectStore.selectedProject = null;
};

// Existing handlers for sliders
const handleSingleValueChange = () => {
  console.log(`Single slider changed. New singleValue: ${projectStore.singleValue}`);
  projectStore.selectedMonth = projectStore.singleValue;
};

const handleRangeChange = () => {
  const newMonth = projectStore.rangeValue[0];
  console.log(`Range slider changed. New rangeValue: ${projectStore.rangeValue}, Setting selectedMonth to ${newMonth}`);
  projectStore.selectedMonth = newMonth;
};

// Watchers
watch(
  () => selectedProject.value,
  async (newProject) => {
    // Avoid infinite loop: only set details if different from store's selectedProject
    if (newProject !== projectStore.selectedProject) {
      if (newProject) {
        console.log(`Project selected: ${newProject.project_name}`);
        await projectStore.setCurrentProjectDetails(newProject);
      } else {
        console.log('No project selected. Resetting project details.');
        await projectStore.resetProjectDetails();
      }
    }
  }
);

watch(
  () => projectStore.selectedProject,
  (newProject) => {
    // Avoid infinite loop: only update if different
    if (selectedProject.value !== newProject) {
      selectedProject.value = newProject;
      console.log(`Store selectedProject updated to: ${newProject?.project_name}`);
    }
  }
);

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.metrics-container {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  overflow: auto;
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
