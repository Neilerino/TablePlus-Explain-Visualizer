import { enrichNode } from './node-enricher.js';
import { determineEdgeLabel } from './edge-labeler.js';

export function transformToD3Tree(planData) {
  return processNode(planData.Plan, null);
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
