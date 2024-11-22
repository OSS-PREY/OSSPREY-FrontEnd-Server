<!-- src/components/TechNet.vue -->

<template>
  <VCard class="text-center text-sm-start" style="height: 100%;">
    <VCardTitle class="text-h6 text-primary">
      Technical Network
    </VCardTitle>
    <VCardText style="height: calc(100% - 64px); position: relative;">
      <!-- Sankey Diagram -->
      <div class="sankey-container" ref="sankeyDiv" ><div id="sankey"></div></div>
      
      <!-- Loading Indicator -->
      <div v-if="projectStore.techNetLoading" class="overlay">
        Loading Sankey diagram...
      </div>
      
      <!-- No Data Message -->
      <div
        v-if="!projectStore.techNetLoading && !projectStore.techNetError && (!projectStore.techNetData || projectStore.techNetData.length === 0) && projectStore.selectedProject && projectStore.selectedMonth"
        class="overlay"
      >
        No technical network data available for the selected month.
      </div>
      
      <!-- Error Message -->
      <div
        v-if="!projectStore.techNetLoading && projectStore.techNetError"
        class="overlay error-message"
      >
        {{ projectStore.techNetError }}
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
    console.log('TechNet Sankey diagram cleared.');
  }
};

/**
 * Prepares and renders the Sankey diagram using Plotly.
 */
const preparePlotData = () => {
  if (!projectStore.techNetData) return;

  // Extract the project name and selected month
  const projectName = projectStore.selectedProject.project_id;
  const selectedMonth = projectStore.selectedMonth;

  const monthData = projectStore.techNetData;

  // Validate data format
  if (!Array.isArray(monthData) || !monthData.every(item => Array.isArray(item) && item.length === 3)) {
    console.error('TechNet data format is invalid:', monthData);
    clearSankeyDiagram();
    return;
  }


  if (!monthData || monthData.length === 0) {
    // No data available; clear the diagram
    clearSankeyDiagram();
    console.warn('No TechNet data available to render.');
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
    value: parseInt(item[2], 10),
  }));

  console.log('Contributors:', contributors);
  console.log('Technologies:', technologies);
  console.log('Nodes:', nodes);
  console.log('Links:', links);

  if (!links.every(link => Number.isInteger(link.source) && Number.isInteger(link.target) && link.value > 0)) {
  console.error('Invalid link data:', links);
  clearSankeyDiagram();
  return;
}



  // Define colors (optional customization)
  const nodeColors = [...contributors.map(() => '#1E88E5'), ...technologies.map(() => '#E53935')]; // Blue for contributors, Red for technologies

  // Prepare the Sankey diagram data structure
  const sankeyData = {
  type: 'sankey',
  orientation: 'h',
  node: {
    pad: 10, // Reduce padding between nodes
    thickness: 15, // Reduce node thickness
    line: {
      color: '#333', // Darker border for nodes
      width: 1,
    },
    label: nodes.map(node => node.name),
    color: [...contributors.map(() => '#1E88E5'), ...technologies.map(() => '#E53935')], // Customize node colors
    hoverinfo: 'label+value+percent entry', // More detailed hover info
  },
  link: {
    source: links.map(link => link.source),
    target: links.map(link => link.target),
    value: links.map(link => link.value),
    color: links.map(() => 'rgba(0, 150, 136, 0.5)'), // Use a unique link color (greenish tint)
    hoverinfo: 'source+target+value', // Show source, target, and value on hover
  },
};


const containerWidth = document.querySelector('.sankey-container').offsetWidth;
const containerHeight = containerWidth * 0.4; // Maintain a 16:9 aspect ratio

const layout = {
  font: {
    size: 12,
    color: '#424242',
  },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  width: containerWidth,
  height: containerHeight,
  margin: { t: 20, l: 20, r: 20, b: 20 },
};




  if (sankeyDiv.value) {
    try {
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('TechNet Sankey diagram rendered.');
    } catch (err) {
      console.error('Error rendering Sankey diagram:', err);
    }
  }

};

/**
 * Handles window resize events to make Plotly diagrams responsive.
 */
const handleResize = () => {
  if (sankeyDiv.value) {
    Plotly.Plots.resize(sankeyDiv.value);
    console.log('TechNet Sankey diagram resized.');
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
    clearSankeyDiagram();
  }
};

// Watch for changes in the technical network data and render the Sankey diagram
watch(
  () => projectStore.techNetData,
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
