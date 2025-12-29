/**
 * Sidebar component
 * Generic sidebar container with header and content
 */

/**
 * Render a sidebar
 * @param {Object} options - Sidebar options
 * @param {string} options.side - 'left' or 'right'
 * @param {string} options.id - Sidebar ID
 * @param {string} options.content - Sidebar content HTML
 * @param {boolean} options.collapsed - Initially collapsed?
 * @param {string} options.collapseIcon - Icon for collapse button
 * @returns {string} HTML string
 */
export function renderSidebar({ side, id, content, collapsed = false, collapseIcon = '◀' }) {
  const collapsedClass = collapsed ? ' collapsed' : '';

  return `
    <div class="sidebar ${side}-sidebar${collapsedClass}" id="${id}">
      <div class="sidebar-header">
        <button class="collapse-btn" id="${id}CollapseBtn" title="Toggle sidebar">${collapseIcon}</button>
      </div>
      <div class="sidebar-content">
        ${content}
      </div>
    </div>
  `;
}
