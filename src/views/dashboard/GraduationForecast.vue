<script setup>
import statsVerticalWallet from '@images/cards/wallet-primary.png';
import { hexToRgb } from '@layouts/utils';
import { useTheme } from 'vuetify';

const vuetifyTheme = useTheme()

const series = {
  income: [{
    data: [
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
      0.71,
      0.59,
      0.51,
      0.42,
      0.21,
      0.11,
      0.07,
      0.03,



    ],
  }]
}

const currentTab = ref('income')

const tabData = computed(() => {
  const data = {
    income: {
      avatar: statsVerticalWallet,
      title: 'Current Project: CommonsRDF',
      stats: 'Current Period: 2015-03-06  to 2016-11-28',
      profitLoss: 65,
      profitLossAmount: '6.5',
      compareToLastWeek: '$39k',
    },
  }
  
  return data[currentTab.value]
})

const chartConfig = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledTextColor = `rgba(${ hexToRgb(String(currentTheme['on-surface'])) },${ variableTheme['disabled-opacity'] })`
  const borderColor = `rgba(${ hexToRgb(String(variableTheme['border-color'])) },${ variableTheme['border-opacity'] })`
  
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
    fill: {
      type: 'gradient',
      gradient: {
        opacityTo: 0.25,
        opacityFrom: 0.5,
        stops: [
          0,
          95,
          100,
        ],
        shadeIntensity: 0.6,
        colorStops: [[
          {
            offset: 0,
            opacity: 0.4,
            color: currentTheme.primary,
          },
          {
            offset: 100,
            opacity: 0.2,
            color: currentTheme.surface,
          },
        ]],
      },
    },
    theme: {
      monochrome: {
        enabled: true,
        shadeTo: 'light',
        shadeIntensity: 1,
        color: currentTheme.primary,
      },
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: [
        '',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
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
      offsetY: 20,
      offsetX: -24,
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
      show: false,
      tickAmount: 4,
    },
    markers: {
      size: 8,
      strokeWidth: 6,
      strokeOpacity: 1,
      offsetX: -10,
      hover: { size: 8 },
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [{
        size: 8,
        seriesIndex: 0,
        fillColor: '#fff',
        strokeColor: currentTheme.primary,
        dataPointIndex: series[currentTab.value][0].data.length - 1,
      }],
    },
  }
})
</script>

<template>
  <VCard>
    <VCardText>
      <VTabs
        v-model="currentTab"
        class="v-tabs-pill"
      >
        <VTab value="income" class="highlighted-tab">
          Project Health Indicator
        </VTab>
      </VTabs>
    </VCardText>

    <VCardText class="d-flex align-center gap-3">
      <VAvatar
        size="48"
        rounded
        :image="tabData.avatar"
      />

      <div>
        <p class="mb-0">
          {{ tabData.title }}
        </p>
        <div class="d-flex align-center gap-2">
          <h6 class="text-h6">
            {{ tabData.stats }}
          </h6>
          <span
            class="text-sm"
            :class="tabData.profitLoss > 0 ? 'text-success' : 'text-error'"
          >
          </span>
        </div>
      </div>
    </VCardText>

    <VCardText>
      <VueApexCharts
        type="area"
        :height="230"
        :options="chartConfig"
        :series="series[currentTab]"
      />
    </VCardText>

    <!-- <VCardText class="d-flex align-center justify-center pt-2 gap-4">
      <VProgressCircular
        size="45"
        color="primary"
        :model-value="tabData.profitLoss"
      >
        <span class="text-overline text-medium-emphasis">${{ tabData.profitLossAmount }}</span>
      </VProgressCircular>

      <div>
        <h6 class="text-base font-weight-regular">
          <span class="text-capitalize d-inline-block">{{ currentTab }} this week</span>
        </h6>
        <span class="text-sm d-inline-block">{{ tabData.compareToLastWeek }} less than last week</span>
      </div>
    </VCardText> -->
  </VCard>
</template>



<style scoped>
.highlighted-tab {
  display: flex;
  justify-content: flex-start; /* Align horizontally to the left */
  align-items: center; /* Align vertically center */
  padding: 5px 10px; /* Add padding for better spacing */
  background-color: #f0f8ff; /* Light background color */
  border-radius: 3px; /* Rounded corners */
  font-weight: bold; /* Bold text */
  font-size: 16px;
  color: #333; /* Dark text color */
  border: 1px solid #007bff; /* Border to highlight */
  margin: 0; /* Remove margin to align it properly */
  text-align: left; /* Ensure text is left-aligned */
}

.v-tabs {
  justify-content: flex-start; /* Align tabs to the left */
}

.table-container {
  max-height: 400px; /* Adjust based on your needs */
  overflow-y: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-bordered {
  border: 1px solid #dee2e6;
}

.table-bordered th, .table-bordered td {
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