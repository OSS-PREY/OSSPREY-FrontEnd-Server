<!-- src/components/ProjectDetails.vue -->

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
            <!-- About (Description) -->
            <VRow class="mb-3">
              <VCol cols="12" class="d-flex align-items-center">
                <strong>About:</strong>&nbsp; {{ projectStore.selectedProject.description }}
              </VCol>
            </VRow>

            <!-- Status with Conditional Styling -->
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
                  {{ projectStore.selectedProject.start_date }}
                </div>
              </VCol>
              <VCol cols="6">
                <div>
                  <strong>End date:</strong>&nbsp;
                  {{ projectStore.selectedProject.end_date }}
                </div>
              </VCol>
            </VRow>


            <!-- Sponsor -->
            <VRow class="mb-3">
              <VCol cols="12" class="d-flex align-items-center">
                <strong>Sponsor:</strong>&nbsp; {{ projectStore.selectedProject.sponsor }}
              </VCol>
            </VRow>
            <VRow class="mb-3">
              <VCol cols="12" class="d-flex align-items-center">
                <strong>Category:</strong>&nbsp; Apache Project
              </VCol>
            </VRow>
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

// Compute the class for the status badge based on the status value
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
</style>
