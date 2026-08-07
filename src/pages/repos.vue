<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import ReposTable from '@/views/repos/ReposTable.vue';
import { getApiBaseUrl } from '@/utils/apiBase';
import { apiFetch } from '@/utils/apiFetch';

const API_BASE = getApiBaseUrl();
const REFRESH_INTERVAL_MS = 15000;

const pendingRepos = ref([]);
const processedRepos = ref([]);
const loadError = ref('');

let refreshTimer = null;

const formatDateTime = iso => {
  if (!iso)
    return '—';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime()))
    return '—';

  const pad = value => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDuration = totalSeconds => {
  if (totalSeconds === null || totalSeconds === undefined)
    return '—';

  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0)
    return `${remainder} seconds`;

  return `${minutes} minutes ${remainder} seconds`;
};

const loadRepos = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/api/repo_jobs`);

    if (!res.ok)
      throw new Error(`Status request failed (${res.status})`);

    const data = await res.json();

    pendingRepos.value = (data.pending || []).map(job => ({
      repoName: job.repo_name,
      gitLink: job.git_link,
      startTime: formatDateTime(job.created_at),
      completionTime: null,
      estimatedProcessingTime: formatDuration(job.estimated_seconds),
      status: job.status,
    }));

    processedRepos.value = (data.processed || []).map(job => ({
      repoName: job.repo_name,
      gitLink: job.git_link,
      startTime: formatDateTime(job.created_at),
      completionTime: job.status === 'completed'
        ? formatDateTime(job.finished_at)
        : `${formatDateTime(job.finished_at)} (${job.status})`,
      status: job.status,
    }));

    loadError.value = '';
  } catch (err) {
    loadError.value = err.message || 'Failed to load repositories.';
  }
};

onMounted(() => {
  loadRepos();
  refreshTimer = setInterval(loadRepos, REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
  if (refreshTimer)
    clearInterval(refreshTimer);
});
</script>

<template>
  <VContainer fluid class="py-6 repos-page">

    <div class="repos-heading mt-8">
      <h1 class="text-h4 font-weight-bold mb-0">All Repos</h1>
      <p v-if="loadError" class="repos-heading__note">{{ loadError }}</p>
    </div>

    <ReposTable
      title="Pending Repos"
      :rows="pendingRepos"
      time-column-label="Estimated Processing Time"
      time-field="estimatedProcessingTime"
      class="mt-8"
    />
    <ReposTable
      title="Processed Repos"
      :rows="processedRepos"
      class="mt-8"
    />
  </VContainer>
</template>

<style scoped>
.repos-page {
  max-width: 1280px;
  margin: 0 auto;
}

.repos-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.repos-heading__note {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-error));
  margin: 0;
}
</style>
