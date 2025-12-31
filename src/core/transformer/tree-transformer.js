import { enrichNode } from './node-enricher.js';
import { determineEdgeLabel } from './edge-labeler.js';
import { calculateCriticalPath, assignNodeIds } from '../analysis/index.ts';

export function transformToD3Tree(planData) {
  const tree = processNode(planData.Plan, null);

  // Assign unique IDs to all nodes
  assignNodeIds(tree);

  // Calculate critical path (default: execution time)
  const criticalPath = calculateCriticalPath(tree, 'time');

  // Extract root metrics for percentage calculations
  const rootCost = planData.Plan['Total Cost'] || 0;
  const rootTime = planData.Plan['Actual Total Time'] || 0;

  return {
    tree,
    criticalPath,
    rootCost,
    rootTime
  };
}

function processNode(node, parent) {
  const enrichedNode = enrichNode(node);
  const edgeLabel = determineEdgeLabel(node, parent);

  const d3Node = {
    ...enrichedNode,
    children: [],
    edgeLabel: edgeLabel
  };

  if (node.Plans && node.Plans.length > 0) {
    d3Node.children = node.Plans.map(childPlan => processNode(childPlan, node));
  }

  return d3Node;
}
