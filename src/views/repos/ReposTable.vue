<script setup>
import { computed } from 'vue';

/**
 * @typedef {Object} RepoRow
 * @property {string} repoName
 * @property {string} startTime
 * @property {string|null} [completionTime]
 * @property {'pending' | 'processed'} status
 */

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
});

const normaliseDateString = value => {
  if (!value)
    return Number.NEGATIVE_INFINITY;

  const normalised = value.replace(' ', 'T');
  const timestamp = Date.parse(normalised);

  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const sortedRows = computed(() => {
  return [...props.rows].sort((a, b) => normaliseDateString(b.startTime) - normaliseDateString(a.startTime));
});
</script>

<template>
  <section class="repos-section">
    <h2 class="text-h5 font-weight-medium mb-4">{{ title }}</h2>

    <div class="table-wrapper" role="region" :aria-label="`${title} table`">
      <table class="repos-table">
        <thead>
          <tr>
            <th scope="col">Repo Name</th>
            <th scope="col">Task Initiation Time</th>
            <th scope="col">Completion Time</th>
          </tr>
        </thead>
        <tbody v-if="sortedRows.length">
          <tr v-for="row in sortedRows" :key="`${row.repoName}-${row.startTime}`">
            <td>{{ row.repoName }}</td>
            <td>{{ row.startTime }}</td>
            <td>{{ row.completionTime ?? '—' }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="3" class="empty-state">No items to show.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.repos-section + .repos-section {
  margin-top: 2.5rem;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  background-color: rgba(var(--v-theme-surface), 0.9);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.repos-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 480px;
}

.repos-table th,
.repos-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.6);
  word-break: break-word;
}

.repos-table thead th {
  font-weight: 600;
  background-color: rgba(var(--v-theme-surface-variant), 0.6);
}

.repos-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
