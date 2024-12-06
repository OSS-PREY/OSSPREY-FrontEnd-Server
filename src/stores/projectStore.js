// src/stores/projectStore.js

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // -------------------- Configuration --------------------
  
  const baseUrl = ref('https://oss-decal.priyal.me'); // Update if your backend is hosted elsewhere

  // -------------------- Project Selection State --------------------
  
  const selectedProject = ref(null); // Holds the currently selected project object
  const selectedMonth = ref(null);   // Holds the currently selected month number

  // -------------------- Developer Selection State --------------------

  const selectedDeveloper = ref(null);

  const setSelectedDeveloper = (developerName) => {
    selectedDeveloper.value = developerName;
    console.log('Selected Developer:', selectedDeveloper.value);
  };


   // -------------------- Commit Links State --------------------
  const commitLinksData = ref(null);
  const commitLinksLoading = ref(false);
  const commitLinksError = ref(null);

  const normalizeName = (name) => {
    return name ? name.toLowerCase().replace(/\s+/g, '') : '';
  };

  // -------------------- GitHub Details State --------------------
  
  const github_url = ref('N/A');
  const fork_count = ref(0);
  const stargazer_count = ref(0);
  const watch_count = ref(0);

  // -------------------- All Project Descriptions --------------------
  
  const allDescriptions = ref([]); // Array of all projects with their details

  // -------------------- Monthly Ranges State --------------------
  
  const monthlyRanges = ref({}); // Object mapping project IDs to their monthly ranges

  // -------------------- Loading and Error States --------------------
  
  const loading = ref(false); // Indicates if the store is fetching initial project data
  const error = ref(null);    // Holds any error message related to fetching project data

  // -------------------- Commit Measures State --------------------
  
  const commitMeasuresData = ref(null);      // Holds commit measures data
  const commitMeasuresLoading = ref(false);  // Indicates if commit measures are being fetched
  const commitMeasuresError = ref(null);     // Holds any error message related to fetching commit measures

  // -------------------- Email Measures State --------------------
  
  const emailMeasuresData = ref(null);       // Holds email measures data
  const emailMeasuresLoading = ref(false);   // Indicates if email measures are being fetched
  const emailMeasuresError = ref(null);      // Holds any error message related to fetching email measures

  // -------------------- Graduation Forecast State --------------------
  
  const gradForecastData = ref([]);          // Holds graduation forecast data for charts
  const xAxisCategories = ref([]);           // Holds x-axis categories for charts
  const gradForecastLoading = ref(false);     // Indicates if graduation forecast data is being fetched
  const gradForecastError = ref(null);        // Holds any error message related to fetching graduation forecast data

  // -------------------- Technical Network State --------------------
  
  const techNetData = ref(null);             // Holds technical network data
  const techNetLoading = ref(false);         // Indicates if technical network data is being fetched
  const techNetError = ref(null);            // Holds any error message related to fetching technical network data

  // -------------------- Social Network State --------------------
  
  const socialNetData = ref(null);           // Holds social network data
  const socialNetLoading = ref(false);       // Indicates if social network data is being fetched
  const socialNetError = ref(null);          // Holds any error message related to fetching social network data

  // -------------------- Range Slider State --------------------
  
  const showRangeSlider = ref(false);         // Determines whether to show range slider
  const rangeValue = ref([1, 12]);            // Holds the range slider values
  const singleValue = ref(1);                 // Holds the single slider value

  // -------------------- Watchers --------------------
  
  // Watch for changes in selectedProject and selectedMonth to fetch corresponding data
  watch(
    [selectedProject, selectedMonth],
    async ([newProject, newMonth], [oldProject, oldMonth]) => {
      console.log(`Project changed from ${oldProject?.project_name || 'None'} to ${newProject?.project_name || 'None'}`);
      console.log(`Month changed from ${oldMonth || 'None'} to ${newMonth || 'None'}`);

      if (newProject && newMonth) {
        await Promise.all([
          fetchTechNetData(newProject.project_id, newMonth),
          fetchSocialNetData(newProject.project_id, newMonth),
          fetchCommitMeasuresData(newProject.project_id, newMonth),
          fetchEmailMeasuresData(newProject.project_id, newMonth),
          fetchGradForecast(newProject.project_id),
          fetchPredictions(newProject.project_id, newMonth),
        ]);
      } else {
        // Clear all measures if project or month is not selected
        clearTechNetData();
        clearSocialNetData();
        commitMeasuresData.value = null;
        commitMeasuresError.value = null;
        emailMeasuresData.value = null;
        emailMeasuresError.value = null;
        gradForecastData.value = [];
        xAxisCategories.value = [];
        gradForecastError.value = null;
      }
    }
  );

  watch(
    [selectedDeveloper, selectedProject, selectedMonth],
    async ([newDeveloper, newProject, newMonth]) => {
      console.log(`Developer changed to ${newDeveloper || 'None'}`);

      if (newDeveloper && newProject && newMonth) {
        await fetchCommitLinksData(newProject.project_id, newMonth, newDeveloper);
      } else {
        // Clear commit links data if any of the required parameters are missing
        commitLinksData.value = null;
        commitLinksError.value = null;
      }
    }
  );



  // -------------------- Actions --------------------

  /**
   * Fetches all project data and merges project information.
   */
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

  /**
   * Sets the current project details and initializes selected month.
   * @param {Object} project - The project object selected by the user.
   */
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
        selectedMonth.value = min; // Automatically select the first available month
        console.log(`Project details set for project ID: ${project.project_id}`);
        console.log(`Selected Month set to: ${selectedMonth.value}`);
      }
    } catch (err) {
      console.error(`Error setting project details for ${project.project_id}:`, err);
      error.value = 'Failed to set project details.';
      selectedMonth.value = null;
    }
  };

  /**
   * Resets all project-related details and measures.
   */
  const resetProjectDetails = () => {
    console.log('Resetting project details.');
    selectedProject.value = null;
    github_url.value = 'N/A';
    fork_count.value = 0;
    stargazer_count.value = 0;
    watch_count.value = 0;
    selectedMonth.value = null;
    monthlyRanges.value = {};
    
    // Reset all measures
    commitMeasuresData.value = null;
    commitMeasuresError.value = null;
    emailMeasuresData.value = null;
    emailMeasuresError.value = null;
    techNetData.value = null;
    techNetError.value = null;
    socialNetData.value = null;
    socialNetError.value = null;
    gradForecastData.value = [];
    xAxisCategories.value = [];
    gradForecastError.value = null;
    showRangeSlider.value = false;
    rangeValue.value = [1, 12];
    singleValue.value = 1;
  };

  /**
   * Fetches monthly ranges for a specific project.
   * @param {String} project_id - The ID of the project.
   */
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
      selectedMonth.value = null;
      monthlyRanges.value = {};
    }
  };

  // -------------------- Computed Properties --------------------

  /**
   * Returns an array of available months based on monthlyRanges.
   */
  const availableMonths = computed(() => {
    if (selectedProject.value && Object.keys(monthlyRanges.value).length > 0) {
      return Object.keys(monthlyRanges.value).map(Number).sort((a, b) => a - b);
    }
    return [];
  });

  /**
   * Returns the minimum available month.
   */
  const minMonth = computed(() => {
    if (availableMonths.value.length > 0) {
      return availableMonths.value[0];
    }
    return 1;
  });

  /**
   * Returns the maximum available month.
   */
  const maxMonth = computed(() => {
    if (availableMonths.value.length > 0) {
      return availableMonths.value[availableMonths.value.length - 1];
    }
    return 12;
  });

  // -------------------- Fetch Graduation Forecast --------------------
  
  /**
   * Fetches graduation forecast data for a specific project.
   * @param {String} projectId - The ID of the project.
   */
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

  // -------------------- Predictions State --------------------
  
  const predictionsData = ref({});          // Holds predictions data
  const predictionsLoading = ref(false);    // Indicates if predictions data is being fetched
  const predictionsError = ref(null);       // Holds any error message related to fetching predictions data

  /**
   * Fetches predictions data for a specific project and month.
   * @param {String} projectId - The ID of the project.
   * @param {Number} month - The selected month number.
   */
  const fetchPredictions = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or selected month is missing.');
      predictionsError.value = 'Project ID or selected month is missing.';
      return;
    }

    predictionsLoading.value = true;
    predictionsData.value = {};
    predictionsError.value = null;

    try {
      console.log(`Fetching /api/predictions/${projectId}/${month}...`);
      const url = `${baseUrl.value}/api/predictions/${projectId}/${month}`;
      const response = await fetch(url);

      if (!response.ok) {
        predictionsError.value = `Failed to fetch Predictions data: ${response.status}`;
        throw new Error(`Failed to fetch predictions: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched Predictions Data:', data);

      predictionsData.value = data;
    } catch (error) {
      console.error('Error fetching Predictions data:', error);
      predictionsError.value = 'Error fetching Predictions data.';
    } finally {
      predictionsLoading.value = false;
      console.log('Finished fetchPredictions.');
    }
  };

  // -------------------- Fetch Commit Measures --------------------
  
  /**
   * Fetches commit measures data for a specific project and month.
   * @param {String} projectId - The ID of the project.
   * @param {Number} month - The month number.
   */
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
      
      // Process data to ensure it's an object
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
      commitMeasuresError.value = 'Loading...';
      commitMeasuresData.value = null;
    } finally {
      commitMeasuresLoading.value = false;
      console.log('Finished fetchCommitMeasuresData.');
    }
  };

  // -------------------- Fetch Email Measures --------------------
  
  /**
   * Fetches email measures data for a specific project and month.
   * @param {String} projectId - The ID of the project.
   * @param {Number} month - The month number.
   */
  const fetchEmailMeasuresData = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or month is missing.');
      emailMeasuresError.value = 'Project ID or month is missing.';
      emailMeasuresData.value = null;
      return;
    }

    console.log(`Fetching /api/email_measure/${projectId}/${month}...`);
    emailMeasuresLoading.value = true;
    emailMeasuresError.value = null;
    emailMeasuresData.value = null;

    try {
      const response = await fetch(`${baseUrl.value}/api/email_measure/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch email measures: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += ` ${errorData.error || ''}`;
        } catch {}
        emailMeasuresError.value = errorMsg;
        console.error(`Error fetching email measures: ${emailMeasuresError.value}`);
        throw new Error(emailMeasuresError.value);
      }

      const data = await response.json();
      console.log('Fetched Email Measures Data:', data);
      
      // Process data to ensure it's an object
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          const measures = {};
          data.data.forEach(measure => {
            if (typeof measure === 'object') {
              Object.assign(measures, measure);
            }
          });
          emailMeasuresData.value = measures;
          console.log('Processed Email Measures Data:', emailMeasuresData.value);
        } else {
          // If data.data is already an object
          emailMeasuresData.value = data.data;
          console.log('Processed Email Measures Data:', emailMeasuresData.value);
        }
      } else {
        throw new Error('Invalid email measures data format.');
      }
    } catch (error) {
      console.error('Error fetching Email Measures data:', error);
      emailMeasuresError.value = 'Loading...';
      emailMeasuresData.value = null;
    } finally {
      emailMeasuresLoading.value = false;
      console.log('Finished fetchEmailMeasuresData.');
    }
  };

  // -------------------- Fetch Technical Network Data --------------------
  
  /**
   * Fetches technical network data for a specific project and month.
   * @param {String} projectId - The ID of the project.
   * @param {Number} month - The month number.
   */
  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetData.value = null;
    techNetError.value = null;

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
        
        try {
          const errorData = await response.json();
          
        } catch {}
        console.error(errorMsg);
        
        techNetData.value = null;
        return; // Exit function without throwing
      }

      const data = await response.json();
      console.log('Fetched TechNet Data:', data);
      techNetData.value = data.data;
    } catch (err) {
      console.error('Error fetching TechNet data:', err);
      
      techNetData.value = null;
    } finally {
      techNetLoading.value = false;
      console.log('Finished fetchTechNetData.');
    }
  };

  /**
   * Clears the existing TechNet data.
   */
  const clearTechNetData = () => {
    console.log('Clearing TechNet data.');
    techNetData.value = null;
    techNetError.value = null;
  };

  // -------------------- Fetch Social Network Data --------------------
  
  /**
   * Fetches social network data for a specific project and month.
   * @param {String} projectId - The ID of the project.
   * @param {Number} month - The month number.
   */
  const fetchSocialNetData = async (projectId, month) => {
    socialNetLoading.value = true;
    socialNetData.value = null;
    socialNetError.value = null;

    try {
      console.log(`Fetching /api/social_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/social_net/${projectId}/${month}`);

      if (!response.ok) {
        
        try {
          const errorData = await response.json();
          
        } catch {}
        console.error(errorMsg);
        
        socialNetData.value = null;
        return;
      }

      const data = await response.json();
      console.log('Fetched SocialNet Data:', data);
      socialNetData.value = data.data;
    } catch (err) {
      console.error('Error fetching SocialNet data:', err);
      socialNetError.value = 'Error fetching SocialNet data.';
      socialNetData.value = null;
    } finally {
      socialNetLoading.value = false;
      console.log('Finished fetchSocialNetData.');
    }
  };

  /**
   * Clears the existing SocialNet data.
   */
  const clearSocialNetData = () => {
    console.log('Clearing SocialNet data.');
    socialNetData.value = null;
    socialNetError.value = null;
  };


  // --------------- Try

  const fetchCommitLinksData = async (projectId, month, developerName) => {
    commitLinksLoading.value = true;
    commitLinksError.value = null;
    commitLinksData.value = null;

    try {
      console.log(`Fetching /api/commit_links/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}/api/commit_links/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch commit links: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += ` ${errorData.error || ''}`;
        } catch {}
        commitLinksError.value = errorMsg;
        console.error(`Error fetching commit links: ${commitLinksError.value}`);
        throw new Error(commitLinksError.value);
      }

      const data = await response.json();
      console.log('Fetched Commit Links Data:', data);

      // Filter the commits by developerName
      const normalizedDeveloperName = normalizeName(developerName);
      const filteredCommits = data.commits.filter(commit => {
        const commitAuthorName = normalizeName(commit.dealised_author_full_name);
        console.log(`Comparing '${commitAuthorName}' with '${normalizedDeveloperName}'`);
        return commitAuthorName === normalizedDeveloperName;
      });

      commitLinksData.value = filteredCommits;

    } catch (error) {
      console.error('Error fetching Commit Links data:', error);
      commitLinksError.value = 'Error fetching Commit Links data.';
      commitLinksData.value = null;
    } finally {
      commitLinksLoading.value = false;
      console.log('Finished fetchCommitLinksData.');
    }
  };


  

  // -------------------- Return Statement --------------------
  
  return {
    // -------------------- Configuration --------------------
    baseUrl,

    // -------------------- Project Selection --------------------
    selectedProject,
    selectedMonth,

    // -------------------- GitHub Details --------------------
    github_url,
    fork_count,
    stargazer_count,
    watch_count,

    // -------------------- All Project Descriptions --------------------
    allDescriptions,

    // -------------------- Monthly Ranges --------------------
    monthlyRanges,

    // -------------------- Loading and Error States --------------------
    loading,
    error,

    // -------------------- Commit Measures --------------------
    commitMeasuresData,
    commitMeasuresLoading,
    commitMeasuresError,
    fetchCommitMeasuresData,

    // -------------------- Email Measures --------------------
    emailMeasuresData,
    emailMeasuresLoading,
    emailMeasuresError,
    fetchEmailMeasuresData,

    // -------------------- Graduation Forecast --------------------
    gradForecastData,
    xAxisCategories,
    gradForecastLoading,
    gradForecastError,
    fetchGradForecast,

    // -------------------- Graduation Forecast Predictions ---------------
    predictionsData,
    predictionsLoading,
    predictionsError,
    fetchPredictions,

    // -------------------- Technical Network --------------------
    techNetData,
    techNetLoading,
    techNetError,
    fetchTechNetData,
    clearTechNetData,

    // ------------------- Developer --------------------------
    selectedDeveloper,
  setSelectedDeveloper,
  commitLinksData,
  commitLinksLoading,
  commitLinksError,
  fetchCommitLinksData,

    // -------------------- Social Network --------------------
    socialNetData,
    socialNetLoading,
    socialNetError,
    fetchSocialNetData,
    clearSocialNetData,

    // -------------------- Range Slider --------------------
    showRangeSlider,
    rangeValue,
    singleValue,

    // -------------------- Computed Properties --------------------
    availableMonths,
    minMonth,
    maxMonth,

    // -------------------- Actions --------------------
    fetchAllProjectData,
    setCurrentProjectDetails,
    resetProjectDetails,
    fetchMonthlyRanges,
  };
});
