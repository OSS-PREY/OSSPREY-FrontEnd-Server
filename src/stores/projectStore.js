// src/stores/projectStore.js

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // -------------------- Configuration --------------------
  const baseUrl = ref('https://oss-decal.priyal.me'); // Update if your backend is hosted elsewhere

  // Foundation selection
  const selectedFoundation = ref('Apache'); // Correct initialization
  const setFoundation = (foundation) => {
    selectedFoundation.value = foundation;
    console.log(`Foundation set to: ${foundation}`);
  };

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

  // -------------------- GitHub Details State --------------------
  const github_url = ref('N/A');
  const fork_count = ref(0);
  const stargazer_count = ref(0);
  const watch_count = ref(0);

  // -------------------- All Project Descriptions --------------------
  const allDescriptions = ref([]); // Apache projects
  const eclipseDescriptions = ref([]); // Eclipse projects

  // -------------------- Monthly Ranges State --------------------
  const monthlyRanges = ref({}); // Object mapping project IDs to their monthly ranges

  // -------------------- Loading and Error States --------------------
  const loading = ref(false);
  const error = ref(null);

  // -------------------- Commit Measures State --------------------
  const commitMeasuresData = ref(null);
  const commitMeasuresLoading = ref(false);
  const commitMeasuresError = ref(null);

  // -------------------- Email Measures State --------------------
  const emailMeasuresData = ref(null);
  const emailMeasuresLoading = ref(false);
  const emailMeasuresError = ref(null);

  // -------------------- Graduation Forecast State --------------------
  const gradForecastData = ref([]);
  const xAxisCategories = ref([]);
  const gradForecastLoading = ref(false);
  const gradForecastError = ref(null);

  // -------------------- Technical Network State --------------------
  const techNetData = ref(null);
  const techNetLoading = ref(false);
  const techNetError = ref(null);

  // -------------------- Social Network State --------------------
  const socialNetData = ref(null);
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  // -------------------- Range Slider State --------------------
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]);
  const singleValue = ref(1);

  // Compute API prefix based on selected foundation
  const apiPrefix = computed(() => {
    return selectedFoundation.value === 'Eclipse' ? '/eclipse' : '/api';
  });

  // -------------------- Watchers --------------------
  watch(
    [selectedProject, selectedMonth],
    async ([newProject, newMonth]) => {
      console.log(`Project changed to ${newProject?.project_name || 'None'} and month ${newMonth || 'None'}`);

      if (newProject && newMonth) {
        // Fetch data based on foundation
        await Promise.all([
          fetchTechNetData(newProject.project_id, newMonth),
          fetchSocialNetData(newProject.project_id, newMonth),
          fetchCommitMeasuresData(newProject.project_id, newMonth),
          fetchEmailMeasuresData(newProject.project_id, newMonth),
          // Fetch email links if a developer is already selected
          selectedDeveloper.value ? fetchEmailLinksData(newProject.project_id, newMonth, selectedDeveloper.value) : Promise.resolve(),
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
        await fetchEmailLinksData(newProject.project_id, newMonth, newDeveloper);
      } else {
        // Clear commit links and email links data if parameters are missing
        commitLinksData.value = null;
        commitLinksError.value = null;
        emailMeasuresData.value = null;
        emailMeasuresError.value = null;
      }
    }
  );

  // -------------------- Actions --------------------

  // Normalize developer name as per user's requirement
  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  // Fetch Apache Project Data
  const fetchAllProjectData = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('Fetching all Apache project data...');
      const [projectsRes, projectInfoRes] = await Promise.all([
        fetch(`${baseUrl.value}/api/projects`),
        fetch(`${baseUrl.value}/api/project_info`),
      ]);

      if (!projectsRes.ok) {
        const errorText = await projectsRes.text();
        throw new Error(`Failed to fetch Apache projects: ${projectsRes.status} ${errorText}`);
      }

      if (!projectInfoRes.ok) {
        const errorText = await projectInfoRes.text();
        throw new Error(`Failed to fetch Apache project_info: ${projectInfoRes.status} ${errorText}`);
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

      console.log('Mapped Apache Projects:', allDescriptions.value);

      if (allDescriptions.value.length === 0) {
        throw new Error('No Apache project data available.');
      }
    } catch (err) {
      console.error('Error fetching and merging Apache project data:', err);
      error.value = 'Failed to fetch project information (Apache).';
    } finally {
      loading.value = false;
    }
  };

  // Fetch Eclipse Project Data
  const fetchEclipseProjects = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('Fetching all Eclipse project data...');
      const projectInfoRes = await fetch(`${baseUrl.value}/eclipse/project_info`);

      if (!projectInfoRes.ok) {
        const errorText = await projectInfoRes.text();
        throw new Error(`Failed to fetch Eclipse project_info: ${projectInfoRes.status} ${errorText}`);
      }

      const projectInfoData = await projectInfoRes.json();
      const projectInfos = projectInfoData.projects;

      eclipseDescriptions.value = projectInfos
        .filter((info) => info.display === true)
        .map((info) => ({
          project_id: info.project_id,
          project_name: info.project_name || 'N/A',
          project_url: info.project_url || 'N/A',
          status: info.status || 'N/A',
          tech: info.tech || 'N/A',
          releases: info.releases || [],
          dependencies: info.dependencies || [],
          month_intervals: info.month_intervals || {},
          github_url: info.project_url || 'N/A',
        }));

      console.log('Mapped Eclipse Projects:', eclipseDescriptions.value);

      if (eclipseDescriptions.value.length === 0) {
        throw new Error('No Eclipse project data available.');
      }
    } catch (err) {
      console.error('Error fetching and merging Eclipse project data:', err);
      error.value = 'Failed to fetch project information (Eclipse).';
    } finally {
      loading.value = false;
    }
  };

  const setCurrentProjectDetails = async (project) => {
    if (!project) {
      resetProjectDetails();
      return;
    }

    selectedProject.value = project;
    github_url.value = project.github_url || 'N/A';
    fork_count.value = project.fork_count || 0;
    stargazer_count.value = project.stargazer_count || 0;
    watch_count.value = project.watch_count || 0;

    console.log(`Selected Project: ${project.project_name} (ID: ${project.project_id})`);

    try {
      if (selectedFoundation.value === 'Eclipse') {
        // Eclipse projects: use month_intervals from project data
        monthlyRanges.value = project.month_intervals || {};
      } else {
        // Apache: fetch monthly ranges from API
        await fetchMonthlyRanges(project.project_id);
      }

      if (availableMonths.value.length === 0) {
        selectedMonth.value = null;
        console.warn(`No available months for project ID: ${project.project_id}`);
      } else {
        const min = minMonth.value;
        const max = maxMonth.value;
        rangeValue.value = [min, max];
        singleValue.value = min;
        selectedMonth.value = min;
        console.log(`Project details set for project ID: ${project.project_id}`);
        console.log(`Selected Month set to: ${selectedMonth.value}`);
      }
    } catch (err) {
      console.error(`Error setting project details for ${project.project_id}:`, err);
      error.value = 'Failed to set project details.';
      selectedMonth.value = null;
    }
  };

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

  const fetchMonthlyRanges = async (project_id) => {
    // Only for Apache
    if (selectedFoundation.value !== 'Apache') return;
    try {
      console.log(`Fetching monthly ranges for Apache project ID: ${project_id}`);
      const response = await fetch(`${baseUrl.value}/api/monthly_ranges`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch monthly ranges: ${response.status} ${errorText}`);
      }
      const data = await response.json();

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
      selectedMonth.value = null;
      monthlyRanges.value = {};
    }
  };

  // -------------------- Computed Properties --------------------
  const availableMonths = computed(() => {
    if (selectedProject.value && Object.keys(monthlyRanges.value).length > 0) {
      return Object.keys(monthlyRanges.value).map(Number).sort((a, b) => a - b);
    }
    return [];
  });

  const minMonth = computed(() => {
    return availableMonths.value.length > 0 ? availableMonths.value[0] : 1;
  });

  const maxMonth = computed(() => {
    return availableMonths.value.length > 0 ? availableMonths.value[availableMonths.value.length - 1] : 12;
  });

  // -------------------- Fetch Graduation Forecast --------------------
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
      console.log(`Fetching ${apiPrefix.value}/grad_forecast/${projectId}...`);
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/grad_forecast/${projectId}`);

      if (!response.ok) {
        gradForecastError.value = `Failed to fetch Graduation Forecast data: ${response.status}`;
        return;
      }

      const data = await response.json();
      console.log('Fetched Graduation Forecast Data:', data);

      const sortedData = Object.values(data)
        .sort((a, b) => {
          const dateA = a.date || a.month;
          const dateB = b.date || b.month;
          return new Date(dateA) - new Date(dateB);
        })
        .map((item) => ({
          x: `Month ${item.date || item.month}`,
          y: item.close,
        }));

      gradForecastData.value = sortedData.map(item => item.y);
      xAxisCategories.value = sortedData.map(item => item.x);
    } catch (error) {
      console.error('Error fetching Graduation Forecast data:', error);
      gradForecastError.value = 'Error fetching Graduation Forecast data.';
    } finally {
      gradForecastLoading.value = false;
      console.log('Finished fetchGradForecast.');
    }
  };

  // -------------------- Predictions --------------------
  const predictionsData = ref({});
  const predictionsLoading = ref(false);
  const predictionsError = ref(null);

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
      console.log(`Fetching ${apiPrefix.value}/predictions/${projectId}/${month}...`);
      const url = `${baseUrl.value}${apiPrefix.value}/predictions/${projectId}/${month}`;
      const response = await fetch(url);

      if (!response.ok) {
        predictionsError.value = `Failed to fetch Predictions data: ${response.status}`;
        return;
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
  const fetchCommitMeasuresData = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or month is missing.');
      commitMeasuresError.value = 'Project ID or month is missing.';
      commitMeasuresData.value = null;
      return;
    }

    console.log(`Fetching ${apiPrefix.value}/commit_measure/${projectId}/${month}...`);
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;

    try {
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch commit measures: ${response.status}`;
        commitMeasuresError.value = errorMsg;
        return;
      }

      const data = await response.json();
      console.log('Fetched Commit Measures Data:', data);
      
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          const measures = {};
          data.data.forEach(measure => {
            if (typeof measure === 'object') {
              Object.assign(measures, measure);
            }
          });
          commitMeasuresData.value = measures;
        } else {
          commitMeasuresData.value = data.data;
        }
      } else {
        throw new Error('Invalid commit measures data format.');
      }
    } catch (error) {
      console.error('Error fetching Commit Measures data:', error);
      commitMeasuresError.value = 'Failed to load commit measures.';
      commitMeasuresData.value = null;
    } finally {
      commitMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Email Links Data --------------------
  const fetchEmailLinksData = async (projectId, month, developerName) => {
    if (!projectId || !month || !developerName) {
      console.warn('Project ID, month, or developer name is missing.');
      emailMeasuresError.value = 'Project ID, month, or developer name is missing.';
      emailMeasuresData.value = null;
      return;
    }
  
    console.log(`Fetching ${apiPrefix.value}/email_links/${projectId}/${month} for developer: ${developerName}...`);
    emailMeasuresLoading.value = true;
    emailMeasuresError.value = null;
    emailMeasuresData.value = null;
  
    try {
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/email_links/${projectId}/${month}`);
  
      if (!response.ok) {
        let errorMsg = `Failed to fetch email links: ${response.status}`;
        emailMeasuresError.value = errorMsg;
        return;
      }
  
      const data = await response.json();
      console.log('Fetched Email Measures Data:', data);
  
      // Ensure the response has the expected structure
      if (data && data.commits && Array.isArray(data.commits)) {
        const normalizedDeveloperName = normalizeName(developerName);
        const filteredEmails = data.commits
          .filter(email => {
            const emailAuthorName = normalizeName(email.dealised_author_full_name);
            return emailAuthorName === normalizedDeveloperName;
          })
          .map(email => ({
            link: email.link,
            date: email.human_date_time,
          }));
  
        emailMeasuresData.value = filteredEmails;
      } else {
        throw new Error('Invalid email measures data format: Expected "commits" array in the response.');
      }
    } catch (error) {
      console.error('Error fetching Email Links data:', error);
      emailMeasuresError.value = 'Failed to load email links.';
      emailMeasuresData.value = null;
    } finally {
      emailMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Technical Network Data --------------------
  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetData.value = null;
    techNetError.value = null;

    const monthStr = month.toString();

    // For Apache, ensure month is available
    if (selectedFoundation.value === 'Apache' && !monthlyRanges.value.hasOwnProperty(monthStr)) {
      console.warn(`Month ${month} is not available for project ${projectId}. Skipping TechNet data fetch.`);
      techNetLoading.value = false;
      return;
    }

    try {
      console.log(`Fetching ${apiPrefix.value}/tech_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/tech_net/${projectId}/${month}`);

      if (!response.ok) {
        techNetError.value = `Failed to fetch Technical Network data: ${response.status}`;
        return;
      }

      const data = await response.json();
      techNetData.value = data.data;
      console.log('Fetched Technical Network Data:', data);
    } catch (err) {
      console.error('Error fetching TechNet data:', err);
      techNetData.value = null;
    } finally {
      techNetLoading.value = false;
    }
  };

  const clearTechNetData = () => {
    techNetData.value = null;
    techNetError.value = null;
  };

  // -------------------- Fetch Social Network Data --------------------
  const fetchSocialNetData = async (projectId, month) => {
    socialNetLoading.value = true;
    socialNetData.value = null;
    socialNetError.value = null;

    try {
      console.log(`Fetching ${apiPrefix.value}/social_net/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/social_net/${projectId}/${month}`);

      if (!response.ok) {
        socialNetError.value = `Failed to fetch Social Network data: ${response.status}`;
        return;
      }

      const data = await response.json();
      // Assuming data.data contains the social network data
      socialNetData.value = data.data;
      console.log('Fetched Social Network Data:', data);
    } catch (err) {
      console.error('Error fetching SocialNet data:', err);
      socialNetData.value = null;
    } finally {
      socialNetLoading.value = false;
    }
  };

  const clearSocialNetData = () => {
    socialNetData.value = null;
    socialNetError.value = null;
  };

  // -------------------- Fetch Commit Links Data --------------------
  const fetchCommitLinksData = async (projectId, month, developerName) => {
    if (!developerName) {
      console.warn('Developer name is missing.');
      commitLinksError.value = 'Developer name is missing.';
      commitLinksData.value = null;
      return;
    }

    commitLinksLoading.value = true;
    commitLinksError.value = null;
    commitLinksData.value = null;

    try {
      console.log(`Fetching ${apiPrefix.value}/commit_links/${projectId}/${month}...`);
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month}`);

      if (!response.ok) {
        let errorMsg = `Failed to fetch commit links: ${response.status}`;
        commitLinksError.value = errorMsg;
        return;
      }

      const data = await response.json();
      const normalizedDeveloperName = normalizeName(developerName);
      const filteredCommits = data.commits.filter(commit => {
        const commitAuthorName = normalizeName(commit.dealised_author_full_name);
        return commitAuthorName === normalizedDeveloperName;
      });

      commitLinksData.value = filteredCommits;
      console.log('Filtered Commit Links:', filteredCommits);
    } catch (error) {
      console.error('Error fetching Commit Links data:', error);
      commitLinksError.value = 'Failed to load commit links.';
      commitLinksData.value = null;
    } finally {
      commitLinksLoading.value = false;
    }
  };

  return {
    // -------------------- Foundation --------------------
    selectedFoundation,
    setFoundation,

    // -------------------- Project Selection --------------------
    selectedProject,
    selectedMonth,

    // -------------------- GitHub Details --------------------
    github_url,
    fork_count,
    stargazer_count,
    watch_count,

    // -------------------- Project Descriptions --------------------
    allDescriptions,
    eclipseDescriptions,

    // -------------------- Monthly Ranges --------------------
    monthlyRanges,

    // -------------------- Loading & Error --------------------
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
    fetchEmailLinksData,

    // -------------------- Graduation Forecast --------------------
    gradForecastData,
    xAxisCategories,
    gradForecastLoading,
    gradForecastError,
    fetchGradForecast,

    // -------------------- Predictions --------------------
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

    // -------------------- Developer --------------------
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

    // -------------------- Computed --------------------
    availableMonths,
    minMonth,
    maxMonth,

    // -------------------- Actions --------------------
    fetchAllProjectData,
    fetchEclipseProjects,
    setCurrentProjectDetails,
    resetProjectDetails,
    fetchMonthlyRanges,

    // -------------------- API prefix --------------------
    apiPrefix,
  };
});
