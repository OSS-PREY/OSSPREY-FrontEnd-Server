<!-- src/components/TechNet.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: 100%;">
    <VCardTitle class="text-h6 text-primary">
      Technical Network
    </VCardTitle>
    <VCardText style="height: calc(100% - 64px); position: relative;">
      <!-- Sankey Diagram -->
      <div ref="sankeyDiv" style="width: 100%; height: 100%;"></div>
      
      <!-- Loading Indicator -->
      <div v-if="projectStore.techNetLoading" class="overlay">
        Loading Sankey diagram...
      </div>
      
      <!-- Error Message -->
      <div v-if="projectStore.techNetError" class="error-message overlay">
        {{ projectStore.techNetError }}
      </div>
      
      <!-- No Data Message -->
      <div v-if="!projectStore.techNetLoading && !projectStore.techNetError && (!projectStore.techNetData || projectStore.techNetData.length === 0) && projectStore.selectedProject && projectStore.selectedMonth" class="overlay">
        No technical network data available for the selected month.
      </div>
      
      <!-- Prompt to Select a Project -->
      <div v-if="!projectStore.selectedProject" class="overlay">
        Please select a project to view its technical network.
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { useProjectStore } from '@/stores/projectStore';

const projectStore = useProjectStore();
const sankeyDiv = ref(null);

/**
 * Clears the existing Sankey diagram.
 */
const clearSankeyDiagram = () => {
  if (sankeyDiv.value) {
    Plotly.purge(sankeyDiv.value);
  }
};

/**
 * Prepares and renders the Sankey diagram using Plotly.
 */
const preparePlotData = () => {
  if (!projectStore.techNetData) return;

  // Extract the project name and selected month
  const projectName = projectStore.selectedProject.project_name;
  const selectedMonth = projectStore.selectedMonth;

  // Extract the data for the selected month
  const monthData = projectStore.techNetData;

  if (!monthData || monthData.length === 0) {
    projectStore.techNetError = 'No technical network data available for the selected month.';
    clearSankeyDiagram();
    return;
  }

  // Extract unique contributors and technologies
  const contributors = [...new Set(monthData.map(item => item[0]))];
  const technologies = [...new Set(monthData.map(item => item[1]))];

  // Create nodes: contributors first, then technologies
  const nodes = [...contributors, ...technologies].map(name => ({ name }));

  // Create a mapping from node names to indices
  const nodeMap = {};
  nodes.forEach((node, index) => {
    nodeMap[node.name] = index;
  });

  // Create links
  const links = monthData.map(item => ({
    source: nodeMap[item[0]],
    target: nodeMap[item[1]],
    value: item[2],
  }));

  // Define colors (optional customization)
  const nodeColors = contributors.map(() => '#1E88E5'); // Blue for contributors
  const techColors = technologies.map(() => '#E53935'); // Red for technologies
  const allColors = [...nodeColors, ...techColors];

  // Prepare the Sankey diagram data structure
  const sankeyData = {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 15,
      thickness: 20,
      line: {
        color: 'black',
        width: 0.5,
      },
      label: nodes.map(node => node.name),
      color: allColors, // Assign colors if available
    },
    link: {
      source: links.map(link => link.source),
      target: links.map(link => link.target),
      value: links.map(link => link.value),
      color: links.map(() => 'rgba(30, 136, 229, 0.4)'), // Light blue for links
    },
  };

  const layout = {
    title: `${projectName} - Month ${selectedMonth}`,
    font: {
      size: 12,
      color: '#424242',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    height: 600,
    width: 800,
    responsive: true,
  };

  if (sankeyDiv.value) {
    Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
  }
};

/**
 * Fetches and renders the Sankey diagram whenever the selected project or month changes.
 */
const fetchAndRenderSankey = () => {
  const projectId = projectStore.selectedProject?.project_id;
  const month = projectStore.selectedMonth;

  console.log(`Attempting to fetch TechNet data for project_id: ${projectId}, month: ${month}`);

  if (projectId && month !== null && month !== undefined && !isNaN(month)) {
    projectStore.fetchTechNetData(projectId, month);
  } else {
    // Clear the Sankey diagram if selection is incomplete
    clearSankeyDiagram();
  }
};

// Watch for changes in the technical network data and render the Sankey diagram
watch(
  () => projectStore.techNetData,
  (newData) => {
    if (newData) {
      preparePlotData();
    } else {
      clearSankeyDiagram();
    }
  }
);

// Watch for changes in selected project and month to fetch new data
watch(
  () => [projectStore.selectedProject, projectStore.selectedMonth],
  ([newProject, newMonth]) => {
    if (newProject && newMonth !== null && newMonth !== undefined && !isNaN(newMonth)) {
      fetchAndRenderSankey();
    } else {
      clearSankeyDiagram();
    }
  },
  { immediate: true }
);

// Handle window resize to make Plotly responsive
onMounted(() => {
  window.addEventListener('resize', handleResize);
  // Initial fetch if needed
  fetchAndRenderSankey();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

/**
 * Handles window resize events to make Plotly diagrams responsive.
 */
const handleResize = () => {
  if (sankeyDiv.value) {
    Plotly.Plots.resize(sankeyDiv.value);
  }
};
</script>

<style scoped>
.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: #424242;
}

.error-message {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
