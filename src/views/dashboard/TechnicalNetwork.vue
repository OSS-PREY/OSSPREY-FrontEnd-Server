<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

const { global } = useTheme();
const projectStore = useProjectStore();

// References and state variables
const sankeyDiv = ref(null);
const loading = ref(true);
const error = ref(null);

// Correct API Base URL (remove '/api/projects')
const apiBaseUrl = 'https://oss-backend-8stu.onrender.com'; // Ensure this is your backend's base URL

// Data holders
const allData = ref(null);
const dates = ref([]);
const dateRange = ref([0, 0]);

// Computed labels for the slider (optional customization)
const dateLabels = computed(() =>
  dates.value.map((d, i) => (i % 2 === 0 ? d : '')) // Adjust labeling as needed
);

// Watch for changes in the selected project to fetch Sankey data
watch(
  () => projectStore.selectedProject,
  (newProject) => {
    if (newProject) {
      fetchSankeyData();
    }
  },
  { immediate: true }
);

// Function to fetch Sankey data for the selected project
const fetchSankeyData = async () => {
  loading.value = true;
  error.value = null; // Reset error state

  try {
    // Construct the correct API endpoint
    const projectName = projectStore.selectedProject.toLowerCase().replace(/\s+/g, '-'); // Adjust if needed
    const response = await fetch(`${apiBaseUrl}/api/tech_net/${projectName}`);

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

    allData.value = data;
    dates.value = data.dates;
    // Initialize date range based on dates length
    dateRange.value = [0, dates.value.length - 1];
    projectStore.rangeValue = dateRange.value;
    preparePlotData();
  } catch (err) {
    console.error('Error fetching Sankey data:', err);
    error.value = err.message || 'Failed to fetch Sankey data.';
  } finally {
    loading.value = false;
  }
};

// Function to prepare and render the Sankey diagram
const preparePlotData = () => {
  if (!allData.value || dates.value.length === 0) return;

  const selectedDates = dates.value.slice(
    dateRange.value[0],
    dateRange.value[1] + 1
  );

  const nodes = allData.value.nodes;
  const nodeMap = {};
  nodes.forEach((node, index) => {
    nodeMap[index] = node.name;
  });

  const filteredLinks = allData.value.links.filter((link) =>
    selectedDates.includes(link.date)
  );

  if (filteredLinks.length === 0) {
    error.value = 'No data available for the selected date range.';
    return;
  } else {
    error.value = null;
  }

  const plotData = [
    {
      type: 'sankey',
      orientation: 'h',
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: 'black',
          width: 0.5,
        },
        label: nodes.map((node) => node.name),
        color: 'blue',
      },
      link: {
        source: filteredLinks.map((l) => l.source),
        target: filteredLinks.map((l) => l.target),
        value: filteredLinks.map((l) => l.value),
      },
    },
  ];

  const layout = {
    title: `Contribution Sankey Diagram for ${projectStore.selectedProject}`,
    font: {
      size: 10,
    },
  };

  if (sankeyDiv.value) {
    Plotly.react(sankeyDiv.value, plotData, layout);
  }
};

// Fetch Sankey data when the component mounts if a project is already selected
onMounted(() => {
  if (projectStore.selectedProject) {
    fetchSankeyData();
  }
});
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 600px;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Technical Network
          </VCardTitle>
        </VCardItem>

        <!-- Sankey Diagram and Controls -->
        <VCardText style="height: 100%;">
          <!-- Loading Indicator -->
          <div v-if="loading">Loading Sankey diagram...</div>

          <!-- Error Message -->
          <div v-if="error" class="text-error mb-4">Error loading Sankey diagram: {{ error }}</div>

          <!-- Sankey Diagram -->
          <div ref="sankeyDiv" style="width: 100%; height: 60%;"></div>

          <!-- Slider Controls -->
          <div v-if="!loading && !error">
            <!-- Date Range Slider -->
            <VSlider
              v-model="dateRange"
              range
              :min="0"
              :max="dates.length - 1"
              :step="1"
              label="Select Date Range"
              ticks="true"
              tick-size="4"
              thumb-label
              class="mt-4"
            />

            <!-- Display Selected Date Range -->
            <div class="mt-2">
              <strong>Selected Dates:</strong>
              <span>{{ formatDate(dates[dateRange[0]]) }}</span>
              -
              <span>{{ formatDate(dates[dateRange[1]]) }}</span>
            </div>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss";
</style>
