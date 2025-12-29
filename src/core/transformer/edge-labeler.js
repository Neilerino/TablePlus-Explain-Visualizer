/**
 * Edge labeling module
 * Determines labels for edges (relationships) between nodes
 */

/**
 * Determine the edge label for a node
 * @param {Object} node - Plan node
 * @param {Object} parent - Parent node
 * @returns {string|null} Edge label or null
 */
export function determineEdgeLabel(node, parent) {
  if (!parent) return null;

  // Priority 1: Hash condition (for hash joins)
  if (node['Hash Cond']) {
    return node['Hash Cond'];
  }

  // Priority 2: Join filter
  if (node['Join Filter']) {
    return node['Join Filter'];
  }

  // Priority 3: Parent relationship (Inner, Outer, SubPlan, etc.)
  if (node['Parent Relationship']) {
    return node['Parent Relationship'];
  }

  return null;
}
