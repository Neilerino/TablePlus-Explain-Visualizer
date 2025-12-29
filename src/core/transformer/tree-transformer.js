/**
 * Tree transformation module
 * Converts PostgreSQL EXPLAIN plan to D3.js tree hierarchy format
 */

import { enrichNode } from './node-enricher.js';
import { determineEdgeLabel } from './edge-labeler.js';

/**
 * Transform PostgreSQL EXPLAIN plan to D3 tree format
 * @param {Object} planData - Parsed EXPLAIN plan data
 * @returns {Object} D3-compatible tree structure
 */
export function transformToD3Tree(planData) {
  return processNode(planData.Plan, null);
}

/**
 * Recursively process a plan node and its children
 * @param {Object} node - Plan node to process
 * @param {Object} parent - Parent node (null for root)
 * @returns {Object} D3 tree node
 */
function processNode(node, parent) {
  // Enrich the node with computed properties
  const enrichedNode = enrichNode(node);

  // Determine edge label if this node has a parent
  const edgeLabel = determineEdgeLabel(node, parent);

  // Create D3 node structure
  const d3Node = {
    ...enrichedNode,
    children: [],
    edgeLabel: edgeLabel
  };

  // Recursively process child nodes
  if (node.Plans && node.Plans.length > 0) {
    d3Node.children = node.Plans.map(childPlan => processNode(childPlan, node));
  }

  return d3Node;
}
