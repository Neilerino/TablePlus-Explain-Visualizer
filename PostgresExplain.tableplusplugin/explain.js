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
          sharedDirtiedBlocks: node['Shared Dirtied Blocks'] || 0,
          sharedWrittenBlocks: node['Shared Written Blocks'] || 0,
          localHitBlocks: node['Local Hit Blocks'] || 0,
          localReadBlocks: node['Local Read Blocks'] || 0,
          tempReadBlocks: node['Temp Read Blocks'] || 0,
          tempWrittenBlocks: node['Temp Written Blocks'] || 0,

          // I/O Timing (if available)
          ioReadTime: node['I/O Read Time'] || null,
          ioWriteTime: node['I/O Write Time'] || null,

          // Filter selectivity
          rowsRemovedByFilter: node['Rows Removed by Filter'] || null,
          rowsRemovedByJoinFilter: node['Rows Removed by Join Filter'] || null,

          // Index info
          heapFetches: node['Heap Fetches'] || null,
          exactHeapBlocks: node['Exact Heap Blocks'] || null,
          lossyHeapBlocks: node['Lossy Heap Blocks'] || null,

          // Parallel query info
          workersPlanned: node['Workers Planned'] || null,
          workersLaunched: node['Workers Launched'] || null,

          // Output columns (VERBOSE)
          output: node['Output'] ? node['Output'].join(', ') : null,

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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sql.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      overflow: hidden;
      height: 100vh;
    }
    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
    }
    /* SIDEBARS */
    .sidebar {
      background: #252526;
      border-right: 1px solid #3e3e42;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease, min-width 0.2s ease;
      position: relative;
    }
    .sidebar.collapsed {
      width: 0 !important;
      min-width: 0 !important;
      border: none;
      overflow: visible;
    }
    .sidebar.collapsed .sidebar-content {
      display: none;
    }
    .sidebar.collapsed .sidebar-header {
      background: transparent;
      border: none;
      padding: 0;
      min-height: 0;
    }
    .left-sidebar {
      width: 350px;
      min-width: 250px;
      max-width: 600px;
    }
    .right-sidebar {
      width: 400px;
      min-width: 300px;
      max-width: 700px;
      border-right: none;
      border-left: 1px solid #3e3e42;
    }
    .sidebar-header {
      position: relative;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 12px 16px;
      background: #2d2d30;
      border-bottom: 1px solid #3e3e42;
      flex-shrink: 0;
      min-height: 44px;
    }
    .sidebar.collapsed .sidebar-header {
      border-bottom: none;
    }
    .collapse-btn {
      background: #2d2d30;
      border: 1px solid #3e3e42;
      color: #cccccc;
      cursor: pointer;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      font-size: 14px;
      min-width: 28px;
      position: relative;
      z-index: 10;
      transition: background 0.15s;
    }
    .collapse-btn:hover {
      background: #3e3e42;
    }
    /* Keep left collapse button visible when sidebar is collapsed */
    .left-sidebar.collapsed .collapse-btn {
      position: fixed;
      left: 12px;
      top: 50vh;
      transform: translateY(-50%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
    }
    .sidebar-content::-webkit-scrollbar {
      width: 8px;
    }
    .sidebar-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .sidebar-content::-webkit-scrollbar-thumb {
      background: #3e3e42;
      border-radius: 4px;
    }
    .sidebar-content::-webkit-scrollbar-thumb:hover {
      background: #4e4e52;
    }

    /* RESIZE HANDLES */
    .resize-handle {
      width: 4px;
      background: #3e3e42;
      cursor: col-resize;
      flex-shrink: 0;
      position: relative;
      transition: background 0.15s;
    }
    .resize-handle:hover,
    .resize-handle.dragging {
      background: #007acc;
    }

    /* MAIN CONTENT */
    .main-content {
      flex: 1;
      background: #1e1e1e;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    #tree-container {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    .zoom-controls {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10;
    }
    .zoom-btn {
      background: #2d2d30;
      border: 1px solid #3e3e42;
      color: #cccccc;
      width: 36px;
      height: 36px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      transition: all 0.2s;
    }
    .zoom-btn:hover {
      background: #3e3e42;
      border-color: #007acc;
    }
    .zoom-btn:active {
      background: #007acc;
    }

    /* QUERY PANEL */
    .query-panel {
      margin-bottom: 20px;
    }
    .query-panel h4,
    .stats-panel h4 {
      font-size: 12px;
      font-weight: 600;
      color: #858585;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .query-text {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      background: #282c34;
      padding: 0;
      border-radius: 4px;
      border: 1px solid #3e3e42;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .query-text code {
      display: block;
      padding: 12px;
      line-height: 1.5;
      white-space: pre;
      background: transparent;
    }

    /* STATISTICS PANEL */
    .stats-panel {
      margin-top: 20px;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      margin-bottom: 4px;
      background: #1e1e1e;
      border-radius: 3px;
      border: 1px solid #3e3e42;
    }
    .stat-label {
      font-size: 12px;
      color: #858585;
      font-weight: 500;
    }
    .stat-value {
      font-size: 12px;
      color: #4fc3f7;
      font-weight: 600;
    }

    /* NODE DETAILS (right sidebar) */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #858585;
      font-size: 13px;
    }
    .detail-section {
      margin-bottom: 20px;
    }
    .detail-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #4fc3f7;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .detail-title {
      font-size: 16px;
      color: #4CAF50;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .detail-item {
      padding: 6px 0;
      border-bottom: 1px solid #3e3e42;
      font-size: 12px;
    }
    .detail-item:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #858585;
      margin-bottom: 2px;
      display: inline-block;
      min-width: 120px;
      font-weight: 500;
    }
    .detail-value {
      color: #d4d4d4;
      word-wrap: break-word;
    }
    .detail-warning {
      color: #ff9800;
      font-weight: 600;
    }
    .node rect {
      fill: #2d2d30;
      stroke: #4CAF50;
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s;
      rx: 4px;
      ry: 4px;
    }
    .node.expensive rect {
      stroke: #f44336;
      fill: #3d2626;
    }
    .node.moderate rect {
      stroke: #ff9800;
      fill: #3d3126;
    }
    .node.warning rect {
      stroke: #9c27b0;
      fill: #342d3d;
    }
    .node rect.selected {
      stroke: #007acc;
      stroke-width: 3px;
      filter: drop-shadow(0 0 10px rgba(0, 122, 204, 0.6));
    }
    .node:hover rect:not(.selected) {
      stroke-width: 3px;
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.2));
    }
    .node text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      pointer-events: none;
    }
    .node .node-type {
      font-weight: 600;
      font-size: 13px;
      fill: #cccccc;
    }
    .node .node-alias {
      font-size: 10px;
      fill: #858585;
      font-style: italic;
    }
    .node .node-metric {
      font-size: 10px;
      fill: #a0a0a0;
    }
    .node .node-metric-label {
      fill: #707070;
    }
    .node .node-metric-value {
      fill: #cccccc;
      font-weight: 500;
    }
    .link {
      fill: none;
      stroke: #3e3e42;
      stroke-width: 2px;
    }
    .edge-label {
      font-size: 9px;
      fill: #4fc3f7;
      font-family: 'Monaco', monospace;
      background: #1e1e1e;
      dominant-baseline: middle;
      text-anchor: start;
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- LEFT SIDEBAR -->
    <div class="sidebar left-sidebar" id="leftSidebar">
      <div class="sidebar-header">
        <button class="collapse-btn" id="leftCollapseBtn" title="Toggle sidebar">◀</button>
      </div>

      <div class="sidebar-content">
        <!-- Query Section -->
        <div class="query-panel">
          <h4>Original Query</h4>
          <pre class="query-text"><code class="language-sql">${escapedQuery}</code></pre>
        </div>

        <!-- Statistics Section -->
        <div class="stats-panel">
          <h4>Execution Statistics</h4>
          <div class="stat-item">
            <span class="stat-label">Planning Time</span>
            <span class="stat-value">${planData['Planning Time'] ? planData['Planning Time'].toFixed(3) + ' ms' : 'N/A'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Execution Time</span>
            <span class="stat-value">${planData['Execution Time'] ? planData['Execution Time'].toFixed(3) + ' ms' : 'N/A'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Cost</span>
            <span class="stat-value">${planData.Plan['Total Cost'] ? planData.Plan['Total Cost'].toFixed(2) : 'N/A'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Actual Rows</span>
            <span class="stat-value">${planData.Plan['Actual Rows'] || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- LEFT RESIZE HANDLE -->
    <div class="resize-handle" id="leftResizeHandle"></div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <div id="tree-container">
        <div class="zoom-controls">
          <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
          <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
          <button class="zoom-btn" id="zoom-reset" title="Reset Zoom">⊙</button>
        </div>
      </div>
    </div>

    <!-- RIGHT RESIZE HANDLE -->
    <div class="resize-handle" id="rightResizeHandle"></div>

    <!-- RIGHT SIDEBAR -->
    <div class="sidebar right-sidebar collapsed" id="rightSidebar">
      <div class="sidebar-header">
        <button class="collapse-btn" id="rightCollapseBtn" title="Close sidebar">✕</button>
      </div>

      <div class="sidebar-content" id="nodeDetails">
        <div class="empty-state">
          <p>Click a node to view details</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const treeData = ${treeJson};

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const appState = {
      leftSidebarWidth: 350,
      rightSidebarWidth: 400,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: true,
      selectedNode: null
    };

    // Load saved state from localStorage (graceful fallback)
    function loadState() {
      try {
        const saved = localStorage.getItem('pgexplain-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(appState, parsed);
        }
      } catch (e) {
        // localStorage not available or failed - just use defaults
        console.log('State persistence not available');
      }
    }

    function saveState() {
      try {
        localStorage.setItem('pgexplain-state', JSON.stringify({
          leftSidebarWidth: appState.leftSidebarWidth,
          rightSidebarWidth: appState.rightSidebarWidth,
          leftSidebarCollapsed: appState.leftSidebarCollapsed,
          rightSidebarCollapsed: appState.rightSidebarCollapsed
          // Don't persist selectedNode
        }));
      } catch (e) {
        // localStorage not available - that's OK
      }
    }

    loadState();

    // ============================================
    // SIDEBAR COLLAPSE/EXPAND
    // ============================================
    function toggleSidebar(side) {
      const sidebar = document.getElementById(side === 'left' ? 'leftSidebar' : 'rightSidebar');
      const isCollapsed = sidebar.classList.contains('collapsed');
      const btn = document.getElementById(side === 'left' ? 'leftCollapseBtn' : 'rightCollapseBtn');

      if (isCollapsed) {
        sidebar.classList.remove('collapsed');
        appState[side + 'SidebarCollapsed'] = false;
        btn.textContent = side === 'left' ? '◀' : '✕';
      } else {
        sidebar.classList.add('collapsed');
        appState[side + 'SidebarCollapsed'] = true;
        btn.textContent = side === 'left' ? '▶' : '✕';

        // Clear selection when closing right sidebar
        if (side === 'right' && appState.selectedNode) {
          d3.select(appState.selectedNode).select('rect').classed('selected', false);
          appState.selectedNode = null;
        }
      }

      saveState();
    }

    // Initialize collapse buttons
    document.getElementById('leftCollapseBtn').addEventListener('click', () => toggleSidebar('left'));
    document.getElementById('rightCollapseBtn').addEventListener('click', () => toggleSidebar('right'));

    // Apply saved collapsed state
    if (appState.leftSidebarCollapsed) {
      document.getElementById('leftSidebar').classList.add('collapsed');
      document.getElementById('leftCollapseBtn').textContent = '▶';
    }
    // Right sidebar starts collapsed by default

    // ============================================
    // RESIZE HANDLES
    // ============================================
    function initResizeHandles() {
      const leftHandle = document.getElementById('leftResizeHandle');
      const rightHandle = document.getElementById('rightResizeHandle');
      const leftSidebar = document.getElementById('leftSidebar');
      const rightSidebar = document.getElementById('rightSidebar');

      let isResizing = false;
      let currentHandle = null;
      let startX = 0;
      let startWidth = 0;

      function onMouseDown(handle, sidebar, side) {
        return function(e) {
          // Don't resize if collapsed
          if (sidebar.classList.contains('collapsed')) return;

          isResizing = true;
          currentHandle = handle;
          startX = e.pageX;
          startWidth = sidebar.offsetWidth;

          handle.classList.add('dragging');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';

          e.preventDefault();
        };
      }

      function onMouseMove(e) {
        if (!isResizing) return;

        const sidebar = currentHandle === leftHandle ? leftSidebar : rightSidebar;
        const side = currentHandle === leftHandle ? 'left' : 'right';
        const delta = side === 'left' ? (e.pageX - startX) : (startX - e.pageX);
        const newWidth = startWidth + delta;

        // Enforce min/max
        const minWidth = side === 'left' ? 250 : 300;
        const maxWidth = side === 'left' ? 600 : 700;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

        sidebar.style.width = clampedWidth + 'px';
        appState[side + 'SidebarWidth'] = clampedWidth;
      }

      function onMouseUp() {
        if (!isResizing) return;

        isResizing = false;
        currentHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        currentHandle = null;

        saveState();
      }

      leftHandle.addEventListener('mousedown', onMouseDown(leftHandle, leftSidebar, 'left'));
      rightHandle.addEventListener('mousedown', onMouseDown(rightHandle, rightSidebar, 'right'));
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    initResizeHandles();

    // Apply saved widths
    document.getElementById('leftSidebar').style.width = appState.leftSidebarWidth + 'px';
    document.getElementById('rightSidebar').style.width = appState.rightSidebarWidth + 'px';

    // ============================================
    // NODE DETAILS POPULATION
    // ============================================
    function populateNodeDetails(d) {
      let content = '<div class="detail-title">' + d.data.name;
      if (d.data.details.joinType) {
        content += ' <span style="color: #858585;">(' + d.data.details.joinType + ' Join)</span>';
      }
      content += '</div>';

      // Table/Relation info
      if (d.data.details.relation) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Table Info</div>';
        if (d.data.details.schema) {
          content += '<div class="detail-item"><span class="detail-label">Schema:</span> <span class="detail-value">' + d.data.details.schema + '</span></div>';
        }
        content += '<div class="detail-item"><span class="detail-label">Table:</span> <span class="detail-value">' + d.data.details.relation + '</span></div>';
        if (d.data.details.alias) {
          content += '<div class="detail-item"><span class="detail-label">Alias:</span> <span class="detail-value">' + d.data.details.alias + '</span></div>';
        }
        if (d.data.details.indexName) {
          content += '<div class="detail-item"><span class="detail-label">Index:</span> <span class="detail-value">' + d.data.details.indexName + '</span></div>';
        }
        content += '</div>';
      }

      // Cost & Timing
      content += '<div class="detail-section">';
      content += '<div class="detail-section-title">Cost & Timing</div>';
      content += '<div class="detail-item"><span class="detail-label">Total Cost:</span> <span class="detail-value">' + d.data.details.cost + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Startup Cost:</span> <span class="detail-value">' + d.data.details.startupCost + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Actual Time:</span> <span class="detail-value">' + d.data.details.actualTime + ' ms</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Startup Time:</span> <span class="detail-value">' + d.data.details.startupTime + ' ms</span></div>';
      content += '</div>';

      // Rows & Estimation
      content += '<div class="detail-section">';
      content += '<div class="detail-section-title">Rows</div>';
      content += '<div class="detail-item"><span class="detail-label">Plan Rows:</span> <span class="detail-value">' + d.data.details.planRows + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Actual Rows:</span> <span class="detail-value">' + d.data.details.actualRows + '</span></div>';
      content += '<div class="detail-item"><span class="detail-label">Loops:</span> <span class="detail-value">' + d.data.details.loops + '</span></div>';

      if (d.data.details.estimationOff) {
        const accuracy = d.data.details.estimationAccuracy;
        content += '<div class="detail-item"><span class="detail-warning">⚠ Estimation Off: ' + (accuracy < 1 ? 'underestimated' : 'overestimated') + ' by ' + (Math.abs(1 - accuracy) * 100).toFixed(0) + '%</span></div>';
      }
      content += '</div>';

      // Join Conditions
      if (d.data.details.hashCond || d.data.details.joinFilter) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Join Conditions</div>';
        if (d.data.details.hashCond) {
          content += '<div class="detail-item"><span class="detail-label">Hash Cond:</span> <span class="detail-value">' + d.data.details.hashCond + '</span></div>';
        }
        if (d.data.details.joinFilter) {
          content += '<div class="detail-item"><span class="detail-label">Join Filter:</span> <span class="detail-value">' + d.data.details.joinFilter + '</span></div>';
        }
        if (d.data.details.innerUnique !== null) {
          content += '<div class="detail-item"><span class="detail-label">Inner Unique:</span> <span class="detail-value">' + d.data.details.innerUnique + '</span></div>';
        }
        content += '</div>';
      }

      // Sort Info
      if (d.data.details.sortKey) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Sort Info</div>';
        content += '<div class="detail-item"><span class="detail-label">Sort Key:</span> <span class="detail-value">' + d.data.details.sortKey + '</span></div>';
        if (d.data.details.sortMethod) {
          content += '<div class="detail-item"><span class="detail-label">Method:</span> <span class="detail-value">' + d.data.details.sortMethod + '</span></div>';
        }
        if (d.data.details.sortSpaceUsed) {
          content += '<div class="detail-item"><span class="detail-label">Space:</span> <span class="detail-value">' + d.data.details.sortSpaceUsed + ' kB (' + d.data.details.sortSpaceType + ')</span></div>';
        }
        content += '</div>';
      }

      // Aggregate/Hash Info
      if (d.data.details.strategy || d.data.details.groupKey) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Aggregate Info</div>';
        if (d.data.details.strategy) {
          content += '<div class="detail-item"><span class="detail-label">Strategy:</span> <span class="detail-value">' + d.data.details.strategy + '</span></div>';
        }
        if (d.data.details.groupKey) {
          content += '<div class="detail-item"><span class="detail-label">Group Key:</span> <span class="detail-value">' + d.data.details.groupKey + '</span></div>';
        }
        if (d.data.details.peakMemoryUsage) {
          content += '<div class="detail-item"><span class="detail-label">Peak Memory:</span> <span class="detail-value">' + d.data.details.peakMemoryUsage + ' kB</span></div>';
        }
        if (d.data.details.hashAggBatches) {
          content += '<div class="detail-item"><span class="detail-label">Hash Batches:</span> <span class="detail-value">' + d.data.details.hashAggBatches + '</span></div>';
        }
        if (d.data.details.hashBuckets) {
          content += '<div class="detail-item"><span class="detail-label">Hash Buckets:</span> <span class="detail-value">' + d.data.details.hashBuckets + '</span></div>';
        }
        content += '</div>';
      }

      // Parallel Query Info
      if (d.data.details.workersPlanned || d.data.details.workersLaunched) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Parallel Execution</div>';
        if (d.data.details.workersPlanned) {
          content += '<div class="detail-item"><span class="detail-label">Workers Planned:</span> <span class="detail-value">' + d.data.details.workersPlanned + '</span></div>';
        }
        if (d.data.details.workersLaunched) {
          content += '<div class="detail-item"><span class="detail-label">Workers Launched:</span> <span class="detail-value">' + d.data.details.workersLaunched + '</span></div>';
        }
        content += '</div>';
      }

      // Filter & Selectivity
      if (d.data.details.filter || d.data.details.rowsRemovedByFilter !== null) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Filter</div>';
        if (d.data.details.filter) {
          content += '<div class="detail-item"><span class="detail-label">Condition:</span> <span class="detail-value">' + d.data.details.filter + '</span></div>';
        }
        if (d.data.details.rowsRemovedByFilter !== null) {
          content += '<div class="detail-item"><span class="detail-label">Rows Removed:</span> <span class="detail-value">' + d.data.details.rowsRemovedByFilter + '</span></div>';
          const totalRows = d.data.details.actualRows + d.data.details.rowsRemovedByFilter;
          const selectivity = totalRows > 0 ? ((d.data.details.actualRows / totalRows) * 100).toFixed(1) : 0;
          content += '<div class="detail-item"><span class="detail-label">Selectivity:</span> <span class="detail-value">' + selectivity + '%</span></div>';
        }
        if (d.data.details.rowsRemovedByJoinFilter !== null) {
          content += '<div class="detail-item"><span class="detail-label">Rows Removed (Join):</span> <span class="detail-value">' + d.data.details.rowsRemovedByJoinFilter + '</span></div>';
        }
        content += '</div>';
      }

      // Index-Specific Info
      if (d.data.details.heapFetches || d.data.details.exactHeapBlocks || d.data.details.lossyHeapBlocks) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Index Scan Details</div>';
        if (d.data.details.heapFetches) {
          content += '<div class="detail-item"><span class="detail-label">Heap Fetches:</span> <span class="detail-value">' + d.data.details.heapFetches + '</span></div>';
        }
        if (d.data.details.exactHeapBlocks) {
          content += '<div class="detail-item"><span class="detail-label">Exact Heap Blocks:</span> <span class="detail-value">' + d.data.details.exactHeapBlocks + '</span></div>';
        }
        if (d.data.details.lossyHeapBlocks) {
          content += '<div class="detail-item"><span class="detail-label">Lossy Heap Blocks:</span> <span class="detail-value">' + d.data.details.lossyHeapBlocks + '</span></div>';
        }
        content += '</div>';
      }

      // Buffer Info (Enhanced)
      const hasBufferInfo = d.data.details.sharedHitBlocks > 0 ||
                           d.data.details.sharedReadBlocks > 0 ||
                           d.data.details.sharedDirtiedBlocks > 0 ||
                           d.data.details.sharedWrittenBlocks > 0 ||
                           d.data.details.localHitBlocks > 0 ||
                           d.data.details.localReadBlocks > 0 ||
                           d.data.details.tempReadBlocks > 0 ||
                           d.data.details.tempWrittenBlocks > 0;

      if (hasBufferInfo) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Buffers</div>';

        // Shared buffers
        if (d.data.details.sharedHitBlocks > 0 || d.data.details.sharedReadBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Hit:</span> <span class="detail-value">' + d.data.details.sharedHitBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Shared Read:</span> <span class="detail-value">' + d.data.details.sharedReadBlocks + ' blocks</span></div>';

          if (d.data.details.sharedReadBlocks > 0) {
            const hitRate = (d.data.details.sharedHitBlocks / (d.data.details.sharedHitBlocks + d.data.details.sharedReadBlocks) * 100).toFixed(1);
            content += '<div class="detail-item"><span class="detail-label">Cache Hit Rate:</span> <span class="detail-value">' + hitRate + '%</span></div>';
          }
        }

        if (d.data.details.sharedDirtiedBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Dirtied:</span> <span class="detail-value">' + d.data.details.sharedDirtiedBlocks + ' blocks</span></div>';
        }
        if (d.data.details.sharedWrittenBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Shared Written:</span> <span class="detail-value">' + d.data.details.sharedWrittenBlocks + ' blocks</span></div>';
        }

        // Local buffers
        if (d.data.details.localHitBlocks > 0 || d.data.details.localReadBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Local Hit:</span> <span class="detail-value">' + d.data.details.localHitBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Local Read:</span> <span class="detail-value">' + d.data.details.localReadBlocks + ' blocks</span></div>';
        }

        // Temp buffers
        if (d.data.details.tempReadBlocks > 0 || d.data.details.tempWrittenBlocks > 0) {
          content += '<div class="detail-item"><span class="detail-label">Temp Read:</span> <span class="detail-value">' + d.data.details.tempReadBlocks + ' blocks</span></div>';
          content += '<div class="detail-item"><span class="detail-label">Temp Written:</span> <span class="detail-value">' + d.data.details.tempWrittenBlocks + ' blocks</span></div>';
        }

        content += '</div>';
      }

      // I/O Timing
      if (d.data.details.ioReadTime !== null || d.data.details.ioWriteTime !== null) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">I/O Timing</div>';
        if (d.data.details.ioReadTime !== null) {
          content += '<div class="detail-item"><span class="detail-label">Read Time:</span> <span class="detail-value">' + d.data.details.ioReadTime.toFixed(3) + ' ms</span></div>';
        }
        if (d.data.details.ioWriteTime !== null) {
          content += '<div class="detail-item"><span class="detail-label">Write Time:</span> <span class="detail-value">' + d.data.details.ioWriteTime.toFixed(3) + ' ms</span></div>';
        }
        content += '</div>';
      }

      // Output Columns (if VERBOSE)
      if (d.data.details.output) {
        content += '<div class="detail-section">';
        content += '<div class="detail-section-title">Output</div>';
        content += '<div class="detail-item"><pre style="margin: 0; background: #282c34; padding: 8px; border-radius: 4px; overflow-x: auto;"><code class="language-sql" style="font-size: 11px;">' + d.data.details.output + '</code></pre></div>';
        content += '</div>';
      }

      document.getElementById('nodeDetails').innerHTML = content;

      // Apply syntax highlighting to the output field
      if (d.data.details.output && typeof hljs !== 'undefined') {
        document.querySelectorAll('#nodeDetails code.language-sql').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    }

    // Set up dimensions for vertical tree
    const margin = {top: 40, right: 40, bottom: 40, left: 40};
    const container = document.getElementById('tree-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const width = Math.max(containerWidth, 1200) - margin.left - margin.right;
    const height = Math.max(containerHeight, 800) - margin.top - margin.bottom;

    // Define node dimensions (needed for layout calculations)
    const nodeWidth = 180;
    const nodeHeight = 90;

    // Create SVG with viewBox for better scaling
    const svgContainer = d3.select('#tree-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom));

    // Create main group for zoom/pan
    const svg = svgContainer.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Create tree layout - reduce height to account for last node height
    const tree = d3.tree().size([width, height - nodeHeight]);

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    const treeLayout = tree(root);

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Min zoom: 10%, Max zoom: 400%
      .on('zoom', (event) => {
        svg.attr('transform', 'translate(' + margin.left + ',' + margin.top + ') ' + event.transform);
      });

    // Apply zoom to SVG
    svgContainer.call(zoom);

    // Zoom control buttons
    document.getElementById('zoom-in').addEventListener('click', () => {
      svgContainer.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      svgContainer.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    document.getElementById('zoom-reset').addEventListener('click', () => {
      svgContainer.transition().duration(300).call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
    });

    // Draw links (vertical tree) - connect to rectangle edges
    const links = svg.selectAll('.link')
      .data(treeLayout.links())
      .enter()
      .append('g');

    links.append('path')
      .attr('class', 'link')
      .attr('d', d => {
        // Custom path to connect bottom of parent to top of child
        return d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y)({
            source: {x: d.source.x, y: d.source.y + nodeHeight},
            target: {x: d.target.x, y: d.target.y}
          });
      });

    // Add edge labels (join conditions, etc.)
    links.each(function(d) {
      if (d.target.data.edgeLabel) {
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + nodeHeight + d.target.y) / 2;

        d3.select(this)
          .append('text')
          .attr('class', 'edge-label')
          .attr('x', midX + 10)
          .attr('y', midY)
          .text(d.target.data.edgeLabel.length > 50 ?
                d.target.data.edgeLabel.substring(0, 50) + '...' :
                d.target.data.edgeLabel);
      }
    });

    // Draw nodes (vertical tree - use d.x, d.y normally)
    const nodes = svg.selectAll('.node')
      .data(treeLayout.descendants())
      .enter()
      .append('g')
      .attr('class', d => {
        let className = 'node';
        const cost = parseFloat(d.data.details.cost);

        // Color based purely on cost, not estimation accuracy
        if (cost > 1000) {
          className += ' expensive';
        } else if (cost > 100) {
          className += ' moderate';
        }

        return className;
      })
      .attr('transform', d => {
        const tx = d.x - nodeWidth/2;
        const ty = d.y;
        return 'translate(' + tx + ',' + ty + ')';
      });

    // Add rectangles with click handler
    nodes.append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .on('click', function(event, d) {
        event.stopPropagation();

        const rightSidebar = document.getElementById('rightSidebar');
        const wasCollapsed = rightSidebar.classList.contains('collapsed');
        const clickedSame = appState.selectedNode === this.parentNode;

        // Clear previous selection
        if (appState.selectedNode) {
          d3.select(appState.selectedNode).select('rect').classed('selected', false);
        }

        // If clicking same node, collapse sidebar
        if (clickedSame && !wasCollapsed) {
          toggleSidebar('right');
          appState.selectedNode = null;
          return;
        }

        // Select new node
        d3.select(this).classed('selected', true);
        appState.selectedNode = this.parentNode;

        // Open sidebar if collapsed
        if (wasCollapsed) {
          rightSidebar.classList.remove('collapsed');
          appState.rightSidebarCollapsed = false;
          saveState();
        }

        // Update sidebar content
        populateNodeDetails(d);
      });

    // Add text inside rectangles

    // Node Type (title)
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 18)
      .attr('class', 'node-type')
      .attr('text-anchor', 'middle')
      .text(d => d.data.name);

    // Alias/Table (subtitle)
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 32)
      .attr('class', 'node-alias')
      .attr('text-anchor', 'middle')
      .text(d => {
        if (d.data.details.joinType) return d.data.details.joinType + ' Join';
        if (d.data.details.strategy) return d.data.details.strategy;
        if (d.data.details.alias) return d.data.details.alias;
        if (d.data.details.relation) return d.data.details.relation;
        return '';
      });

    // Cost metric
    nodes.append('text')
      .attr('x', 8)
      .attr('y', 52)
      .attr('class', 'node-metric')
      .text(d => 'Cost: ' + d.data.details.cost);

    // Rows metric
    nodes.append('text')
      .attr('x', 8)
      .attr('y', 65)
      .attr('class', 'node-metric')
      .text(d => 'Rows: ' + d.data.details.actualRows);

    // Time metric
    nodes.append('text')
      .attr('x', 8)
      .attr('y', 78)
      .attr('class', 'node-metric')
      .text(d => {
        if (d.data.details.actualTime !== 'N/A') {
          return 'Time: ' + d.data.details.actualTime + ' ms';
        }
        return 'Time: N/A';
      });

    // Estimation warning (if applicable)
    nodes.filter(d => d.data.details.estimationOff)
      .append('text')
      .attr('x', nodeWidth - 8)
      .attr('y', 52)
      .attr('text-anchor', 'end')
      .attr('class', 'node-metric')
      .style('fill', '#ff9800')
      .text('⚠');

    // Initialize syntax highlighting for the query
    if (typeof hljs !== 'undefined') {
      hljs.highlightAll();
    }
  </script>
</body>
</html>`;
}

// Export function
global.runExplain = runExplain;
