export function determineEdgeLabel(node, parent) {
  if (!parent) return null;

  if (node['Hash Cond']) {
    return node['Hash Cond'];
  }

  if (node['Join Filter']) {
    return node['Join Filter'];
  }

  if (node['Parent Relationship']) {
    return node['Parent Relationship'];
  }

  return null;
}
