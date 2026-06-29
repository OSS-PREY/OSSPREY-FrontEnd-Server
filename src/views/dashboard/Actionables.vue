<!-- src/components/Actionables.vue -->
<template>
  <VCard class="text-center text-sm-start project-actionables-card hover-elevate">
    <VCardText>
      <DashboardPanelHeader
        title="Researched Actionables (ReACTs)"
        tooltip="Presents evidence-based interventions recommended when socio-technical metrics fall below historical baselines. Drawn from 186 peer-reviewed SE studies and mapped to project-specific needs."
      />
    </VCardText>

    <VCardText class="d-flex align-center gap-3">
      <div>
        <p class="mb-0">{{ tabData.title }}</p>
        <p class="mb-0">{{ tabData.monthDetail }}</p>
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
      <div v-if="hasActionables" class="table-container">
        <table class="table table-bordered">
          <tbody>
            <template v-for="(actionable, index) in sortedActionables" :key="index">
              <tr>
                <td>
                  <div
                    class="actionable-cell clickable"
                    role="button"
                    tabindex="0"
                    @click="openActionable(actionable)"
                    @keydown.enter="openActionable(actionable)"
                  >
                    <span
                      class="bullet"
                      :style="{ backgroundColor: getBulletColor(actionable.importance) }"
                    ></span>
                    <span class="action-text">{{ actionable.title }}</span>
                    <span class="refs">
                      <template v-for="(refItem, rIndex) in refsFor(actionable)" :key="rIndex">
                        <a v-if="refItem.link" :href="refItem.link" target="_blank" class="ref-link" @click.stop>[REF]</a>
                      </template>
                    </span>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-else-if="shouldShowActionableEmptyState" class="empty-state">
        No data available for this month.
      </div>
    </VCardText>

    <!-- Actionable detail dialog -->
    <VDialog v-model="dialogOpen" max-width="600" scrollable>
      <VCard v-if="selectedActionable">
        <VCardItem>
          <VCardTitle class="dialog-title">{{ displayActionable.title }}</VCardTitle>
          <template #append>
            <VChip :color="getBulletColor(displayActionable.importance)" size="small" label>
              {{ priorityLabel(displayActionable.importance) }}
            </VChip>
          </template>
        </VCardItem>

        <VCardText>
          <div v-if="displayActionable.category" class="detail-section">
            <div class="detail-label">Category</div>
            <div class="detail-body">{{ displayActionable.category }}</div>
          </div>

          <div v-if="displayActionable.positive_impact" class="detail-section">
            <div class="detail-label">Impact</div>
            <div class="detail-body">{{ displayActionable.positive_impact }}</div>
          </div>

          <div v-if="displayActionable.evidence" class="detail-section">
            <div class="detail-label">Evidence</div>
            <div class="detail-body">{{ displayActionable.evidence }}</div>
          </div>

          <div v-if="displayRefs.length" class="detail-section">
            <div class="detail-label">References</div>
            <div class="detail-body">
              <a
                v-for="(refItem, rIndex) in displayRefs"
                :key="rIndex"
                :href="refItem.link || undefined"
                target="_blank"
                class="ref-link dialog-ref"
              >{{ refItem.label }}</a>
            </div>
          </div>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialogOpen = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { ref, computed } from 'vue';
import DashboardPanelHeader from '@/components/DashboardPanelHeader.vue';
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
      monthDetail: `Current month: ${projectStore.selectedMonth ?? ''}`,
    },
  }[currentTab.value];
});

// Helper: Return bullet color based on importance (support score, 1-4)
const getBulletColor = (importance) => {
  if (importance >= 4) return 'red';   // Critical
  else if (importance >= 2) return 'yellow'; // Medium
  else return 'green';                 // Low
};

// Helper: Human-readable priority label for the detail dialog
const priorityLabel = (importance) => {
  if (importance >= 4) return 'Critical';
  else if (importance >= 2) return 'Medium';
  else return 'Low';
};

// Detail dialog state
const dialogOpen = ref(false);
const selectedActionable = ref(null);

const openActionable = (actionable) => {
  selectedActionable.value = actionable;
  dialogOpen.value = true;
};

const extractUrls = (value) => {
  if (Array.isArray(value)) return value.flatMap(extractUrls);
  if (value === null || value === undefined) return [];
  const matches = String(value).match(/https?:\/\/[^\s'"\]\[,]+/g);
  return matches ? matches : [];
};

const extractRefs = (refs) => {
  if (!refs) return [];
  const items = Array.isArray(refs) ? refs : [refs];
  const result = [];

  for (const item of items) {
    if (item === null || item === undefined) continue;
    if (typeof item === 'string') {
      for (const url of extractUrls(item)) result.push({ link: url, label: url });
      continue;
    }
    if (typeof item === 'object') {
      const urls = extractUrls(item.link);
      const label = item.venue || item.title || '';
      if (urls.length === 0 && label) {
        result.push({ link: '', label });
      } else {
        for (const url of urls) result.push({ link: url, label: label || url });
      }
    }
  }

  const seen = new Set();
  return result.filter((ref) => {
    const key = ref.link || ref.label;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const refsFor = (actionable) => extractRefs(actionable?.refs);

const displayActionable = computed(() => {
  const a = selectedActionable.value || {};
  return {
    title: a.title || a.Title || '',
    importance: a.importance ?? a.Importance ?? 0,
    category: a.category || a.Category || '',
    positive_impact: a.positive_impact || a.impact || a.Positive_Impact || '',
    evidence: a.evidence || a.Evidence || '',
  };
});

const displayRefs = computed(() => extractRefs(selectedActionable.value?.refs));

// ------------------ Show up to 10 actionables for the selected month ------------------
const sortedActionables = computed(() => {
  const reactData = projectStore.reactData;
  const monthKey = projectStore.selectedMonth !== null && projectStore.selectedMonth !== undefined
    ? String(projectStore.selectedMonth)
    : null;

  let actionables = [];

  if (Array.isArray(reactData)) {
    actionables = reactData;
  } else if (reactData && typeof reactData === 'object') {
    if (monthKey && Array.isArray(reactData[monthKey])) {
      actionables = reactData[monthKey];
    } else {
      const firstMonthEntries = Object.values(reactData).find(entry => Array.isArray(entry));
      if (firstMonthEntries) actionables = firstMonthEntries;
    }
  }

  return Array.isArray(actionables)
    ? [...actionables].sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 10)
    : [];
});
// ---------------------------------------------------------------------------------------

const hasActionables = computed(() => Array.isArray(sortedActionables.value) && sortedActionables.value.length > 0);

const shouldShowActionableEmptyState = computed(() => {
  const hasMonth = projectStore.selectedMonth !== null && projectStore.selectedMonth !== undefined;
  return hasMonth && !hasActionables.value;
});
</script>

<style scoped>
.project-actionables-card {
  height: 450px;
  overflow: hidden;
}

/* Tabs */
.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  position: relative;
  margin: 0;
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

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-weight: 500;
  color: #6b6b6b;
  text-align: center;
}

/* Clickable actionable rows */
.clickable {
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* Detail dialog */
.dialog-title {
  white-space: normal;
  word-break: break-word;
  font-size: 1.1rem;
  line-height: 1.4;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-label {
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
}

.detail-body {
  font-size: 0.95rem;
  line-height: 1.5;
}

.dialog-ref {
  display: inline-block;
  margin-right: 10px;
  word-break: break-all;
}
</style>
