<script setup>
import { useTheme } from 'vuetify';

const { global } = useTheme();

// Define reactive values for the sliders, checkbox, dropdown, and dates
const rangeValue = ref([10, 90]); // Range slider value
const singleValue = ref(50); // Single value slider
const showRangeSlider = ref(false); // Checkbox state
const selectedProject = ref(''); // Dropdown selection

// Sample projects for the dropdown
const projects = ['Abdera', 'CommonsRDF'];

// Date values (dummy values to start)
const startDate = ref('');
const endDate = ref('');

// Watch the selected project and update dates based on the selection
watch(selectedProject, (newProject) => {
  if (newProject === 'Abdera') {
    startDate.value = '2006-06-06';
    endDate.value = '2008-11-08';
  } else if (newProject === 'CommonsRDF') {
    startDate.value = '2015-03-06';
    endDate.value = '2016-11-28';
  }
});
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 450px;">
    <VRow no-gutters>
      <VCol
        cols="12"
        sm="12"
      >
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project selector
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <!-- Dropdown for selecting a project -->
          <VSelect
            v-model="selectedProject"
            :items="projects"
            label="Project"
            class="mb-4"
            outlined
            dense
          />

          <!-- Checkbox to toggle between single value and range slider -->
          <VCheckbox
            v-model="showRangeSlider"
            label="Enable Range Slider"
            class="mb-4"
          />

          <!-- Conditional rendering based on checkbox state -->
          <VSlider
            v-if="showRangeSlider"
            v-model="rangeValue"
            range
            :min="0"
            :max="100"
            class="mt-4"
            style="width: calc(100% - 10px); margin-right: 10px;"
            label="Select Range"
            ticks="always"
          />

          <VSlider
            v-else
            v-model="singleValue"
            :min="0"
            :max="100"
            class="mt-4"
            style="width: calc(100% - 10px); margin-right: 10px;"
            label="Select Month"
            ticks="always"
          />

          <!-- Static fields for Start Date and End Date, side by side -->
          <div class="mt-4 d-flex align-center" style="margin-left: 16px;">
            <div class="d-flex align-center" style="width: 50%;">
              <strong>Start Date: </strong>&nbsp;{{ startDate }}
            </div>
            <div class="d-flex align-center justify-center" style="width: 50%;">
              <strong>End Date: </strong>&nbsp;{{ endDate }}
            </div>
          </div>

          <VBtn
            variant="tonal"
            class="mt-6"
            size="small"
          >
            Open Parallel window
          </VBtn>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>
