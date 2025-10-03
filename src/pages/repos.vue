<script setup>
import NavbarActions from '@/layouts/components/NavbarActions.vue';
import NavbarBranding from '@/layouts/components/NavbarBranding.vue';
import ReposTable from '@/views/repos/ReposTable.vue';

const pendingRepos = [
  {
    repoName: 'ossprey/metrics-pipeline',
    startTime: '2025-10-02 10:12',
    completionTime: null,
    estimatedProcessingTime: '17 minutes 45 seconds',
    status: 'pending',
  },
  {
    repoName: 'apache/incubator-ex',
    startTime: '2025-10-02 09:55',
    completionTime: null,
    estimatedProcessingTime: '22 minutes 5 seconds',
    status: 'pending',
  },
  {
    repoName: 'eclipse/foundation-tools',
    startTime: '2025-10-01 21:18',
    completionTime: null,
    estimatedProcessingTime: '31 minutes 12 seconds',
    status: 'pending',
  },
];

const processedRepos = [
  {
    repoName: 'nafiz/elta-ai-agentic',
    startTime: '2025-09-30 14:03',
    completionTime: '2025-09-30 14:29',
    status: 'processed',
  },
  {
    repoName: 'uc-davis/decal-lab-site',
    startTime: '2025-09-29 11:47',
    completionTime: '2025-09-29 12:02',
    status: 'processed',
  },
  {
    repoName: 'ossprey/frontend',
    startTime: '2025-09-28 16:20',
    completionTime: '2025-09-28 16:41',
    status: 'processed',
  },
];
</script>

<template>
  <VContainer fluid class="py-6 repos-page">
    <header class="repos-topbar" role="banner">
      <NavbarBranding />
      <NavbarActions />
    </header>

    <div class="repos-heading mt-8">
      <h1 class="text-h4 font-weight-bold mb-0">All Repos</h1>
      <p class="repos-heading__note">This page is currently under development.</p>
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

.repos-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
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
