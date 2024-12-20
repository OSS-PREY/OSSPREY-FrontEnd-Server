<!-- src/components/TechnicalNetwork.vue -->

<template>
  <VCard class="text-center text-sm-start tech-net-card">
    <VCardItem class="pb-3">
      <VCardTitle class="text-primary">
        Technical Network
      </VCardTitle>
    </VCardItem>
    
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

      <!-- Error Message -->
      <div v-if="projectStore.techNetError" class="overlay error-message">
        {{ projectStore.techNetError }}
      </div>

      <!-- No Data Message -->
      <div
        v-if="!projectStore.techNetLoading && !projectStore.techNetError && (!projectStore.techNetData || projectStore.techNetData.length === 0) && projectStore.selectedProject && projectStore.selectedMonth"
        class="overlay"
      >
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
import { VCard, VCardTitle, VCardText, VProgressCircular, VCardItem } from 'vuetify/components';

const projectStore = useProjectStore();
const sankeyDiv = ref(null);

/**
 * Reduces the commits based on the threshold logic.
 * Ensures that the value is a number and applies filtering based on the threshold.
 */
function reduceTheCommits(inputArray) {
  if (!Array.isArray(inputArray)) return [];

  const currentSum = inputArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  const threshold = currentSum < 100 ? 0 : Math.ceil(currentSum / 100);

  const filteredArray = inputArray.filter((item) => parseInt(item[2], 10) > threshold);

  const numCommits = filteredArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  const numCommitters = [...new Set(filteredArray.map((item) => item[0]))].length;
  const commitsPerDev = numCommitters > 0 ? Math.floor(numCommits / numCommitters) : 0;

  console.log("Filtered Commits Data:", filteredArray);
  console.log("Total Commits:", numCommits);
  console.log("Number of Committers:", numCommitters);
  console.log("Commits Per Developer:", commitsPerDev);

  return filteredArray;
}

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

  if (!projectStore.techNetData || projectStore.techNetData.length === 0) {
    console.warn('No technical network data found to render.');
    clearSankeyDiagram();
    return;
  }

  const projectName = projectStore.selectedProject.project_id;
  console.log(`Project Name: ${projectName}`);
  console.log('TechNet Data:', projectStore.techNetData);

  const monthData = projectStore.techNetData; // Directly use fetched data

  const reducedData = reduceTheCommits(monthData); // Apply reduce_the_commits function

  const nodes = [];
  const links = [];

  reducedData.forEach(([source, target, value]) => {
    const sourceIndex = nodes.findIndex(node => node.name === source && node.side === 'source');
    const targetIndex = nodes.findIndex(node => node.name === target && node.side === 'target');

    // Add source node if it doesn't exist
    let srcIdx;
    if (sourceIndex === -1) {
      srcIdx = nodes.length;
      nodes.push({ name: source, side: 'source' });
    } else {
      srcIdx = sourceIndex;
    }

    // Add target node if it doesn't exist
    let tgtIdx;
    if (targetIndex === -1) {
      tgtIdx = nodes.length;
      nodes.push({ name: target, side: 'target' });
    } else {
      tgtIdx = targetIndex;
    }

    links.push({
      source: srcIdx,
      target: tgtIdx,
      value: parseInt(value, 10) || 0,
    });
  });

  // Remove duplicate nodes and reindex
  const uniqueNodes = [];
  const nodeMap = new Map();
  nodes.forEach(node => {
    const key = `${node.side}|${node.name}`;
    if (!nodeMap.has(key)) {
      nodeMap.set(key, uniqueNodes.length);
      uniqueNodes.push(node);
    }
  });

  // Update link indices based on unique nodes
  const updatedLinks = links.map(link => ({
    source: nodeMap.get(`${nodes[link.source].side}|${nodes[link.source].name}`),
    target: nodeMap.get(`${nodes[link.target].side}|${nodes[link.target].name}`),
    value: link.value,
  }));

  // Define node colors based on their side
  const nodeColors = uniqueNodes.map(node =>
    node.side === 'source' ? '#4CAF50' : '#FF9800'
  );

  const sankeyData = {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 20,
      thickness: 20,
      line: {
        color: '#333',
        width: 0.5,
      },
      label: uniqueNodes.map(node => node.name),
      color: nodeColors,
      hovertemplate: '%{label}<extra></extra>',
    },
    link: {
      source: updatedLinks.map(link => link.source),
      target: updatedLinks.map(link => link.target),
      value: updatedLinks.map(link => link.value),
      color: updatedLinks.map(() => 'rgba(76, 175, 80, 0.4)'),
      hovertemplate: 'Source: %{source.label}<br>Target: %{target.label}<br>Value: %{value}<extra></extra>',
    },
  };

  const containerWidth = sankeyDiv.value ? sankeyDiv.value.offsetWidth : 600;
  const containerHeight = containerWidth * 0.6;

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

  if (sankeyDiv.value) {
    try {
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('TechNet Sankey diagram rendered successfully.');

      sankeyDiv.value.on('plotly_click', function(data) {
        if (data?.points?.length > 0) {
          const point = data.points[0];
          if (point.fullData.type === 'sankey' && point.curveNumber === 0 && point.pointNumber !== undefined) {
            const nodeIndex = point.pointNumber;
            const nodeName = sankeyData.node.label[nodeIndex];
            console.log('Clicked node index:', nodeIndex, 'Node name:', nodeName);
            projectStore.setSelectedDeveloper(nodeName);
          }
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

  if (projectId && month !== null && month !== undefined && !isNaN(month)) {
    projectStore.fetchTechNetData(projectId, month);
  } else {
    clearSankeyDiagram();
  }
};

// Watch for changes in technical network data
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

// Watch for changes in selected project or month
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
  overflow: auto;
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
  overflow: auto;
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
