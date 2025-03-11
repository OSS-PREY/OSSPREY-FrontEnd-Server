<!-- src/components/Actionables.vue -->
<template>
  <VCard class="text-center text-sm-start project-actionables-card">
    <VCardText>
      <VTabs v-model="currentTab" class="v-tabs-pill">
        <VTab value="income" class="highlighted-tab">
          Recommendations
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

    <!-- Priority Labels -->
    <VCardText>
      <div class="priority-labels">
        <div class="priority-item">
          <span class="bullet" style="background-color: red;"></span> <span>Critical</span>
        </div>
        <div class="priority-item">
          <span class="bullet" style="background-color: yellow;"></span> <span>Medium</span>
        </div>
        <div class="priority-item">
          <span class="bullet" style="background-color: green;"></span> <span>Low</span>
        </div>
      </div>
    </VCardText>

    <!-- Table for Actionables -->
    <VCardText>
      <div class="table-container">
        <table class="table table-bordered">
          <tbody>
            <template v-for="(actionable, index) in sortedActionables" :key="index">
              <tr>
                <td>
                  <div class="actionable-cell">
                    <span
                      class="bullet"
                      :style="{ backgroundColor: getBulletColor(actionable.importance) }"
                    ></span>
                    <span class="action-text">{{ actionable.title }}</span>
                    <span class="refs">
                      <template v-for="(refItem, rIndex) in actionable.refs" :key="rIndex">
                        <a :href="refItem.link" target="_blank" class="ref-link">[REF]</a>
                      </template>
                    </span>
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

<script setup>
import { ref, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';
import statsVerticalWallet from '@images/cards/wallet-primary.png';

const currentTab = ref('income');

const vuetifyTheme = useTheme();
const projectStore = useProjectStore();

const tabData = computed(() => {
  return {
    income: {
      avatar: statsVerticalWallet,
      title: '',
      stats: 'How do you stay on track? With these steps below:',
    },
  }[currentTab.value];
});

// Helper: Return bullet color based on importance
const getBulletColor = (importance) => {
  if (importance >= 5) return 'red';   // Critical
  else if (importance >= 3) return 'yellow'; // Medium
  else return 'green';                 // Low
};

// ------------------ CHANGED: handle multi-month ReACT data ------------------
const sortedActionables = computed(() => {
  const rd = projectStore.reactData;  // can be array or object
  let dataArray = [];

  if (Array.isArray(rd)) {
    // Old single-month style
    dataArray = rd;
  } else if (rd && typeof rd === 'object') {
    // Multi-month style: pick the array for the selected month
    const selMonth = projectStore.selectedMonth;
    if (selMonth != null && rd[selMonth]) {
      dataArray = rd[selMonth];
    } else {
      dataArray = [];
    }
  }

  // Sort descending by importance
<<<<<<< HEAD
  return dataArray.slice().sort((a, b) => b.importance - a.importance).slice(0, 10);
=======
  return dataArray.slice().sort((a, b) => b.importance - a.importance).slice(0, 10);;
>>>>>>> f249e70b0bb47d836faeef6445195971dfce82a2
});
// ---------------------------------------------------------------------------
</script>

<style scoped>
.project-actionables-card {
  height: 450px;
  overflow: hidden;
}

/* Tabs */
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

/* Priority Labels */
.priority-labels {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

/* Table */
.table-container {
  max-height: 300px; /* Adjust as needed */
  overflow-y: auto;
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

.table-bordered td {
  border: 1px solid #dee2e6;
  padding: 10px;
  text-align: left;
  word-wrap: break-word;
  white-space: normal;
}

/* Fix for bullets getting squashed */
.actionable-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  word-break: break-word;
}

.bullet {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.action-text {
  font-weight: 500;
  flex: 1;
}

/* Reference Links */
.refs {
  margin-left: 8px;
}

.ref-link {
  text-decoration: none;
  color: #1e88e5;
  font-weight: bold;
  margin-right: 4px;
}

.ref-link:hover {
  text-decoration: underline;
}

/* Ensuring table doesn't get cut */
.table-container {
  overflow-x: auto;
  padding-bottom: 10px;
}
</style>
