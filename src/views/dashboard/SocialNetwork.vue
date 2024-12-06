<template>
  <VCard class="text-center text-sm-start social-net-card">
    <VCardItem class="pb-3">
      <VCardTitle class="text-primary">
        Social Network
      </VCardTitle>
    </VCardItem>
    <VCardText class="sankey-wrapper">
      <!-- Sankey Diagram -->
      <div class="sankey-container" ref="sankeyDiv">
        <div id="sankey"></div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="projectStore.socialNetLoading" class="overlay">
        <VProgressCircular indeterminate color="primary" size="50"></VProgressCircular>
        <span class="loading-text">Loading Sankey diagram...</span>
      </div>

      <!-- No Data Message -->
      <div
        v-if="!projectStore.socialNetLoading && !projectStore.socialNetError && (!projectStore.socialNetData || projectStore.socialNetData.length === 0) && projectStore.selectedProject && projectStore.selectedMonth"
        class="overlay"
      >
        No social network data available for the selected month.
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
 * Reduces the emails based on the threshold logic.
 */
function reduceTheEmails(inputArray) {
  const currentSum = inputArray.reduce((sum, item) => sum + parseInt(item[2]), 0);
  const threshold = currentSum < 100 ? 0 : Math.ceil(currentSum / 100);

  const filteredArray = inputArray.filter((item) => item[2] > threshold);

  const numEmails = filteredArray.reduce((sum, item) => sum + parseInt(item[2]), 0);
  const numSenders = [...new Set(filteredArray.map((item) => item[0]))].length;
  const emailsPerDev = Math.floor(numEmails / numSenders);

  console.log("Filtered Emails Data:", filteredArray);
  console.log("Total Emails:", numEmails);
  console.log("Number of Senders:", numSenders);
  console.log("Emails Per Developer:", emailsPerDev);

  return filteredArray;
}

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

  if (!projectStore.socialNetData || projectStore.socialNetData.length === 0) {
    console.warn('No social network data found to render.');
    clearSankeyDiagram();
    return;
  }

  const projectName = projectStore.selectedProject.project_id;
  console.log(`Project Name: ${projectName}`);
  console.log('SocialNet Data:', projectStore.socialNetData);

  const monthData = projectStore.socialNetData;

  // Apply reduce_the_emails function
  const reducedData = reduceTheEmails(monthData);

  const nodes = [];
  const links = [];
  reducedData.forEach(([source, target, value]) => {
    const sourceIndex = nodes.push({ name: source, side: 'source' }) - 1;
    const targetIndex = nodes.push({ name: target, side: 'target' }) - 1;

    links.push({
      source: sourceIndex,
      target: targetIndex,
      value: parseInt(value, 10) || 0,
    });
  });

  const nodeMap = {};
  const updatedNodes = [];
  const updatedLinks = [];

  nodes.forEach((node, index) => {
    const key = `${node.side}|${node.name}`;
    if (!nodeMap[key]) {
      nodeMap[key] = updatedNodes.push({ name: node.name, side: node.side }) - 1;
    }
  });

  links.forEach(link => {
    const newSource = nodeMap[`source|${nodes[link.source].name}`];
    const newTarget = nodeMap[`target|${nodes[link.target].name}`];
    const existingLink = updatedLinks.find(
      l => l.source === newSource && l.target === newTarget
    );
    if (existingLink) {
      existingLink.value += link.value;
    } else {
      updatedLinks.push({
        source: newSource,
        target: newTarget,
        value: link.value,
      });
    }
  });

  const nodeColors = updatedNodes.map(node =>
    node.side === 'source' ? '#1E90FF' : '#FF4500'
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
      label: updatedNodes.map(node => node.name),
      color: nodeColors,
      hovertemplate: '%{label}<extra></extra>',
    },
    link: {
      source: updatedLinks.map(link => link.source),
      target: updatedLinks.map(link => link.target),
      value: updatedLinks.map(link => link.value),
      color: updatedLinks.map(() => 'rgba(30, 136, 229, 0.4)'),
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
      console.log('Rendering Sankey diagram...');
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('SocialNet Sankey diagram rendered successfully.');
    } catch (err) {
      console.error('Error rendering SocialNet Sankey diagram:', err);
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
.social-net-card {
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
