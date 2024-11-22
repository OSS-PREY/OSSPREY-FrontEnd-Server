// src/stores/projectStore.js

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // Configuration
  const baseUrl = ref('https://oss-backend-8stu.onrender.com'); // Update this if your backend is hosted elsewhere

  // Project Selection
  const selectedProject = ref(null);
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]); // Default range, will be updated based on available months
  const singleValue = ref(1);
  const selectedMonth = ref(null); // Initialize as null

  // GitHub Details
  const github_url = ref('N/A');
  const fork_count = ref(0);
  const stargazer_count = ref(0);
  const watch_count = ref(0);

  // All Project Descriptions
  const allDescriptions = ref([]);

  // Graduation Forecast 
  const gradForecastData = ref([]);
  const xAxisCategories = ref([]);
  const gradForecastLoading = ref(false);
  const gradForecastError = ref(null);

  // Loading and Error States
  const loading = ref(false);
  const error = ref(null);

  // Monthly Ranges
  const monthlyRanges = ref({});

  // Computed Properties for Slider Min and Max
  const availableMonths = computed(() => {
    if (selectedProject.value && Object.keys(monthlyRanges.value).length > 0) {
      return Object.keys(monthlyRanges.value).map(Number).sort((a, b) => a - b);
    }
    return [];
  });

  const minMonth = computed(() => {
    if (availableMonths.value.length > 0) {
      return availableMonths.value[0];
    }
    return 1;
  });

  const maxMonth = computed(() => {
    if (availableMonths.value.length > 0) {
      return availableMonths.value[availableMonths.value.length - 1];
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

    console.log(`Selected Project: ${project.project_name} (ID: ${project.project_id})`);

    try {
      await fetchMonthlyRanges(project.project_id);
      if (availableMonths.value.length === 0) {
        selectedMonth.value = null;
        console.warn(`No available months for project ID: ${project.project_id}`);
      } else {
        const min = minMonth.value;
        const max = maxMonth.value;
        rangeValue.value = [min, max];
        singleValue.value = min;
        selectedMonth.value = min; // Set to first available month
        console.log(`Project details set for project ID: ${project.project_id}`);
        console.log(`Selected Month set to: ${selectedMonth.value}`);
      }
    } catch (err) {
      console.error(`Error setting project details for ${project.project_id}:`, err);
      error.value = 'Failed to set project details.';
      // Reset selectedMonth if fetching monthly ranges fails
      selectedMonth.value = null;
    }
  };

  // Reset project details
  const resetProjectDetails = () => {
    console.log('Resetting project details.');
    selectedProject.value = null;
    github_url.value = 'N/A';
    fork_count.value = 0;
    stargazer_count.value = 0;
    watch_count.value = 0;
    showRangeSlider.value = false;
    rangeValue.value = [1, 12];
    singleValue.value = 1;
    selectedMonth.value = null;
    monthlyRanges.value = {};
  };

  // Fetch Monthly Ranges for a Project
  const fetchMonthlyRanges = async (project_id) => {
    try {
      console.log(`Fetching monthly ranges for project ID: ${project_id}`);
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
      selectedMonth.value = null;
      monthlyRanges.value = {};
    }
  };

  // Grad forecast
  const fetchGradForecast = async (projectId) => {
    if (!projectId) {
      console.warn('No project selected.');
      gradForecastError.value = 'No project selected.';
      return;
    }
  
    console.log('Starting fetchGradForecast...');
    gradForecastLoading.value = true;
    gradForecastData.value = [];
    xAxisCategories.value = [];
    gradForecastError.value = null;
  
    try {
      console.log(`Fetching /api/grad_forecast/${projectId}...`);
      const response = await fetch(`${baseUrl.value}/api/grad_forecast/${projectId}`);
  
      if (!response.ok) {
        gradForecastError.value = `Failed to fetch Graduation Forecast data: ${response.status}`;
        console.error('Response not OK:', response);
        throw new Error(`Failed to fetch grad forecast: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Fetched Graduation Forecast Data:', data);
  
      // Process data for chart
      const sortedData = Object.values(data)
        .sort((a, b) => a.date - b.date) // Ensure data is sorted by date
        .map((item) => ({
          x: `Month ${item.date}`,
          y: item.close,
        }));
  
      gradForecastData.value = sortedData.map(item => item.y);
      xAxisCategories.value = sortedData.map(item => item.x);
  
      console.log('Processed Graduation Forecast Data:', gradForecastData.value, xAxisCategories.value);
    } catch (error) {
      console.error('Error fetching Graduation Forecast data:', error);
      gradForecastError.value = 'Error fetching Graduation Forecast data.';
    } finally {
      gradForecastLoading.value = false;
      console.log('Finished fetchGradForecast.');
    }
  };

  
  // -------------------- Fetch all commit data State and Actions --------------------

  // Fetch Commit Measures Data
  const commitMeasuresData = ref(null);
  const commitMeasuresLoading = ref(false);
  const commitMeasuresError = ref(null);

  const fetchCommitMeasuresData = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or month is missing.');
      commitMeasuresError.value = 'Project ID or month is missing.';
      commitMeasuresData.value = null;
      return;
    }
  
    console.log(`Fetching /api/commit_measure/${projectId}/${month}...`);
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;
  
    try {
      const response = await fetch(`${baseUrl.value}/api/commit_measure/${projectId}/${month}`);
  
      if (!response.ok) {
        let errorMsg = `Failed to fetch commit measures: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += ` ${errorData.error || ''}`;
        } catch {}
        commitMeasuresError.value = errorMsg;
        console.error(`Error fetching commit measures: ${commitMeasuresError.value}`);
        throw new Error(commitMeasuresError.value);
      }
  
      const data = await response.json();
      console.log('Fetched Commit Measures Data:', data);
      
      // Process data to transform array into object if necessary
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          const measures = {};
          data.data.forEach(measure => {
            if (typeof measure === 'object') {
              Object.assign(measures, measure);
            }
          });
          commitMeasuresData.value = measures;
          console.log('Processed Commit Measures Data:', commitMeasuresData.value);
        } else {
          // If data.data is already an object
          commitMeasuresData.value = data.data;
          console.log('Processed Commit Measures Data:', commitMeasuresData.value);
        }
      } else {
        throw new Error('Invalid commit measures data format.');
      }
    } catch (error) {
      console.error('Error fetching Commit Measures data:', error);
      commitMeasuresError.value = 'Error fetching Commit Measures data.';
      commitMeasuresData.value = null;
    } finally {
      commitMeasuresLoading.value = false;
      console.log('Finished fetchCommitMeasuresData.');
    }
  };

// -------------------- Fetch all project data State and Actions --------------------

  const fetchAllProjectData = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('Fetching all project data...');
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
  const techNetError = ref(null); // Added for error handling

  /**
   * Clears the existing TechNet data.
   */
  const clearTechNetData = () => {
    console.log('Clearing TechNet data.');
    techNetData.value = null;
    techNetError.value = null;
  };

  /**
   * Fetches TechNet data based on projectId and month.
   */
  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetData.value = null;
    techNetError.value = null;

    // Convert month to string to match object keys
    const monthStr = month.toString();

    // Check if month is valid for the current project
    if (!monthlyRanges.value.hasOwnProperty(monthStr)) {
      console.warn(`Month ${month} is not available for project ${projectId}. Skipping TechNet data fetch.`);
      techNetLoading.value = false;
      techNetData.value = null;
      techNetError.value = null;
      return;
    }

    try {
      console.log(`Fetching /api/tech_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/tech_net/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch TechNet data: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += ` - ${errorData.error}`;
        } catch {
          // If response is not JSON
        }
        console.error(errorMsg);
        techNetError.value = errorMsg;
        techNetData.value = null;
        return; // Exit function without throwing
      }

      const data = await response.json();
      console.log(data, projectId, month);
      techNetData.value = data.data;
      console.log('Fetched TechNet Data:', techNetData.value);
    } catch (err) {
      console.error('Error fetching TechNet data:', err);
      techNetError.value = 'Error fetching TechNet data.';
      techNetData.value = null;
    } finally {
      techNetLoading.value = false;
    }
  };

  // -------------------- Social Network State and Actions --------------------

  /**
   * Fetches SocialNet data based on projectId and month.
   */
  const socialNetData = ref(null);
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  /**
   * Clears the existing SocialNet data.
   */
  const clearSocialNetData = () => {
    console.log('Clearing SocialNet data.');
    socialNetData.value = null;
    socialNetError.value = null;
  };

  /**
   * Fetches SocialNet data based on projectId and month.
   */
  const fetchSocialNetData = async (projectId, month) => {
    console.log('Starting fetchSocialNetData...');
    console.log(`Project ID: ${projectId}, Month: ${month}`);
    
    // Reset state
    socialNetLoading.value = true;
    socialNetData.value = null;
    socialNetError.value = null;

    try {
      console.log(`Fetching /api/social_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/social_net/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch SocialNet data: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += ` - ${errorData.error}`;
        } catch {
          // If response is not JSON
        }
        console.error(errorMsg);
        socialNetError.value = errorMsg;
        socialNetData.value = null;
        return;
      }

      // Parse and log the response data
      const data = await response.json();
      console.log('Fetched Data from Backend:', data);

      if (!Array.isArray(data.data)) {
        console.warn('Unexpected data format:', data);
        socialNetData.value = [];
        return;
      }

      // Assign fetched data
      socialNetData.value = data.data;
      console.log('SocialNet Data:', socialNetData.value);
    } catch (err) {
      console.error('Error fetching SocialNet data:', err);
      socialNetError.value = 'Error fetching SocialNet data.';
    } finally {
      socialNetLoading.value = false;
      console.log('Finished fetchSocialNetData.');
    }
  };

  // -------------------- Commit Measures State and Actions --------------------

  // The fetchCommitMeasuresData function is already defined above

  // -------------------- Watchers for Selected Project and Month --------------------

  watch(
    selectedMonth,
    async (newMonth, oldMonth) => {
      console.log(`Month changed from ${oldMonth} to ${newMonth}`);
      if (
        selectedProject.value &&
        newMonth !== null &&
        newMonth !== undefined &&
        !isNaN(newMonth)
      ) {
        await fetchTechNetData(selectedProject.value.project_id, newMonth);
        await fetchSocialNetData(selectedProject.value.project_id, newMonth);
        await fetchCommitMeasuresData(selectedProject.value.project_id, newMonth);
        await fetchGradForecast(selectedProject.value.project_id);
      } else {
        clearTechNetData();
        clearSocialNetData();
        commitMeasuresData.value = null;
        commitMeasuresError.value = null;
      }
    }
  );
  
  watch(
    selectedProject,
    async (newProject, oldProject) => {
      console.log(
        `Project changed from ${oldProject?.project_name} to ${newProject?.project_name}`
      );
      if (
        newProject &&
        selectedMonth.value !== null &&
        selectedMonth.value !== undefined &&
        !isNaN(selectedMonth.value)
      ) {
        await fetchTechNetData(newProject.project_id, selectedMonth.value);
        await fetchSocialNetData(newProject.project_id, selectedMonth.value);
        await fetchCommitMeasuresData(newProject.project_id, selectedMonth.value);
        await fetchGradForecast(newProject.project_id);
      } else {
        clearTechNetData();
        clearSocialNetData();
        commitMeasuresData.value = null;
        commitMeasuresError.value = null;
      }
    }
  );

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
    availableMonths,

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

    // Graduation Forecast
    fetchGradForecast,
    gradForecastData,
    xAxisCategories,
    gradForecastLoading,
    gradForecastError,
  };
});
