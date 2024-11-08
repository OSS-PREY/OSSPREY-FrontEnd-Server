<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

const { global } = useTheme();
const projectStore = useProjectStore();

// State variables
const projects = ref([]);
const loadingProjects = ref(true);
const error = ref(null);

// Fetch projects from backend
const fetchProjects = async () => {
  loadingProjects.value = true;
  try {
    const response = await fetch('https://oss-backend-8stu.onrender.com/api/projects');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    projects.value = data.projects;
  } catch (err) {
    console.error('Error fetching projects:', err);
    error.value = 'Failed to fetch projects.';
  } finally {
    loadingProjects.value = false;
  }
};

// Watch the selected project and update details
watch(() => projectStore.selectedProject, (newProject) => {
  if (newProject) {
    const selected = projects.value.find(p => p.name === newProject);
    if (selected) {
      projectStore.startDate = selected.start_date || 'N/A';
      projectStore.endDate = selected.end_date || 'N/A';
      projectStore.status = selected.status || 'N/A';
      projectStore.description = selected.description || 'N/A';
    }
  }
});

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

            <!-- Display project details -->
            <div v-if="projectStore.selectedProject">
              <div class="mt-4">
                <strong>Description:</strong> {{ projectStore.description }}
              </div>
              <div class="mt-2">
                <strong>Status:</strong> {{ projectStore.status }}
              </div>
              <div class="mt-2">
                <strong>Start Date:</strong> {{ projectStore.startDate }}
              </div>
              <div class="mt-2">
                <strong>End Date:</strong> {{ projectStore.endDate }}
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
              :min="0"
              :max="100"
              class="mt-4"
              style="width: calc(100% - 10px); margin-right: 10px;"
              label="Select Range"
              ticks="always"
            />

            <VSlider
              v-else
              v-model="projectStore.singleValue"
              :min="0"
              :max="100"
              class="mt-4"
              style="width: calc(100% - 10px); margin-right: 10px;"
              label="Select Month"
              ticks="always"
            />

            <VBtn variant="tonal" class="mt-6" size="small">
              Open Parallel Window
            </VBtn>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>