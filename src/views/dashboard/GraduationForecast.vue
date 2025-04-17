<!-- src/components/Graduationforecast.vue -->
<template>
  <VCard>
    <!-- Tabs Section -->
    <VCardText>
      <VTabs v-model="currentTab" class="v-tabs-pill">
        <VTab value="yearly" class="highlighted-tab">
          Probability of Sustainability
        </VTab>
        <!-- <VTab value="monthly" class="highlighted-tab">
          Month-wise Forecast
        </VTab> -->
      </VTabs>
    </VCardText>

    <!-- Tab Information Section -->
    <VCardText class="d-flex align-center gap-3">
      <!-- Existing Avatar (if any) -->
      <VAvatar size="48" rounded :image="tabData.avatar" v-if="tabData.avatar" />
      <div>
        <p class="mb-0">{{ tabData.title }}<span class="ms-2">| {{ tabData.monthDetail }}</span></p>
        <div class="d-flex align-center gap-2">
          <h6 class="text-h6">{{ tabData.stats }}</h6>
        </div>
      </div>
    </VCardText>

    <!-- All Months Forecast Tab Content -->
    <VCardText v-if="currentTab === 'yearly'">
      <VCardText v-if="gradForecastError" class="text-danger">
        {{ gradForecastError }}
      </VCardText>
      <VCardText v-if="gradForecastLoading">Loading data...</VCardText>
      <VCardText v-else>
        <VueApexCharts
          type="line"
          :height="230"
          :options="yearlyChartConfig"
          :series="yearlySeries"
        />
      </VCardText>
    </VCardText>

    <!-- Month-wise Forecast Tab Content -->
    <VCardText v-if="currentTab === 'monthly'">
      <VCardText v-if="predictionsError" class="text-danger">
        {{ predictionsError }}
      </VCardText>
      <VCardText v-if="predictionsLoading">Loading predictions...</VCardText>
      <VCardText v-else>
        <VueApexCharts
          type="line"
          :height="230"
          :options="monthlyChartConfig"
          :series="monthlySeries"
        />
        <!-- Existing Table (Assuming it's for Predictions) -->
        <VDataTable
          :headers="predictionsTableHeaders"
          :items="predictionsTableData"
          class="mt-5"
        >
          <template #item.close="{ item }">
            {{ item.close.toFixed(4) }}
          </template>
        </VDataTable>

        <!-- Releases/Reviews Table for Eclipse Projects -->
        <div v-if="isEclipseProject && projectReleases.length" class="mt-5">
          <VRow class="mb-3">
            <VCol cols="12">
              <strong>Releases/Reviews:</strong>
            </VCol>
          </VRow>
          <div class="table-container">
            <table class="table table-bordered">
              <thead>
                <tr class="table-primary">
                  <th>Release/Review</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(release, index) in projectReleases"
                  :key="index"
                >
                  <td class="actionable-cell">
                    <a :href="release.url" target="_blank" rel="noopener noreferrer">
                      {{ release.name }}
                    </a>
                  </td>
                  <td>{{ formatDate(release.date || release.month) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </VCardText>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { VDataTable, VAvatar, VCard, VCardText, VCardTitle, VRow, VCol, VTabs, VTab } from 'vuetify/components';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';

// Initialize theme and store
const vuetifyTheme = useTheme();
const projectStore = useProjectStore();

// Current Tab State
const currentTab = ref('yearly'); // Default to 'yearly'

// Reactive selected month (1-indexed, provided via your Project Selector)
const selectedMonth = computed(() => projectStore.selectedMonth || 1);


function gaussianKernel(size, sigma) {
  const kernel = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - center;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }

  // Normalize the kernel
  return kernel.map(v => v / sum);
}

// function applyGaussianSmoothing(data, kernelSize = 10, sigma = 1.0) {
//   const kernel = gaussianKernel(kernelSize, sigma);
//   const half = Math.floor(kernelSize / 2);
//   const smoothed = [];

//   for (let i = 0; i < data.length; i++) {
//     let sum = 0;
//     for (let j = 0; j < kernel.length; j++) {
//       const index = i + j - half;
//       if (index >= 0 && index < data.length) {
//         sum += data[index] * kernel[j];
//       }
//     }
//     smoothed.push(sum);
//   }

//   return smoothed;
// }
function applyGaussianSmoothing(data, kernelSize = 10, sigma = 1.0) {
  const kernel = gaussianKernel(kernelSize, sigma);
  const half = Math.floor(kernelSize / 2);
  const paddedData = [0, ...data]; // Inject a 0 at the start
  const smoothed = [];

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < kernel.length; j++) {
      const index = i + j - half;
      if (index >= 0 && index < paddedData.length) {
        sum += paddedData[index] * kernel[j];
      }
    }
    smoothed.push(sum);
  }

  return smoothed;
}





// Computed properties for loading and error states
const gradForecastLoading = computed(() => projectStore.gradForecastLoading);
const gradForecastError = computed(() => projectStore.gradForecastError);
// const gradForecastData = computed(() => projectStore.gradForecastData);
const gradForecastData = computed(() => {
  const raw = projectStore.gradForecastData;
  // raw[0] = 0
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return applyGaussianSmoothing(raw, 5, 1.0); // kernel size = 5, sigma = 1.0
});
const predictionsLoading = computed(() => projectStore.predictionsLoading);
const predictionsError = computed(() => projectStore.predictionsError);
const predictionsData = computed(() => projectStore.predictionsData);

// -------------------- All Months Forecast (Yearly) --------------------
// We create two series that together show the full forecast.
// • Series A (actual): for indices 0 to (selectedMonth - 1) (i.e. months 1 through selectedMonth)
// • Series B (projection): for indices (selectedMonth - 1) to end (i.e. starting at the selected month)
// In both series the underlying y values come directly from the API.
// (The overlapping point at index (selectedMonth - 1) makes the two segments join seamlessly.)
const yearlySeries = computed(() => {
  const allData = gradForecastData.value || [];
  const xCategories = projectStore.xAxisCategories || [];
  const selected = selectedMonth.value; // e.g. 5 means month 5 is selected; its index is 4

  // Build Series A: show valid values for indices 0 .. selected-1, and null for later indices.
  const seriesAData = allData.map((val, index) => ({
    x: xCategories[index] || `Month ${index + 1}`,
    y: index < selected ? val : null
  }));

  // Build Series B: show nulls for indices before (selected - 1), then valid values from index (selected - 1) onward.
  const seriesBData = allData.map((val, index) => ({
    x: xCategories[index] || `Month ${index + 1}`,
    y: index >= selected - 1 ? val : null
  }));

  return [
    { name: 'Graduation Forecast', data: seriesAData },
    { name: '', data: seriesBData }
  ];
});

// Define the chart configuration for Yearly Forecasts
const yearlyChartConfig = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`;
  const selected = selectedMonth.value;
  const selectedIndex = selected - 1; // 0-indexed

  return {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
      // The first series is solid; the second is dashed.
      dashArray: [0, 5]
    },
    grid: {
      strokeDashArray: 4.5,
      borderColor: `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`,
      padding: {
        left: 0,
        top: -20,
        right: 11,
        bottom: 7
      }
    },
    // Series colors: primary for actual; grey for projected.
    colors: [currentTheme.primary, '#9e9e9e'],
    markers: {
      size: 5,
      hover: { size: 7 },
      discrete: [
        {
          // For Series A, at the selected month index, show a marker with a thick green border.
          seriesIndex: 0,
          dataPointIndex: selectedIndex,
          fillColor: currentTheme.primary,
          strokeColor: "#4CAF50", // Green border
          strokeWidth: 4,
          size: 5
        },
        {
          // For Series B, hide the marker for the overlapping point.
          seriesIndex: 1,
          dataPointIndex: selectedIndex,
          size: 0
        }
      ]
    },
    xaxis: {
      type: 'category',
      categories: projectStore.xAxisCategories,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '14px',
          colors: disabledTextColor
        }
      }
    },
    yaxis: {
      min: 0,
      max: 1, // Adjust if your data range changes
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          if(val==null){
            return '';
          }
          else{
          return val.toFixed(2);
          }
        }
      }
    },
    legend: {
      show: false // Hide legend so the two segments are not labeled separately.
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        title: {
          formatter: () => 'Graduation Forecast'
        }
      }
    }
  };
});

// -------------------- Month-wise Forecast (Monthly) --------------------
// (Retained from your original implementation.)
const monthlySeries = computed(() => {
  const adjustedForecast = predictionsData.value.adjusted_forecast || {};
  const dataPoints = Object.values(adjustedForecast).map(item => item.close);
  return [
    {
      name: 'Month-wise Forecast',
      data: dataPoints
    }
  ];
});

const monthlyChartConfig = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`;
  const borderColor = `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`;

  return {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
      dashArray: 5
    },
    grid: {
      strokeDashArray: 4.5,
      borderColor,
      padding: {
        left: 0,
        top: -20,
        right: 11,
        bottom: 7
      }
    },
    colors: [currentTheme.secondary],
    markers: {
      size: 5,
      hover: { size: 7 }
    },
    xaxis: {
      categories: Object.values(predictionsData.value.adjusted_forecast).map(item => `Month ${item.date}`),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '14px',
          colors: disabledTextColor
        }
      }
    },
    yaxis: {
      min: 0,
      max: 1,
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          if(val==null){
            return '';
          }
          else{
            return val.toFixed(2);
          }
          
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: currentTheme['on-surface']
      }
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  };
});

// Define tab data
const tabData = computed(() => {
  if (currentTab.value === 'yearly') {
    return {
      avatar: null,
      title: `Current Project: ${projectStore.selectedProject?.project_id || 'None'}`,
      stats: gradForecastLoading.value
        ? 'Loading forecast data...'
        : `Forecast Data: ${gradForecastData.value.length} months available`,
        monthDetail: `Current Month: ${projectStore.selectedMonth || 'None'}`,
    };
  } else if (currentTab.value === 'monthly') {
    return {
      avatar: null,
      title: `Month-wise Forecast for ${projectStore.selectedProject?.project_id || 'None'}`,
      stats: predictionsLoading.value
        ? 'Loading predictions...'
        : `Adjusted Forecast for next 3 months`
    };
  }
  return {};
});

// Define table headers for Predictions
const predictionsTableHeaders = [
  { text: 'Month', value: 'month' },
  { text: 'Adjusted Close', value: 'close' }
];

// Prepare table data for Predictions
const predictionsTableData = computed(() => {
  const adjustedForecast = predictionsData.value.adjusted_forecast;
  if (!adjustedForecast) return [];
  return Object.values(adjustedForecast).map(item => ({
    month: `Month ${item.date}`,
    close: item.close
  }));
});

/**
 * Utility function to convert HEX color to RGB string.
 * @param {string} hex - HEX color code.
 * @returns {string} - RGB string.
 */
const hexToRgb = (hex) => {
  const cleanHex = hex.replace(/^#/, '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
};

// Computed property to determine if the selected project is from Eclipse
const isEclipseProject = computed(() => {
  return projectStore.selectedFoundation === 'Eclipse';
});

// Computed property to get releases/reviews data for Eclipse projects
const projectReleases = computed(() => {
  return projectStore.selectedProject?.releases || [];
});

// Function to format date strings for better readability
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateObj = new Date(dateStr);
  return isNaN(dateObj) ? 'Invalid Date' : dateObj.toLocaleDateString(undefined, options);
};

// Fetch Graduation Forecast Data
const fetchGradForecastData = async () => {
  const projectId = projectStore.selectedProject?.project_id;
  if (!projectId) {
    console.warn('No project selected.');
    return;
  }
  // CHANGE: Check for local mode – if active, skip fetching the graduation forecast via API.
  if (projectStore.isLocalMode) {
    console.log("Local mode is active, skipping fetchGradForecast.");
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

.table-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
  overflow-x: auto;
  display: block;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.table-bordered {
  border: 1px solid #dee2e6;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  word-wrap: break-word;
  white-space: normal;
}

.table-primary {
  background-color: #696cff;
  color: #fff;
}

a {
  color: #1e88e5;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-5 {
  margin-top: 32px;
}

.text-danger {
  color: red;
}
</style>
