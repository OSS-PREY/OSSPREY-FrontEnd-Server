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

    <!-- Single Column Table for Actionables -->
    <VCardText>
      <div class="table-container">
        <table class="table table-bordered">
          <thead>
            <tr class="table-primary">
              <th>Actionable Recommendation</th>
            </tr>
          </thead>
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
  const data = {
    income: {
      avatar: statsVerticalWallet,
      title: '',
      stats: 'How do you stay on track? With these steps below:',
    },
  };
  return data[currentTab.value];
});

// Helper: Return bullet color based on importance
const getBulletColor = (importance) => {
  // For priority 5 & 6 (and above) => red; for 3-4 => yellow; for 1-2 => green.
  if (importance >= 5) return 'red';
  else if (importance >= 3) return 'yellow';
  else return 'green';
};

// Ensure that we always work with an array and sort descending by importance
const sortedActionables = computed(() => {
  // Use projectStore.reactData if it's an array; otherwise, return empty array.
  const dataArray = Array.isArray(projectStore.reactData) ? projectStore.reactData : [];
  return dataArray.slice().sort((a, b) => b.importance - a.importance);
});
</script>

<style scoped>
.project-actionables-card {
  height: 400px;
  overflow: hidden;
}

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

.actionable-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bullet {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.action-text {
  font-weight: 500;
}

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
</style>
