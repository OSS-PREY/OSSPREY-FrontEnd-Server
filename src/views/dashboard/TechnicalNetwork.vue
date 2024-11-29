<!-- src/components/TechNet.vue -->

<template>
  <VCard class="text-center text-sm-start tech-net-card">
    <VCardTitle class="text-h6 text-primary">
      Technical Network
    </VCardTitle>
    <VCardText class="sankey-wrapper">
      <!-- Sankey Diagram -->
      <div class="sankey-container" ref="sankeyDiv">
        <div id="sankey"></div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="projectStore.techNetLoading" class="overlay">
        <VProgressCircular indeterminate color="primary" size="50"></VProgressCircular>
        <span class="loading-text">Loading Sankey diagram...</span>
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
import { VCard, VCardTitle, VCardText, VProgressCircular } from 'vuetify/components';

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
  console.log('Starting preparePlotData for TechNet...');

  // Step 1: Check if TechNet data is available
  if (!projectStore.techNetData || projectStore.techNetData.length === 0) {
    console.warn('No technical network data found to render.');
    clearSankeyDiagram();
    return;
  }

  // Step 2: Extract project details
  const projectName = projectStore.selectedProject.project_id;
  console.log(`Project Name: ${projectName}`);
  console.log('TechNet Data:', projectStore.techNetData);

  // Step 3: Extract data for the selected month
  const monthData = projectStore.techNetData; // Directly use fetched data
  console.log('Month Data:', monthData);

  // Step 4: Validate data format
  if (!monthData.every(item => Array.isArray(item) && item.length === 3)) {
    console.error('TechNet data format is invalid:', monthData);
    clearSankeyDiagram();
    return;
  }

  // Step 5: Create nodes and links
  const nodeLabels = [];
  const nodeMap = new Map();
  let nodeIndex = 0;

  const links = monthData.map(([source, target, value]) => {
    if (!nodeMap.has(source)) {
      nodeMap.set(source, nodeIndex++);
      nodeLabels.push(source);
    }
    if (!nodeMap.has(target)) {
      nodeMap.set(target, nodeIndex++);
      nodeLabels.push(target);
    }
    return {
      source: nodeMap.get(source),
      target: nodeMap.get(target),
      value: parseInt(value, 10) || 0,
    };
  });

  // Step 6: Define colors
  const sourceNodes = new Set(monthData.map(item => item[0]));
  const nodeColors = nodeLabels.map(label => {
    // Color source nodes (developers) differently
    if (sourceNodes.has(label)) {
      return '#4CAF50'; // Green for sources (developers)
    } else {
      return '#FF9800'; // Orange for others
    }
  });

  // Step 7: Prepare Sankey data
  const sankeyData = {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 20,
      thickness: 20,
      line: {
        color: '#333', // Darker border for nodes
        width: 0.5,
      },
      label: nodeLabels,
      color: nodeColors,
      hovertemplate: '%{label}<extra></extra>',
    },
    link: {
      source: links.map(link => link.source),
      target: links.map(link => link.target),
      value: links.map(link => link.value),
      color: links.map(() => 'rgba(76, 175, 80, 0.4)'), // Light green for links
      hovertemplate: 'Source: %{source.label}<br>Target: %{target.label}<br>Value: %{value}<extra></extra>',
    },
  };

  const containerWidth = document.querySelector('.sankey-container').offsetWidth;
  const containerHeight = containerWidth * 0.6; // Maintain a 3:2 aspect ratio

  const layout = {
    font: {
      size: 12,
      color: '#424242',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    height: containerHeight,
    width: containerWidth,
    margin: { t: 20, l: 20, r: 20, b: 20 },
    autosize: true,
  };

  // Step 8: Render the Sankey diagram
  if (sankeyDiv.value) {
    try {
      console.log('Rendering Sankey diagram...');
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('TechNet Sankey diagram rendered successfully.');

      // Add event listener for node clicks
      sankeyDiv.value.on('plotly_click', function(data) {
        if (data && data.points && data.points.length > 0) {
          const point = data.points[0];
          if (point.fullData.type === 'sankey' && point.curveNumber === 0 && point.pointNumber !== undefined) {
            const nodeIndex = point.pointNumber;
            const nodeName = sankeyData.node.label[nodeIndex];
            console.log('Clicked node index:', nodeIndex, 'Node name:', nodeName);
            // Check if the node is a developer (source node)
            if (sourceNodes.has(nodeName)) {
              console.log('Developer node clicked:', nodeName);
              // Set selected developer
              projectStore.setSelectedDeveloper(nodeName);
            } else {
              console.log('Clicked node is not a developer:', nodeName);
            }
          } else {
            console.log('Clicked point is not a node.');
          }
        } else {
          console.log('No valid point data on click.');
        }
      });

    } catch (err) {
      console.error('Error rendering TechNet Sankey diagram:', err);
    }
  }

  console.log('Finished preparePlotData for TechNet.');
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
    console.log("Watcher triggered for TechNet", { newProject, newMonth });
    if (newProject && newMonth !== null && newMonth !== undefined && !isNaN(newMonth)) {
      console.log("Fetching and rendering TechNet Sankey");
      fetchAndRenderSankey();
    } else {
      console.log("Clearing TechNet Sankey diagram");
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


<style scoped lang="scss">
.tech-net-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sankey-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
}

.sankey-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

#sankey {
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #424242;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.loading-text {
  margin-top: 10px;
  font-size: 1rem;
}

.error-message {
  color: red;
}

@media (max-width: 768px) {
  .overlay {
    padding: 10px;
    max-width: 95%;
  }

  .loading-text {
    font-size: 0.9rem;
  }
}
</style>
