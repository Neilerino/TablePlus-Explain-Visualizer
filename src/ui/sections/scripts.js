/**
 * Scripts section
 * Generates embedded JavaScript for the visualization
 */

import { getNodeDetailsPopulatorCode } from '../components/node-details.js';

/**
 * Render the scripts section
 * @param {string} treeJson - JSON string of tree data
 * @param {string} visualizationCode - D3 visualization code
 * @returns {string} HTML string
 */
export function renderScripts(treeJson, visualizationCode) {
  return `
<script>
  console.log('Script is running!');
  console.log('Visualization code length:', '${visualizationCode ? visualizationCode.length : 0}');
  const treeData = ${treeJson};

  // Wait for DOM to be ready
  function initializeApp() {
    console.log('DOM ready, initializing...');

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

  loadState();

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

  // Initialize collapse buttons
  document.getElementById('leftSidebarCollapseBtn').addEventListener('click', () => toggleSidebar('left'));
  document.getElementById('rightSidebarCollapseBtn').addEventListener('click', () => toggleSidebar('right'));

  // Apply saved collapsed state
  if (appState.leftSidebarCollapsed) {
    document.getElementById('leftSidebar').classList.add('collapsed');
    document.getElementById('leftSidebarCollapseBtn').textContent = '▶';
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

  initResizeHandles();

  // Apply saved widths
  document.getElementById('leftSidebar').style.width = appState.leftSidebarWidth + 'px';
  document.getElementById('rightSidebar').style.width = appState.rightSidebarWidth + 'px';

  // ============================================
  // NODE DETAILS POPULATION
  // ============================================
  ${getNodeDetailsPopulatorCode()}

  // ============================================
  // D3 VISUALIZATION
  // ============================================
  ${visualizationCode}

  // Initialize syntax highlighting
  if (typeof hljs !== 'undefined') {
    hljs.highlightAll();
  }

  } // End initializeApp

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM already loaded
    initializeApp();
  }
</script>
  `;
}
