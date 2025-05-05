<template>
  <VCard class="text-center text-sm-start" style="height: 450px;">
    <VRow no-gutters>
      <VCol cols="12" sm="12">
        <!-- Header -->
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">Project Selector</VCardTitle>
        </VCardItem>

        <!-- Data Source Buttons -->
        <VRow class="mb">
          <VCol cols="12" class="d-flex justify-center">
            <VBtn
              color="primary"
              :variant="selectedDataSource === 'foundation' ? 'outlined' : 'text'"
              class="ms-2"
              @click="switchDataSource('foundation')"
            >
              Foundation
            </VBtn>
            <VBtn
              color="primary"
              :variant="selectedDataSource === 'local' ? 'outlined' : 'text'"
              class="ms-2"
              @click="switchDataSource('local')"
            >
              GitHub
            </VBtn>
          </VCol>
        </VRow>

        <!-- Content Area -->
        <VCardText class="content-area">
          <div v-if="projectStore.loading" class="loading">Loading projects...</div>
          <div v-else>
            <!-- FOUNDATION / ECLIPSE BLOCK -->
            <div v-if="selectedDataSource === 'foundation'">
              <div v-if="projectStore.error" class="text-error">{{ projectStore.error }}</div>
              <VSelect
                v-model="projectStore.selectedFoundation"
                :items="foundations"
                label="Foundation"
                class="mb-3"
                outlined
                dense
                @change="handleFoundationChange"
              />
              <VSelect
                v-if="projectStore.selectedFoundation === 'Eclipse'"
                v-model="selectedCategory"
                :items="eclipseCategories"
                label="Category"
                class="mb-3"
                outlined
                dense
                @change="handleCategoryChange"
              />
              <VAutocomplete
                v-if="shouldShowProjectAutocomplete"
                v-model="selectedProject"
                :items="projectItems"
                item-title="project_name"
                item-value="project_id"
                :label="projectLabel"
                class="mb-3"
                outlined
                dense
                :loading="projectStore.loading"
                :error="!!projectStore.error"
                :error-messages="projectStore.error"
                return-object
                hide-no-data
                hide-details
                clearable
              />
              <!-- Foundation Mode Slider -->
              <VSlider
                v-if="hasValidMonths"
                v-model="projectStore.singleValue"
                :min="sliderMin"
                :max="sliderMax"
                :step="1"
                class="mb-3"
                label="Select Month"
                :ticks="true"
                tick-size="4"
                thumb-label
                @update:modelValue="handleSingleValueChange"
              />
              <div v-if="projectStore.selectedProject && !hasValidMonths" class="text-error">
                No available months for the selected project.
              </div>
              <VCard
                v-if="(projectStore.selectedFoundation === 'Apache' || projectStore.selectedFoundation === 'Eclipse') && projectStore.selectedProject"
                class="metrics-container mt-3"
                outlined
              >
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

            <div v-else-if="selectedDataSource === 'local'">
              <!--
              <VBtn color="primary" class="mb-2" @click="triggerFileInput" block>
                Browse Local Folder
              </VBtn>
              <input type="file" ref="fileInput" @change="handleFileSelect" webkitdirectory style="display: none;" />
              -->

              <div class="text-center mb-2">OR</div>

              <VAutocomplete
                v-model="githubRepoLink"
                :items="exampleRepos"
                label="GitHub Repository URL"
                placeholder="https://github.com/username/repository"
                outlined
                dense
                class="mb-3"
                hide-no-data
                hide-selected
                return-object
                item-title="label"
                item-value="value"
                @update:modelValue="val => githubRepoLink = typeof val === 'string' ? val : val.value"
              />

              <VBtn color="primary" class="mb-2" @click="uploadRepoLink" block>
                Upload Repository Link
              </VBtn>

              <!-- LOCAL Mode Slider -->
              <VSlider
                v-if="localHasValidMonths"
                v-model="localMonth"
                :min="localSliderMin"
                :max="localSliderMax"
                :step="1"
                class="mb-3"
                label="Select Month"
                :ticks="true"
                tick-size="4"
                thumb-label
                @update:modelValue="handleLocalMonthChange"
              />

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

              <div v-else-if="repoUploading" class="d-flex justify-center align-center">
                <VProgressCircular indeterminate color="primary" />
              </div>
            </div>




          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup>
import { onMounted, watch, computed, ref } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

// Data source: foundation or local
const selectedDataSource = ref('foundation');

// FOUNDATION reactive variables
const selectedProject = ref(null);
const selectedCategory = ref(null);

// LOCAL reactive variables
const selectedLocalProject = ref(null);
const githubRepoLink = ref('');
const fileInput = ref(null);
const repoUploading = ref(false);

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
    return categories.slice(0, 200).map((_, index) => index + 1); // limit to 100 months
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
    localMonth.value = newVal[0];
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
    projectStore.resetLocalProjectDetails();
    projectStore.xAxisCategories = [];  // 🔧 Reset here
    projectStore.selectedMonth = null;
  } else {
    projectStore.resetProjectDetails();
    projectStore.xAxisCategories = [];  // 🔧 Reset here
  }
};


const exampleRepos = [
  { label: 'Seer - https://github.com/epasveer/seer.git', value: 'https://github.com/epasveer/seer.git' },
  { label: 'git-sizer - https://github.com/github/git-sizer', value: 'https://github.com/github/git-sizer' },
  { label: 'ReACTive - https://github.com/Nafiz43/ReACTive', value: 'https://github.com/Nafiz43/ReACTive' },
  { label: 'Portfolio - https://github.com/Nafiz43/portfolio', value: 'hhttps://github.com/Nafiz43/portfolio' },
  // { label: 'linux - https://github.com/torvalds/linux', value: 'https://github.com/torvalds/linux' },
];

// let githubRepoLink = ref('');


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

const uploadRepoLink = async () => {
  const repoLink = githubRepoLink.value.trim();
  console.log("Repo link entered:", repoLink);
  if (repoLink === '') {
    alert('Please enter a Git Repository URL.');
    return;
  }
  // Example (just remove the strict ".git" requirement):
  if (!repoLink.toLowerCase().startsWith('https://github.com/')) {
    alert("Please enter a valid GitHub repository URL, e.g. https://github.com/owner/repo");
    return;
  }

  repoUploading.value = true;
  try {
    const response = await projectStore.uploadGitRepositoryLink(repoLink);
    console.log("POST response:", response);
    if (response.error) {
      alert("Error: " + response.error);
    } else {
      alert("Repository link uploaded successfully!");
      console.log("Forecast JSON:", response.forecast_json);
      console.log("Social Network Data:", response.social_net);
      const repoNameMatch = repoLink.match(/\/([^\/]+)\.git$/);
      const repoName = repoNameMatch ? repoNameMatch[1] : 'Unknown Project';
      selectedLocalProject.value = {
        project_name: repoName,
        github_url: repoLink
      };
    }
  } catch (error) {
    console.error("Error uploading repository link:", error);
    alert("Failed to upload repository link.");
  } finally {
    repoUploading.value = false;
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
});
</script>

<style scoped lang="scss">
.metrics-container {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  overflow: auto;
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
  border: 1px solid #ccc;
  font-weight: normal;
  text-transform: none;
}
.normal-btn:hover {
  background-color: #f5f5f5;
}
.coming-soon {
  margin-top: 20px;
  font-style: italic;
  color: grey;
}
</style>
