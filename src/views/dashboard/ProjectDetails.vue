<template>
  <VCard class="text-center text-sm-start project-details-card">
    <VRow no-gutters class="h-100">
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project Details
          </VCardTitle>
        </VCardItem>

        <VCardText class="h-100">
          <!-- If no project is selected -->
          <div v-if="!projectStore.selectedProject">
            <em>Please select a project to see its details.</em>
          </div>

          <!-- Display project details -->
          <div v-else>
            <!-- Apache Fields -->
            <div v-if="isApacheProject">
              <VRow class="mb-3">
                <VCol cols="12" class="d-flex align-items-center">
                  <strong>About:</strong>&nbsp;
                  {{ projectStore.selectedProject.description || 'No description available.' }}
                </VCol>
              </VRow>

              <VRow class="mb-3">
                <VCol cols="12" class="d-flex align-items-center">
                  <strong>Status:</strong>&nbsp;
                  <span :class="statusClass" class="status-badge">
                    {{ projectStore.selectedProject.status }}
                  </span>
                </VCol>
              </VRow>

              <VRow class="mb-3" gap="3">
                <VCol cols="6">
                  <div>
                    <strong>Start date:</strong>&nbsp;
                    {{ projectStore.selectedProject.start_date || 'N/A' }}
                  </div>
                </VCol>
                <VCol cols="6">
                  <div>
                    <strong>End date:</strong>&nbsp;
                    {{ projectStore.selectedProject.end_date || 'N/A' }}
                  </div>
                </VCol>
              </VRow>

              <VRow class="mb-3">
                <VCol cols="12" class="d-flex align-items-center">
                  <strong>Sponsor:</strong>&nbsp; {{ projectStore.selectedProject.sponsor || 'N/A' }}
                </VCol>
              </VRow>

              <VRow class="mb-3">
                <VCol cols="12" class="d-flex align-items-center">
                  <strong>Category:</strong>&nbsp; {{ projectCategory }}
                </VCol>
              </VRow>
            </div>

            <!-- Eclipse Fields -->
            <div v-if="isEclipseProject">
              <VRow class="mb-3">
                <VCol cols="12" class="d-flex align-items-center">
                  <strong>Status:</strong>&nbsp;
                  <span :class="statusClass" class="status-badge">
                    {{ projectStore.selectedProject.status }}
                  </span>
                </VCol>
              </VRow>

              <div v-if="projectStore.selectedProject.releases && projectStore.selectedProject.releases.length">
                <VRow class="mb-3">
                  <VCol cols="12">
                    <strong>Releases/Reviews:</strong>
                  </VCol>
                </VRow>
                <div class="table-container">
                  <table class="table table-bordered">
                    <thead>
                      <tr class="table-primary">
                        <th>Release/Review</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(release, index) in projectStore.selectedProject.releases"
                        :key="index"
                      >
                        <td class="actionable-cell">
                          <a :href="release.url" target="_blank" rel="noopener noreferrer">
                            {{ release.name }}
                          </a>
                        </td>
                        <td>{{ formatDate(release.date) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup>
import { computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';

const projectStore = useProjectStore();

const isApacheProject = computed(() => projectStore.selectedFoundation === 'Apache');
const isEclipseProject = computed(() => projectStore.selectedFoundation === 'Eclipse');

const statusClass = computed(() => {
  if (!projectStore.selectedProject || !projectStore.selectedProject.status) return 'status-default';

  const status = projectStore.selectedProject.status.toLowerCase();
  switch (status) {
    case 'retired':
      return 'status-retired';
    case 'graduated':
      return 'status-graduated';
    case 'current':
      return 'status-current';
    default:
      return 'status-default';
  }
});

const projectCategory = computed(() => {
  if (isEclipseProject.value) {
    return projectStore.selectedProject.tech || 'N/A';
  } else {
    return 'Apache Project';
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateObj = new Date(dateStr);
  return isNaN(dateObj) ? 'Invalid Date' : dateObj.toLocaleDateString(undefined, options);
};
</script>


<style scoped lang="scss">
.project-details-card {
  height: 400px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
  text-transform: capitalize;
}

/* Status-specific styles */
.status-retired {
  background-color: #e0f7fa; /* Light Blue */
  color: #006064;
}

.status-graduated {
  background-color: #e8f5e9; /* Light Green */
  color: #1b5e20;
}

.status-current {
  background-color: #fffde7; /* Yellow */
  color: #f9a825;
}

.status-default {
  background-color: #f5f5f5; /* Grey */
  color: #616161;
}

.mb-3 {
  margin-bottom: 16px;
}

a {
  color: #1e88e5;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Table styling similar to your other component */
.table-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: auto; /* Enable horizontal scrolling for wide tables */
  display: block;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Ensures consistent column widths */
}

.table-bordered {
  border: 1px solid #dee2e6;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  word-wrap: break-word;
  white-space: normal;
}

.table-primary {
  background-color: #696cff;
  color: #fff;
}

.center {
  text-align: center;
}

.priority {
  display: flex;
  align-items: center;
}

.priority-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.priority-indicator.critical {
  background-color: maroon;
}

.priority-indicator.high {
  background-color: red;
}

.priority-indicator.medium {
  background-color: yellow;
}

.priority-indicator.low {
  background-color: green;
}

/* Legend styling */
.priority-legend {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

/* Adjusting cell widths */
.feature-name-header,
.feature-name-cell {
  width: 25%; /* Adjust as needed */
}

.actionable-header,
.actionable-cell {
  width: 75%; /* Adjust as needed */
}
</style>
