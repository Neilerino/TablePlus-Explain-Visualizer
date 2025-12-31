/**
 * Main application logic for PostgreSQL EXPLAIN Visualizer
 */
import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css'; // Add syntax highlighting theme
import { renderTree } from './visualization/tree-renderer.js';
import { populateNodeDetails } from './ui/node-details.js';
import { populateStatsPanel } from './ui/stats-panel.js';
import { populateQueryPanel } from './ui/query-panel.js';
import { ViewManager } from './services/view-manager.ts';
import { GridAdapter } from './services/grid-adapter.ts';
import { GridRenderer } from './visualization/grid-renderer.ts';
import { renderViewToggle } from './ui/view-toggle.ts';
import { renderCriticalPathControl } from './ui/critical-path-control.ts';

// Register SQL language for syntax highlighting
hljs.registerLanguage('sql', sql);

// ============================================
// STATE MANAGEMENT
// ============================================
const appState = {
  leftSidebarWidth: 350,
  rightSidebarWidth: 400,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: true,
  selectedNode: null,
  viewManager: null,
  gridRenderer: null,
  criticalPathEnabled: false,
  criticalPath: [],
  criticalPathVisualizer: null
};

// Load saved state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('pgexplain-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(appState, parsed);
    }
  } catch (e) {
    console.log('State persistence not available');
  }
}

// Save state to localStorage
function saveState() {
  try {
    localStorage.setItem('pgexplain-state', JSON.stringify({
      leftSidebarWidth: appState.leftSidebarWidth,
      rightSidebarWidth: appState.rightSidebarWidth,
      leftSidebarCollapsed: appState.leftSidebarCollapsed,
      rightSidebarCollapsed: appState.rightSidebarCollapsed
    }));
  } catch (e) {
    // localStorage not available - that's OK
  }
}

// ============================================
// SIDEBAR COLLAPSE/EXPAND
// ============================================
function toggleSidebar(side) {
  const sidebar = document.getElementById(side === 'left' ? 'leftSidebar' : 'rightSidebar');
  const isCollapsed = sidebar.classList.contains('collapsed');
  const btn = document.getElementById(side === 'left' ? 'leftSidebarCollapseBtn' : 'rightSidebarCollapseBtn');

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

// ============================================
// MAIN INITIALIZATION
// ============================================
export function initializeApp() {
  console.log('Initializing PostgreSQL EXPLAIN Visualizer...');

  loadState();

  // Initialize collapse buttons
  document.getElementById('leftSidebarCollapseBtn').addEventListener('click', () => toggleSidebar('left'));
  document.getElementById('rightSidebarCollapseBtn').addEventListener('click', () => toggleSidebar('right'));

  // Apply saved collapsed state
  if (appState.leftSidebarCollapsed) {
    document.getElementById('leftSidebar').classList.add('collapsed');
    document.getElementById('leftSidebarCollapseBtn').textContent = '▶';
  }

  // Initialize resize handles
  initResizeHandles();

  // Apply saved widths
  document.getElementById('leftSidebar').style.width = appState.leftSidebarWidth + 'px';
  document.getElementById('rightSidebar').style.width = appState.rightSidebarWidth + 'px';

  console.log('App initialized successfully');
}

// ============================================
// RENDER FUNCTION (Called by plugin via window.ExplainViz.render)
// ============================================
export function renderVisualization(data) {
  const { query, planData, treeData, criticalPath = [], rootCost = 0, rootTime = 0 } = data;

  console.log('Rendering visualization with data:', { query, planData, treeData, criticalPath });

  // Initialize View Manager if not already done
  if (!appState.viewManager) {
    appState.viewManager = new ViewManager();
    appState.viewManager.setCriticalPath(criticalPath);
  }

  // Store critical path in appState
  appState.criticalPath = criticalPath;

  // Populate query panel
  populateQueryPanel(query, hljs);

  // Populate stats panel
  populateStatsPanel(planData);

  // Add critical path control to stats panel
  const statsContainer = document.getElementById('statsContainer');
  renderCriticalPathControl(statsContainer, appState.viewManager);

  // Add view toggle
  const viewToggleContainer = document.getElementById('viewToggleContainer');
  if (viewToggleContainer) {
    renderViewToggle(viewToggleContainer, appState.viewManager);
  }

  // Subscribe to view manager state changes
  appState.viewManager.subscribe((state) => {
    handleViewChange(state, { query, planData, treeData, criticalPath, rootCost, rootTime });
  });

  // Subscribe to critical path toggle
  appState.viewManager.subscribe((state) => {
    appState.criticalPathEnabled = state.criticalPathEnabled;
    if (appState.criticalPathVisualizer) {
      appState.criticalPathVisualizer.toggle(state.criticalPathEnabled, criticalPath);
    }
  });

  // Wrapper for populateNodeDetails that includes hljs
  const populateNodeDetailsWithHljs = (d) => populateNodeDetails(d, hljs);

  // Initial render: graph view
  renderGraphView(treeData, criticalPath, populateNodeDetailsWithHljs);

  // Initialize syntax highlighting for query
  if (hljs) {
    hljs.highlightAll();
  }

  console.log('Visualization rendered successfully');
}

/**
 * Render graph view
 */
function renderGraphView(treeData, criticalPath, populateNodeDetailsWithHljs) {
  const treeContainer = document.getElementById('tree-container');
  const gridContainer = document.getElementById('grid-container');
  const zoomControls = document.querySelector('.zoom-controls');

  // Show graph, hide grid
  treeContainer.style.display = 'flex';
  gridContainer.style.display = 'none';

  // Show zoom controls for graph view
  if (zoomControls) {
    zoomControls.style.display = 'flex';
  }

  // Clear and re-render tree
  treeContainer.innerHTML = '';
  renderTree(d3, treeData, appState, toggleSidebar, populateNodeDetailsWithHljs, saveState, criticalPath);
}

/**
 * Render grid view
 */
function renderGridView(treeData, planData, rootCost, rootTime, populateNodeDetailsWithHljs) {
  console.log('renderGridView called', { treeData, planData, rootCost, rootTime });

  const treeContainer = document.getElementById('tree-container');
  const gridContainer = document.getElementById('grid-container');
  const zoomControls = document.querySelector('.zoom-controls');

  // Hide graph, show grid
  treeContainer.style.display = 'none';
  gridContainer.style.display = 'flex';

  // Hide zoom controls for grid view
  if (zoomControls) {
    zoomControls.style.display = 'none';
  }

  console.log('Grid container dimensions:', gridContainer.clientWidth, 'x', gridContainer.clientHeight);

  // Initialize grid if needed
  if (!appState.gridRenderer) {
    console.log('Creating new GridRenderer');
    appState.gridRenderer = new GridRenderer(gridContainer, appState.viewManager);
  }

  // Transform data for grid
  console.log('Transforming data for grid...');
  const gridConfig = GridAdapter.toGridData(treeData, planData);
  console.log('Grid config:', gridConfig, 'Row count:', gridConfig.rowData.length);

  // Render grid
  console.log('Rendering grid...');
  appState.gridRenderer.render(gridConfig, (rowData) => {
    // Handle row click - populate node details
    populateNodeDetailsWithHljs({ data: rowData._node });

    // Open right sidebar if collapsed
    const rightSidebar = document.getElementById('rightSidebar');
    if (rightSidebar.classList.contains('collapsed')) {
      toggleSidebar('right');
    }
  });
  console.log('Grid render complete');
}

/**
 * Handle view changes from ViewManager
 */
function handleViewChange(state, visualizationData) {
  console.log('handleViewChange called', { currentView: state.currentView });

  const { query, planData, treeData, criticalPath, rootCost, rootTime } = visualizationData;
  const populateNodeDetailsWithHljs = (d) => populateNodeDetails(d, hljs);

  if (state.currentView === 'graph') {
    console.log('Switching to graph view');
    renderGraphView(treeData, criticalPath, populateNodeDetailsWithHljs);
  } else if (state.currentView === 'grid') {
    console.log('Switching to grid view');
    renderGridView(treeData, planData, rootCost, rootTime, populateNodeDetailsWithHljs);
  }

  // Sync selection if node is selected
  if (state.selectedNodeId && state.currentView === 'grid' && appState.gridRenderer) {
    appState.gridRenderer.selectNode(state.selectedNodeId);
  }
}
