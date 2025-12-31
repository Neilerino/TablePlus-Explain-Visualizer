/**
 * Main D3 tree visualization renderer
 */
import { renderLinks } from './link-renderer.js';
import { renderNodes } from './node-renderer.js';
import { setupZoomControls } from './zoom-controls.js';
import { setupNodeClickHandler } from './interactions.js';
import { CriticalPathVisualizer } from '../services/critical-path-visualizer.ts';

/**
 * Render the D3 tree visualization
 * @param {Object} d3 - D3 library
 * @param {Object} treeData - Hierarchical tree data
 * @param {Object} appState - Application state
 * @param {Function} toggleSidebar - Function to toggle sidebar
 * @param {Function} populateNodeDetails - Function to populate node details
 * @param {Function} saveState - Function to save state
 * @param {Array} criticalPath - Critical path nodes (optional)
 */
export function renderTree(d3, treeData, appState, toggleSidebar, populateNodeDetails, saveState, criticalPath = []) {
  // Set up dimensions for vertical tree
  const margin = {top: 40, right: 40, bottom: 40, left: 40};
  const container = document.getElementById('tree-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const width = Math.max(containerWidth, 1200) - margin.left - margin.right;
  const height = Math.max(containerHeight, 800) - margin.top - margin.bottom;

  // Define node dimensions
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

  // Setup node click handler
  const onNodeClick = setupNodeClickHandler(d3, appState, toggleSidebar, populateNodeDetails, saveState);

  // Render links
  renderLinks(d3, svg, treeLayout, nodeHeight);

  // Render nodes
  renderNodes(d3, svg, treeLayout, nodeWidth, nodeHeight, onNodeClick);

  // Setup zoom controls
  setupZoomControls(d3, svgContainer, svg, margin);

  // Always create critical path visualizer (even if disabled initially)
  if (criticalPath && criticalPath.length > 0) {
    const visualizer = new CriticalPathVisualizer(d3, svg);

    // Store visualizer in appState for later toggling
    appState.criticalPathVisualizer = visualizer;

    // Apply highlighting if enabled
    if (appState.criticalPathEnabled) {
      visualizer.highlightPath(criticalPath);
    }
  }
}
