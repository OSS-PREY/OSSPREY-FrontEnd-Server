<script setup>
import statsVerticalWallet from '@images/cards/wallet-primary.png';
import { hexToRgb } from '@layouts/utils';
import { useTheme } from 'vuetify';
import { ref, computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const vuetifyTheme = useTheme();

const currentTab = ref('income');

// Historical data (past to present)
const historicalData = [
  0.4,
  0.45,
  0.52,
  0.59,
  0.60,
  0.65,
  0.69,
  0.71,
  0.75,
  0.78,
  0.79,
  0.82,
];

// Green trajectory (optimal future path)
const greenTrajectoryData = [
  0.82, // Starting from the last historical data point
  0.85,
  0.88,
  0.90,
  0.92,
  0.95,
  0.97,
  0.99,
  1.0,
];

// Red trajectory (suboptimal future path)
const redTrajectoryData = [
  0.82, // Starting from the last historical data point
  0.80,
  0.78,
  0.75,
  0.70,
  0.65,
  0.60,
  0.55,
  0.50,
];

const series = {
  income: [
    {
      name: 'Historical Data',
      data: historicalData,
    },
    {
      name: 'Success Trajectory',
      data: [
        ...Array(historicalData.length - 1).fill(null),
        ...greenTrajectoryData,
      ],
    },
    {
      name: 'Failure Trajectory',
      data: [
        ...Array(historicalData.length - 1).fill(null),
        ...redTrajectoryData,
      ],
    },
  ],
};

const tabData = computed(() => {
  const data = {
    income: {
      avatar: statsVerticalWallet,
      title: 'Current Project: CommonsRDF',
      stats: 'Current Period: 2015-03-06 to 2016-11-28',
    },
  };

  return data[currentTab.value];
});

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
      dashArray: [0, 5, 5], // Solid line for historical, dashed for projections
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
    colors: [currentTheme.primary, '#28a745', '#dc3545'], // Colors for the lines
    markers: {
      size: 5,
      hover: { size: 7 },
    },
    xaxis: {
      categories: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
      ],
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '14px',
          colors: disabledTextColor,
          fontFamily: 'Public Sans',
        },
      },
    },
    yaxis: {
      min: 0,
      max: 1,
      tickAmount: 4,
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
</script>

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

    <VCardText>
      <VueApexCharts
        type="line"
        :height="230"
        :options="chartConfig"
        :series="series[currentTab]"
      />
    </VCardText>
  </VCard>
</template>

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
  max-height: 400px;
  overflow-y: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-bordered {
  border: 1px solid #dee2e6;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
}

.table-primary {
  background-color: #007bff;
  color: #fff;
}

.table-primary th {
  color: #fff;
}

.table-primary td {
  color: #fff;
}

.center {
  text-align: center;
}
</style>
