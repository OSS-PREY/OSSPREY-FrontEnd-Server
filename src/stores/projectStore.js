// src/stores/projectStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { getApiBaseUrl } from '@/utils/apiBase';
import { defaultMonth, renderableRows, rowsForMonth } from '@/utils/networkRows';
import { countEntries } from '@/utils/linkCounts';
// Same helper the pages use: adds the ngrok skip header and auth token.
import { apiFetch as ngrokFetch } from '@/utils/apiFetch';

export const useProjectStore = defineStore('projectStore', () => {
  // -------------------- Configuration --------------------
  const baseUrl = ref(getApiBaseUrl());

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

  // -------------------- Frontend Actionables (local mode) --------------------
  // Local mode shows the full ReACT catalog loaded directly from the frontend
  // (public/updated_react_set2.json); the backend's data.react is not used.
  const loadFrontendActionables = async () => {
    try {
      const res = await ngrokFetch('/updated_react_set2.json');
      if (!res.ok) {
        console.warn('Failed to load /updated_react_set2.json:', res.status);
        return [];
      }
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (err) {
      console.warn('Failed to load frontend actionables:', err);
      return [];
    }
  };

  // -------------------- Request Queue State --------------------
  // The backend processes repositories through a bounded FIFO queue. The
  // frontend submits a job, then polls for its status until it finishes.
  const queueJobId = ref(null);
  const queueStatus = ref(null);        // queued | running | completed | failed | cancelled
  const queuePosition = ref(0);         // 1-based position while queued (0 otherwise)
  const queueEtaSeconds = ref(0);       // estimated seconds until the job finishes
  const queueLength = ref(0);           // total jobs currently waiting
  const queueProcessing = ref(false);   // true from submission until a terminal state
  const queueError = ref(null);         // populated when a job fails

  const QUEUE_POLL_INTERVAL_MS = 2000;
  // Give up polling after this many consecutive network failures (~30 s of
  // outage) instead of spinning forever with the status panel stuck.
  const QUEUE_MAX_POLL_FAILURES = 15;
  let queuePollTimer = null;
  let queuePollFailures = 0;

  const resetQueueState = () => {
    if (queuePollTimer) {
      clearTimeout(queuePollTimer);
      queuePollTimer = null;
    }
    queueJobId.value = null;
    queueStatus.value = null;
    queuePosition.value = 0;
    queueEtaSeconds.value = 0;
    queueLength.value = 0;
    queueError.value = null;
    queueProcessing.value = false;
  };

  const updateQueueState = (job) => {
    if (!job) return;
    queueStatus.value = job.status ?? queueStatus.value;
    queuePosition.value = job.position ?? 0;
    queueEtaSeconds.value = job.estimated_wait_seconds ?? 0;
    queueLength.value = job.queue_length ?? 0;
  };

  // Poll the backend until the job reaches a terminal state.
  //
  // The loop is tied to the job id: `resetQueueState`/`cancelQueuedJob` clear
  // `queueJobId`, and a `clearTimeout` only cancels a *pending* tick — a tick
  // whose fetch is already in flight would otherwise complete afterwards,
  // overwrite the newer job's state, and schedule another poll. The guard at
  // the top of `tick` makes every stale iteration exit immediately instead.
  const pollQueueUntilDone = (jobId) => new Promise((resolve) => {
    const tick = async () => {
      if (queueJobId.value !== jobId) {
        // Job was cancelled or superseded by a newer submission.
        resolve({ status: 'cancelled', superseded: true });
        return;
      }
      try {
        const res = await ngrokFetch(`${baseUrl.value}/api/queue_status/${jobId}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) {
          resolve({ status: 'failed', error: `Status request failed (${res.status})` });
          return;
        }
        const job = await res.json();
        if (queueJobId.value !== jobId) {
          resolve({ status: 'cancelled', superseded: true });
          return;
        }
        queuePollFailures = 0;
        updateQueueState(job);
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          resolve(job);
          return;
        }
        queuePollTimer = setTimeout(tick, QUEUE_POLL_INTERVAL_MS);
      } catch (err) {
        queuePollFailures += 1;
        if (queuePollFailures >= QUEUE_MAX_POLL_FAILURES) {
          resolve({ status: 'failed', error: 'Lost connection to the server while waiting for the job.' });
          return;
        }
        console.warn(`Queue status poll failed (attempt ${queuePollFailures}/${QUEUE_MAX_POLL_FAILURES}), retrying:`, err);
        queuePollTimer = setTimeout(tick, QUEUE_POLL_INTERVAL_MS);
      }
    };
    queuePollFailures = 0;
    tick();
  });

  // Apply a finished pipeline result to the dashboard state. This is the same
  // post-processing the previous synchronous flow performed inline.
  const applyPipelineResult = async (data, git_link) => {
    // Graduation Forecast
    let monthKeys = [];
    if (data.forecast_json) {
      monthKeys = Object.keys(data.forecast_json).map(Number).sort((a, b) => a - b);
      gradForecastData.value = monthKeys.map(k => data.forecast_json[k]);
      xAxisCategories.value = [];
      xAxisCategories.value = monthKeys.map(k => `Month ${k}`);
    }

    // ReACT data handling — frontend-only: load the full catalog from
    // updated_react_set2.json; the backend's data.react is intentionally ignored.
    reactData.value = await loadFrontendActionables();

    // Process metadata (store it for display in ProjectDetails)
    if (data.metadata) {
      localMetadata.value = data.metadata;
    }

    // Social & Technical Network Data (for Local mode)
    if (data.social_net) {
      socialNetData.value = data.social_net;
    }
    if (data.tech_net) {
      techNetData.value = data.tech_net;
    }

    // In Local mode, store the full raw email/commit data.
    if (data.issue_data) {
      rawLocalEmailData.value = data.issue_data;
    }
    if (data.commit_data) {
      rawLocalCommitData.value = data.commit_data;
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
      // Local months are 0-based (forecast, tech_net and social_net are all
      // keyed 0..N-1), and the newest month is routinely empty -- gem5's has no
      // commits at all -- so open on the newest month that actually shows
      // something. See utils/networkRows.js.
      if ((selectedMonth.value === null || selectedMonth.value === undefined) && monthKeys.length > 0) {
        const opening = defaultMonth(monthKeys, techNetData.value, socialNetData.value);
        if (opening !== null) {
          selectedMonth.value = opening;
          singleValue.value = opening;
        }
      }
    }

    return data;
  };

  // -------------------- Upload Git Repository Link (POST + poll) --------------------
  const uploadGitRepositoryLink = async (inputUrl) => {
    resetQueueState();
    queueProcessing.value = true;   // show the status panel immediately
    queueStatus.value = 'queued';   // optimistic label until the server responds

    let git_link = inputUrl.trim();
    // 1) Remove any trailing slash
    if (git_link.endsWith('/')) {
      git_link = git_link.slice(0, -1);
    }
    // 2) If it starts with https://github.com/, ensure it ends with .git
    if (git_link.toLowerCase().startsWith('https://github.com/') && !git_link.toLowerCase().endsWith('.git')) {
      git_link += '.git';
    }
    console.log('Normalized GitHub URL:', git_link);

    try {
      // Step 1: submit the job to the queue (returns immediately with a handle).
      const response = await ngrokFetch(`${baseUrl.value}/api/upload_git_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ git_link })
      });
      const job = await response.json();

      if (!response.ok || job.error) {
        queueStatus.value = 'failed';
        queueError.value = job.error || `Failed to queue request (${response.status}).`;
        queueProcessing.value = false;
        return { error: queueError.value };
      }

      queueJobId.value = job.job_id;
      queueProcessing.value = true;
      updateQueueState(job);
      console.log('Queued job:', job);

      // Step 2: poll until the job reaches a terminal state.
      const finalJob = await pollQueueUntilDone(job.job_id);

      // A newer submission (or a cancel) may have superseded this job while
      // the final poll was in flight; never apply its result in that case.
      if (queueJobId.value !== job.job_id) {
        return { cancelled: true };
      }

      if (finalJob.status === 'completed') {
        const result = finalJob.result || {};
        await applyPipelineResult(result, git_link);
        queueProcessing.value = false;
        return result;
      }

      if (finalJob.status === 'cancelled') {
        queueProcessing.value = false;
        return { cancelled: true };
      }

      // failed
      queueStatus.value = 'failed';
      queueError.value =
        (finalJob.result && finalJob.result.error) || finalJob.error || 'Processing failed.';
      queueProcessing.value = false;
      return { error: queueError.value };
    } catch (error) {
      console.error('Error uploading git repository link:', error);
      queueStatus.value = 'failed';
      queueError.value = error?.message || 'Unexpected error while processing the request.';
      queueProcessing.value = false;
      return { error: queueError.value };
    }
  };

  // Cancel the active job if it is still waiting in the queue.
  const cancelQueuedJob = async () => {
    const jobId = queueJobId.value;
    if (!jobId) return;
    try {
      await ngrokFetch(`${baseUrl.value}/api/cancel_job/${jobId}`, {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch (err) {
      console.warn('Failed to cancel job:', err);
    }
    if (queuePollTimer) {
      clearTimeout(queuePollTimer);
      queuePollTimer = null;
    }
    // Clearing the id makes any in-flight poll iteration bail out (see
    // pollQueueUntilDone) so the cancelled job's result is never applied.
    queueJobId.value = null;
    queueStatus.value = 'cancelled';
    queueProcessing.value = false;
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

  // `loading` backs the "Loading projects..." indicator, which should stay
  // visible until *all* initial fetches finish — fetchAllProjectData and
  // fetchEclipseProjects run in parallel and used to race on this flag.
  let pendingInitialFetches = 0;
  const beginInitialFetch = () => {
    pendingInitialFetches += 1;
    loading.value = true;
  };
  const endInitialFetch = () => {
    pendingInitialFetches = Math.max(0, pendingInitialFetches - 1);
    if (pendingInitialFetches === 0) loading.value = false;
  };

  // -------------------- Graduation Forecast --------------------
  const gradForecastLoading = ref(false);
  const gradForecastError = ref(null);

  // -------------------- Technical & Social Network States --------------------
  const techNetLoading = ref(false);
  const techNetError = ref(null);
  const socialNetLoading = ref(false);
  const socialNetError = ref(null);

  // Per-resource request sequence counters. Every fetcher increments its
  // counter on entry and only writes results back if its id is still current,
  // so a slow response for a previous project/month can never overwrite the
  // state of the selection the user is actually looking at.
  let commitMeasuresReq = 0;
  let emailMeasuresReq = 0;
  let techNetReq = 0;
  let socialNetReq = 0;
  let gradForecastReq = 0;

  // -------------------- Range Slider State --------------------
  const showRangeSlider = ref(false);
  const rangeValue = ref([1, 12]);
  const singleValue = ref(1);

  // -------------------- API Prefix --------------------
  const apiPrefix = computed(() => {
    return selectedFoundation.value === 'Eclipse' ? '/eclipse' : '/api';
  });

  // -------------------- Helpers / Local Filtering --------------------
  // Month 0 is a real month: local repos key forecasts, networks and link
  // tables from 0, so `!month` silently dropped every request for it.
  const monthMissing = (month) => month === null || month === undefined || isNaN(month);

  const normalizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
  };

  // Local Mode: Filter commit and email statistics from Technical Network function
  const setReducedCommits = (data) => {
    reducedCommits.value = data;
    console.log('Updated Reduced Commits Data:', reducedCommits.value);
  };
  
  // Month-resolved network rows for the stat cards. Deliberately NOT the
  // reduced* arrays: those carry the Sankey's legibility threshold (drop edges
  // weighing <= sum/100), which under-reported busy months by up to 90%, and
  // they are only populated as a side effect of the chart having rendered.
  const monthRows = netData =>
    rowsForMonth(netData, selectedMonth.value).filter(
      r => Array.isArray(r) && r.length >= 3 && Number.isFinite(parseInt(r[2], 10)),
    );
  const currentTechRows = computed(() => monthRows(techNetData.value));
  const currentSocialRows = computed(() => monthRows(socialNetData.value));

  // True per-month totals for locally processed repos. The network edge weights
  // count file changes, not commits, so the stat cards read these instead.
  const monthCommitCount = ref(0);
  const monthCommitterCount = ref(0);
  const monthIssueCount = ref(0);
  const monthSenderCount = ref(0);

  const fetchMonthLinkStats = async (projectId, month) => {
    if (!projectId || monthMissing(month)) return;
    const load = async (endpoint) => {
      try {
        const response = await ngrokFetch(`${baseUrl.value}${endpoint}`);
        // 404 is the normal answer for a month with nothing in it.
        if (!response.ok) return { total: 0, people: 0 };
        const data = await response.json();

        return countEntries(data?.commits);
      } catch (error) {
        console.error(`Failed to load link stats from ${endpoint}:`, error);

        return { total: 0, people: 0 };
      }
    };
    const [commits, issues] = await Promise.all([
      load(`/api/local_commit_links/${projectId}/${month}`),
      load(`/api/local_issue_links/${projectId}/${month}`),
    ]);
    monthCommitCount.value = commits.total;
    monthCommitterCount.value = commits.people;
    monthIssueCount.value = issues.total;
    monthSenderCount.value = issues.people;
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
    const monthKey = String(month);
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
    const monthKey = String(month);
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
        if (!isLocalMode.value) {
          await Promise.all([
            fetchCommitMeasuresData(newProject.project_id, newMonth),
            fetchEmailMeasuresData(newProject.project_id, newMonth),
          ]);
          await fetchSocialNetData(newProject.project_id, newMonth);
          await fetchTechNetData(newProject.project_id, newMonth);
          // The graduation forecast is per-project, not per-month; it is
          // fetched by GraduationForecast.vue on project change instead of
          // re-fetching here on every month change.
        } else {
          // Local mode has no foundation endpoints: measures/networks come
          // from the upload response. The commit/issue totals do need a call,
          // because the networks alone cannot say how many commits a month had.
          await fetchMonthLinkStats(newProject.project_id, newMonth);
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
          monthCommitCount.value = 0;
          monthCommitterCount.value = 0;
          monthIssueCount.value = 0;
          monthSenderCount.value = 0;
        }
      }
    }
  );

  watch(
    [selectedDeveloper, selectedProject, selectedMonth],
    async ([newDeveloper, newProject, newMonth]) => {
      console.log(`Developer changed to ${newDeveloper || 'None'}`);
      if (newDeveloper && newProject && newMonth !== null && newMonth !== undefined) {
        await fetchCommitLinksData(newProject.project_id, newMonth, newDeveloper);
        await fetchEmailLinksData(newProject.project_id, newMonth, newDeveloper);
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
    beginInitialFetch();
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
      endInitialFetch();
    }
  };

  const fetchEclipseProjects = async () => {
    beginInitialFetch();
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
      endInitialFetch();
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
      // Clear up front: monthly ranges are per-project, and a failed fetch
      // must not leave the previous project's ranges in place.
      monthlyRanges.value = {};
      if (selectedFoundation.value === 'Eclipse') {
        monthlyRanges.value =
          project.month_intervals && Object.keys(project.month_intervals).length > 0
            ? project.month_intervals
            : { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true, "8": true, "9": true, "10": true, "11": true, "12": true };
      } else {
        await fetchMonthlyRanges(project.project_id);
      }
      // The user may have switched to another project while the monthly
      // ranges were loading; never apply results for a stale selection.
      if (selectedProject.value?.project_id !== project.project_id) {
        console.log(`Skipping stale project details for ${project.project_id}.`);
        return;
      }
      if (availableMonths.value.length === 0) {
        selectedMonth.value = null;
        console.warn(`No available months for project ID: ${project.project_id}`);
      } else {
        const min = minMonth.value;
        const max = maxMonth.value;
        
        rangeValue.value = [min, max];
        singleValue.value = max;
        selectedMonth.value = max;
        
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
    // Local-mode payload too: without this the previous repo's forecast,
    // actionables and networks keep rendering after the selection is cleared.
    reactData.value = [];
    localMetadata.value = null;
    rawLocalEmailData.value = null;
    rawLocalCommitData.value = null;
    reducedCommits.value = null;
    reducedEmails.value = null;
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
      // A newer selection may have superseded this request while it was in
      // flight; the caller performs the authoritative staleness check, so here
      // we only avoid writing obviously stale state.
      if (selectedProject.value?.project_id?.toLowerCase() !== project_id.toLowerCase()) return;
      const projectRange = data.project_ranges.find(range => range.project_id.toLowerCase() === project_id.toLowerCase());
      if (!projectRange) throw new Error(`Monthly ranges not found for project ID: ${project_id}`);
      monthlyRanges.value = projectRange.monthly_ranges;
      console.log(`Fetched monthly ranges for project ID ${project_id}:`, monthlyRanges.value);
    } catch (err) {
      console.error('Error fetching monthly ranges:', err);
      // Do not touch selectedMonth/monthlyRanges here: by the time a slow
      // request fails, a different project may already own that state. The
      // caller (setCurrentProjectDetails) handles the empty-ranges case.
      error.value = 'Failed to fetch monthly ranges.';
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
    // Stale-react guard: never show the previous project's actionables under
    // a new selection while this request is in flight.
    reactData.value = [];
    const reqId = ++gradForecastReq;

    try {
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/grad_forecast/${projectId}`
        : `${baseUrl.value}${apiPrefix.value}/grad_forecast/${projectId}`;
      const response = await ngrokFetch(endpoint);
      if (reqId !== gradForecastReq) return; // superseded by a newer request
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
  
      // ------------------------------------------------------------------
      // Researched Actionables (ReACTs)
      // Source: public/updated_react_set2.json (generated from final_set.csv
      // by scripts/transform_final_set.py).
      // Logic: only surface an actionable when at least one of the socio-
      // technical features it targets is "struggling" for the project/month,
      // i.e. its recent average is at or below the project's historical
      // baseline. Results are grouped by month so the panel reacts to the
      // month selector.
      //
      // This section is best-effort and has its own try/catch: a failure here
      // must not mark the forecast itself (already loaded above) as failed.
      // ------------------------------------------------------------------
      try {
        const reactRes = await ngrokFetch('/updated_react_set2.json');
        if (!reactRes.ok) throw new Error(`ReACT catalog request failed: HTTP ${reactRes.status}`);
        const reactJson = await reactRes.json();
        if (reqId !== gradForecastReq) return; // superseded while loading

      const featureList = [
        // Social features
        's_num_nodes',
        's_avg_clustering_coef',
        's_graph_density',
        's_num_component',
        's_weighted_mean_degree',
        's_net_overlap',
        // Technical features
        't_graph_density',
        't_num_dev_per_file',
        't_num_dev_nodes',
        't_num_file_nodes',
        't_num_file_per_dev',
        't_net_overlap',
        // Shared (social + technical)
        'st_num_dev',
      ];

      const normalizeRefs = (refs) => {
        if (!Array.isArray(refs)) return [];
        return refs
          .map(ref => {
            const cleaned = {};
            if (ref && ref.link) cleaned.link = ref.link;
            if (ref && ref.venue) cleaned.venue = ref.venue;
            return cleaned;
          })
          .filter(ref => ref.link);
      };

      const normalizeEntry = (entry) => ({
        title: entry.title || '',
        importance: entry.importance || entry.Importance || 0,
        category: entry.category || '',
        features: entry.Features || entry.features || '',
        positive_impact: entry.positive_impact || entry.impact || '',
        evidence: entry.evidence || '',
        confidence_score: entry.confidence_score ?? null,
        refs: normalizeRefs(entry.refs),
      });

      const normalizedReact = Array.isArray(reactJson) ? reactJson.map(normalizeEntry) : [];
      const reactFeatureSets = normalizedReact.map(entry =>
        String(entry.features).split(',').map(f => f.trim()).filter(Boolean)
      );

      // Baseline metrics: per-project, per-month socio-technical values.
      // foundation.json keys rows by `proj_name`, which can match either the
      // project id or the (full descriptive) project name depending on the
      // foundation, so we match case-insensitively against both.
      const foundationRes = await ngrokFetch('/foundation.json');
      if (!foundationRes.ok) throw new Error(`foundation.json request failed: HTTP ${foundationRes.status}`);
      const foundationRows = await foundationRes.json();
      if (reqId !== gradForecastReq) return; // superseded while loading
      const projectKeys = new Set(
        [projectId, selectedProject.value?.project_name, selectedProject.value?.project_id]
          .filter(Boolean)
          .map(value => String(value).trim().toLowerCase())
      );
      const projectRows = (Array.isArray(foundationRows) ? foundationRows : [])
        .filter(row => projectKeys.has(String(row.proj_name).trim().toLowerCase()));

      if (projectRows.length === 0) {
        console.warn(`No baseline data in foundation.json for project "${projectId}"; cannot match actionables.`);
        reactData.value = {};
      } else {
        // Project-wide historical average per feature = the baseline.
        const globalAverages = {};
        for (const feature of featureList) {
          const values = projectRows.map(row => parseFloat(row[feature]) || 0);
          globalAverages[feature] = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        }

        const months = [...new Set(projectRows.map(row => Number(row.month)))].sort((a, b) => a - b);
        const reactResultsByMonth = {};

        for (const month of months) {
          // Trailing 3-month window (month-2 .. month).
          const windowRows = projectRows.filter(row => {
            const m = Number(row.month);
            return m >= month - 2 && m <= month;
          });
          const divisor = windowRows.length || 1;

          // "Struggling" = recent average at or below the historical baseline.
          const strugglingFeatures = new Set(
            featureList.filter(feature => {
              const windowAvg = windowRows
                .map(row => parseFloat(row[feature]) || 0)
                .reduce((a, b) => a + b, 0) / divisor;
              return windowAvg - globalAverages[feature] <= 0;
            })
          );

          const matched = normalizedReact
            .filter((entry, idx) => reactFeatureSets[idx].some(f => strugglingFeatures.has(f)))
            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
            .slice(0, 10);

          reactResultsByMonth[String(month)] = matched;
        }

        reactData.value = reactResultsByMonth;
      }
      } catch (reactErr) {
        // The forecast itself is fine; only the actionables are unavailable.
        console.warn('Failed to compute ReACT actionables:', reactErr);
        if (reqId === gradForecastReq) reactData.value = {};
      }


      }



    } catch (error) {
      if (reqId !== gradForecastReq) return;
      console.error('Error fetching Graduation Forecast data:', error);
      gradForecastError.value = 'Error fetching Graduation Forecast data.';
    } finally {
      if (reqId === gradForecastReq) gradForecastLoading.value = false;
    }
  };
  


  // -------------------- Fetch Commit Measures --------------------
  const fetchCommitMeasuresData = async (projectId, month) => {
    if (!projectId || monthMissing(month)) {
      console.warn('Project ID or month is missing.');
      commitMeasuresError.value = 'Project ID or month is missing.';
      commitMeasuresData.value = null;
      return;
    }
    console.log(`Fetching commit measures from ${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}...`);
    const reqId = ++commitMeasuresReq;
    commitMeasuresLoading.value = true;
    commitMeasuresError.value = null;
    commitMeasuresData.value = null;
    try {
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/commit_measure/${projectId}/${month}`);
      if (reqId !== commitMeasuresReq) return; // superseded by a newer request
      if (!response.ok) {
        commitMeasuresError.value = `Failed to fetch commit measures: ${response.status}`;
        return;
      }
      const data = await response.json();
      if (reqId !== commitMeasuresReq) return;
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
      if (reqId !== commitMeasuresReq) return;
      console.error('Error fetching Commit Measures data:', error);
      commitMeasuresError.value = 'Failed to load commit measures.';
      commitMeasuresData.value = null;
    } finally {
      if (reqId === commitMeasuresReq) commitMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Email Measures --------------------
  const fetchEmailMeasuresData = async (projectId, month) => {
    if (!projectId || monthMissing(month)) {
      console.warn('Project ID or month is missing.');
      emailMeasuresError.value = 'Project ID or month is missing.';
      emailMeasuresData.value = null;
      return;
    }
    console.log(`Fetching email measures from ${baseUrl.value}${apiPrefix.value}/email_measure/${projectId}/${month}...`);
    const reqId = ++emailMeasuresReq;
    emailMeasuresLoading.value = true;
    emailMeasuresError.value = null;
    emailMeasuresData.value = null;
    try {
      const response = await ngrokFetch(`${baseUrl.value}${apiPrefix.value}/email_measure/${projectId}/${month}`);
      if (reqId !== emailMeasuresReq) return; // superseded by a newer request
      if (!response.ok) {
        emailMeasuresError.value = `Failed to fetch email measures: ${response.status}`;
        return;
      }
      const data = await response.json();
      if (reqId !== emailMeasuresReq) return;
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
      if (reqId !== emailMeasuresReq) return;
      console.error('Error fetching Email Measures data:', error);
      emailMeasuresError.value = 'Failed to load email measures.';
      emailMeasuresData.value = null;
    } finally {
      if (reqId === emailMeasuresReq) emailMeasuresLoading.value = false;
    }
  };

  // -------------------- Fetch Commit Links Data --------------------
  const fetchCommitLinksData = async (projectId, month, developerName) => {
    if (!projectId || monthMissing(month) || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      commitLinksError.value = 'Project ID, month, or developer name missing.';
      commitLinksData.value = null;
      return;
    }
    // Local repos have their own link tables, built by the pipeline from the
    // same CSVs as the networks; same response shape, so the parsing below is
    // shared.
    const commitLinksEndpoint = isLocalMode.value
      ? `${baseUrl.value}/api/local_commit_links/${projectId}/${month}`
      : `${baseUrl.value}${apiPrefix.value}/commit_links/${projectId}/${month}`;
    console.log(`Fetching commit links from ${commitLinksEndpoint} for ${developerName}...`);
    commitLinksLoading.value = true;
    commitLinksError.value = null;
    commitLinksData.value = null;
    try {
      const response = await ngrokFetch(commitLinksEndpoint);
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
    if (!projectId || monthMissing(month) || !developerName) {
      console.warn('Project ID, month, or developer name missing.');
      emailLinksError.value = 'Project ID, month, or developer name missing.';
      emailLinksData.value = null;
      return;
    }
    const emailLinksEndpoint = isLocalMode.value
      ? `${baseUrl.value}/api/local_issue_links/${projectId}/${month}`
      : `${baseUrl.value}${apiPrefix.value}/email_links/${projectId}/${month}`;
    console.log(`Fetching email links from ${emailLinksEndpoint} for ${developerName}...`);
    emailLinksLoading.value = true;
    emailLinksError.value = null;
    emailLinksData.value = null;
    try {
      const response = await ngrokFetch(emailLinksEndpoint);
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
    const reqId = ++techNetReq;
    techNetLoading.value = true;
    techNetError.value = null;
    try {
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/tech_net/${projectId}/${month}`
        : `${baseUrl.value}/api/tech_net/${projectId}/${month}`;
      console.log(`Fetching tech network from: ${endpoint}`);
      const response = await ngrokFetch(endpoint);
      if (reqId !== techNetReq) return; // superseded by a newer request
      if (!response.ok) {
        // Clear the old month's graph: showing it alongside an error would
        // silently present stale data as current.
        techNetData.value = null;
        techNetError.value = `Failed to fetch Tech Network data: ${response.status}`;
        return;
      }
      const data = await response.json();
      if (reqId !== techNetReq) return;
      techNetData.value = data.data;
      console.log('Fetched Tech Network Data:', data);
    } catch (err) {
      if (reqId !== techNetReq) return;
      console.error('Error fetching TechNet data:', err);
      techNetData.value = null;
      techNetError.value = 'Failed to load Tech Network data.';
    } finally {
      if (reqId === techNetReq) techNetLoading.value = false;
    }
  };

  const clearTechNetData = () => {
    techNetData.value = null;
    techNetError.value = null;
  };

  // -------------------- Fetch Social Network Data --------------------
  const fetchSocialNetData = async (projectId, month) => {
    const reqId = ++socialNetReq;
    socialNetLoading.value = true;
    socialNetError.value = null;
    try {
      const endpoint = selectedFoundation.value === 'Eclipse'
        ? `${baseUrl.value}/eclipse/social_net/${projectId}/${month}`
        : `${baseUrl.value}/api/social_net/${projectId}/${month}`;
      console.log(`Fetching social network from: ${endpoint}`);
      const response = await ngrokFetch(endpoint);
      if (reqId !== socialNetReq) return; // superseded by a newer request
      if (!response.ok) {
        // Clear the old month's graph: showing it alongside an error would
        // silently present stale data as current.
        socialNetData.value = null;
        socialNetError.value = `Failed to fetch Social Network data: ${response.status}`;
        return;
      }
      const data = await response.json();
      if (reqId !== socialNetReq) return;
      socialNetData.value = data.data;
      console.log('Fetched Social Network Data:', data);
    } catch (err) {
      if (reqId !== socialNetReq) return;
      console.error('Error fetching SocialNet data:', err);
      socialNetData.value = null;
      socialNetError.value = 'Failed to load Social Network data.';
    } finally {
      if (reqId === socialNetReq) socialNetLoading.value = false;
    }
  };

  const clearSocialNetData = () => {
    socialNetData.value = null;
    socialNetError.value = null;
  };


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
    currentTechRows,
    currentSocialRows,
    monthCommitCount,
    monthCommitterCount,
    monthIssueCount,
    monthSenderCount,
    fetchMonthLinkStats,
    // Actions
    fetchAllProjectData,
    fetchEclipseProjects,
    setCurrentProjectDetails,
    resetProjectDetails,
    resetLocalProjectDetails,
    resetQueueState,
    fetchMonthlyRanges,
    // API Prefix
    apiPrefix,
    // Upload Git Repository Link
    uploadGitRepositoryLink,
    // Request Queue State & Actions
    queueJobId,
    queueStatus,
    queuePosition,
    queueEtaSeconds,
    queueLength,
    queueProcessing,
    queueError,
    cancelQueuedJob,
    // React Data
    reactData,
    // [Testing] Technical Network local mode stats
    reducedCommits,
    setReducedCommits,
    reducedEmails,
    setReducedEmails,
  };
});
