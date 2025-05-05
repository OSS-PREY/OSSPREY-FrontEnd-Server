// src/stores/projectStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  // -------------------- Configuration --------------------
  const baseUrl = ref('https://f29e-169-237-5-231.ngrok-free.app');  

  const ngrokFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'ngrok-skip-browser-warning': 'true',
    };
  
    return fetch(url, { ...options, headers });
  };


  // Graduation Forecast State
  const gradForecastData = ref([]);
  const xAxisCategories = ref([]);

  // React Data State (for actionables)
  // Can be an array (old style) or an object keyed by month (new style)
  const reactData = ref([]);

  // Local Mode - Technical and Social Network Data
  const techNetData = ref(null);
  const socialNetData = ref(null);
  const reducedCommits = ref(null);
  const reducedEmails = ref(null);

  // Local Mode flag – used to determine which workflow (local vs. foundation) is active.
  const isLocalMode = ref(false);

  // -------------------- Raw Local Data --------------------
  // When in local mode, we store full commit/email data from the POST response.
  const rawLocalEmailData = ref(null);
  const rawLocalCommitData = ref(null);

  // -------------------- Local Metadata --------------------
  // Store metadata fetched from the GitHub API for local mode.
  const localMetadata = ref(null);

  // -------------------- Upload Git Repository Link (POST) --------------------
  const uploadGitRepositoryLink = async (inputUrl) => {
    try {
      let git_link = inputUrl.trim();

    // 1) Remove any trailing slash
    if (git_link.endsWith('/')) {
      git_link = git_link.slice(0, -1);
    }

    // 2) If it starts with https://github.com/, ensure it ends with .git
    //    (This covers both https://github.com/owner/repo and https://github.com/owner/repo.git)
    if (git_link.toLowerCase().startsWith('https://github.com/') && !git_link.toLowerCase().endsWith('.git')) {
      git_link += '.git';
    }

    console.log('Normalized GitHub URL:', git_link);

      const response = await ngrokFetch(`${baseUrl.value}/api/upload_git_link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ git_link })
      });
      const data = await response.json();

      // Graduation Forecast
      if (data.forecast_json) {
        const keys = Object.keys(data.forecast_json).map(Number).sort((a, b) => a - b);
        gradForecastData.value = keys.map(k => data.forecast_json[k]);
        console.log('Graduation Forecast Data:', gradForecastData.value);
        xAxisCategories.value = [];  
        xAxisCategories.value = keys.map(k => `Month ${k}`);
        console.log('X-Axis Categories:', xAxisCategories.value);
      }

      // ReACT data handling
      if (data.react) {
        reactData.value = Array.isArray(data.react)
          ? data.react
          : (typeof data.react === 'object' ? data.react : []);
        // console.log('ReACT Data:', reactData.value);
      } else {
        reactData.value = [];
      }
      // console.log("ReACT Data PRINTING:", reactData.value);

      // Process metadata (store it for display in ProjectDetails)
      if (data.metadata) {
        localMetadata.value = data.metadata;
        console.log('Metadata received:', localMetadata.value);
      }

      // Social & Technical Network Data (for Local mode)
      if (data.social_net) {
        socialNetData.value = data.social_net;
        console.log('Social Network Data:', socialNetData.value);
      }
      if (data.tech_net) {
        techNetData.value = data.tech_net;
        console.log('Technical Network Data:', techNetData.value);
      }

      // In Local mode, store the full raw email/commit data.
      if (data.issue_data) {
        rawLocalEmailData.value = data.issue_data;
        console.log('Raw Local Email (issue) Data:', rawLocalEmailData.value);
      }
      if (data.commit_data) {
        rawLocalCommitData.value = data.commit_data;
        console.log('Raw Local Commit Data:', rawLocalCommitData.value);
      }

      // Local Mode Specific Logic: Set the project details based solely on the repo URL.
      if (isLocalMode.value) {
        const repoNameMatch = git_link.match(/\/([^\/]+)\.git$/);
        const repoName = repoNameMatch ? repoNameMatch[1] : 'Unknown Project';
        selectedProject.value = {
          project_id: `local_${repoName}`, 
          project_name: repoName,
          github_url: git_link,
        };
        console.log(`Local mode: Set selectedProject to local_${repoName}`);
        // Use it only to set a default when data is first loaded
        if (!selectedMonth.value && xAxisCategories.value && xAxisCategories.value.length > 0) {
          selectedMonth.value = 0;
          console.log("Set default selectedMonth to 1 on initialization.");
        }
        // if (xAxisCategories.value && xAxisCategories.value.length > 0) {
        //   const months = xAxisCategories.value
        //     .filter(str => typeof str === 'string')
        //     .map(str => {
        //       const parts = str.split(" ");
        //       return parts[1] ? Number(parts[1]) : 0;
        //     })
        //     .sort((a, b) => a - b);
        //   selectedMonth.value = months[0];
        //   console.log(`Local mode: Set selectedMonth to ${selectedMonth.value} based on forecast data.`);
        // } else {
        //   selectedMonth.value = 0;
        //   console.log("Local mode: No forecast data available. Defaulting selectedMonth to 0.");
        // }
      }

      return data;
    } catch (error) {
      console.error("Error uploading git repository link:", error);
      throw error;
    }
  };

  // -------------------- Foundation Selection --------------------
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
    console.log('Selected Developer:', developerName);
  };

  // Social & Technical Node Selections (no changes needed here)
  const selectedSocialDeveloper = ref(null);
  const setSelectedSocialDeveloper = (developerName) => {
    selectedSocialDeveloper.value = developerName;
    console.log('Selected Social Developer:', developerName);
    // Optionally, if you want local social node clicks to also set the developer:
    if (isLocalMode.value) {
      setSelectedDeveloper(developerName);
    }
  };

  const selectedTechnicalDeveloper = ref(null);
  const setSelectedTechnicalDeveloper = (developerName) => {
    selectedTechnicalDeveloper.value = developerName;
    console.log('Selected Technical Developer:', developerName);
  };

  // -------------------- Measures & Links State --------------------
  const commitMeasuresData = ref(null);
  const commitMeasuresLoading = ref(false);
  const commitMeasuresError = ref(null);

  const emailMeasuresData = ref(null);
  const emailMeasuresLoading = ref(false);
  const emailMeasuresError = ref(null);

  const commitLinksData = ref(null);
  const commitLinksLoading = ref(false);
  const commitLinksError = ref(null);

  const emailLinksData = ref(null);
  const emailLinksLoading = ref(false);
  const emailLinksError = ref(null);

  // -------------------- GitHub Details --------------------
  const github_url = ref('N/A');
  const fork_count = ref(0);
  const stargazer_count = ref(0);
  const watch_count = ref(0);

  // -------------------- Project Descriptions --------------------
  const allDescriptions = ref([]);
  const eclipseDescriptions = ref([]);

  // -------------------- Monthly Ranges --------------------
  const monthlyRanges = ref({});

  // -------------------- Loading & Error States --------------------
  const loading = ref(false);
  const error = ref(null);

  // -------------------- Graduation Forecast --------------------
  const gradForecastLoading = ref(false);
  const gradForecastError = ref(null);

  // -------------------- Technical & Social Network States --------------------
  const techNetLoading = ref(false);
  const techNetError = ref(null);
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  // -------------------- Range Slider State --------------------
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]);
  const singleValue = ref(1);

  // -------------------- API Prefix --------------------
  const apiPrefix = computed(() => {
    return selectedFoundation.value === 'Eclipse' ? '/eclipse' : '/api';
  });

  // -------------------- Helpers / Local Filtering --------------------
  const normalizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
  };

  // Local Mode: Filter commit and email statistics from Technical Network function
  const setReducedCommits = (data) => {
    reducedCommits.value = data;
    console.log('Updated Reduced Commits Data:', reducedCommits.value);
  };
  
  const setReducedEmails = (data) => {
    reducedEmails.value = data;
    console.log('Updated Reduced Emails Data:', reducedEmails.value);
  };

  const filterLocalEmailLinks = (projectId, month, developerName) => {
    if (!rawLocalEmailData.value || !rawLocalEmailData.value.months) {
      console.warn('Local Email Data not available or invalid:', rawLocalEmailData.value);
      return [];
    }
    const monthKey = String(month + 1);
    const emailsForMonth = rawLocalEmailData.value.months[monthKey] || [];
    const devNormalized = normalizeName(developerName);
    const filtered = emailsForMonth.filter(item =>
      normalizeName(item.dealised_author_full_name || '') === devNormalized
    ).map(item => ({
      link: item.link || 'N/A',
      date: item.human_date_time || 'N/A'
    }));
    console.log(`[Local filter] Emails for '${devNormalized}' in Month ${monthKey}:`, filtered);
    return filtered;
  };

  const filterLocalCommitLinks = (projectId, month, developerName) => {
    if (!rawLocalCommitData.value || !rawLocalCommitData.value.months) {
      console.warn('Local Commit Data not available or invalid:', rawLocalCommitData.value);
      return [];
    }
    const monthKey = String(month + 1);
    const commitsForMonth = rawLocalCommitData.value.months[monthKey] || [];
    const devNormalized = normalizeName(developerName);
    const filtered = commitsForMonth.filter(item =>
      normalizeName(item.dealised_author_full_name || '') === devNormalized
    ).map(item => ({
      link: item.link || 'N/A',
      date: item.human_date_time || 'N/A'
    }));
    console.log(`[Local filter] Commits for '${devNormalized}' in Month ${monthKey}:`, filtered);
    return filtered;
  };

  // -------------------- Watchers --------------------
  watch(
    [selectedProject, selectedMonth],
    async ([newProject, newMonth]) => {
      console.log(`Project changed to ${newProject?.project_name || 'None'} and month ${newMonth || 'None'}`);
      if (newProject && newMonth !== null && newMonth !== undefined) {
        await Promise.all([
          fetchCommitMeasuresData(newProject.project_id, newMonth),
          fetchEmailMeasuresData(newProject.project_id, newMonth),
        ]);
        if (!isLocalMode.value) {
          await fetchSocialNetData(newProject.project_id, newMonth);
          await fetchTechNetData(newProject.project_id, newMonth);
          await fetchGradForecast(newProject.project_id);
        } else {
          console.log("Local mode: skipping GET calls for social/tech/forecast on project/month change.");
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
          console.log("Local mode: full reset for project/month change.");
        }
      }
    }
  );

  watch(
    [selectedDeveloper, selectedProject, selectedMonth],
    async ([newDeveloper, newProject, newMonth]) => {
      console.log(`Developer changed to ${newDeveloper || 'None'}`);
      if (newDeveloper && newProject && newMonth !== null && newMonth !== undefined) {
        // For both commit and email links, if in local mode use filtering,
        // otherwise make GET calls.
        if (isLocalMode.value) {
          commitLinksData.value = filterLocalCommitLinks(newProject.project_id, newMonth, newDeveloper);
          emailLinksData.value = filterLocalEmailLinks(newProject.project_id, newMonth, newDeveloper);
        } else {
          await fetchCommitLinksData(newProject.project_id, newMonth, newDeveloper);
          await fetchEmailLinksData(newProject.project_id, newMonth, newDeveloper);
        }
      } else {
        commitLinksData.value = null;
        commitLinksError.value = null;
        emailLinksData.value = null;
        emailLinksError.value = null;
      }
    }
  );

  // -------------------- Fetching Functions --------------------
  // Foundation Mode fetch functions remain unchanged.

  const fetchAllProjectData = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('Fetching all Apache project data...');
      const [projectsRes, projectInfoRes] = await Promise.all([
        ngrokFetch(`${baseUrl.value}/api/projects`),
        ngrokFetch(`${baseUrl.value}/api/project_info`)
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
      projectInfos.forEach(info => {
        projectInfoMap.set(info.project_id.toLowerCase(), info);
      });
      allDescriptions.value = projects
        .filter(project => projectInfoMap.has(project.name.toLowerCase()))
        .map(project => {
          const info = projectInfoMap.get(project.name.toLowerCase());
          return {
            project_id: info.project_id,
            project_name: info.project_name || 'N/A',
            description: info.description || 'N/A',
            sponsor: info.sponsor || 'N/A',
            champion: info.champion || 'N/A',
            mentors: typeof info.mentor === 'string' ? info.mentor.split(',').map(m => m.trim()) : [],
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
      if (allDescriptions.value.length === 0) throw new Error('No Apache project data available.');
    } catch (err) {
      console.error('Error fetching Apache project data:', err);
      error.value = 'Failed to fetch project information (Apache).';
    } finally {
      loading.value = false;
    }
  };

  const fetchEclipseProjects = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('Fetching all Eclipse project data...');
      const projectInfoRes = await ngrokFetch(`${baseUrl.value}/eclipse/project_info`);
      if (!projectInfoRes.ok) {
        const errorText = await projectInfoRes.text();
        throw new Error(`Failed to fetch Eclipse project_info: ${projectInfoRes.status} ${errorText}`);
      }
      const projectInfoData = await projectInfoRes.json();
      const projectInfos = projectInfoData.projects;
      eclipseDescriptions.value = projectInfos
        .filter(info => info.display === true)
        .map(info => ({
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
      if (eclipseDescriptions.value.length === 0) throw new Error('No Eclipse project data available.');
    } catch (err) {
      console.error('Error fetching Eclipse project data:', err);
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
        console.log("Available Months:", availableMonths.value);
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
    commitLinksData.value = null;
    commitLinksError.value = null;
    emailLinksData.value = null;
    emailLinksError.value = null;
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

  // Local mode reset (preserving forecast/social data if desired)
  const resetLocalProjectDetails = () => {
    console.log('Resetting local project details (preserving forecast & social network data).');
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
    commitLinksData.value = null;
    commitLinksError.value = null;
    emailLinksData.value = null;
    emailLinksError.value = null;
    showRangeSlider.value = false;
    rangeValue.value = [1, 12];
    singleValue.value = 1;
  };

  const fetchMonthlyRanges = async (project_id) => {
    if (selectedFoundation.value !== 'Apache') return;
    try {
      console.log(`Fetching monthly ranges for Apache project ID: ${project_id}`);
      const response = await ngrokFetch(`${baseUrl.value}/api/monthly_ranges`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch monthly ranges: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      const projectRange = data.project_ranges.find(range => range.project_id.toLowerCase() === project_id.toLowerCase());
      if (!projectRange) throw new Error(`Monthly ranges not found for project ID: ${project_id}`);
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
        return keys.length === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : keys.map(Number).sort((a, b) => a - b);
      } else if (Object.keys(monthlyRanges.value).length > 0) {
        return Object.keys(monthlyRanges.value).map(Number).sort((a, b) => a - b);
      }
    }
    return [];
  });
  const minMonth = computed(() => availableMonths.value.length > 0 ? availableMonths.value[0] : 1);
  const maxMonth = computed(() => availableMonths.value.length > 0 ? availableMonths.value[availableMonths.value.length - 1] : 12);
  

  // -------------------- Graduation Forecast --------------------

  const fetchGradForecast = async (projectId) => {
    if (!projectId) {
      console.warn('No project selected.');
      gradForecastError.value = 'No project selected.';
      return;
    }
  
    gradForecastLoading.value = true;
    gradForecastData.value = [];
    if (!isLocalMode.value) xAxisCategories.value = [];
    gradForecastError.value = null;
  
    try {
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/grad_forecast/${projectId}`
        : `${baseUrl.value}${apiPrefix.value}/grad_forecast/${projectId}`;
      const response = await ngrokFetch(endpoint);
      if (!response.ok) {
        gradForecastError.value = `Failed to fetch Graduation Forecast data: ${response.status}`;
        return;
      }

      console.log('LOCAL MODE VALUE', isLocalMode.value)
      if(!isLocalMode.value){
        const data = await response.json();
      const sortedData = Object.values(data)
        .sort((a, b) => new Date(a.date || a.month) - new Date(b.date || b.month))
        .map(item => ({ x: `Month ${item.date || item.month}`, y: item.close }));
  
      gradForecastData.value = sortedData.map(item => item.y);
      xAxisCategories.value = sortedData.map(item => item.x);
  
      const reactJson = await (await ngrokFetch('/react_set.json')).json();
      const rawData = await (await ngrokFetch('/foundation.json')).json();
  
      const projected = projectId;
      const filteredByProject = rawData.filter(row => row.proj_name === projected);
      if (filteredByProject.length === 0) {
        console.warn(`No data for project ${projected}`);
        return;
      }
  
      const featureList = [
        's_avg_clustering_coef',
        't_num_dev_nodes',
        't_num_dev_per_file',
        't_graph_density',
        'st_num_dev',
        't_net_overlap'
      ];
  
      // Compute global averages across all months
      const avgFeatureValues = {};
      for (const feature of featureList) {
        const values = filteredByProject.map(row => parseFloat(row[feature]) || 0);
        avgFeatureValues[feature] = values.reduce((a, b) => a + b, 0) / values.length;
      }
  
      // Get all unique sorted months
      const allMonths = [...new Set(filteredByProject.map(row => row.month))].sort((a, b) => a - b);
      const reactResultsByMonth = {};
  
      for (const month of allMonths) {
        const windowData = filteredByProject.filter(row =>
          row.month >= month - 2 && row.month <= month
        );
  
        const differences = {};
        for (const feature of featureList) {
          const values = windowData.map(row => parseFloat(row[feature]) || 0);
          const monthlySum = values.reduce((a, b) => a + b, 0);
          differences[feature] = monthlySum - avgFeatureValues[feature];
        }
  
        const degradedFeatures = Object.entries(differences)
          .filter(([_, diff]) => diff <= 0)
          .map(([feature]) => feature);
  
        const relevantReact = reactJson
          .filter(entry => {
            const entryFeatures = (entry.Features || "").split(',').map(f => f.trim());
            return degradedFeatures.some(feature => entryFeatures.includes(feature));
          })
          .sort((a, b) => (b.Importance || 0) - (a.Importance || 0))
          .map(entry => ({
            title: entry.title,
            importance: entry.importance || entry.Importance || 0,
            refs: (entry.refs || []).map(ref => {
              const cleanedRef = {};
              if (ref.link) cleanedRef.link = ref.link;
              if (ref.text && !ref.link) cleanedRef.text = ref.text;
              return cleanedRef;
            })
          }));
  
        // reactResultsByMonth[month.toString()] = relevantReact;
        reactResultsByMonth[month.toString()] = relevantReact
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

      }
  
      // ✅ Store all month-wise actionables
      reactData.value = reactResultsByMonth;
      // console.log('✅ All-month ReACT results:', reactData.value);

      }
  
      
  
    } catch (error) {
      console.error('Error fetching Graduation Forecast data:', error);
      gradForecastError.value = 'Error fetching Graduation Forecast data.';
    } finally {
      gradForecastLoading.value = false;
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
    console.log(`Fetching commit measures from ${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}...`);
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;
    try {
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}`);
      if (!response.ok) {
        commitMeasuresError.value = `Failed to fetch commit measures: ${response.status}`;
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
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/email_measure/${projectId}/${month}`);
      if (!response.ok) {
        emailMeasuresError.value = `Failed to fetch email measures: ${response.status}`;
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
      emailMeasuresError.value = 'Failed to load email measures.';
      emailMeasuresData.value = null;
    } finally {
      emailMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Commit Links Data --------------------
  const fetchCommitLinksData = async (projectId, month, developerName) => {
    if (!projectId || !month || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      commitLinksError.value = 'Project ID, month, or developer name missing.';
      commitLinksData.value = null;
      return;
    }
    // NEW: In local mode, do not make a GET call. Filter from raw data.
    if (isLocalMode.value) {
      console.log("Local mode: Filtering commit links from raw data.");
      commitLinksData.value = filterLocalCommitLinks(projectId, month, developerName);
      commitLinksLoading.value = false;
      return;
    }
    console.log(`Fetching commit links from ${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month} for ${developerName}...`);
    commitLinksLoading.value = true;
    commitLinksError.value = null;
    commitLinksData.value = null;
    try {
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month}`);
      if (!response.ok) {
        commitLinksError.value = `Failed to fetch commit links: ${response.status}`;
        return;
      }
      const data = await response.json();
      console.log('Fetched Commit Links Data:', data);
      if (data && data.commits && Array.isArray(data.commits)) {
        const normalizedDev = normalizeName(developerName);
        const filtered = data.commits.filter(commit =>
          normalizeName(commit.dealised_author_full_name || '') === normalizedDev
        ).map(commit => ({
          link: commit.link,
          date: commit.human_date_time,
        }));
        commitLinksData.value = filtered;
      } else {
        throw new Error('Invalid commit links data format.');
      }
    } catch (error) {
      console.error('Error fetching Commit Links data:', error);
      commitLinksError.value = 'Failed to load commit links.';
      commitLinksData.value = null;
    } finally {
      commitLinksLoading.value = false;
    }
  };

  // -------------------- Fetch Email Links Data --------------------
  const fetchEmailLinksData = async (projectId, month, developerName) => {
    if (!projectId || !month || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      emailLinksError.value = 'Project ID, month, or developer name missing.';
      emailLinksData.value = null;
      return;
    }
    // NEW: In local mode, use the raw filter instead of GET.
    if (isLocalMode.value) {
      console.log("Local mode: Filtering email links from raw data.");
      emailLinksData.value = filterLocalEmailLinks(projectId, month, developerName);
      emailLinksLoading.value = false;
      return;
    }
    console.log(`Fetching email links from ${baseUrl.value}${apiPrefix.value}/email_links/${projectId}/${month} for ${developerName}...`);
    emailLinksLoading.value = true;
    emailLinksError.value = null;
    emailLinksData.value = null;
    try {
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/email_links/${projectId}/${month}`);
      if (!response.ok) {
        emailLinksError.value = `Failed to fetch email links: ${response.status}`;
        return;
      }
      const data = await response.json();
      console.log('Fetched Email Links Data:', data);
      if (data && data.commits && Array.isArray(data.commits)) {
        const normalizedDev = normalizeName(developerName);
        const filtered = data.commits.filter(commit =>
          normalizeName(commit.dealised_author_full_name || '') === normalizedDev
        ).map(commit => ({
          link: commit.link || 'N/A',
          date: commit.human_date_time || 'N/A'
        }));
        emailLinksData.value = filtered;
      } else {
        throw new Error('Invalid email links data format.');
      }
    } catch (error) {
      console.error('Error fetching Email Links data:', error);
      emailLinksError.value = 'Failed to load email links.';
      emailLinksData.value = null;
    } finally {
      emailLinksLoading.value = false;
    }
  };

  // -------------------- Fetch Technical Network Data --------------------
  const fetchTechNetData = async (projectId, month) => {
    techNetLoading.value = true;
    techNetError.value = null;
    try {
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/tech_net/${projectId}/${month}`
        : `${baseUrl.value}/api/tech_net/${projectId}/${month}`;
      console.log(`Fetching tech network from: ${endpoint}`);
      const response = await ngrokFetch(endpoint);
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
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/social_net/${projectId}/${month}`
        : `${baseUrl.value}/api/social_net/${projectId}/${month}`;
      console.log(`Fetching social network from: ${endpoint}`);
      const response = await ngrokFetch(endpoint);
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

  const sortedActionables = ref([]);
  

  // -------------------- Return Everything --------------------
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
    // Measures & Links
    commitMeasuresData,
    commitMeasuresLoading,
    commitMeasuresError,
    fetchCommitMeasuresData,
    emailMeasuresData,
    emailMeasuresLoading,
    emailMeasuresError,
    fetchEmailMeasuresData,
    commitLinksData,
    commitLinksLoading,
    commitLinksError,
    fetchCommitLinksData,
    emailLinksData,
    emailLinksLoading,
    emailLinksError,
    fetchEmailLinksData,
    // Graduation Forecast
    gradForecastData,
    xAxisCategories,
    gradForecastLoading,
    gradForecastError,
    fetchGradForecast,
    // Technical & Social Network Data
    techNetData,
    techNetLoading,
    techNetError,
    fetchTechNetData,
    clearTechNetData,
    socialNetData,
    socialNetLoading,
    socialNetError,
    fetchSocialNetData,
    clearSocialNetData,
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
    // Computed Properties
    availableMonths,
    minMonth,
    maxMonth,
    // Local Mode Flag & Raw Data
    isLocalMode,
    rawLocalEmailData,
    rawLocalCommitData,
    localMetadata,
    // Actions
    fetchAllProjectData,
    fetchEclipseProjects,
    setCurrentProjectDetails,
    resetProjectDetails,
    resetLocalProjectDetails,
    fetchMonthlyRanges,
    // API Prefix
    apiPrefix,
    // Upload Git Repository Link
    uploadGitRepositoryLink,
    // React Data
    reactData,
    // [Testing] Technical Network local mode stats
    reducedCommits,
    setReducedCommits,  
    reducedEmails,
    setReducedEmails,
    sortedActionables,
  };
});
