<template>
  <VCard class="text-center text-sm-start" style="height: 450px;">
    <VRow no-gutters>
      <VCol cols="12" sm="12">
        <!-- Header -->
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project Selector
          </VCardTitle>
        </VCardItem>

        <!-- Data Source Buttons -->
        <VRow class="mb">
          <VCol cols="12" class="d-flex justify-center">
            <VBtn
              :variant="selectedDataSource === 'foundation' ? 'contained' : 'outlined'"
              color="primary"
              class="mr-2"
              @click="selectedDataSource = 'foundation'"
            >
              Foundation
            </VBtn>
            <VBtn
              :variant="selectedDataSource === 'local' ? 'contained' : 'outlined'"
              color="primary"
              class="mr-2"
              @click="selectedDataSource = 'local'"
            >
              Local
            </VBtn>
          </VCol>
        </VRow>

        <!-- Content Area -->
        <VCardText class="content-area">
          <!-- Loading Indicator -->
          <div v-if="projectStore.loading" class="loading">Loading projects...</div>
          <div v-else>

            <!-- =========================================
                 FOUNDATION / ECLIPSE BLOCK
                 ========================================= -->
            <div v-if="selectedDataSource === 'foundation'">
              <!-- Error Message -->
              <div v-if="projectStore.error" class="text-error">{{ projectStore.error }}</div>
              <!-- Foundation Dropdown -->
              <VSelect
                v-model="projectStore.selectedFoundation"
                :items="foundations"
                label="Foundation"
                class="mb-3"
                outlined
                dense
                @change="handleFoundationChange"
              />

              <!-- Eclipse Category Dropdown (only if Foundation is Eclipse) -->
              <VSelect
                v-if="projectStore.selectedFoundation === 'Eclipse'"
                v-model="selectedCategory"
                :items="eclipseCategories"
                label="Category"
                class="mb-3"
                outlined
                dense
                @change="handleCategoryChange"
              />

              <!-- Project Autocomplete -->
              <VAutocomplete
                v-if="shouldShowProjectAutocomplete"
                v-model="selectedProject"
                :items="projectItems"
                item-title="project_name"
                item-value="project_id"
                :label="projectLabel"
                class="mb-3"
                outlined
                dense
                :loading="projectStore.loading"
                :error="!!projectStore.error"
                :error-messages="projectStore.error"
                return-object
                hide-no-data
                hide-details
                clearable
              />

              <!-- Checkbox for Range Slider -->
              <VCheckbox
                v-model="projectStore.showRangeSlider"
                label="Enable Range Slider"
                class="mb-3"
              />

              <!-- Range Slider -->
              <VSlider
                v-if="projectStore.showRangeSlider && hasValidMonths"
                v-model="projectStore.rangeValue"
                range
                :min="sliderMin"
                :max="sliderMax"
                :step="1"
                class="mb-3"
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
                class="mb-3"
                label="Select Month"
                ticks="always"
                tick-size="4"
                thumb-label
                @update:modelValue="handleSingleValueChange"
              />

              <!-- No months available message -->
              <div v-if="projectStore.selectedProject && !hasValidMonths" class="text-error">
                No available months for the selected project.
              </div>

              <!-- Apache GitHub Metrics -->
              <VCard
                v-if="projectStore.selectedFoundation === 'Apache' && projectStore.selectedProject"
                class="metrics-container mt-3"
                outlined
              >
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

            <!-- =========================================
                 LOCAL PROJECTS BLOCK
                 ========================================= -->
            <div v-else-if="selectedDataSource === 'local'">
              <!-- Add your local project selection UI here. For example: -->
              <VSelect
                v-model="selectedLocalProject"
                :items="projectStore.localProjects"
                item-title="project_name"
                item-value="project_id"
                label="Local Project"
                class="mb-3"
                outlined
                dense
              />
              <!-- You can display local project details or any additional UI here -->
              <div v-if="selectedLocalProject">
                <div>
                  <strong>Local Project Name:</strong> {{ selectedLocalProject.project_name }}
                </div>
                <div>
                  <strong>Local Project URL:</strong>
                  <a :href="selectedLocalProject.github_url" target="_blank">
                    {{ selectedLocalProject.github_url }}
                  </a>
                </div>
              </div>
            </div>
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

// Initialize store and router
const projectStore = useProjectStore();
const router = useRouter();

// NEW: Data source choice ("foundation" or "local")
const selectedDataSource = ref('foundation');

// Reactive variables
const selectedProject = ref(null);
const selectedCategory = ref(null);

// For local projects
const selectedLocalProject = ref(null);

// Static list of foundations
const foundations = ['Apache', 'Eclipse'];

// Static list of Eclipse categories
const eclipseCategories = [
  'Modeling', 'IoT', 'Tools', 'Technology', 'Web Tools Platforms', 'Science', 'Digital Twin',
  'Automotive', 'Cloud Development', 'Adoptium', 'EE4J', 'Eclipse Project', 'Oniro', 'RT',
  'SOA Platform', 'PolarSys', 'LocationTech', 'OpenHW Group', 'AsciiDoc'
];

// Computed property to determine if Project Autocomplete should be shown
const shouldShowProjectAutocomplete = computed(() => {
  if (projectStore.selectedFoundation === 'Apache') {
    return true;
  }
  if (projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value) {
    return true;
  }
  return false;
});

// Computed property to set the items for Project Autocomplete
const projectItems = computed(() => {
  if (projectStore.selectedFoundation === 'Apache') {
    return projectStore.allDescriptions;
  }
  if (projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value) {
    return projectStore.eclipseDescriptions.filter(project =>
      project.tech.toLowerCase() === selectedCategory.value.toLowerCase()
    );
  }
  return [];
});

// Computed property to set the label for Project Autocomplete
const projectLabel = computed(() => {
  if (projectStore.selectedFoundation === 'Apache') {
    return 'Project';
  }
  if (projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value) {
    return 'Eclipse Project';
  }
  return 'Project';
});

// Slider boundaries
const sliderMin = computed(() => projectStore.minMonth);
const sliderMax = computed(() => projectStore.maxMonth);

// Whether months are available
const hasValidMonths = computed(() => {
  return projectStore.availableMonths.length > 0;
});

// Fetch local projects (placeholder)
const fetchLocalProjects = async () => {
  console.log('Fetching local projects...');
  // You could call a store action if you have it:
  // await projectStore.fetchLocalProjects();
};

// Fetch initial data on mount
const fetchData = async () => {
  console.log('Fetching initial project data for both Apache and Eclipse...');
  // Fetch both foundations' data
  await Promise.all([
    projectStore.fetchAllProjectData(),
    projectStore.fetchEclipseProjects(),
    fetchLocalProjects() // new line to also fetch local projects
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
  console.log(
    `Range slider changed. New rangeValue: ${projectStore.rangeValue}, Setting selectedMonth to ${newMonth}`
  );
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
  /* Changed overflow to hidden to prevent overflow */
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
  font-size: 0.9rem;
}

.v-input {
  /* Ensure Autocomplete fields do not take excessive vertical space */
  min-height: 36px;
}

.v-autocomplete {
  /* Prevent the autocomplete from expanding the container */
  position: relative;
  z-index: 1;
}
</style>
