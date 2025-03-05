<!-- src/components/EmailLinks.vue -->
<template>
  <VCard class="text-center text-sm-start" style="height: auto;">
    <VRow no-gutters style="height: 100%;">
      <VCol cols="12" sm="12">
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Email Link
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <VRow class="d-flex align-center">
            <VCol cols="auto" class="d-flex align-center">
              <span>Current Node:</span>
            </VCol>
            <VCol cols="auto" class="d-flex align-center">
              <VBtn
                color="primary"
                variant="outlined"
                class="ms-2"
                style="border-radius: 12px;"
                @click="viewEmails"
                :disabled="!emailMeasuresData"
              >
                Node
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>

    <!-- Dialog for Email Links -->
    <VDialog v-model="dialogVisible" max-width="800">
      <VCard>
        <VCardTitle>
          Emails by {{ selectedDeveloper }}
        </VCardTitle>
        <VCardText>
          <div v-if="emailLinksLoading">
            <VProgressCircular indeterminate color="primary" size="50"></VProgressCircular>
            Loading emails...
          </div>
          <div v-else-if="emailLinksError">
            {{ emailLinksError }}
          </div>
          <div v-else-if="emailLinksData && emailLinksData.length">
            <VSimpleTable>
              <thead>
                <tr>
                  <th>Date and Time</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="commit in emailLinksData" :key="commit.link">
                  <td>{{ commit.human_date_time }}</td>
                  <td>
                    <a :href="commit.link" target="_blank">{{ commit.link }}</a>
                  </td>
                </tr>
              </tbody>
            </VSimpleTable>
          </div>
          <div v-else>
            No emails found for {{ selectedDeveloper }}.
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer></VSpacer>
          <VBtn color="primary" text @click="closeDialog">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { useTheme } from 'vuetify';
import {
  VBtn,
  VCard,
  VCardTitle,
  VCardText,
  VCardItem,
  VRow,
  VCol,
  VDialog,
  VCardActions,
  VSpacer,
  VProgressCircular,
} from 'vuetify/components';
import { ref, computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';

const projectStore = useProjectStore();

const emailMeasuresData = computed(() => projectStore.emailMeasuresData);
const emailMeasuresLoading = computed(() => projectStore.emailMeasuresLoading);
const emailMeasuresError = computed(() => projectStore.emailMeasuresError);

const emailLinksData = computed(() => projectStore.emailLinksData);
const emailLinksLoading = computed(() => projectStore.emailLinksLoading);
const emailLinksError = computed(() => projectStore.emailLinksError);
const selectedDeveloper = computed(() => projectStore.setSelectedSocialDeveloper);

const dialogVisible = ref(false);

const viewEmails = () => {
  console.log("something", selectedDeveloper);
  if (selectedDeveloper.value) {
    // When a developer is selected, open the dialog so that the watcher in the store fetches data.
    console.log(selectedDeveloper.value);
    dialogVisible.value = true;
  } else {
    alert('Please select a developer in the Social Network.');
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};
</script>
