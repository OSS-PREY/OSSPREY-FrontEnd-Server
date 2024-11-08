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

const apiBaseUrl = 'https://oss-backend-8stu.onrender.com'; // Replace with your actual API URL

const allData = ref(null);
const dates = ref([]);
const dateRange = ref([0, 0]);
const dateLabels = computed(() =>
  dates.value.map((d, i) => (i % 2 === 0 ? d : '')) // Adjust labeling as needed
);
const selectedDates = ref([]);

// Fetch data when the selected project changes
watch(
  () => projectStore.selectedProject,
  (newProject) => {
    if (newProject) {
      fetchSankeyData();
    }
  },
  { immediate: true }
);

// Update dateRange when rangeValue changes
watch(
  () => projectStore.rangeValue,
  (newValue) => {
    dateRange.value = newValue;
    preparePlotData();
  }
);

const fetchSankeyData = () => {
  loading.value = true;
  const projectName = projectStore.selectedProject.toLowerCase(); // Adjust if needed
  fetch(`${apiBaseUrl}/api/sankey/${projectName}`)
    .then((response) =>
      response.text().then((text) => {
        try {
          return JSON.parse(text);
        } catch (err) {
          console.error('Response text:', text);
          throw err;
        }
      })
    )
    .then((data) => {
      if (data.error) {
        console.error(data.error);
        error.value = data.error;
      } else {
        allData.value = data;
        dates.value = data.dates;
        // Initialize date range based on the store
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
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 400px;">
    <VRow no-gutters>
      <VCol
        cols="12"
        sm="12"
        xl="12"
        :class="$vuetify.display.smAndUp ? 'border-e' : 'border-b'"
      >
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Technical Network
          </VCardTitle>
        </VCardItem>

        <!-- Sankey Diagram -->
        <VCardText style="height: 100%;">
          <VRow class="mb-1" style="height: 90%;">
            <VCol cols="12" class="d-flex align-items-center">
              <!-- Div for Plotly diagram -->
              <div ref="sankeyDiv" style="width: 100%; height: 100%;"></div>
              <div v-if="loading">Loading Sankey diagram...</div>
              <div v-if="error">Error loading Sankey diagram: {{ error }}</div>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss"
</style>