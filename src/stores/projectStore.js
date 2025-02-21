// src/stores/projectStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // -------------------- Configuration --------------------
  const baseUrl = ref('https://oss-decal.priyal.me');

  // Graduation Forecast State
  const gradForecastData = ref([]);
  const xAxisCategories = ref([]);

  // React Data State (for actionables)
  const reactData = ref([]);

  // Local Mode - Technical and Social Network Data
  const techNetData = ref(null);
  const socialNetData = ref(null);

  // Local Mode flag – used to determine which workflow (local vs. foundation) is active.
  const isLocalMode = ref(false);

  // Upload Git Repository Link (POST)
  const uploadGitRepositoryLink = async (git_link) => {
    try {
      const response = await fetch(`${baseUrl.value}/api/upload_git_link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'  // bypass caching issues
        },
        body: JSON.stringify({ git_link })
      });
      const data = await response.json();

      // Update Graduation Forecast if available
      if (data.forecast_json) {
        const keys = Object.keys(data.forecast_json)
          .map(Number)
          .sort((a, b) => a - b);
        gradForecastData.value = keys.map(k => data.forecast_json[k]);
        console.log('Inside loop for Graduation Forecast data');
        console.log('Graduation Forecast Data:', gradForecastData.value);
        xAxisCategories.value = keys.map(k => `Month ${k}`);
        console.log('X-Axis Categories:', xAxisCategories.value);

        //New content

        
      }

      // Update React data if available
      if (data.react && Array.isArray(data.react)) {
        reactData.value = data.react;
      } else {
        reactData.value = [];
      }

      // For Local mode: store social network data (object keyed by month)
      if (data.social_net) {
        socialNetData.value = data.social_net;
        console.log('Inside loop for Social Network data');
        console.log('Social Network Data:', socialNetData.value);
      }

      // For Local mode: store tech network data (object keyed by month)
      if (data.tech_net) {
        techNetData.value = data.tech_net;
        console.log('Inside loop for Technical Network data');
        console.log('Technical Network Data:', techNetData.value);
      }

      // --- Local Mode Specific Logic ---
      if (isLocalMode.value) {
         // Derive repoName from git_link (e.g. "repository" from ".../repository.git")
         const repoNameMatch = git_link.match(/\/([^\/]+)\.git$/);
         const repoName = repoNameMatch ? repoNameMatch[1] : 'Unknown Project';
         // Assign a temporary project ID for local mode
         selectedProject.value = {
            project_id: `local_${repoName}`, 
            project_name: repoName,
            github_url: git_link,
         };
         console.log(`Local mode: Set selectedProject to local_${repoName}`);
         // If forecast categories exist, choose the earliest month as default
         if (xAxisCategories.value && xAxisCategories.value.length > 0) {
            const months = xAxisCategories.value
              .filter(str => typeof str === 'string')
              .map(str => {
                const parts = str.split(" ");
                return parts[1] ? Number(parts[1]) : 0;
              })
              .sort((a, b) => a - b);
            selectedMonth.value = months[0]; // Set the earliest month as default
            console.log(`Local mode: Set selectedMonth to ${selectedMonth.value} based on forecast data.`);
         } else {
            selectedMonth.value = 0; // Default to 0 if no months are available
            console.log("Local mode: No forecast data available. Defaulting selectedMonth to 0.");
         }
      }

      return data;
    } catch (error) {
      console.error("Error uploading git repository link:", error);
      throw error;
    }
  };

  // Foundation selection – can be "Apache" or "Eclipse"
  const selectedFoundation = ref('Apache');
  const setFoundation = (foundation) => {
    selectedFoundation.value = foundation;
    console.log(`Foundation set to: ${foundation}`);
  };

  // -------------------- Project Selection State --------------------
  const selectedProject = ref(null);
  const selectedMonth = ref(null);

  // -------------------- Developer Selection State --------------------
  const selectedDeveloper = ref(null);
  const setSelectedDeveloper = (developerName) => {
    selectedDeveloper.value = developerName;
    console.log('Selected Developer:', selectedDeveloper.value);
  };

  // Social & Technical Node Selections
  const selectedSocialDeveloper = ref(null);
  const setSelectedSocialDeveloper = (developerName) => {
    selectedSocialDeveloper.value = developerName;
    console.log('Selected Social Developer:', selectedSocialDeveloper.value);
  };

  const selectedTechnicalDeveloper = ref(null);
  const setSelectedTechnicalDeveloper = (developerName) => {
    selectedTechnicalDeveloper.value = developerName;
    console.log('Selected Technical Developer:', selectedTechnicalDeveloper.value);
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
  const monthlyRanges = ref({}); // Mapping project IDs to monthly ranges

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
  const gradForecastLoading = ref(false);
  const gradForecastError = ref(null);

  // -------------------- Technical Network State --------------------
  const techNetLoading = ref(false);
  const techNetError = ref(null);

  // -------------------- Social Network State --------------------
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  // -------------------- Range Slider State --------------------
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]);
  const singleValue = ref(1);

  // For most endpoints we use a computed prefix. (Special case defined for Eclipse)
  const apiPrefix = computed(() => {
    return selectedFoundation.value === 'Eclipse' ? '/eclipse' : '/api';
  });

  // -------------------- Watchers --------------------
  watch(
    [selectedProject, selectedMonth],
    async ([newProject, newMonth]) => {
      console.log(`Project changed to ${newProject?.project_name || 'None'} and month ${newMonth || 'None'}`);
      if (newProject && newMonth) {
        await Promise.all([
          // fetchTechNetData(newProject.project_id, newMonth),
          // fetchSocialNetData(newProject.project_id, newMonth),
          fetchCommitMeasuresData(newProject.project_id, newMonth),
          fetchEmailMeasuresData(newProject.project_id, newMonth),
          selectedDeveloper.value
            ? fetchEmailLinksData(newProject.project_id, newMonth, selectedDeveloper.value)
            : Promise.resolve(),
        ]);

        if (!isLocalMode.value) {
          await fetchSocialNetData(newProject.project_id, newMonth);
          await fetchTechNetData(newProject.project_id, newMonth);
          await fetchGradForecast(newProject.project_id);
          // await fetchPredictions(newProject.project_id, newMonth);
        } else {
          console.log("Local mode - fetching data now for change in project/month.");
        }
      } else {
        if (!isLocalMode.value) {
          clearSocialNetData();
          clearTechNetData();
          commitMeasuresData.value = null;
          commitMeasuresError.value = null;
          emailMeasuresData.value = null;
          emailMeasuresError.value = null;
          gradForecastData.value = [];
          xAxisCategories.value = [];
          gradForecastError.value = null;
        } else {
          // In local mode we clear some measures but preserve the POST‐returned social/forecast data.
          console.log("Local mode: full reset.");
        }
      }
    }
  );

  watch(
    [selectedDeveloper, selectedProject, selectedMonth],
    async ([newDeveloper, newProject, newMonth]) => {
      console.log(`Developer changed to ${newDeveloper || 'None'}`);
      if (newDeveloper && newProject && newMonth) {
        if (!isLocalMode.value)
        {
          await fetchCommitLinksData(newProject.project_id, newMonth, newDeveloper);
          await fetchEmailLinksData(newProject.project_id, newMonth, newDeveloper);
        } else {
          console.log("Local mode - pending to be handled differently.");
        }
      } else {
        commitLinksData.value = null;
        commitLinksError.value = null;
        emailMeasuresData.value = null;
        emailMeasuresError.value = null;
      }
    }
  );

  // -------------------- Actions --------------------

  // Normalize developer name
  const normalizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
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
            mentors: typeof info.mentor === 'string'
              ? info.mentor.split(',').map((m) => m.trim())
              : [],
            start_date: info.start_date || 'N/A',
            end_date: info.end_date || 'N/A',
            status: info.status || 'N/A',
            github_url: project.url || 'N/A',
            fork_count: typeof project.fork_count === 'number' ? project.fork_count : 0,
            stargazer_count: typeof project.stargazer_count === 'number' ? project.stargazer_count : 0,
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
        monthlyRanges.value =
          project.month_intervals && Object.keys(project.month_intervals).length > 0
            ? project.month_intervals
            : { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true, "8": true, "9": true, "10": true, "11": true, "12": true };
      } else {
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

  // For Local mode, reset details without clearing forecast/social data.
  const resetLocalProjectDetails = () => {
    console.log('Resetting local project details (preserving forecast and social network data).');
    selectedProject.value = null;
    github_url.value = 'N/A';
    fork_count.value = 0;
    stargazer_count.value = 0;
    watch_count.value = 0;
    selectedMonth.value = null;
    monthlyRanges.value = {};
    commitMeasuresData.value = null;
    commitMeasuresError.value = null;
    emailMeasuresData.value = null;
    emailMeasuresError.value = null;
    // techNetData.value = null;
    // techNetError.value = null;
    // socialNetError.value = null;
    // socialNetData.value = null;
    // xAxisCategories.value = [];
    // gradForecastData.value = [];
    // gradForecastError.value = null;
    showRangeSlider.value = false;
    rangeValue.value = [1, 12];
    singleValue.value = 1;
  };

  const fetchMonthlyRanges = async (project_id) => {
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
    if (selectedProject.value) {
      if (selectedFoundation.value === 'Eclipse') {
        const keys = Object.keys(monthlyRanges.value);
        if (keys.length === 0) {
          return [1,2,3,4,5,6,7,8,9,10,11,12];
        } else {
          return keys.map(Number).sort((a, b) => a - b);
        }
      } else if (Object.keys(monthlyRanges.value).length > 0) {
        return Object.keys(monthlyRanges.value).map(Number).sort((a, b) => a - b);
      }
    }
    return [];
  });
  const minMonth = computed(() => availableMonths.value.length > 0 ? availableMonths.value[0] : 1);
  const maxMonth = computed(() => availableMonths.value.length > 0 ? availableMonths.value[availableMonths.value.length - 1] : 12);

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
    if (!isLocalMode.value) {
      xAxisCategories.value = [];
    }
    gradForecastError.value = null;
    try {
      const endpoint =
        selectedFoundation.value === 'Eclipse'
          ? `${baseUrl.value}/eclipse/grad_forecast/${projectId}`
          : `${baseUrl.value}${apiPrefix.value}/grad_forecast/${projectId}`;
      console.log(`Fetching graduation forecast from: ${endpoint}`);
      const response = await fetch(endpoint);
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
        .map(item => ({
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

  // [DISCARDED]-------------------- Predictions --------------------
  // const predictionsData = ref({});
  // const predictionsLoading = ref(false);
  // const predictionsError = ref(null);
  // const fetchPredictions = async (projectId, month) => {
  //   if (!projectId || !month) {
  //     console.warn('Project ID or selected month is missing.');
  //     predictionsError.value = 'Project ID or selected month is missing.';
  //     return;
  //   }
  //   predictionsLoading.value = true;
  //   predictionsData.value = {};
  //   predictionsError.value = null;
  //   try {
  //     const endpoint =
  //       selectedFoundation.value === 'Eclipse'
  //         ? `${baseUrl.value}/eclipse/predictions/${projectId}/${month}`
  //         : `${baseUrl.value}${apiPrefix.value}/predictions/${projectId}/${month}`;
  //     console.log(`Fetching predictions from: ${endpoint}`);
  //     const response = await fetch(endpoint);
  //     if (!response.ok) {
  //       predictionsError.value = `Failed to fetch Predictions data: ${response.status}`;
  //       return;
  //     }
  //     const data = await response.json();
  //     console.log('Fetched Predictions Data:', data);
  //     predictionsData.value = data;
  //   } catch (error) {
  //     console.error('Error fetching Predictions data:', error);
  //     predictionsError.value = 'Error fetching Predictions data.';
  //   } finally {
  //     predictionsLoading.value = false;
  //     console.log('Finished fetchPredictions.');
  //   }
  // };

  // -------------------- Fetch Commit Measures --------------------
  const fetchCommitMeasuresData = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or month is missing.');
      commitMeasuresError.value = 'Project ID or month is missing.';
      commitMeasuresData.value = null;
      return;
    }
    console.log(`Fetching commit measures from ${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}...`);
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

  // -------------------- Fetch Email Measures --------------------
  const fetchEmailMeasuresData = async (projectId, month) => {
    if (!projectId || !month) {
      console.warn('Project ID or month is missing.');
      emailMeasuresError.value = 'Project ID or month is missing.';
      emailMeasuresData.value = null;
      return;
    }
    console.log(`Fetching email measures from ${baseUrl.value}${apiPrefix.value}/email_measure/${projectId}/${month}...`);
    emailMeasuresLoading.value = true;
    emailMeasuresError.value = null;
    emailMeasuresData.value = null;
    try {
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/email_measure/${projectId}/${month}`);
      if (!response.ok) {
        let errorMsg = `Failed to fetch email measures: ${response.status}`;
        emailMeasuresError.value = errorMsg;
        return;
      }
      const data = await response.json();
      console.log('Fetched Email Measures Data:', data);
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          const measures = {};
          data.data.forEach(measure => {
            if (typeof measure === 'object') {
              Object.assign(measures, measure);
            }
          });
          emailMeasuresData.value = measures;
        } else {
          emailMeasuresData.value = data.data;
        }
      } else {
        throw new Error('Invalid email measures data format.');
      }
    } catch (error) {
      console.error('Error fetching Email Measures data:', error);
      emailMeasuresError.value = 'Failed to load commit measures.';
      emailMeasuresData.value = null;
    } finally {
      emailMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Email Links Data --------------------
  const fetchEmailLinksData = async (projectId, month, developerName) => {
    if (!projectId || !month || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      emailMeasuresError.value = 'Project ID, month, or developer name missing.';
      emailMeasuresData.value = null;
      return;
    }
    console.log(`Fetching email links from ${baseUrl.value}${apiPrefix.value}/email_links/${projectId}/${month} for ${developerName}...`);
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
      console.log('Fetched Email Links Data:', data);
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
        throw new Error('Invalid email links data format.');
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
  // const fetchTechNetData = async (projectId, month) => {
  //   techNetLoading.value = true;
  //   techNetData.value = null;
  //   techNetError.value = null;
  //   const monthStr = month.toString();
  //   if (selectedFoundation.value === 'Apache' && !monthlyRanges.value.hasOwnProperty(monthStr)) {
  //     console.warn(`Month ${month} is not available for project ${projectId}. Skipping TechNet fetch.`);
  //     techNetLoading.value = false;
  //     return;
  //   }
  //   try {
  //     console.log(`Fetching technical network from ${baseUrl.value}${apiPrefix.value}/tech_net/${projectId}/${month}...`);
  //     const response = await fetch(`${baseUrl.value}${apiPrefix.value}/tech_net/${projectId}/${month}`);
  //     if (!response.ok) {
  //       techNetError.value = `Failed to fetch Technical Network data: ${response.status}`;
  //       return;
  //     }
  //     const data = await response.json();
  //     techNetData.value = data.data;
  //     console.log('Fetched Technical Network Data:', data);
  //   } catch (err) {
  //     console.error('Error fetching TechNet data:', err);
  //     techNetData.value = null;
  //   } finally {
  //     techNetLoading.value = false;
  //   }
  // };

  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetError.value = null;
    try {
      const endpoint =
        selectedFoundation.value === 'Eclipse'
          ? `${baseUrl.value}/eclipse/tech_net/${projectId}/${month}`
          : `${baseUrl.value}/api/tech_net/${projectId}/${month}`;
      console.log(`Fetching tech network from: ${endpoint}`);
      const response = await fetch(endpoint);
      if (!response.ok) {
        techNetError.value = `Failed to fetch Tech Network data: ${response.status}`;
        return;
      }
      const data = await response.json();
      techNetData.value = data.data;
      console.log('Fetched Tech Network Data:', data);
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
    socialNetError.value = null;
    try {
      const endpoint =
        selectedFoundation.value === 'Eclipse'
          ? `${baseUrl.value}/eclipse/social_net/${projectId}/${month}`
          : `${baseUrl.value}/api/social_net/${projectId}/${month}`;
      console.log(`Fetching social network from: ${endpoint}`);
      const response = await fetch(endpoint);
      if (!response.ok) {
        socialNetError.value = `Failed to fetch Social Network data: ${response.status}`;
        return;
      }
      const data = await response.json();
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
    if (!projectId || !month || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      commitMeasuresError.value = 'Project ID, month, or developer name missing.';
      commitMeasuresData.value = null;
      return;
    }
    console.log(`Fetching commit links from ${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month} for ${developerName}...`);
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;
    try {
      const response = await fetch(`${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month}`);
      if (!response.ok) {
        let errorMsg = `Failed to fetch commit links: ${response.status}`;
        commitMeasuresError.value = errorMsg;
        return;
      }
      const data = await response.json();
      console.log('Fetched Commit Links Data:', data);
      if (data && data.commits && Array.isArray(data.commits)) {
        const normalizedDeveloperName = normalizeName(developerName);
        const filteredCommits = data.commits
          .filter(commit => {
            const commitAuthorName = normalizeName(commit.dealised_author_full_name);
            return commitAuthorName === normalizedDeveloperName;
          })
          .map(commit => ({
            link: commit.link,
            date: commit.human_date_time,
          }));
        commitMeasuresData.value = filteredCommits;
      } else {
        throw new Error('Invalid commit links data format.');
      }
    } catch (error) {
      console.error('Error fetching Commit Links data:', error);
      commitMeasuresError.value = 'Failed to load commit links.';
      commitMeasuresData.value = null;
    } finally {
      commitMeasuresLoading.value = false;
    }
  };

  // -------------------- Return --------------------
  return {
    // Foundation
    selectedFoundation,
    setFoundation,
    // Project Selection
    selectedProject,
    selectedMonth,
    // Developer Selection
    selectedDeveloper,
    setSelectedDeveloper,
    // Social & Technical Node Selections
    selectedSocialDeveloper,
    setSelectedSocialDeveloper,
    selectedTechnicalDeveloper,
    setSelectedTechnicalDeveloper,
    // Commit Links
    commitLinksData,
    commitLinksLoading,
    commitLinksError,
    fetchCommitLinksData,
    // Graduation Forecast
    gradForecastData,
    xAxisCategories,
    gradForecastLoading,
    gradForecastError,
    fetchGradForecast,
    // Technical Network
    techNetData,
    techNetLoading,
    techNetError,
    fetchTechNetData,
    clearTechNetData,
    // Email Measures
    emailMeasuresData,
    emailMeasuresLoading,
    emailMeasuresError,
    fetchEmailMeasuresData,
    fetchEmailLinksData,
    // GitHub Details
    github_url,
    fork_count,
    stargazer_count,
    watch_count,
    // Project Descriptions
    allDescriptions,
    eclipseDescriptions,
    // Monthly Ranges
    monthlyRanges,
    // Loading & Error
    loading,
    error,
    // Range Slider
    showRangeSlider,
    rangeValue,
    singleValue,
    // Computed: availableMonths, minMonth, maxMonth
    availableMonths,
    minMonth,
    maxMonth,
    // Local mode flag
    isLocalMode,
    // Actions: fetch projects, set/reset project details, fetch monthly ranges
    fetchAllProjectData,
    fetchEclipseProjects,
    setCurrentProjectDetails,
    resetProjectDetails,
    fetchMonthlyRanges,
    // API prefix
    apiPrefix,
    // Upload Git Repository Link (POST)
    uploadGitRepositoryLink,
    // React Data
    reactData,
    // Social Network Data
    socialNetData,
    socialNetLoading,
    socialNetError,
    fetchSocialNetData,
    clearSocialNetData,
    // Local mode reset (preserve forecast and social data)
    resetLocalProjectDetails,

    //Removed functionalities
    // Predictions
    // predictionsData,
    // predictionsLoading,
    // predictionsError,
    // fetchPredictions,
    
  };
});
