/**
 * Interaction handlers module
 * Generates event handler code for node interactions
 */

/**
 * Generate interaction handlers code
 * @returns {string} JavaScript code for interactions
 */
export function getInteractionsCode() {
  return `
  // Node click handler
  function onNodeClick(event, d) {
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
      document.getElementById('rightSidebarCollapseBtn').textContent = '✕';
      saveState();
    }

    // Update sidebar content
    populateNodeDetails(d);
  }
  `;
}
