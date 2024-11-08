// src/stores/projectStore.js

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  const selectedProject = ref('');
  const startDate = ref('');
  const endDate = ref('');
  const status = ref('');
  const description = ref('');
  const showRangeSlider = ref(false);
  const rangeValue = ref([0, 100]);
  const singleValue = ref(50);

  return {
    selectedProject,
    startDate,
    endDate,
    status,
    description,
    showRangeSlider,
    rangeValue,
    singleValue,
  };
});
