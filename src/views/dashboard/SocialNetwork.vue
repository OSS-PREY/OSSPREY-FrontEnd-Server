<!-- src/components/SocialNet.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: 100%;">
    <VCardTitle class="text-h6 text-primary">
      Social Network
    </VCardTitle>
    <VCardText style="height: calc(100% - 64px); position: relative;">
      <!-- Sankey Diagram -->
      <div ref="sankeyDiv" style="width: 100%; height: 100%;"></div>

      <!-- Loading Indicator -->
      <div v-if="projectStore.socialNetLoading" class="overlay">
        Loading Sankey diagram...
      </div>

      <!-- No Data Message -->
      <div
        v-if="!projectStore.socialNetLoading && !projectStore.socialNetError && (!projectStore.socialNetData || projectStore.socialNetData.length === 0) && projectStore.selectedProject && projectStore.selectedMonth"
        class="overlay"
      >
        No social network data available for the selected month.
      </div>

      <!-- Error Message -->
      <div
        v-if="!projectStore.socialNetLoading && projectStore.socialNetError"
        class="overlay error-message"
      >
        {{ projectStore.socialNetError }}
      </div>

      <!-- Prompt to Select a Project -->
      <div v-if="!projectStore.selectedProject" class="overlay">
        Please select a project to view its social network.
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
    console.log('SocialNet Sankey diagram cleared.');
  }
};

/**
 * Prepares and renders the Sankey diagram using Plotly.
 */
const preparePlotData = () => {
  if (!projectStore.socialNetData) return;

  // Extract the project name and selected month
  const projectName = projectStore.selectedProject.project_id;
  const selectedMonth = projectStore.selectedMonth;

  // Extract the data for the selected month
  const monthData = projectStore.socialNetData;

  if (!monthData || monthData.length === 0) {
    // No data available; clear the diagram
    clearSankeyDiagram();
    console.warn('No SocialNet data available to render.');
    return;
  }

  // Extract unique contributors
  const contributors = [...new Set(monthData.flatMap(item => [item[0], item[1]]))];

  // Create nodes
  const nodes = contributors.map(name => ({ name }));

  // Create a mapping from node names to indices
  const nodeMap = {};
  nodes.forEach((node, index) => {
    nodeMap[node.name] = index;
  });

  // Create links
  const links = monthData.map(item => ({
    source: nodeMap[item[0]],
    target: nodeMap[item[1]],
    value: parseInt(item[2], 10),
  }));

  // Define colors (optional customization)
  const nodeColors = contributors.map(() => '#FF5733'); // Orange for contributors

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
      color: nodeColors, // Assign colors if available
    },
    link: {
      source: links.map(link => link.source),
      target: links.map(link => link.target),
      value: links.map(link => link.value),
      color: links.map(() => 'rgba(255, 87, 51, 0.4)'), // Light orange for links
    },
  };

  const layout = {
    title: `${projectName} - Social Network - Month ${selectedMonth}`,
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
    console.log('SocialNet Sankey diagram rendered.');
  }
};

/**
 * Handles window resize events to make Plotly diagrams responsive.
 */
const handleResize = () => {
  if (sankeyDiv.value) {
    Plotly.Plots.resize(sankeyDiv.value);
    console.log('SocialNet Sankey diagram resized.');
  }
};

/**
 * Fetches and renders the Sankey diagram whenever the selected project or month changes.
 */
const fetchAndRenderSankey = () => {
  const projectId = projectStore.selectedProject?.project_id;
  const month = projectStore.selectedMonth;

  console.log(`Attempting to fetch SocialNet data for project_id: ${projectId}, month: ${month}`);

  if (projectId && month !== null && month !== undefined && !isNaN(month)) {
    projectStore.fetchSocialNetData(projectId, month);
  } else {
    clearSankeyDiagram();
  }
};

// Watch for changes in the social network data and render the Sankey diagram
watch(
  () => projectStore.socialNetData,
  (newData) => {
    if (newData && newData.length > 0) {
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
  fetchAndRenderSankey();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
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
