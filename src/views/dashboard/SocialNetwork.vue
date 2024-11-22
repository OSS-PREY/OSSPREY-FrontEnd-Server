<!-- src/components/SocialNet.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: 100%;">
    <VCardTitle class="text-h6 text-primary">
      Social Network
    </VCardTitle>
    <VCardText style="height: calc(100% - 64px); position: relative;">
      <!-- Sankey Diagram -->
      <div class="sankey-container" ref="sankeyDiv" ><div id="sankey"></div></div>

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
  console.log('Starting preparePlotData...');

  // Step 1: Check if SocialNet data is available
  if (!projectStore.socialNetData || projectStore.socialNetData.length === 0) {
    console.warn('No social network data found to render.');
    clearSankeyDiagram();
    return;
  }

  // Step 2: Extract project details
  const projectName = projectStore.selectedProject.project_id;
  console.log(`Project Name: ${projectName}`);
  console.log('SocialNet Data:', projectStore.socialNetData);

  // Step 3: Extract data for the selected month
  const monthData = projectStore.socialNetData; // Directly use fetched data
  console.log('Month Data:', monthData);

  // Step 4: Validate data format
  if (!monthData.every(item => Array.isArray(item) && item.length === 3)) {
    console.error('SocialNet data format is invalid:', monthData);
    clearSankeyDiagram();
    return;
  }

  // Step 5: Create separate nodes for sources and targets (allow duplicates)
  const nodes = [];
  const links = [];
  monthData.forEach(([source, target, value]) => {
    const sourceIndex = nodes.push({ name: source, side: 'source' }) - 1; // Add source node
    const targetIndex = nodes.push({ name: target, side: 'target' }) - 1; // Add target node

    links.push({
      source: sourceIndex,
      target: targetIndex,
      value: parseInt(value, 10) || 0,
    });
  });

  console.log('Nodes before grouping:', nodes);
  console.log('Links before grouping:', links);

  // Step 6: Group duplicate nodes
  const nodeMap = {}; // Map to hold unique nodes and their new indices
  const updatedNodes = []; // List of new grouped nodes
  const updatedLinks = []; // Updated links to match grouped nodes

  // Group nodes and maintain a mapping for sources and targets
  nodes.forEach((node, index) => {
    const key = `${node.side}|${node.name}`;
    if (!nodeMap[key]) {
      nodeMap[key] = updatedNodes.push({ name: node.name, side: node.side }) - 1;
    }
  });

  // Update links to use grouped node indices
  links.forEach(link => {
    const newSource = nodeMap[`source|${nodes[link.source].name}`];
    const newTarget = nodeMap[`target|${nodes[link.target].name}`];
    const existingLink = updatedLinks.find(
      l => l.source === newSource && l.target === newTarget
    );
    if (existingLink) {
      existingLink.value += link.value; // Aggregate values for merged links
    } else {
      updatedLinks.push({
        source: newSource,
        target: newTarget,
        value: link.value,
      });
    }
  });

  console.log('Nodes after grouping:', updatedNodes);
  console.log('Links after grouping:', updatedLinks);

  // Step 7: Define colors
  const nodeColors = updatedNodes.map(node =>
    node.side === 'source' ? '#1E90FF' : '#FF4500'
  ); // Blue for sources, Orange for targets
  console.log('Node Colors:', nodeColors);

  // Step 8: Prepare Sankey data
  const sankeyData = {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 20,
      thickness: 20,
      line: {
        color: 'black',
        width: 0.5,
      },
      label: updatedNodes.map(node => node.name),
      color: nodeColors,
    },
    link: {
      source: updatedLinks.map(link => link.source),
      target: updatedLinks.map(link => link.target),
      value: updatedLinks.map(link => link.value),
      color: updatedLinks.map(() => 'rgba(30, 136, 229, 0.4)'), // Light blue for links
    },
  };

  const containerWidth = document.querySelector('.sankey-container').offsetWidth;
  const containerHeight = containerWidth; // Maintain a 16:9 aspect ratio


  const layout = {
    font: {
      size: 12,
      color: '#424242',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    height: containerWidth,
    width: containerHeight,
    margin: { t: 20, l: 20, r: 20, b: 20 },
  };

  // Step 9: Render the Sankey diagram
  if (sankeyDiv.value) {
    try {
      console.log('Rendering Sankey diagram...');
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('SocialNet Sankey diagram rendered successfully.');
    } catch (err) {
      console.error('Error rendering Social Sankey diagram:', err);
    }
  }

  console.log('Finished preparePlotData.');
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
    console.log("Watcher triggered", { newProject, newMonth });
    if (newProject && newMonth !== null && newMonth !== undefined && !isNaN(newMonth)) {
      console.log("Fetching and rendering Sankey");
      fetchAndRenderSankey();
    } else {
      console.log("Clearing Sankey diagram");
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
  position: relative;
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

.sankey-container {
  width: 100%; /* Make it responsive */
  max-width: 800px; /* Restrict the maximum width */
  height: auto;
  overflow: hidden; /* Prevent overflowing content */
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto; /* Center the diagram in the parent */
}
</style>
