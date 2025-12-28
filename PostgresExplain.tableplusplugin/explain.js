// PostgreSQL EXPLAIN Visualizer Plugin for TablePlus - Enhanced Version
// This version includes additional performance debugging information

function runExplain(context) {
  try {
    // Step 1: Get query from editor
    let queryEditor = context.currentQueryEditor();
    if (!queryEditor) {
      context.alert('No Query Editor', 'Please open a query editor tab.');
      return;
    }

    // Try to get selected text first, then fall back to full query
    let query = queryEditor.currentSelectedString();
    if (!query || query.trim().length === 0) {
      query = queryEditor.value();
    }

    if (!query || query.trim().length === 0) {
      context.alert('No Query', 'Please write or select a SQL query.');
      return;
    }

    // Step 2: Clean and validate query
    query = query.trim().replace(/;+$/, '').trim();

    // Check if already has EXPLAIN
    if (/^\s*EXPLAIN/i.test(query)) {
      context.alert('Query Already Has EXPLAIN', 'Please remove the EXPLAIN statement first.');
      return;
    }

    // Validate query type
    if (!/^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)/i.test(query)) {
      context.alert('Invalid Query Type', 'EXPLAIN only works with SELECT, INSERT, UPDATE, DELETE, or WITH queries.');
      return;
    }

    // Step 3: Build EXPLAIN query with detailed options
    const explainQuery = 'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ' + query;

    // Step 4: Execute EXPLAIN query
    context.execute(explainQuery, function(result) {
      try {
        // Step 5: Extract plan data
        if (!result || !result.rows || result.rows.length === 0) {
          context.alert('No EXPLAIN Data', 'The EXPLAIN query returned no data. Make sure you are connected to a PostgreSQL database.');
          return;
        }

        // Get column name (should be "QUERY PLAN")
        const columnNames = Object.keys(result.columns);
        if (columnNames.length === 0) {
          context.alert('Error', 'No columns in result');
          return;
        }

        const columnName = columnNames[0];
        const firstRow = result.rows[0];

        // Get the raw JSON string
        const planJsonString = firstRow.raw(columnName);
        if (!planJsonString) {
          context.alert('Error', 'Could not extract EXPLAIN data');
          return;
        }

        // Parse the JSON
        let planData;
        try {
          planData = JSON.parse(planJsonString);
          // PostgreSQL returns an array with one plan object - extract it
          if (Array.isArray(planData) && planData.length > 0) {
            planData = planData[0];
          }
        } catch (e) {
          context.alert('Error Parsing Plan', 'Could not parse EXPLAIN JSON: ' + e.message);
          return;
        }

        // Step 6: Generate HTML with D3.js visualization
        const html = generateExplainHTML(query, planData);

        // Step 7: Display the HTML
        context.loadHTML(html);

      } catch (error) {
        context.alert('Error Processing EXPLAIN', error.message || String(error));
      }
    });

  } catch (error) {
    context.alert('Unexpected Error', error.message || String(error));
  }
}

// Generate HTML with enhanced D3.js tree visualization
function generateExplainHTML(originalQuery, planData) {
  // Convert EXPLAIN plan to D3 tree format with enhanced details
  function convertToD3Tree(plan) {
    function processNode(node, parent) {
      // Calculate estimation accuracy
      const planRows = node['Plan Rows'] || 0;
      const actualRows = node['Actual Rows'] || 0;
      const estimationAccuracy = planRows > 0 ? (actualRows / planRows) : 1;

      const d3Node = {
        name: node['Node Type'] || 'Unknown',
        rawNode: node, // Keep full node for edge processing
        details: {
          // Basic info
          cost: node['Total Cost'] ? node['Total Cost'].toFixed(2) : 'N/A',
          startupCost: node['Startup Cost'] ? node['Startup Cost'].toFixed(2) : 'N/A',
          planRows: node['Plan Rows'] || 'N/A',
          actualRows: node['Actual Rows'] || 'N/A',
          actualTime: node['Actual Total Time'] ? node['Actual Total Time'].toFixed(3) : 'N/A',
          startupTime: node['Actual Startup Time'] ? node['Actual Startup Time'].toFixed(3) : 'N/A',

          // Table/Index info
          relation: node['Relation Name'] || null,
          alias: node['Alias'] || null,
          schema: node['Schema'] || null,
          indexName: node['Index Name'] || null,

          // Join info
          joinType: node['Join Type'] || null,
          hashCond: node['Hash Cond'] || null,
          joinFilter: node['Join Filter'] || null,
          innerUnique: node['Inner Unique'] || null,
          parentRelationship: node['Parent Relationship'] || null,

          // Filter/Sort info
          filter: node['Filter'] || null,
          sortKey: node['Sort Key'] ? node['Sort Key'].join(', ') : null,
          sortMethod: node['Sort Method'] || null,
          sortSpaceUsed: node['Sort Space Used'] || null,
          sortSpaceType: node['Sort Space Type'] || null,

          // Aggregate info
          strategy: node['Strategy'] || null,
          groupKey: node['Group Key'] ? node['Group Key'].join(', ') : null,
          hashAggBatches: node['HashAgg Batches'] || null,
          peakMemoryUsage: node['Peak Memory Usage'] || null,

          // Hash info
          hashBuckets: node['Hash Buckets'] || null,
          hashBatches: node['Hash Batches'] || null,

          // Buffer info
          sharedHitBlocks: node['Shared Hit Blocks'] || 0,
          sharedReadBlocks: node['Shared Read Blocks'] || 0,

          // Performance indicators
          estimationAccuracy: estimationAccuracy,
          estimationOff: estimationAccuracy < 0.5 || estimationAccuracy > 2,
          loops: node['Actual Loops'] || 1
        },
        children: [],
        edgeLabel: null
      };

      // Determine edge label based on parent relationship and join conditions
      if (parent) {
        if (node['Hash Cond']) {
          d3Node.edgeLabel = node['Hash Cond'];
        } else if (node['Join Filter']) {
          d3Node.edgeLabel = node['Join Filter'];
        } else if (node['Parent Relationship']) {
          d3Node.edgeLabel = node['Parent Relationship'];
        }
      }

      // Process Plans (child nodes)
      if (node.Plans && node.Plans.length > 0) {
        node.Plans.forEach(childPlan => {
          d3Node.children.push(processNode(childPlan, node));
        });
      }

      return d3Node;
    }

    return processNode(plan.Plan, null);
  }

  const treeData = convertToD3Tree(planData);

  // Escape data for embedding
  const escapedQuery = originalQuery
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const treeJson = JSON.stringify(treeData).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PostgreSQL EXPLAIN Visualization (Enhanced)</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container {
      max-width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .metadata {
      color: #7f8c8d;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .summary {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .summary-item {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 5px;
    }
    .summary-label {
      font-weight: 600;
      color: #34495e;
    }
    .summary-value {
      color: #2980b9;
      font-weight: 700;
    }
    .query-section {
      margin-bottom: 20px;
    }
    .query-section summary {
      cursor: pointer;
      font-weight: 600;
      color: #2c3e50;
      padding: 10px;
      background: #ecf0f1;
      border-radius: 4px;
      user-select: none;
    }
    .query-section summary:hover {
      background: #d5dbdb;
    }
    .query-text {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre;
      margin-top: 10px;
    }
    .legend {
      background: #fff;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    .legend-title {
      font-weight: 600;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .legend-item {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
      vertical-align: middle;
    }
    #tree-container {
      overflow-x: auto;
      margin-top: 20px;
    }
    .node circle {
      fill: #fff;
      stroke: #4CAF50;
      stroke-width: 3px;
      cursor: pointer;
    }
    .node.expensive circle {
      stroke: #f44336;
      fill: #ffebee;
    }
    .node.moderate circle {
      stroke: #ff9800;
      fill: #fff3e0;
    }
    .node.warning circle {
      stroke: #9c27b0;
      fill: #f3e5f5;
    }
    .node text {
      font-size: 11px;
      font-family: sans-serif;
      cursor: pointer;
    }
    .node .node-name {
      font-weight: 600;
      fill: #2c3e50;
    }
    .node .node-badge {
      font-size: 9px;
      fill: #666;
      font-style: italic;
    }
    .node .node-detail {
      fill: #7f8c8d;
      font-size: 9px;
    }
    .node .node-warning {
      fill: #e74c3c;
      font-weight: 600;
      font-size: 10px;
    }
    .link {
      fill: none;
      stroke: #95a5a6;
      stroke-width: 2px;
    }
    .edge-label {
      font-size: 10px;
      fill: #2980b9;
      font-family: 'Monaco', monospace;
      background: white;
      padding: 2px 4px;
    }
    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 12px;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 400px;
      z-index: 1000;
      line-height: 1.6;
    }
    .tooltip-title {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 8px;
      color: #4CAF50;
      border-bottom: 1px solid #555;
      padding-bottom: 5px;
    }
    .tooltip-section {
      margin: 8px 0;
    }
    .tooltip-section-title {
      font-weight: 600;
      color: #81c784;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .tooltip-item {
      margin: 3px 0;
      padding-left: 8px;
    }
    .tooltip-label {
      font-weight: 600;
      color: #aaa;
      min-width: 100px;
      display: inline-block;
    }
    .tooltip-value {
      color: #fff;
    }
    .tooltip-warning {
      color: #ff9800;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PostgreSQL EXPLAIN Visualization (Enhanced)</h1>
    <div class="metadata">Generated at ${new Date().toLocaleString()}</div>

    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Planning Time:</span>
        <span class="summary-value">${planData['Planning Time'] ? planData['Planning Time'].toFixed(3) + 'ms' : 'N/A'}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Execution Time:</span>
        <span class="summary-value">${planData['Execution Time'] ? planData['Execution Time'].toFixed(3) + 'ms' : 'N/A'}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Cost:</span>
        <span class="summary-value">${planData.Plan['Total Cost'] ? planData.Plan['Total Cost'].toFixed(2) : 'N/A'}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Actual Rows:</span>
        <span class="summary-value">${planData.Plan['Actual Rows'] || 'N/A'}</span>
      </div>
    </div>

    <div class="legend">
      <div class="legend-title">Node Color Legend:</div>
      <div class="legend-item">
        <span class="legend-color" style="background: #4CAF50"></span>
        Low Cost (&lt; 100)
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ff9800"></span>
        Moderate Cost (100-1000)
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f44336"></span>
        High Cost (&gt; 1000)
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #9c27b0"></span>
        Estimation Warning
      </div>
    </div>

    <div class="query-section">
      <details>
        <summary>Original Query</summary>
        <pre class="query-text">${escapedQuery}</pre>
      </details>
    </div>

    <div id="tree-container"></div>
  </div>

  <div class="tooltip" id="tooltip"></div>

  <script>
    const treeData = ${treeJson};

    // Set up dimensions
    const margin = {top: 20, right: 150, bottom: 20, left: 150};
    const width = 1400 - margin.left - margin.right;
    const height = 1000 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#tree-container')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Create tree layout
    const tree = d3.tree().size([height, width]);

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    const treeLayout = tree(root);

    // Tooltip
    const tooltip = d3.select('#tooltip');

    // Draw links
    const links = svg.selectAll('.link')
      .data(treeLayout.links())
      .enter()
      .append('g');

    links.append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

    // Add edge labels (join conditions, etc.)
    links.each(function(d) {
      if (d.target.data.edgeLabel) {
        const midX = (d.source.y + d.target.y) / 2;
        const midY = (d.source.x + d.target.x) / 2;

        d3.select(this)
          .append('text')
          .attr('class', 'edge-label')
          .attr('x', midX)
          .attr('y', midY)
          .attr('dy', -5)
          .style('text-anchor', 'middle')
          .text(d.target.data.edgeLabel.length > 40 ?
                d.target.data.edgeLabel.substring(0, 40) + '...' :
                d.target.data.edgeLabel);
      }
    });

    // Draw nodes
    const nodes = svg.selectAll('.node')
      .data(treeLayout.descendants())
      .enter()
      .append('g')
      .attr('class', d => {
        let className = 'node';
        const cost = parseFloat(d.data.details.cost);

        if (d.data.details.estimationOff) {
          className += ' warning';
        } else if (cost > 1000) {
          className += ' expensive';
        } else if (cost > 100) {
          className += ' moderate';
        }

        return className;
      })
      .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

    // Add circles
    nodes.append('circle')
      .attr('r', 7)
      .on('mouseover', function(event, d) {
        tooltip.style('opacity', 1);

        let content = '<div class="tooltip-title">' + d.data.name;
        if (d.data.details.joinType) {
          content += ' (' + d.data.details.joinType + ' Join)';
        }
        content += '</div>';

        // Table/Relation info
        if (d.data.details.relation) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Table Info</div>';
          if (d.data.details.schema) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Schema:</span> <span class="tooltip-value">' + d.data.details.schema + '</span></div>';
          }
          content += '<div class="tooltip-item"><span class="tooltip-label">Table:</span> <span class="tooltip-value">' + d.data.details.relation + '</span></div>';
          if (d.data.details.alias) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Alias:</span> <span class="tooltip-value">' + d.data.details.alias + '</span></div>';
          }
          if (d.data.details.indexName) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Index:</span> <span class="tooltip-value">' + d.data.details.indexName + '</span></div>';
          }
          content += '</div>';
        }

        // Cost & Timing
        content += '<div class="tooltip-section">';
        content += '<div class="tooltip-section-title">Cost & Timing</div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Total Cost:</span> <span class="tooltip-value">' + d.data.details.cost + '</span></div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Startup Cost:</span> <span class="tooltip-value">' + d.data.details.startupCost + '</span></div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Actual Time:</span> <span class="tooltip-value">' + d.data.details.actualTime + ' ms</span></div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Startup Time:</span> <span class="tooltip-value">' + d.data.details.startupTime + ' ms</span></div>';
        content += '</div>';

        // Rows & Estimation
        content += '<div class="tooltip-section">';
        content += '<div class="tooltip-section-title">Rows</div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Plan Rows:</span> <span class="tooltip-value">' + d.data.details.planRows + '</span></div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Actual Rows:</span> <span class="tooltip-value">' + d.data.details.actualRows + '</span></div>';
        content += '<div class="tooltip-item"><span class="tooltip-label">Loops:</span> <span class="tooltip-value">' + d.data.details.loops + '</span></div>';

        if (d.data.details.estimationOff) {
          const accuracy = d.data.details.estimationAccuracy;
          content += '<div class="tooltip-item"><span class="tooltip-warning">⚠ Estimation Off: ' + (accuracy < 1 ? 'underestimated' : 'overestimated') + ' by ' + (Math.abs(1 - accuracy) * 100).toFixed(0) + '%</span></div>';
        }
        content += '</div>';

        // Join Conditions
        if (d.data.details.hashCond || d.data.details.joinFilter) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Join Conditions</div>';
          if (d.data.details.hashCond) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Hash Cond:</span> <span class="tooltip-value">' + d.data.details.hashCond + '</span></div>';
          }
          if (d.data.details.joinFilter) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Join Filter:</span> <span class="tooltip-value">' + d.data.details.joinFilter + '</span></div>';
          }
          if (d.data.details.innerUnique !== null) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Inner Unique:</span> <span class="tooltip-value">' + d.data.details.innerUnique + '</span></div>';
          }
          content += '</div>';
        }

        // Sort Info
        if (d.data.details.sortKey) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Sort Info</div>';
          content += '<div class="tooltip-item"><span class="tooltip-label">Sort Key:</span> <span class="tooltip-value">' + d.data.details.sortKey + '</span></div>';
          if (d.data.details.sortMethod) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Method:</span> <span class="tooltip-value">' + d.data.details.sortMethod + '</span></div>';
          }
          if (d.data.details.sortSpaceUsed) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Space:</span> <span class="tooltip-value">' + d.data.details.sortSpaceUsed + ' kB (' + d.data.details.sortSpaceType + ')</span></div>';
          }
          content += '</div>';
        }

        // Aggregate/Hash Info
        if (d.data.details.strategy || d.data.details.groupKey) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Aggregate Info</div>';
          if (d.data.details.strategy) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Strategy:</span> <span class="tooltip-value">' + d.data.details.strategy + '</span></div>';
          }
          if (d.data.details.groupKey) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Group Key:</span> <span class="tooltip-value">' + d.data.details.groupKey + '</span></div>';
          }
          if (d.data.details.peakMemoryUsage) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Peak Memory:</span> <span class="tooltip-value">' + d.data.details.peakMemoryUsage + ' kB</span></div>';
          }
          if (d.data.details.hashAggBatches) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Hash Batches:</span> <span class="tooltip-value">' + d.data.details.hashAggBatches + '</span></div>';
          }
          if (d.data.details.hashBuckets) {
            content += '<div class="tooltip-item"><span class="tooltip-label">Hash Buckets:</span> <span class="tooltip-value">' + d.data.details.hashBuckets + '</span></div>';
          }
          content += '</div>';
        }

        // Buffer Info
        if (d.data.details.sharedHitBlocks > 0 || d.data.details.sharedReadBlocks > 0) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Buffers</div>';
          content += '<div class="tooltip-item"><span class="tooltip-label">Cache Hits:</span> <span class="tooltip-value">' + d.data.details.sharedHitBlocks + ' blocks</span></div>';
          content += '<div class="tooltip-item"><span class="tooltip-label">Disk Reads:</span> <span class="tooltip-value">' + d.data.details.sharedReadBlocks + ' blocks</span></div>';

          if (d.data.details.sharedReadBlocks > 0) {
            const hitRate = (d.data.details.sharedHitBlocks / (d.data.details.sharedHitBlocks + d.data.details.sharedReadBlocks) * 100).toFixed(1);
            content += '<div class="tooltip-item"><span class="tooltip-label">Hit Rate:</span> <span class="tooltip-value">' + hitRate + '%</span></div>';
          }
          content += '</div>';
        }

        // Filter
        if (d.data.details.filter) {
          content += '<div class="tooltip-section">';
          content += '<div class="tooltip-section-title">Filter</div>';
          content += '<div class="tooltip-item"><span class="tooltip-value">' + d.data.details.filter + '</span></div>';
          content += '</div>';
        }

        tooltip.html(content)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    // Add node labels (name)
    nodes.append('text')
      .attr('dy', -15)
      .attr('class', 'node-name')
      .style('text-anchor', 'middle')
      .text(d => d.data.name);

    // Add node badge (strategy/join type)
    nodes.append('text')
      .attr('dy', -5)
      .attr('class', 'node-badge')
      .style('text-anchor', 'middle')
      .text(d => {
        if (d.data.details.strategy) return d.data.details.strategy;
        if (d.data.details.joinType) return d.data.details.joinType;
        if (d.data.details.relation) return d.data.details.alias || d.data.details.relation;
        return '';
      });

    // Add cost/rows info
    nodes.append('text')
      .attr('dy', 20)
      .attr('class', 'node-detail')
      .style('text-anchor', 'middle')
      .text(d => {
        return 'Cost: ' + d.data.details.cost + ' | Rows: ' + d.data.details.actualRows;
      });

    // Add warning for bad estimates
    nodes.append('text')
      .attr('dy', 32)
      .attr('class', 'node-warning')
      .style('text-anchor', 'middle')
      .text(d => d.data.details.estimationOff ? '⚠ Est. Off' : '');

    // Add timing for expensive nodes
    nodes.append('text')
      .attr('dy', 44)
      .attr('class', 'node-detail')
      .style('text-anchor', 'middle')
      .text(d => {
        const cost = parseFloat(d.data.details.cost);
        if (cost > 100 && d.data.details.actualTime !== 'N/A') {
          return d.data.details.actualTime + ' ms';
        }
        return '';
      });
  </script>
</body>
</html>`;
}

// Export function
global.runExplain = runExplain;
