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
  const selectedProjectGithubName = ref(''); // Add this line
  const github_url = ref(''); // Add this line

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
    selectedProjectGithubName, // Add this line
    github_url, // Add this line
  };
});
