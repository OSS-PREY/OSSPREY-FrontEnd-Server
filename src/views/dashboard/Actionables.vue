<script setup>
import { ref, computed } from 'vue';
import statsVerticalWallet from '@images/cards/wallet-primary.png';
import { useTheme } from 'vuetify';

const vuetifyTheme = useTheme();

const currentTab = ref('income');

const tabData = computed(() => {
  const data = {
    income: {
      avatar: statsVerticalWallet,
      title: '',
      stats: 'How do you stay on track? With these steps below:',
    },
  };

  return data[currentTab.value];
});

// Priority order mapping
const priorityOrder = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

// Actionables data
const actionablesData = [
  {
    featureName: 't_num_dev_nodes',
    actionables: [
      {
        action:
          'Encourage contributor participation by acknowledging efforts and providing timely responses [REF]',
        priority: 'critical',
      },
      {
        action: 'Consider implementing anonymous code review processes [REF]',
        priority: 'high',
      },
      {
        action:
          'Develop a clear code of conduct that outlines expectations for behavior within the community [REF]',
        priority: 'medium',
      },
    ],
  },
  {
    featureName: 't_num_dev_per_file',
    actionables: [
      {
        action: 'Pair individuals with comparable experience and capabilities [REF]',
        priority: 'critical',
      },
      {
        action:
          'Control access to documents being edited at the repository. Implement mechanisms to request and obtain shared resources [REF]',
        priority: 'medium',
      },
      {
        action:
          'Utilize a distributed pair programming tool that supports defined roles between the pairs [REF]',
        priority: 'low',
      },
    ],
  },
  {
    featureName: 't_graph_density',
    actionables: [
      {
        action: 'Use a domain-specific language (DSL) to define collaboration models [REF]',
        priority: 'high',
      },
      {
        action:
          "Document collaboration models as part of the project's governance documentation [REF]",
        priority: 'medium',
      },
      {
        action:
          'Integrate collaboration models into existing tools like Gerrit or Apache to enforce governance rules [REF]',
        priority: 'low',
      },
    ],
  },
  {
    featureName: 'st_num_dev',
    actionables: [
      {
        action:
          'Create a live FAQ section to help developers find answers to recurrent questions. The FAQ must be live and grow according to recurrent issues. The community can build the FAQ cooperatively in a wiki-like page, enabling anyone to contribute entries [REF]',
        priority: 'critical',
      },
      {
        action: 'Consider implementing anonymous code review processes [REF]',
        priority: 'high',
      },
      {
        action:
          'Develop a clear code of conduct that outlines expectations for behavior within the community [REF]',
        priority: 'medium',
      },
    ],
  },
];

// Sorted actionables data
const sortedActionablesData = computed(() => {
  return actionablesData.map((feature) => {
    const sortedActionables = [...feature.actionables].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    return {
      ...feature,
      actionables: sortedActionables,
    };
  });
});
</script>


<template>
  <VCard>
    <VCardText>
      <VTabs v-model="currentTab" class="v-tabs-pill">
        <VTab value="income" class="highlighted-tab">
          Researched Actionables (ReACTs)
        </VTab>
      </VTabs>
    </VCardText>

    <VCardText class="d-flex align-center gap-3">
      <div>
        <p class="mb-0">{{ tabData.title }}</p>
        <div class="d-flex align-center gap-2">
          <h6 class="text-h6">{{ tabData.stats }}</h6>
        </div>
      </div>
    </VCardText>

    <!-- Priority Legend -->
    <VCardText>
      <div class="priority-legend">
        <span class="legend-item">
          <span class="priority-indicator critical"></span> Critical
        </span>
        <span class="legend-item">
          <span class="priority-indicator high"></span> High
        </span>
        <span class="legend-item">
          <span class="priority-indicator medium"></span> Medium
        </span>
        <span class="legend-item">
          <span class="priority-indicator low"></span> Low
        </span>
      </div>
    </VCardText>

    <VCardText>
      <div class="table-container">
        <table class="table table-bordered">
          <thead>
            <tr class="table-primary">
              <th class="feature-name-header">Feature Name</th>
              <th class="actionable-header">Actionables</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="feature in sortedActionablesData"
              :key="feature.featureName"
            >
              <tr
                v-for="(actionable, index) in feature.actionables"
                :key="index"
              >
                <td
                  v-if="index === 0"
                  :rowspan="feature.actionables.length"
                  class="feature-name-cell"
                >
                  {{ feature.featureName }}
                </td>
                <td class="actionable-cell">
                  <div class="priority">
                    <span
                      :class="['priority-indicator', actionable.priority]"
                    ></span>
                    {{ actionable.action }}
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
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
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Ensures consistent column widths */
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
}

.table-primary {
  background-color: #696cff;
  color: #fff;
}

.center {
  text-align: center;
}

.priority {
  display: flex;
  align-items: center;
}

.priority-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.priority-indicator.critical {
  background-color: maroon;
}

.priority-indicator.high {
  background-color: red;
}

.priority-indicator.medium {
  background-color: yellow;
}

.priority-indicator.low {
  background-color: green;
}

/* Legend styling */
.priority-legend {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

/* Adjusting cell widths */
.feature-name-header,
.feature-name-cell {
  width: 25%; /* Adjust as needed */
  min-width: 150px;
}

.actionable-header,
.actionable-cell {
  width: 75%; /* Adjust as needed */
}
</style>
