<template>
  <VCard class="text-center text-sm-start hover-elevate" style="height: 450px;">
    <VRow no-gutters>
      <VCol cols="12" sm="12">
        <!-- Header -->
        <VCardItem class="pb-3">
          <DashboardPanelHeader
            title="Project Selector"
            tooltip="Select any public GitHub repository to load its socio-technical activity, sustainability forecasts, and evidence-based interventions. All dashboard components update automatically based on the chosen repository and month."
          />
        </VCardItem>

        <!-- Data Source Buttons -->
        <!--
        <VRow class="mb">
          <VCol cols="12" class="d-flex justify-center">
            <VBtn color="primary" :variant="selectedDataSource === 'foundation' ? 'outlined' : 'text'" class="ms-2"
              @click="switchDataSource('foundation')">
              Foundation
            </VBtn>
            <VBtn color="primary" :variant="selectedDataSource === 'local' ? 'outlined' : 'text'" class="ms-2"
              @click="switchDataSource('local')">
              GitHub
            </VBtn>
          </VCol>
        </VRow>
        -->

        <!-- Content Area -->
        <VCardText class="content-area">
          <div v-if="projectStore.loading" class="loading">Loading projects...</div>
          <div v-else>
            <!-- FOUNDATION / ECLIPSE BLOCK
            <div v-if="selectedDataSource === 'foundation'">
              <div v-if="projectStore.error" class="text-error">{{ projectStore.error }}</div>
              <VSelect v-model="projectStore.selectedFoundation" :items="foundations" label="Foundation" class="mb-3"
                outlined dense @change="handleFoundationChange" />
              <VSelect v-if="projectStore.selectedFoundation === 'Eclipse'" v-model="selectedCategory"
                :items="eclipseCategories" label="Category" class="mb-3" outlined dense
                @change="handleCategoryChange" />
              <VAutocomplete v-if="shouldShowProjectAutocomplete" v-model="selectedProject" :items="projectItems"
                item-title="project_name" item-value="project_id" :label="projectLabel" class="mb-3" outlined dense
                :loading="projectStore.loading" :error="!!projectStore.error" :error-messages="projectStore.error"
                return-object hide-no-data hide-details clearable />
              <VSlider v-if="hasValidMonths" v-model="projectStore.singleValue" :min="sliderMin" :max="sliderMax"
                :step="1" class="mb-3" label="Select Month" :ticks="true" tick-size="4" thumb-label
                @update:modelValue="handleSingleValueChange" />
              <p v-if="hasValidMonths" class="slider-helper-text mb-3">
                Adjust the timeline to view sustainability forecasts, social and technical networks for a particular month.
              </p>
              <div v-if="projectStore.selectedProject && !hasValidMonths" class="text-error">
                No available months for the selected project.
              </div>
              <VCard
                v-if="(projectStore.selectedFoundation === 'Apache' || projectStore.selectedFoundation === 'Eclipse') && projectStore.selectedProject"
                class="metrics-container mt-3" outlined>
                <VRow align="center" justify="space-around">
                  <VCol class="d-flex align-center" cols="auto">
                    <VIcon size="20">fa-solid fa-eye</VIcon>
                    <span class="ml-1">Watch: {{ projectStore.watch_count }}</span>
                  </VCol>
                  <VCol class="d-flex align-center" cols="auto">
                    <VIcon size="20">fa-solid fa-code-fork</VIcon>
                    <span class="ml-1">Fork: {{ projectStore.fork_count }}</span>
                  </VCol>
                  <VCol class="d-flex align-center" cols="auto">
                    <VIcon size="20">fa-solid fa-star</VIcon>
                    <span class="ml-1">Star: {{ projectStore.stargazer_count }}</span>
                  </VCol>
                </VRow>
              </VCard>
            </div>
            -->

            <!-- LOCAL PROJECTS BLOCK -->
            <div v-if="selectedDataSource === 'local'">
              <!--
              <VBtn color="primary" class="mb-2" @click="triggerFileInput" block>
                Browse Local Folder
              </VBtn>
              <input type="file" ref="fileInput" @change="handleFileSelect" webkitdirectory style="display: none;" />
              -->
              <VSelect
                v-model="selectedRepoOption"
                :items="repoOptions"
                item-title="title"
                item-value="value"
                label="GitHub Repository URL"
                outlined
                dense
                class="mb-3"
                @update:modelValue="handleRepoSelection"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :class="item.raw.value === 'custom' ? 'custom-repo-option' : ''" />
                </template>
              </VSelect>
              <VTextField
                v-if="selectedRepoOption === 'custom'"
                v-model="githubRepoLink"
                label="GitHub Repository URL"
                outlined
                dense
                class="mb-3"
                placeholder="https://github.com/username/repository"
              />
              <VBtn color="primary" class="mb-2" :disabled="buttonDisabled" @click="uploadRepoLink" block>
                Process Repository
              </VBtn>
              <div v-if="uploadError" class="text-error">{{ uploadError }}</div>

              <!-- Request Queue Status -->
              <VCard v-if="projectStore.queueProcessing || projectStore.queueStatus" class="queue-panel mt-3 mb-3" outlined>
                <div class="d-flex align-center mb-1">
                  <VProgressCircular
                    v-if="['queued', 'running'].includes(projectStore.queueStatus)"
                    indeterminate size="18" width="2" color="primary" class="me-2" />
                  <VIcon v-else-if="projectStore.queueStatus === 'completed'" size="18" color="success" class="me-2">fa-solid fa-circle-check</VIcon>
                  <VIcon v-else size="18" color="error" class="me-2">fa-solid fa-circle-exclamation</VIcon>
                  <strong>Status: {{ queueStatusLabel }}</strong>
                </div>

                <div v-if="projectStore.queueStatus === 'queued'" class="queue-detail">
                  <div>Your request has been placed in the queue.</div>
                  <div>Position: <strong>{{ projectStore.queuePosition }}</strong> of {{ projectStore.queueLength }} waiting</div>
                  <div>Estimated wait: <strong>{{ etaText }}</strong></div>
                  <VBtn size="small" variant="text" color="error" class="mt-1 px-0" @click="cancelQueued">Cancel request</VBtn>
                </div>

                <div v-else-if="projectStore.queueStatus === 'running'" class="queue-detail">
                  Processing your repository now. This can take a few minutes...
                </div>

                <div v-else-if="projectStore.queueStatus === 'completed'" class="queue-detail text-success">
                  Done! Your repository has been processed.
                </div>

                <div v-else-if="projectStore.queueStatus === 'failed'" class="queue-detail text-error">
                  {{ projectStore.queueError || 'Processing failed. Please try again.' }}
                </div>

                <div v-else-if="projectStore.queueStatus === 'cancelled'" class="queue-detail">
                  Request cancelled.
                </div>
              </VCard>
              <!-- LOCAL Mode Slider -->
              <VSlider v-if="localHasValidMonths" v-model="localMonth" :min="localSliderMin" :max="localSliderMax"
                :step="1" class="mb-3" label="Select Month" :ticks="true" tick-size="4" thumb-label
                @update:modelValue="handleLocalMonthChange" />
              <p v-if="localHasValidMonths" class="slider-helper-text mb-3">
                Adjust the timeline to view sustainability forecasts, social and technical networks for a particular month.
              </p>
              <div v-if="selectedLocalProject" class="mt-4">
                <div>
                  <strong>GitHub Project Name:</strong> {{ selectedLocalProject.github_url.split('/').pop() }}
                </div>
                <div>
                  <strong>GitHub Project URL:</strong>
                  <a :href="selectedLocalProject.github_url" target="_blank">
                    {{ selectedLocalProject.github_url }}
                  </a>
                </div>
              </div>
              <div v-if="userRepos.length" class="mt-4">
                <strong>Your Processed Repositories:</strong>
                <VList density="compact">
                  <VListItem v-for="repo in userRepos" :key="repo">
                    <a :href="repo" target="_blank">{{ repo }}</a>
                  </VListItem>
                </VList>
              </div>
              <!-- <div v-else class="coming-soon">Coming Soon</div> -->
            </div>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup>
import { onMounted, watch, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import DashboardPanelHeader from '@/components/DashboardPanelHeader.vue';
import { useProjectStore } from '@/stores/projectStore';
import { getApiBaseUrl } from '@/utils/apiBase';
import { apiFetch } from '@/utils/apiFetch';
const projectStore = useProjectStore();
const route = useRoute();

// Data source: GitHub only (foundation option hidden for now)
const selectedDataSource = ref('local');

// FOUNDATION reactive variables
const selectedProject = ref(null);
const selectedCategory = ref(null);

// LOCAL reactive variables
const selectedLocalProject = ref(null);
const githubRepoLink = ref('');
const fileInput = ref(null);
const uploadError = ref('');

const repoOptions = [
  { title: 'https://github.com/Nafiz43/EvidenceBot', value: 'https://github.com/Nafiz43/EvidenceBot' },
  { title: 'https://github.com/Nafiz43/ReACTive', value: 'https://github.com/Nafiz43/ReACTive' },
  { title: 'https://github.com/ossustain/APEX', value: 'https://github.com/ossustain/APEX' },
  { title: 'https://github.com/gem5/gem5', value: 'https://github.com/gem5/gem5' },
  { title: 'Try a Different GitHub Repo', value: 'custom' }
];
const selectedRepoOption = ref(null);

const handleRepoSelection = (val) => {
  if (val !== 'custom')
    githubRepoLink.value = val;
  else
    githubRepoLink.value = '';
};

const API_BASE = getApiBaseUrl();
const userRepos = ref([]);

const fetchUserRepos = async () => {
  const stored = localStorage.getItem('user');
  if (!stored) return;

  let email;
  try {
    email = JSON.parse(stored).email;
  }
  catch {
    return;
  }

  try {
    const res = await apiFetch(`${API_BASE}/api/user_repositories?email=${encodeURIComponent(email)}`);
    if (!res.ok)
      throw new Error(`Request failed with ${res.status}`);
    const data = await res.json();
    userRepos.value = Array.isArray(data.repositories) ? data.repositories : [];
  }
  catch (err) {
    console.error('Failed to fetch user repositories:', err);
  }
};

// STATIC LISTS
const foundations = ['Apache'];
const eclipseCategories = [
  'Modeling', 'IoT', 'Tools', 'Technology', 'Web Tools Platforms', 'Science', 'Digital Twin',
  'Automotive', 'Cloud Development', 'Adoptium', 'EE4J', 'Eclipse Project', 'Oniro', 'RT',
  'SOA Platform', 'PolarSys', 'LocationTech', 'OpenHW Group', 'AsciiDoc'
].sort((a, b) => a.localeCompare(b));

// FOUNDATION computed properties
const shouldShowProjectAutocomplete = computed(() => {
  return (projectStore.selectedFoundation === 'Apache') ||
    (projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value);
});

const projectItems = computed(() => {
  if (projectStore.selectedFoundation === 'Apache') {
    return [...projectStore.allDescriptions].sort((a, b) =>
      a.project_name.localeCompare(b.project_name)
    );
  }
  if (projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value) {
    return [...projectStore.eclipseDescriptions]
      .filter(project =>
        project.tech.toLowerCase() === selectedCategory.value.toLowerCase()
      )
      .sort((a, b) =>
        a.project_name.localeCompare(b.project_name)
      );
  }
  return [];
});

const projectLabel = computed(() => {
  return projectStore.selectedFoundation === 'Apache' ? 'Project'
    : projectStore.selectedFoundation === 'Eclipse' && selectedCategory.value ? 'Eclipse Project'
      : 'Project';
});
const sliderMin = computed(() => projectStore.minMonth);
const sliderMax = computed(() => projectStore.maxMonth);
const hasValidMonths = computed(() => projectStore.availableMonths.length > 0);

// LOCAL slider computed properties (from xAxisCategories)
// const localMonths = computed(() => {
//   const categories = projectStore.xAxisCategories;
//   if (selectedDataSource.value === 'local' && categories && categories.length > 0) {
//     return categories.map(label => {
//       const parts = label.split(" ");
//       return Number(parts[1]);
//     }).sort((a, b) => a - b);
//   }
//   return [];
// });
const localMonths = computed(() => {
  const categories = projectStore.xAxisCategories;
  if (selectedDataSource.value === 'local' && Array.isArray(categories)) {
    // The labels carry the real month numbers ("Month 0" ... "Month 274").
    // Numbering them from the array index instead gave 1..N, which is off by one
    // against the data everywhere and one past the end at the default -- so the
    // slider opened on a month that has no network at all. The 200 cap also made
    // everything beyond month 200 unreachable (gem5 has 275).
    return categories
      .map(label => Number(String(label).split(' ')[1]))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
  }
  return [];
});




const localHasValidMonths = computed(() => localMonths.value.length > 0);
const localSliderMin = computed(() => (localHasValidMonths.value ? localMonths.value[0] : 1));
const localSliderMax = computed(() => (localHasValidMonths.value ? localMonths.value[localMonths.value.length - 1] : 12));

const localMonth = ref(null);
watch(localMonths, (newVal) => {
  console.log("Local available months:", newVal);
  if (newVal.length > 0 && (localMonth.value === null || !newVal.includes(localMonth.value))) {
    // The store already chose an opening month that has data (see
    // utils/networkRows.js). Overriding it with the last month here is what put
    // the slider and the store one month apart and left both cards empty.
    localMonth.value = newVal.includes(projectStore.selectedMonth)
      ? projectStore.selectedMonth
      : newVal[newVal.length - 1];
    projectStore.selectedMonth = localMonth.value;
  }
});
const handleLocalMonthChange = (newVal) => {
  console.log("Local slider changed to:", newVal);
  localMonth.value = newVal;
  projectStore.selectedMonth = newVal;
};

const fetchLocalProjects = async () => {
  console.log('Fetching local projects...');
  // Implement if needed.
};

const fetchData = async () => {
  console.log('Fetching initial project data for both Apache and Eclipse...');
  await Promise.all([
    projectStore.fetchAllProjectData(),
    projectStore.fetchEclipseProjects(),
    fetchLocalProjects()
  ]);
  console.log('Initial project data fetched.');
};

const switchDataSource = (source) => {
  selectedDataSource.value = source;
  console.log("Switched to:", source);
  projectStore.isLocalMode = (source === 'local');
  if (source === 'local') {
    // Full reset: this runs on every dashboard
    // mount, and the partial reset left the previous repo's forecast,
    // actionables and networks on screen with nothing selected.
    projectStore.resetProjectDetails();
    projectStore.resetQueueState();
    projectStore.xAxisCategories = [];  // 🔧 Reset here
    projectStore.selectedMonth = null;
  } else {
    projectStore.resetProjectDetails();
    projectStore.xAxisCategories = [];  // 🔧 Reset here
  }
};

const handleFoundationChange = async () => {
  console.log(`Foundation changed to: ${projectStore.selectedFoundation}`);
  if (projectStore.selectedFoundation === 'Eclipse') {
    if (projectStore.eclipseDescriptions.length === 0) {
      await projectStore.fetchEclipseProjects();
    }
    selectedCategory.value = null;
    selectedProject.value = null;
    await projectStore.resetProjectDetails();
  } else if (projectStore.selectedFoundation === 'Apache') {
    if (projectStore.allDescriptions.length === 0) {
      await projectStore.fetchAllProjectData();
    }
    selectedProject.value = null;
    await projectStore.resetProjectDetails();
  }
};

const handleCategoryChange = () => {
  console.log(`Category changed to: ${selectedCategory.value}`);
  selectedProject.value = null;
  projectStore.selectedProject = null;
};

const handleSingleValueChange = () => {
  console.log(`Foundation slider changed. New singleValue: ${projectStore.singleValue}`);
  projectStore.selectedMonth = projectStore.singleValue;
};

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length === 0) {
    console.log('No files selected.');
    return;
  }
  console.log('Selected files:', files);
  const fileList = Array.from(files).map(file => ({
    name: file.name,
    path: file.webkitRelativePath || file.name
  }));
  console.log('Selected File List:', fileList);
  event.target.value = '';
};

const buttonDisabled = ref(false)

// -------------------- Request Queue UI helpers --------------------
const queueStatusLabel = computed(() => {
  switch (projectStore.queueStatus) {
    case 'queued': return 'Queued';
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'cancelled': return 'Cancelled';
    default: return '';
  }
});

const formatEta = (seconds) => {
  if (!seconds || seconds <= 0) return 'less than a minute';
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return 'less than a minute';
  return `about ${minutes} minute${minutes > 1 ? 's' : ''}`;
};

const etaText = computed(() => formatEta(projectStore.queueEtaSeconds));

const cancelQueued = () => projectStore.cancelQueuedJob();

const uploadRepoLink = async () => {
  const repoLink = githubRepoLink.value.trim();
  console.log("Repo link entered:", repoLink);
  uploadError.value = '';
  if (repoLink === '') {
    uploadError.value = 'Please enter a Git Repository URL.';
    return;
  }
  // Exactly one owner/repo. A prefix check alone lets a mangled value through
  // (e.g. two URLs pasted together), and the backend would then analyse a
  // different repository than the one asked for.
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/i.test(repoLink)) {
    uploadError.value = 'Please enter a valid GitHub repository URL, e.g. https://github.com/owner/repo';
    return;
  }

  buttonDisabled.value = true;
  // Hide any previously selected project while the new request is processed.
  selectedLocalProject.value = null;
  try {
    // Resolves only once the job reaches a terminal state; live progress is
    // reflected through the reactive queue state in the status panel above.
    const response = await projectStore.uploadGitRepositoryLink(repoLink);
    console.log("Queue response:", response);
    if (response && response.error) {
      // Failure details are surfaced through the queue status panel.
      console.error("Processing failed:", response.error);
    } else if (response && response.cancelled) {
      console.log("Request was cancelled.");
    } else {
      // Prefer the store's normalized project object; fall back to the raw
      // link only if the store somehow has none.
      const repoNameMatch = repoLink.match(/\/([^\/]+)\.git$/);
      const repoName = repoNameMatch ? repoNameMatch[1] : (repoLink.split('/').pop() || 'Unknown Project');
      selectedLocalProject.value = projectStore.selectedProject || {
        project_name: repoName,
        github_url: repoLink
      };
      fetchUserRepos();
    }
  } catch (error) {
    console.error("Error uploading repository link:", error);
    uploadError.value = 'Unexpected error while processing the request.';
  } finally {
    buttonDisabled.value = false;
  }
};

watch(
  () => selectedProject.value,
  async (newProject) => {
    if (newProject !== projectStore.selectedProject) {
      if (newProject) {
        console.log(`Project selected: ${newProject.project_name}`);
        await projectStore.setCurrentProjectDetails(newProject);
      } else {
        console.log('No project selected. Resetting project details.');
        await projectStore.resetProjectDetails();
      }
    }
  }
);

watch(
  () => projectStore.selectedProject,
  (newProject) => {
    if (selectedProject.value !== newProject) {
      selectedProject.value = newProject;
      console.log(`Store selectedProject updated to: ${newProject?.project_name}`);
    }
  }
);

onMounted(() => {
  fetchData();
  // Ensure local mode is active so GitHub uploads show the slider correctly
  switchDataSource('local');
  fetchUserRepos();

  // Deep link from the All Repos page: /dashboard?repo=<github url>. Processed
  // repos are cached backend-side, so this normally returns almost immediately;
  // the queue status panel above covers the case where it does not.
  const deepLink = route.query.repo;
  if (typeof deepLink === 'string' && deepLink.trim()) {
    githubRepoLink.value = deepLink.trim();
    selectedRepoOption.value =
      repoOptions.some(o => o.value === githubRepoLink.value) ? githubRepoLink.value : 'custom';
    uploadRepoLink();
  }
});
</script>

<style scoped lang="scss">
.metrics-container {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  overflow: auto;
}

.slider-helper-text {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-top: 0;
  padding-left: 12px;
  font-style: italic;
}

.ml-1 {
  margin-left: 4px;
}

.mt-4 {
  margin-top: 16px;
}

.text-error {
  color: red;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.v-input {
  min-height: 36px;
}

.v-autocomplete {
  position: relative;
  z-index: 1;
}

.text-center {
  text-align: center;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.normal-btn {
  background-color: white;
  color: inherit;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: normal;
  text-transform: none;
}

.normal-btn:hover {
  background-color: rgb(var(--v-theme-chip-surface));
}

.coming-soon {
  margin-top: 20px;
  font-style: italic;
  color: grey;
}

.custom-repo-option {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: bold;
}

.queue-panel {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.06);
  text-align: left;
}

.queue-detail {
  font-size: 0.9rem;
  line-height: 1.5;
}

.text-success {
  color: rgb(var(--v-theme-success));
  font-size: 0.9rem;
}

a {
  color: rgb(var(--v-theme-link));
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
