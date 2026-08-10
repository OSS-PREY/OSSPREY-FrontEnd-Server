<!-- src/components/Actionables.vue -->
<template>
  <VCard class="text-center text-sm-start project-actionables-card hover-elevate">
    <VCardText>
      <DashboardPanelHeader
        title="Researched Actionables (ReACTs)"
        tooltip="Presents evidence-based interventions recommended when socio-technical metrics fall below historical baselines. Drawn from 186 peer-reviewed SE studies and mapped to project-specific needs."
      />
      <p class="explore-network mb-0">
        Explore actionable network here:
        <a
          href="https://nafiz43.github.io/ReACT-GPT/"
          target="_blank"
          rel="noopener"
          class="explore-link"
        >https://nafiz43.github.io/ReACT-GPT/</a>
      </p>
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
      <div v-if="selecting" class="thinking">
        <span class="thinking__star">&#10035;</span>
        <span class="thinking__word">{{ word }}&hellip;</span>
        <span class="thinking__meta">({{ seconds }}s) matching to this project</span>
      </div>

      <div v-else-if="projectStore.selectedProject" class="actionables-refresh">
        <button type="button" class="refresh-link" @click="selectForProject({ refresh: true })">
          Refresh for this month
        </button>
      </div>

      <div v-if="hasActionables && !selecting" class="table-container">
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
                    <span class="action-text">
                      {{ actionable.title }}
                      <span v-if="actionable.why" class="action-why">{{ actionable.why }}</span>
                    </span>
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
            <VChip
              size="small"
              label
              variant="flat"
              :style="priorityChipStyle(displayActionable.importance)"
            >
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

          <div v-if="confidenceLabel" class="detail-section">
            <div class="detail-label">Confidence</div>
            <div class="detail-body">{{ confidenceLabel }}</div>
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
              >{{ refItem.link }}</a>
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
import { ref, computed, onUnmounted, watch } from 'vue';
import DashboardPanelHeader from '@/components/DashboardPanelHeader.vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/projectStore';
import { topActionables } from '@/utils/rankActionables';
import { apiFetch } from '@/utils/apiFetch';
import { getApiBaseUrl } from '@/utils/apiBase';
import { buildDigest } from '@/utils/painPointsDigest';
import { useThinking } from '@/utils/thinking';
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

// Helper: Color-coded chip style for the detail dialog priority
const priorityChipStyle = (importance) => {
  if (importance >= 4) return { backgroundColor: '#e53935', color: '#ffffff' };
  else if (importance >= 2) return { backgroundColor: '#f9a825', color: '#000000' };
  else return { backgroundColor: '#43a047', color: '#ffffff' };
};

// Detail dialog state
const dialogOpen = ref(false);
const selectedActionable = ref(null);

const openActionable = (actionable) => {
  selectedActionable.value = actionable;
  dialogOpen.value = true;
};

const ALLOWED_REF_HOSTS = [
  'doi.org',
  'ieee.org',
  'ieeecomputersociety.org',
  'acm.org',
  'springer.com',
  'sciencedirect.com',
  'elsevier.com',
  'arxiv.org',
  'wiley.com',
  'usenix.org',
  'researchgate.net',
];

const MAX_REFS = 3;

const isAllowedPublisherUrl = (url) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_REF_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
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
    const rawLink = typeof item === 'string' ? item : item.link;
    const label = typeof item === 'object' && item !== null ? (item.venue || item.title || '') : '';
    for (const url of extractUrls(rawLink)) {
      if (!isAllowedPublisherUrl(url)) continue;
      result.push({ link: url, label: label || url });
    }
  }

  const seen = new Set();
  return result
    .filter((ref) => {
      if (seen.has(ref.link)) return false;
      seen.add(ref.link);
      return true;
    })
    .slice(0, MAX_REFS);
};

const refsFor = (actionable) => extractRefs(actionable?.refs);

const displayActionable = computed(() => {
  const a = selectedActionable.value || {};
  return {
    title: a.title || a.Title || '',
    importance: a.importance ?? a.Importance ?? 0,
    category: a.category || a.Category || '',
    positive_impact: a.positive_impact || a.impact || a.Positive_Impact || a.Impact || '',
    evidence: a.evidence || a.Evidence || '',
    confidence_score: a.confidence_score ?? a.confidenceScore ?? null,
  };
});

const confidenceLabel = computed(() => {
  const score = displayActionable.value.confidence_score;
  if (score === null || score === undefined || score === '') return '';
  const num = Number(score);
  if (Number.isNaN(num)) return String(score);
  return num <= 1 ? `${Math.round(num * 100)}%` : String(num);
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
    if (monthKey) {
      // A month is selected: show its actionables, or honestly show none.
      // Falling back to some *other* month's entries would mislabel them as
      // the current month's.
      actionables = Array.isArray(reactData[monthKey]) ? reactData[monthKey] : [];
    } else {
      const firstMonthEntries = Object.values(reactData).find(entry => Array.isArray(entry));
      if (firstMonthEntries) actionables = firstMonthEntries;
    }
  }

  // The server's project-specific selection when it has run. The catalog
  // order is the fallback -- it is what the panel showed for every project,
  // which is exactly the genericness this replaces.
  if (projectStore.projectActionables.length)
    return projectStore.projectActionables;

  return topActionables(actionables);
});

const { word, seconds, start: startThinking, stop: stopThinking } = useThinking();

const selecting = computed(() => projectStore.projectActionablesLoading);

// Selection costs two model calls and a minute of inference on a cold model, so
// it runs once when a project loads rather than on every slider move. The
// button re-runs it against the month currently on screen.
const selectForProject = async ({ refresh = false } = {}) => {
  const project = projectStore.selectedProject;
  if (!project || projectStore.projectActionablesLoading) return;

  const digest = buildDigest({
    forecast: projectStore.gradForecastData,
    months: projectStore.xAxisCategories.map(l => parseInt(String(l).replace(/\D/g, ''), 10)),
    techNetData: projectStore.techNetData,
    socialNetData: projectStore.socialNetData,
    selectedMonth: projectStore.selectedMonth,
    metadata: projectStore.localMetadata,
  });

  if (!digest) return;

  projectStore.projectActionablesLoading = true;
  startThinking();

  try {
    const res = await apiFetch(`${getApiBaseUrl()}/api/actionables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        github_url: project.github_url,
        project_name: project.project_name || project.name || 'this project',
        description: projectStore.localMetadata?.description || '',
        digest,
        refresh,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && Array.isArray(data.actionables) && data.actionables.length)
      projectStore.projectActionables = data.actionables;
  } catch {
    // Keep the catalog order; the panel must never come up empty.
  } finally {
    projectStore.projectActionablesLoading = false;
    stopThinking();
  }
};

watch(
  () => projectStore.selectedProject?.github_url || projectStore.selectedProject?.project_id,
  () => {
    projectStore.projectActionables = [];
    selectForProject();
  },
  { immediate: true },
);

onUnmounted(stopThinking);
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

/* Explore network link */
.explore-network {
  margin-top: 6px;
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface));
}

.explore-link {
  color: rgb(var(--v-theme-link));
  font-weight: 600;
  text-decoration: none;
  word-break: break-all;
}

.explore-link:hover {
  text-decoration: underline;
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
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.table-bordered td {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 10px;
  text-align: left;
  word-wrap: break-word;
  white-space: normal;
}

/* The one-line reason the model gave for choosing this entry for this
   project. Block so it sits under the title rather than trailing it. */
.action-why {
  display: block;
  margin-block-start: 4px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 0.85em;
  font-style: italic;
}

.actionables-refresh {
  display: flex;
  justify-content: flex-end;
  margin-block-end: 6px;
}

.refresh-link {
  border: none;
  background: none;
  padding: 0;
  color: rgb(var(--v-theme-link));
  font-size: 0.82rem;
  cursor: pointer;
}

.refresh-link:hover {
  text-decoration: underline;
}

/* Fix for bullets getting squashed */
.actionable-cell {
  display: flex;
  align-items: flex-start;
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
  margin-block-start: 5px;
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
  color: rgb(var(--v-theme-link));
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
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
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
