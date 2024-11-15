<template>
  <VCard class="text-center text-sm-start" style="height: 100%;">
    <VCardTitle class="text-h6 text-primary">
      Technical Network
    </VCardTitle>
    <VCardText style="height: calc(100% - 64px);">
      <!-- Sankey Diagram -->
      <div ref="sankeyDiv" style="width: 100%; height: 100%;"></div>
      <div v-if="loading">Loading Sankey diagram...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { useDisplay, useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

const vuetifyTheme = useTheme();
const display = useDisplay();
const projectStore = useProjectStore();

const sankeyDiv = ref(null);
const loading = ref(true);
const error = ref(null);

const apiBaseUrl = 'https://oss-backend-8stu.onrender.com'; // Update to your backend's actual URL

const allData = ref(null);
const dates = ref([]);
const dateRange = ref([0, 0]);
const dateLabels = computed(() =>
  dates.value.map((d, i) => (i % 2 === 0 ? d : '')) // Adjust labeling as needed
);
const selectedDates = ref([]);

// Fetch data when the selected project changes
watch(
  () => projectStore.selectedProjectGithubName,
  (newGithubName) => {
    if (newGithubName) {
      fetchSankeyData();
    }
  },
  { immediate: true }
);

const fetchSankeyData = () => {
  loading.value = true;
  const projectName = projectStore.selectedProjectGithubName;
  if (!projectName) {
    error.value = 'No GitHub repository name available for the selected project.';
    loading.value = false;
    return;
  }
  fetch(`${apiBaseUrl}/api/tech_net/${projectName}`)
    .then((data) => {
      if (data.error) {
        console.error('API Error:', data.error);
        error.value = data.error;
      } else {
        allData.value = data;
        dates.value = data.dates;
        // Initialize date range based on dates length
        dateRange.value = [0, dates.value.length - 1];
        projectStore.rangeValue = dateRange.value;
        preparePlotData();
      }
    })
    .catch((err) => {
      console.error('Error fetching Sankey data:', err);
      error.value = 'Failed to fetch data.';
    })
    .finally(() => {
      loading.value = false;
    });
};

const preparePlotData = () => {
  if (!allData.value || dates.value.length === 0) return;

  selectedDates.value = dates.value.slice(
    dateRange.value[0],
    dateRange.value[1] + 1
  );

  const nodes = allData.value.nodes;
  const nodeMap = {};
  nodes.forEach((node, index) => {
    nodeMap[index] = node.name;
  });

  const filteredLinks = allData.value.links.filter((link) =>
    selectedDates.value.includes(link.date)
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
        thickness: 15,
        line: {
          color: 'black',
          width: 0.5,
        },
        label: nodes.map((node) => node.name),
        color: '#1E88E5', // Adjust to match your theme
      },
      link: {
        source: filteredLinks.map((l) => l.source),
        target: filteredLinks.map((l) => l.target),
        value: filteredLinks.map((l) => l.value),
        color: 'rgba(30, 136, 229, 0.5)', // Adjust link color and opacity
      },
    },
  ];

  const layout = {
    title: '',
    font: {
      size: 12,
      color: '#424242',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    responsive: true,
  };

  if (sankeyDiv.value) {
    Plotly.react(sankeyDiv.value, plotData, layout);
  }
};
</script>

<style lang="scss">
.error-message {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
