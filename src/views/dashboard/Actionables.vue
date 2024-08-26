<script setup>
import statsVerticalWallet from '@images/cards/wallet-primary.png';
import { hexToRgb } from '@layouts/utils';
import { useTheme } from 'vuetify';

const vuetifyTheme = useTheme()

const series = {
  income: [{
    data: [
      24,
      21,
      30,
      22,
      42,
      26,
      35,
      29,
    ],
  }]
}

const currentTab = ref('income')

const tabData = computed(() => {
  const data = {
    income: {
      avatar: statsVerticalWallet,
      title: '',
      stats: 'How do you stay on track? With these steps below:',
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
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
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
      min: 10,
      max: 50,
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
          Researched Actionables (ReACTs)
        </VTab>
      </VTabs>
    </VCardText>

    <VCardText class="d-flex align-center gap-3">
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
      <div class="col-md-12 table-container">
        <!-- <center><h5>Actionables for Feature Amelioration</h5></center> -->
        <table class="table table-bordered">
          <thead>
            <tr class="table-primary">
              <th>Feature Name</th>
              <th>Actionables</th>
              <th>Largest Delta</th>
              <th>Confidence Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="3"> <i> t_num_dev_nodes </i> </td>
              <td>Encourage contributor participation by acknowledging efforts and providing timely responses <a href="">[REF]</a></td>
              <td rowspan="3">-5</td>
              <td>80</td>
            </tr>
            <tr>
              <td>Consider implementing anonymous code review processes <a href="">[REF]</a></td>
              <td>-3</td>
            </tr>
            <tr>
              <td>Develop a clear code of conduct that outlines expectations for behavior within the community <a href="">[REF]</a></td>
              <td>-4</td>
            </tr>
            <tr>
              <td rowspan="3"> <i> t_num_dev_per_file </i> </td>
              <td>Pair individuals with comparable experience and capabilities. <a href="">[REF]</a></td>
              <td rowspan="3">-7</td>
              <td>60</td>
            </tr>
            <tr>
              <td>Control access to documents being edited at the repository. Implement mechanisms to request and obtain shared resources. <a href="">[REF]</a></td>
              <td>-2</td>
            </tr>
            <tr>
              <td>Utilize a distributed pair programming tool that supports defined roles between the pairs. <a href="">[REF]</a></td>
              <td>-6</td>
            </tr>
            <tr>
              <td rowspan="3"> <i> t_graph_density </i> </td>
              <td>Use a domain-specific language (DSL) to define collaboration models <a href="">[REF]</a></td>
              <td rowspan="3">-4</td>
              <td>75</td>
            </tr>
            <tr>
              <td>Document collaboration models as part of the project's governance documentation <a href="">[REF]</a></td>
              <td>-5</td>
            </tr>
            <tr>
              <td>Integrate collaboration models into existing tools like Gerrit or Apache to enforce governance rules <a href="">[REF]</a></td>
              <td>-3</td>
            </tr>
            <tr>
              <td rowspan="3"> <i> st_num_dev </i> </td>
              <td>Create a live FAQ section. Create FAQ sections to help developers find answers to recurrent questions. The FAQ must not be a static section; it must be live and grow according to questions and issues recurrently asked or reported. The community can build the FAQ cooperatively, in a wiki-like page, enabling anyone to contribute with entries (question + answer) <a href="">[REF]</a></td>
              <td rowspan="3">-6</td>
              <td>85</td>
            </tr>
            <tr>
              <td>Consider implementing anonymous code review processes <a href="">[REF]</a></td>
              <td>-2</td>
            </tr>
            <tr>
              <td>Develop a clear code of conduct that outlines expectations for behavior within the community <a href="">[REF]</a></td>
              <td>-4</td>
            </tr>
          </tbody>
        </table>
      </div>
    </VCardText>
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