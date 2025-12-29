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
  selectedNode: null
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
  const { query, planData, treeData } = data;

  console.log('Rendering visualization with data:', { query, planData, treeData });

  // Populate query panel
  populateQueryPanel(query, hljs);

  // Populate stats panel
  populateStatsPanel(planData);

  // Wrapper for populateNodeDetails that includes hljs
  const populateNodeDetailsWithHljs = (d) => populateNodeDetails(d, hljs);

  // Render D3 tree visualization
  renderTree(d3, treeData, appState, toggleSidebar, populateNodeDetailsWithHljs, saveState);

  // Initialize syntax highlighting for query
  if (hljs) {
    hljs.highlightAll();
  }

  console.log('Visualization rendered successfully');
}
