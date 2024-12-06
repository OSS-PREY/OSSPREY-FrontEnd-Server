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
 * Reduces the commits based on the threshold logic.
 */
function reduceTheCommits(inputArray) {
  const currentSum = inputArray.reduce((sum, item) => sum + parseInt(item[2]), 0);
  const threshold = currentSum < 100 ? 0 : Math.ceil(currentSum / 100);

  const filteredArray = inputArray.filter((item) => item[2] > threshold);

  const numCommits = filteredArray.reduce((sum, item) => sum + parseInt(item[2]), 0);
  const numCommitters = [...new Set(filteredArray.map((item) => item[0]))].length;
  const commitsPerDev = Math.floor(numCommits / numCommitters);

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

  const nodeLabels = [];
  const nodeMap = new Map();
  let nodeIndex = 0;

  const links = reducedData.map(([source, target, value]) => {
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

  const sourceNodes = new Set(reducedData.map(item => item[0]));
  const nodeColors = nodeLabels.map(label => {
    if (sourceNodes.has(label)) {
      return '#4CAF50';
    } else {
      return '#FF9800';
    }
  });

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
      label: nodeLabels,
      color: nodeColors,
      hovertemplate: '%{label}<extra></extra>',
    },
    link: {
      source: links.map(link => link.source),
      target: links.map(link => link.target),
      value: links.map(link => link.value),
      color: links.map(() => 'rgba(76, 175, 80, 0.4)'),
      hovertemplate: 'Source: %{source.label}<br>Target: %{target.label}<br>Value: %{value}<extra></extra>',
    },
  };

  const containerWidth = document.querySelector('.sankey-container').offsetWidth;
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
            if (sourceNodes.has(nodeName)) {
              projectStore.setSelectedDeveloper(nodeName);
            }
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
