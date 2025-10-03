<script setup>
import NavbarActions from '@/layouts/components/NavbarActions.vue';
import ReposTable from '@/views/repos/ReposTable.vue';

const pendingRepos = [
  {
    repoName: 'ossprey/metrics-pipeline',
    startTime: '2025-10-02 10:12',
    completionTime: null,
    status: 'pending',
  },
  {
    repoName: 'apache/incubator-ex',
    startTime: '2025-10-02 09:55',
    completionTime: null,
    status: 'pending',
  },
  {
    repoName: 'eclipse/foundation-tools',
    startTime: '2025-10-01 21:18',
    completionTime: null,
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
    <div class="repos-header">
      <h1 class="text-h4 font-weight-bold mb-0">All Repos</h1>
      <NavbarActions />
    </div>

    <ReposTable title="Pending Repos" :rows="pendingRepos" class="mt-8" />
    <ReposTable title="Processed Repos" :rows="processedRepos" class="mt-8" />
  </VContainer>
</template>

<style scoped>
.repos-page {
  max-width: 1200px;
}

.repos-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.repos-header h1 {
  flex: 1 1 auto;
}
</style>
