<!-- src/components/Graduationforecast.vue projectStore.selectedProject.start_date--> 
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

function generateMonthlyXAxisCategories(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const result = [];

  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) return result;

  const current = new Date(startDate);

  while (current <= endDate) {
    result.push(current.toLocaleDateString('default', { month: 'short', year: 'numeric' }));
    current.setMonth(current.getMonth() + 1);
  }

  return result;
}

const computedXCategories = computed(() => {
  let categories = [];

  if (projectStore.selectedProject?.start_date && projectStore.selectedProject?.end_date) {
    categories = generateMonthlyXAxisCategories(
      projectStore.selectedProject.start_date,
      projectStore.selectedProject.end_date
    );
  } else if (projectStore.localMetadata?.created_at && projectStore.localMetadata?.updated_at) {
    const createdAtFormatted = new Date(projectStore.localMetadata.created_at).toISOString().split('T')[0];
    const updatedAtFormatted = new Date(projectStore.localMetadata.updated_at).toISOString().split('T')[0];
    categories = generateMonthlyXAxisCategories(createdAtFormatted, updatedAtFormatted);
  } else {
    categories = projectStore.xAxisCategories || [];
  }

  // Always add 4 extra future months
  if (categories.length > 0) {
    const lastDate = new Date(categories[categories.length - 1]);
    for (let i = 0; i < 4; i++) {
      lastDate.setMonth(lastDate.getMonth() + 1);
      categories.push(
        lastDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })
      );
    }
  }

  return categories;
});

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

const yearlySeries = computed(() => {
  const allData = gradForecastData.value || [];
  const xCategories = computedXCategories.value;
  const selected = selectedMonth.value;
  const selectedIdx = selected - 1;

  const normalize = (arr) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const scaled = arr.map(v => (v - min) / (max - min));
    return { scaled, min, max };
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const fitAR1 = (data) => {
    const n = data.length;
    const meanX = data.slice(0, n - 1).reduce((a, b) => a + b, 0) / (n - 1);
    const meanY = data.slice(1).reduce((a, b) => a + b, 0) / (n - 1);
    let cov = 0, varX = 0;
    for (let i = 0; i < n - 1; i++) {
      cov += (data[i] - meanX) * (data[i + 1] - meanY);
      varX += (data[i] - meanX) ** 2;
    }
    const phi = cov / varX;
    const intercept = meanY - phi * meanX;
    const predictions = data.slice(0, n - 1).map(x => intercept + phi * x);
    const residuals = data.slice(1).map((actual, i) => actual - predictions[i]);
    const stdError = Math.sqrt(residuals.reduce((s, r) => s + r ** 2, 0) / residuals.length);
    return { phi, intercept, stdError };
  };


  const createBranch = (name, mode) => {
  const inputSeries = allData.slice(0, selectedIdx + 1);
  const { scaled: normData } = normalize(inputSeries);

  const { phi, intercept, stdError } = fitAR1(normData);
  const baseVal = clamp01(normData[selectedIdx]);

  const z = 2.58; // 99% confidence
  const forecast = [];

  let last = baseVal;

  for (let i = 0; i < 4; i++) {
    if (i === 0) {
      forecast.push(baseVal); // force exact match
      continue;
    }

    last = intercept + phi * last;

    let adjusted;
    if (mode === "positive") {
      adjusted = clamp01(Math.max(baseVal, last + z * stdError));
    } else if (mode === "negative") {
      adjusted = clamp01(Math.min(baseVal, last - z * stdError));
    } else {
      adjusted = clamp01(last);
    }

    forecast.push(adjusted);
    last = adjusted;
  }

  // Build full { x, y } objects for the chart
  const dataPoints = xCategories.map((x, idx) => {
    if (idx === selectedIdx) {
      return { x, y: allData[selectedIdx] };
    }
    if (idx > selectedIdx && idx <= selectedIdx + 4) {
      const forecastIdx = idx - selectedIdx;
      return { x, y: forecast[forecastIdx] };
    }
    return { x, y: null };
  });

  return { name, data: dataPoints };
};




  // === Series Assembly ===
  const seriesActual = xCategories.map((x, idx) => ({
    x,
    y: idx < selected ? allData[idx] ?? null : null
  }));

  const result = [
    { name: 'Actual Forecast', data: seriesActual }
  ];

  if (allData.length > 0 && selectedIdx >= 0 && selectedIdx < allData.length) {
    result.push(createBranch('Neutral Projection', "neutral"));
    result.push(createBranch('Positive Projection', "positive"));
    result.push(createBranch('Negative Projection', "negative"));
  }

  return result;
});





// Define the chart configuration for Yearly Forecasts
const yearlyChartConfig = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`;
  const selected = selectedMonth.value;
  const selectedIndex = selected - 1;

  return {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
      dashArray: [0, 5, 5, 5] // solid for actual, dashed for all projections
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
    colors: [
      currentTheme.primary, // actual
      '#9e9e9e',             // neutral
      '#4CAF50',             // positive
      '#F44336'              // negative
    ],
    markers: {
      size: 5,
      hover: { size: 7 },
      discrete: [
        {
          seriesIndex: 0,
          dataPointIndex: selectedIndex,
          fillColor: currentTheme.primary,
          strokeColor: "#4CAF50",
          strokeWidth: 4,
          size: 5
        },
        {
          seriesIndex: 1,
          dataPointIndex: selectedIndex,
          size: 0
        }
      ]
    },
    xaxis: {
      type: 'category',
      categories: computedXCategories.value,
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
        formatter: (val) => (val == null ? '' : val.toFixed(2))
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        title: {
          formatter: function (seriesName) {
            return seriesName.includes('Projection')
              ? `Projection: ${seriesName.split(' ')[0]}`
              : 'Graduation Forecast';
          }
        },
        formatter: function (value, { seriesIndex, w }) {
          if (value == null) return '';
          const label = w.globals.seriesNames[seriesIndex];
          return label.includes('Projection')
            ? `${value.toFixed(2)} (Projected)`
            : value.toFixed(2);
        }
      }
    }
  };
});

// -------------------- Month-wise Forecast (Monthly) --------------------
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
      dashArray: [0, 5, 5, 5] 
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
