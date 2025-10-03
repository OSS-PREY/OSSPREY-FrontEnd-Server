<script setup>
import { computed } from 'vue';

/**
 * @typedef {Object} RepoRow
 * @property {string} repoName
 * @property {string} startTime
 * @property {string|null} [completionTime]
 * @property {string} [estimatedProcessingTime]
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
  timeColumnLabel: {
    type: String,
    default: 'Completion Time',
  },
  timeField: {
    type: String,
    default: 'completionTime',
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

const resolveTimeValue = row => {
  const value = row?.[props.timeField];

  if (value === null || value === undefined || value === '')
    return '—';

  return value;
};
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
            <th scope="col">{{ timeColumnLabel }}</th>
          </tr>
        </thead>
        <tbody v-if="sortedRows.length">
          <tr v-for="row in sortedRows" :key="`${row.repoName}-${row.startTime}`">
            <td>{{ row.repoName }}</td>
            <td>{{ row.startTime }}</td>
            <td>{{ resolveTimeValue(row) }}</td>
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
  border-radius: 16px;
  background-color: rgba(var(--v-theme-surface), 0.95);
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.12);
  padding: 1rem;
}

.repos-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
  font-size: 1.05rem;
}

.repos-table th,
.repos-table td {
  padding: 1.1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.6);
  word-break: break-word;
}

.repos-table thead th {
  font-weight: 600;
  background-color: rgba(var(--v-theme-surface-variant), 0.6);
  font-size: 1.125rem;
}

.repos-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 1.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

@media (max-width: 960px) {
  .repos-table {
    font-size: 0.95rem;
  }

  .repos-table th,
  .repos-table td {
    padding: 0.85rem 1.1rem;
  }
}
</style>
