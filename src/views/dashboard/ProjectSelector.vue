<template>
  <VCard class="project-selector-card">
    <VRow no-gutters>
      <VCol cols="12" sm="12">
        <!-- Header -->
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project Selector
          </VCardTitle>
        </VCardItem>

        <!-- Content Area -->
        <VCardText class="content-area">
          <!-- Loading Indicator -->
          <div v-if="projectStore.loading" class="loading">Loading projects...</div>
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

            <!-- Display project details if a project is selected -->
            <div v-if="projectStore.selectedProject" class="project-details">
              <div>
                <strong>Project Name:</strong> {{ projectStore.selectedProject.project_name }}
              </div>
              <div>
                <strong>Project URL:</strong>
                <a :href="projectStore.github_url" target="_blank">{{ projectStore.github_url }}</a>
              </div>
            </div>

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

// Reactive variables
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
.project-selector-card {
  max-height: 80vh; /* Adjust based on viewport */
  display: flex;
  flex-direction: column;
}

.header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.content-area {
  padding: 16px;
  flex: 1 1 auto;
  /* Removed overflow-y to prevent scrolling */
  display: flex;
  flex-direction: column;
}

.loading {
  text-align: center;
  margin-bottom: 16px;
}

.project-details {
  margin-top: 12px;
}

.metrics-container {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  /* Changed overflow to hidden to prevent overflow */
  overflow: hidden;
}

.ml-1 {
  margin-left: 4px;
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
