 const preparePlotData = () => {
  if (!projectStore.techNetData) return;

  const projectName = projectStore.selectedProject.project_id;
  const selectedMonth = projectStore.selectedMonth;

  let monthData = projectStore.techNetData;

  // Validate data format
  if (!Array.isArray(monthData) || !monthData.every(item => Array.isArray(item) && item.length === 3)) {
    console.error('TechNet data format is invalid:', monthData);
    clearSankeyDiagram();
    return;
  }

  if (!monthData || monthData.length === 0) {
    clearSankeyDiagram();
    console.warn('No TechNet data available to render.');
    return;
  }

  // Step 1: Calculate the total number of commits
  const num_commits = monthData.reduce((sum, item) => sum + item[2], 0);

  // Step 2: Calculate the number of unique contributors (committers)
  const committers = new Set(monthData.map(item => item[0]));
  const num_committers = committers.size;

  // Step 3: Calculate average commits per developer (threshold)
  const commit_per_dev = num_committers > 0 ? Math.floor(num_commits / num_committers) : 0;

  console.log("Number of Commits:", num_commits);
  console.log("Number of Committers:", num_committers);
  console.log("Commits Per Developer (Threshold):", commit_per_dev);

  // Step 4: Filter data based on the threshold (similar to reduce_the_commits)
  const filteredData = monthData.filter(item => item[2] > commit_per_dev);

  console.log("Filtered Data for Sankey Diagram:", filteredData);

  if (!filteredData || filteredData.length === 0) {
    clearSankeyDiagram();
    console.warn('No data meets the threshold to render.');
    return;
  }

  // Step 5: Extract unique contributors and technologies from the filtered data
  const contributors = [...new Set(filteredData.map(item => item[0]))];
  const technologies = [...new Set(filteredData.map(item => item[1]))];

  // Step 6: Create nodes: contributors first, then technologies
  const nodes = [...contributors, ...technologies].map(name => ({ name }));

  // Step 7: Create a mapping from node names to indices
  const nodeMap = {};
  nodes.forEach((node, index) => {
    nodeMap[node.name] = index;
  });

  // Step 8: Create links using the filtered data
  const links = filteredData.map(item => ({
    source: nodeMap[item[0]], // Contributor
    target: nodeMap[item[1]], // Technology
    value: parseInt(item[2], 10), // Number of commits
  }));

  console.log("Nodes:", nodes);
  console.log("Links:", links);

  if (!links.every(link => Number.isInteger(link.source) && Number.isInteger(link.target) && link.value > 0)) {
    console.error('Invalid link data:', links);
    clearSankeyDiagram();
    return;
  }

  // Step 9: Define colors for contributors and technologies
  const nodeColors = [...contributors.map(() => '#1E88E5'), ...technologies.map(() => '#E53935')];

  // Step 10: Prepare the Sankey diagram data structure
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
      color: nodeColors,
    },
    link: {
      source: links.map(link => link.source),
      target: links.map(link => link.target),
      value: links.map(link => link.value),
      color: links.map(() => 'rgba(30, 136, 229, 0.4)'), // Light blue for links
    },
  };

  const layout = {
    title: `${projectName} - Technical Network - Month ${selectedMonth}`,
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

  // Step 11: Render the Sankey diagram
  if (sankeyDiv.value) {
    try {
      Plotly.react(sankeyDiv.value, [sankeyData], layout, { responsive: true });
      console.log('TechNet Sankey diagram rendered.');
    } catch (err) {
      console.error('Error rendering Sankey diagram:', err);
    }
  }
};