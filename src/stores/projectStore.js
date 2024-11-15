import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore('projectStore', () => {
  const selectedProject = ref('');
  const project_name = ref('');
  const startDate = ref('');
  const endDate = ref('');
  const status = ref('');
  const description = ref('');
  const sponsor = ref('');
  const champion = ref('');
  const mentors = ref([]);
  const showRangeSlider = ref(false);
  const rangeValue = ref([0, 100]);
  const singleValue = ref(0);

  return {
    selectedProject,
    project_name,
    startDate,
    endDate,
    status,
    description,
    sponsor,
    champion,
    mentors,
    showRangeSlider,
    rangeValue,
    singleValue,
  };
});