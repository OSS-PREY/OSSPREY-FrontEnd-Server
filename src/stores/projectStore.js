// src/stores/projectStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // Configuration
  const baseUrl = ref('http://127.0.0.1:5000');

  // Project Selection
  const selectedProject = ref(null);
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]); // Default range
  const singleValue = ref(1);
  const selectedMonth = ref(1);

  // GitHub Details
  const github_url = ref('N/A');
  const fork_count = ref(0);
  const stargazer_count = ref(0);
  const watch_count = ref(0);

  // All Project Descriptions
  const allDescriptions = ref([]);

  // Loading and Error States
  const loading = ref(false);
  const error = ref(null);

  // Monthly Ranges
  const monthlyRanges = ref({});

  // Computed Properties for Slider Min and Max
  const minMonth = computed(() => {
    if (selectedProject.value && Object.keys(monthlyRanges.value).length > 0) {
      return Math.min(...Object.keys(monthlyRanges.value).map(Number));
    }
    return 1;
  });

  const maxMonth = computed(() => {
    if (selectedProject.value && Object.keys(monthlyRanges.value).length > 0) {
      return Math.max(...Object.keys(monthlyRanges.value).map(Number));
    }
    return 12;
  });

  // Set current project details
  const setCurrentProjectDetails = async (project) => {
    if (!project) {
      resetProjectDetails();
      return;
    }

    selectedProject.value = project;
    github_url.value = project.github_url;
    fork_count.value = project.fork_count;
    stargazer_count.value = project.stargazer_count;
    watch_count.value = project.watch_count;

    try {
      await fetchMonthlyRanges(project.project_id);
      const min = minMonth.value;
      const max = maxMonth.value;
      rangeValue.value = [min, max];
      singleValue.value = min;
      selectedMonth.value = min;

      console.log(`Project details set for project ID: ${project.project_id}`);
    } catch (err) {
      console.error(`Error setting project details for ${project.project_id}:`, err);
      error.value = 'Failed to set project details.';
    }
  };

  // Reset project details
  const resetProjectDetails = () => {
    selectedProject.value = null;
    github_url.value = 'N/A';
    fork_count.value = 0;
    stargazer_count.value = 0;
    watch_count.value = 0;
    rangeValue.value = [1, 12];
    singleValue.value = 1;
    selectedMonth.value = 1;
    monthlyRanges.value = {};
  };

  // Fetch Monthly Ranges for a Project
  const fetchMonthlyRanges = async (project_id) => {
    try {
      const response = await fetch(`${baseUrl.value}/api/monthly_ranges`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch monthly ranges: ${response.status} ${errorText}`);
      }
      const data = await response.json();

      // Access the 'project_ranges' array from the response
      const projectRange = data.project_ranges.find(
        (range) => range.project_id.toLowerCase() === project_id.toLowerCase()
      );
      if (!projectRange) {
        throw new Error(`Monthly ranges not found for project ID: ${project_id}`);
      }

      monthlyRanges.value = projectRange.monthly_ranges;
      console.log(`Fetched monthly ranges for project ID ${project_id}:`, monthlyRanges.value);
    } catch (err) {
      console.error('Error fetching monthly ranges:', err);
      error.value = 'Failed to fetch monthly ranges.';
      // Reset to default if fetching monthly ranges fails
      rangeValue.value = [1, 12];
      singleValue.value = 1;
      selectedMonth.value = 1;
      monthlyRanges.value = {};
    }
  };

  // Compute slider max based on store's sliderMax
  const computeSliderMax = (startDateStr, endDateStr) => {
    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth()) +
          1;
        return months;
      }
    }
    return 12;
  };

  // Fetch all project data
  const fetchAllProjectData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const [projectsRes, projectInfoRes] = await Promise.all([
        fetch(`${baseUrl.value}/api/projects`),
        fetch(`${baseUrl.value}/api/project_info`),
      ]);

      if (!projectsRes.ok) {
        const errorText = await projectsRes.text();
        throw new Error(`Failed to fetch projects: ${projectsRes.status} ${errorText}`);
      }

      if (!projectInfoRes.ok) {
        const errorText = await projectInfoRes.text();
        throw new Error(`Failed to fetch project_info: ${projectInfoRes.status} ${errorText}`);
      }

      const projectsData = await projectsRes.json();
      const projectInfoData = await projectInfoRes.json();

      const projects = projectsData.projects;
      const projectInfos = projectInfoData.projects;

      const projectInfoMap = new Map();
      projectInfos.forEach((info) => {
        projectInfoMap.set(info.project_id.toLowerCase(), info);
      });

      allDescriptions.value = projects
        .filter((project) => projectInfoMap.has(project.name.toLowerCase()))
        .map((project) => {
          const info = projectInfoMap.get(project.name.toLowerCase());
          return {
            project_id: info.project_id,
            project_name: info.project_name || 'N/A',
            description: info.description || 'N/A',
            sponsor: info.sponsor || 'N/A',
            champion: info.champion || 'N/A',
            mentors:
              typeof info.mentor === 'string'
                ? info.mentor.split(',').map((m) => m.trim())
                : [],
            start_date: info.start_date || 'N/A',
            end_date: info.end_date || 'N/A',
            status: info.status || 'N/A',
            github_url: project.url || 'N/A',
            fork_count: typeof project.fork_count === 'number' ? project.fork_count : 0,
            stargazer_count:
              typeof project.stargazer_count === 'number' ? project.stargazer_count : 0,
            watch_count: typeof project.watch_count === 'number' ? project.watch_count : 0,
          };
        });

      console.log('Mapped Projects:', allDescriptions.value);

      if (allDescriptions.value.length === 0) {
        throw new Error('No project data available.');
      }
    } catch (err) {
      console.error('Error fetching and merging project data:', err);
      error.value = 'Failed to fetch project information.';
    } finally {
      loading.value = false;
    }
  };

  // -------------------- Technical Network State and Actions --------------------

  const techNetData = ref(null);
  const techNetLoading = ref(false);
  const techNetError = ref(null);

  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetError.value = null;
    techNetData.value = null;

    try {
      console.log(`Fetching /api/tech_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/tech_net/${projectId}/${month}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch technical network data.');
      }

      const data = await response.json();
      techNetData.value = data.data;
      console.log('Fetched TechNet Data:', techNetData.value);
    } catch (err) {
      console.error('Error fetching TechNet data:', err);
      techNetError.value = err.message;
    } finally {
      techNetLoading.value = false;
    }
  };

  // -------------------- Social Network State and Actions --------------------

  const socialNetData = ref(null);
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  const fetchSocialNetData = async (projectId, month) => {
    socialNetLoading.value = true;
    socialNetError.value = null;
    socialNetData.value = null;

    try {
      console.log(`Fetching /api/social_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/social_net/${projectId}/${month}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch social network data.');
      }

      const data = await response.json();
      socialNetData.value = data.data;
      console.log('Fetched SocialNet Data:', socialNetData.value);
    } catch (err) {
      console.error('Error fetching SocialNet data:', err);
      socialNetError.value = err.message;
    } finally {
      socialNetLoading.value = false;
    }
  };

  // -------------------- Commit Measures State and Actions --------------------

  const commitMeasuresData = ref(null);
  const commitMeasuresLoading = ref(false);
  const commitMeasuresError = ref(null);

  const fetchCommitMeasuresData = async (projectId, month) => {
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;

    try {
      console.log(`Fetching /api/commit_measure/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/commit_measure/${projectId}/${month}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch commit measures data.');
      }

      const data = await response.json();
      commitMeasuresData.value = data.data;
      console.log('Fetched Commit Measures Data:', commitMeasuresData.value);
    } catch (err) {
      console.error('Error fetching Commit Measures data:', err);
      commitMeasuresError.value = err.message;
    } finally {
      commitMeasuresLoading.value = false;
    }
  };

  return {
    // Configuration
    baseUrl,

    // Project Selection
    selectedProject,
    showRangeSlider,
    rangeValue,
    singleValue,
    selectedMonth,
    minMonth,
    maxMonth,

    // GitHub Details
    github_url,
    fork_count,
    stargazer_count,
    watch_count,

    // All Project Descriptions
    allDescriptions,

    // Loading and Error States
    loading,
    error,

    // Monthly Ranges
    monthlyRanges,

    // Actions
    setCurrentProjectDetails,
    computeSliderMax,
    fetchAllProjectData,
    resetProjectDetails,
    fetchMonthlyRanges,

    // Technical Network
    techNetData,
    techNetLoading,
    techNetError,
    fetchTechNetData,

    // Social Network
    socialNetData,
    socialNetLoading,
    socialNetError,
    fetchSocialNetData,

    // Commit Measures
    commitMeasuresData,
    commitMeasuresLoading,
    commitMeasuresError,
    fetchCommitMeasuresData,
  };
});
