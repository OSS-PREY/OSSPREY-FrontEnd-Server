<template>
  <VCard class="text-center text-sm-start social-net-card">
    <VCardItem class="pb-3">
      <VCardTitle class="text-primary">Social Network</VCardTitle>
    </VCardItem>
    <VCardText class="sankey-wrapper">
      <!-- Sankey Diagram Container -->
      <div class="sankey-container" ref="sankeyDiv"></div>
      <!-- Loading Indicator -->
      <div v-if="projectStore.socialNetLoading" class="overlay">
        <VProgressCircular indeterminate color="primary" size="50" />
        <span class="loading-text">Loading Sankey diagram...</span>
      </div>
      <!-- Error Message -->
      <div v-if="projectStore.socialNetError" class="overlay error-message">
        {{ projectStore.socialNetError }}
      </div>
      <!-- No Data Message -->
      <div
        v-if="!projectStore.socialNetLoading && !projectStore.socialNetError &&
             (!projectStore.socialNetData || projectStore.socialNetData.length === 0) &&
             projectStore.selectedProject && projectStore.selectedMonth"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { sankey, sankeyCenter, sankeyLinkHorizontal } from 'd3-sankey';
import { useProjectStore } from '@/stores/projectStore';
import { VCard, VCardTitle, VCardText, VProgressCircular, VCardItem } from 'vuetify/components';

const projectStore = useProjectStore();
const sankeyDiv = ref(null);

// currentSocialData:
// • For Foundation mode, socialNetData is an array.
// • For Local mode, it’s an object keyed by month.
const currentSocialData = computed(() => {
  if (projectStore.socialNetData) {
    if (Array.isArray(projectStore.socialNetData)) {
      console.log("Social network data (Foundation mode):", projectStore.socialNetData);
      return projectStore.socialNetData;
    } else if (typeof projectStore.socialNetData === 'object') {
      const key = projectStore.selectedMonth ? projectStore.selectedMonth.toString() : "";
      const dataForMonth = projectStore.socialNetData[key] || [];
      console.log(`Social network data for month ${key}:`, dataForMonth);
      return dataForMonth;
    }
  }
  return [];
});

function reduceTheEmails(inputArray) {
  if (!Array.isArray(inputArray)) return [];
  const currentSum = inputArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  const threshold = currentSum < 100 ? 0 : Math.ceil(currentSum / 100);
  const filteredArray = inputArray.filter((item) => parseInt(item[2], 10) > threshold);
  console.log("Filtered Social Network Data:", filteredArray);
  console.log("Total Emails:", filteredArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0));
  console.log("Number of Senders:", [...new Set(filteredArray.map(item => item[0]))].length);
  return filteredArray;
}

const clearSankeyDiagram = () => {
  if (sankeyDiv.value) {
    d3.select(sankeyDiv.value).select("svg").remove();
    console.log('SocialNet Sankey diagram cleared.');
  }
};

const preparePlotData = () => {
  const socialData = currentSocialData.value;
  if (!socialData || socialData.length === 0) {
    console.warn('No social network data found to render.');
    clearSankeyDiagram();
    return;
  }
  const reducedData = reduceTheEmails(socialData);
  if (reducedData.length === 0) {
    console.warn('After reduction, no data remains.');
    clearSankeyDiagram();
    return;
  }
  let nodes = [];
  let links = [];
  reducedData.forEach(([source, target, value]) => {
    const sourceIndex = nodes.push({ name: source, side: 'source' }) - 1;
    const targetIndex = nodes.push({ name: target, side: 'target' }) - 1;
    links.push({
      source: sourceIndex,
      target: targetIndex,
      value: parseInt(value, 10) || 0
    });
  });
  const nodeMap = {};
  const updatedNodes = [];
  const updatedLinks = [];
  nodes.forEach((node) => {
    const key = `${node.side}|${node.name}`;
    if (nodeMap[key] === undefined) {
      nodeMap[key] = updatedNodes.push({ name: node.name, side: node.side }) - 1;
    }
  });
  links.forEach(link => {
    const newSource = nodeMap[`source|${nodes[link.source].name}`];
    const newTarget = nodeMap[`target|${nodes[link.target].name}`];
    const existingLink = updatedLinks.find(l => l.source === newSource && l.target === newTarget);
    if (existingLink) {
      existingLink.value += link.value;
    } else {
      updatedLinks.push({
        source: newSource,
        target: newTarget,
        value: link.value
      });
    }
  });
  const containerWidth = sankeyDiv.value ? sankeyDiv.value.offsetWidth : 800;
  const containerHeight = containerWidth * 0.45;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  clearSankeyDiagram();
  const svg = d3.select(sankeyDiv.value)
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const sankeyGenerator = sankey()
    .nodeWidth(12)
    .nodePadding(8)
    .nodeAlign(sankeyCenter)
    .extent([[margin.left, margin.top], [containerWidth - margin.right, containerHeight - margin.bottom]]);
  const graph = {
    nodes: updatedNodes.map(d => ({ ...d })),
    links: updatedLinks.map(d => ({ ...d }))
  };
  sankeyGenerator(graph);
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => {
      const col = d3.color(colorScale(d.source.name));
      col.opacity = 0.4;
      return col.toString();
    })
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke-opacity", 0.7);
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("stroke-opacity", 0.5);
    });
  link.append("title")
    .text(d => `Source: ${d.source.name}\nTarget: ${d.target.name}\nValue: ${d.value}`);
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);
  node.append("rect")
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => colorScale(d.name))
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      console.log(`Social network node clicked: ${d.name}`);
      projectStore.setSelectedSocialDeveloper(d.name);
    })
    .append("title")
    .text(d => d.name);
  node.append("text")
    .attr("x", d => d.side === "target" ? -6 : (d.x1 - d.x0) + 6)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("dy", "0.35em")
    .text(d => d.name)
    .style("font-size", "12px")
    .style("fill", "#424242")
    .style("text-anchor", d => d.side === "target" ? "end" : "start");
  console.log('SocialNet Sankey diagram rendered successfully.');
};

const handleResize = () => {
  if (sankeyDiv.value) {
    preparePlotData();
    console.log('SocialNet Sankey diagram resized.');
  }
};

const fetchAndRenderSankey = () => {
  const projectId = projectStore.selectedProject?.project_id;
  const month = projectStore.selectedMonth;
  console.log(`Attempting to render SocialNet for project_id: ${projectId}, month: ${month}`);
  if (projectId && month !== null && month !== undefined && !isNaN(month)) {
    preparePlotData();
  } else {
    clearSankeyDiagram();
  }
};

watch(
  () => currentSocialData.value,
  (newData) => {
    console.log('Current social network data changed:', newData);
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sankey-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
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
