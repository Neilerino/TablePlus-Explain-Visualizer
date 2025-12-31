/**
 * Utility functions for tree traversal and manipulation
 */

import { EnrichedNode } from '../../../types/plan-data';

/**
 * Type for visitor function used in tree traversal
 */
export type TreeVisitor = (node: EnrichedNode, depth: number, parent: EnrichedNode | null) => void;

/**
 * Walk through tree in depth-first order
 */
export function walkTree(
  node: EnrichedNode,
  visitor: TreeVisitor,
  depth: number = 0,
  parent: EnrichedNode | null = null
): void {
  visitor(node, depth, parent);

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      walkTree(child, visitor, depth + 1, node);
    });
  }
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(root: EnrichedNode, id: string): EnrichedNode | null {
  if (root.id === id) {
    return root;
  }

  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Get path from root to target node
 */
export function getPathToNode(root: EnrichedNode, targetNode: EnrichedNode): EnrichedNode[] {
  const path: EnrichedNode[] = [];

  function search(node: EnrichedNode): boolean {
    path.push(node);

    if (node === targetNode || node.id === targetNode.id) {
      return true;
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (search(child)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }

  search(root);
  return path;
}

/**
 * Generate unique IDs for nodes based on their path in the tree
 */
export function assignNodeIds(node: EnrichedNode, pathPrefix: string = '0'): void {
  node.id = pathPrefix;

  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      assignNodeIds(child, `${pathPrefix}-${index}`);
    });
  }
}

/**
 * Count total nodes in tree
 */
export function countNodes(node: EnrichedNode): number {
  let count = 1;

  if (node.children && node.children.length > 0) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }

  return count;
}

/**
 * Get all leaf nodes (nodes with no children)
 */
export function getLeafNodes(node: EnrichedNode): EnrichedNode[] {
  if (!node.children || node.children.length === 0) {
    return [node];
  }

  return node.children.flatMap(child => getLeafNodes(child));
}
