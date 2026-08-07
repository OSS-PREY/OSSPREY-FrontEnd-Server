<template>
  <VCard class="text-center text-sm-start social-net-card hover-elevate">
    <!-- Header -->
    <VCardItem class="pb-3">
      <DashboardPanelHeader
        title="Social Network"
        tooltip="Visualizes communication patterns among contributors using a directed socio-technical graph. Edge directions represent reply flows in issues or discussions, helping identify collaboration bottlenecks and central communicators."
      />
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
      <div v-else-if="projectStore.socialNetError" class="overlay error-message">
        {{ projectStore.socialNetError }}
      </div>
      <!-- No Data Message -->
      <div v-if="shouldShowSocialNoData" class="overlay">
        No data available for this month.
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
import DashboardPanelHeader from '@/components/DashboardPanelHeader.vue';
import { useProjectStore } from '@/stores/projectStore';
import { renderableRows, rowsForMonth } from '@/utils/networkRows';
import { VCard, VCardTitle, VCardText, VProgressCircular, VCardItem } from 'vuetify/components';

const projectStore = useProjectStore();

// D3 sets inline attributes, so it cannot inherit the theme through CSS: read
// the resolved tokens at draw time instead of hardcoding light-mode greys.
const themeToken = token => {
  // Vuetify defines its theme variables on the application root (.v-theme--dark),
  // not on :root, so resolve them from an element inside the tree.
  const el = sankeyDiv.value || document.querySelector('.v-application') || document.documentElement;
  const value = getComputedStyle(el).getPropertyValue(`--v-theme-${token}`).trim();

  return value ? `rgb(${value})` : null;
};
const sankeyDiv = ref(null);

// Vertical room per contributor: d3-sankey's nodePadding plus enough bar to
// stay clickable and keep its label legible.
const NODE_SLOT = 22;
// How many links the last render actually drew. The no-data overlay keys off
// this, so a month that renders nothing always says so instead of going blank.
const renderedLinks = ref(0);

// currentSocialData:
// • For Foundation mode, socialNetData is an array.
// • For Local mode, it’s an object keyed by month.
const currentSocialData = computed(() =>
  // rowsForMonth handles both shapes and, unlike `month ? ... : ""`, does not
  // treat month 0 as missing -- local repos are keyed from 0, so that lookup
  // silently drew an empty network.
  rowsForMonth(projectStore.socialNetData, projectStore.selectedMonth));

const shouldShowSocialNoData = computed(() => {
  const hasProject = !!projectStore.selectedProject;
  const hasMonth = projectStore.selectedMonth !== null && projectStore.selectedMonth !== undefined;
  if (!hasProject || !hasMonth) return false;
  if (projectStore.socialNetLoading || projectStore.socialNetError) return false;
  return renderedLinks.value === 0;
});

function reduceTheEmails(inputArray) {
  // Threshold and malformed-row handling live in utils/networkRows.js so
  // the cards, the stat boxes and the default month cannot disagree.
  const filteredArray = renderableRows(inputArray);
  console.log("Filtered Social Network Data:", filteredArray);
  console.log("Total Emails:", filteredArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0));
  console.log("Number of Senders:", [...new Set(filteredArray.map(item => item[0]))].length);
  console.log("Emails per sender:", filteredArray.reduce((sum, item) => sum + parseInt(item[2], 10), 0) / filteredArray.length);
  return filteredArray;
}

const clearSankeyDiagram = () => {
  renderedLinks.value = 0;
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
  // **Store in Pinia store (only for local mode)**
  if (projectStore.isLocalMode) {
    projectStore.setReducedEmails(reducedData);
  }

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
  // Fit the box we are actually given. The card is a fixed height with
  // overflow:hidden, so a height guessed from the width clips the diagram.
  const visibleHeight = sankeyDiv.value && sankeyDiv.value.clientHeight
    ? sankeyDiv.value.clientHeight
    : containerWidth * 0.45;
  // A busy month has more contributors than fit the card. Grow the canvas to
  // suit the taller of the two columns and let the container scroll, rather
  // than squeezing every node into an unreadable sliver.
  const columnNodes = Math.max(
    updatedNodes.filter(n => n.side === 'source').length,
    updatedNodes.filter(n => n.side === 'target').length,
  );
  const containerHeight = Math.max(visibleHeight, columnNodes * NODE_SLOT + 40);
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
    .attr("stroke", themeToken("net-stroke") || "#333")
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
    .style("fill", themeToken("net-label") || "#424242")
    .style("text-anchor", d => d.side === "target" ? "end" : "start");
  renderedLinks.value = graph.links.length;
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

// Redraw when the container resizes, not just the window: the card also
// changes size when the sidebar toggles or the layout reflows.
let resizeObserver = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(handleResize);
  if (sankeyDiv.value) resizeObserver.observe(sankeyDiv.value);
  fetchAndRenderSankey();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
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
  overflow-x: hidden;
  overflow-y: auto;
  // A scrollbar appearing must not change the width, or the ResizeObserver
  // that redraws on resize would trigger itself.
  scrollbar-gutter: stable;
  display: flex;
  justify-content: center;
  align-items: flex-start;
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
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-surface), 0.88);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
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
