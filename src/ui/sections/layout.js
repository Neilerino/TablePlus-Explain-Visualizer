import { renderSidebar } from '../components/sidebar.js';
import { renderQueryPanel } from '../components/query-panel.js';
import { renderStatsPanel } from '../components/stats-panel.js';

/**
 * Render the main application layout
 * @param {string} query - Original SQL query
 * @param {Object} planData - Plan data for stats
 * @returns {string} HTML string
 */
export function renderLayout(query, planData) {
  // Left sidebar content
  const leftContent = `
    ${renderQueryPanel(query)}
    ${renderStatsPanel(planData)}
  `;

  // Right sidebar content (empty state - populated by JavaScript)
  const rightContent = `
    <div class="empty-state">
      <p>Click a node to view details</p>
    </div>
  `;

  return `
<body>
  <div class="app-container">
    <!-- LEFT SIDEBAR -->
    ${renderSidebar({
      side: 'left',
      id: 'leftSidebar',
      content: leftContent,
      collapsed: false,
      collapseIcon: '◀'
    })}

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
    ${renderSidebar({
      side: 'right',
      id: 'rightSidebar',
      content: '<div id="nodeDetails">' + rightContent + '</div>',
      collapsed: true,
      collapseIcon: '✕'
    })}
  </div>
</body>
  `;
}
