import { getZoomControlsCode } from './zoom-controls.js';
import { getInteractionsCode } from './interactions.js';
import { getLinkRendererCode } from './link-renderer.js';
import { getNodeRendererCode } from './node-renderer.js';

/**
 * Generate complete D3 tree visualization code
 * @returns {string} JavaScript code for D3 tree rendering
 */
export function getTreeVisualizationCode() {
  return `
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

  ${getInteractionsCode()}

  ${getLinkRendererCode()}

  ${getNodeRendererCode()}

  ${getZoomControlsCode()}
  `;
}
