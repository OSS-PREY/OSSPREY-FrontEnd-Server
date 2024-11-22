<!-- src/components/Graduationforecast.vue -->

<template>
  <VCard>
    <VCardText>
      <VTabs v-model="currentTab" class="v-tabs-pill">
        <VTab value="income" class="highlighted-tab">
          Project Health Indicator
        </VTab>
      </VTabs>
    </VCardText>

    <VCardText class="d-flex align-center gap-3">
      <VAvatar size="48" rounded :image="tabData.avatar" />
      <div>
        <p class="mb-0">{{ tabData.title }}</p>
        <div class="d-flex align-center gap-2">
          <h6 class="text-h6">{{ tabData.stats }}</h6>
        </div>
      </div>
    </VCardText>

    <VCardText v-if="gradForecastError" class="text-danger">
      {{ gradForecastError }}
    </VCardText>
    <VCardText v-if="gradForecastLoading">Loading data...</VCardText>
    <VCardText v-else>
      <VueApexCharts
        type="line"
        :height="230"
        :options="chartConfig"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { useTheme } from 'vuetify';
import CardStatisticsVertical from '@/@core/components/cards/CardStatisticsVertical.vue';
import { useProjectStore } from '@/stores/projectStore'; // Adjust path if necessary

const vuetifyTheme = useTheme();
const projectStore = useProjectStore();

const currentTab = ref('income');
const gradForecastLoading = computed(() => projectStore.gradForecastLoading);
const gradForecastError = computed(() => projectStore.gradForecastError);
const gradForecastData = computed(() => projectStore.gradForecastData);
const xAxisCategories = computed(() => projectStore.xAxisCategories);

/**
 * Convert a HEX color to an RGB string.
 * @param {string} hex - The HEX color (e.g., "#ffffff").
 * @returns {string} The RGB color string (e.g., "255,255,255").
 */
const hexToRgb = (hex) => {
  const cleanHex = hex.replace(/^#/, '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
};

// Fetch Graduation Forecast Data
const fetchGradForecastData = async () => {
  const projectId = projectStore.selectedProject?.project_id;
  if (!projectId) {
    console.warn('No project selected.');
    return;
  }

  await projectStore.fetchGradForecast(projectId);
};

// Watch for project changes
watch(
  () => projectStore.selectedProject,
  (newProject, oldProject) => {
    if (newProject?.project_id !== oldProject?.project_id) {
      fetchGradForecastData();
    }
  },
  { immediate: true }
);

// Define the series for ApexCharts
const series = computed(() => [
  {
    name: 'Graduation Forecast',
    data: gradForecastData.value,
  },
]);

// Define the chart configuration
const chartConfig = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const disabledTextColor = `rgba(${hexToRgb(
    String(currentTheme['on-surface'])
  )},${variableTheme['disabled-opacity']})`;
  const borderColor = `rgba(${hexToRgb(
    String(variableTheme['border-color'])
  )},${variableTheme['border-opacity']})`;

  return {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    grid: {
      strokeDashArray: 4.5,
      borderColor,
      padding: {
        left: 0,
        top: -20,
        right: 11,
        bottom: 7,
      },
    },
    colors: [currentTheme.primary],
    markers: {
      size: 5,
      hover: { size: 7 },
    },
    xaxis: {
      categories: xAxisCategories.value,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '14px',
          colors: disabledTextColor,
        },
      },
    },
    yaxis: {
      min: 0,
      max: 1, // Ensure y-axis is between 0 and 1
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          return val.toFixed(2);
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: currentTheme['on-surface'],
      },
    },
  };
});

// Define tab data
const tabData = computed(() => ({
  avatar: CardStatisticsVertical,
  title: `Current Project: ${projectStore.selectedProject?.project_id || 'None'}`,
  stats: gradForecastLoading.value
    ? 'Loading forecast data...'
    : `Forecast Data: ${gradForecastData.value.length} months available`,
}));

</script>

<style scoped>
.highlighted-tab {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 5px 10px;
  background-color: #f0f8ff;
  border-radius: 3px;
  font-weight: bold;
  font-size: 16px;
  color: #333;
  border: 1px solid #007bff;
  margin: 0;
  text-align: left;
}

.v-tabs {
  justify-content: flex-start;
}
</style>
