/**
 * CTE Tree Extractor
 * Separates CTE subtrees from main tree to create forest layout
 */

import { EnrichedNode, CTEMetadata } from '../../../../types/plan-data';

export interface ForestLayout {
  mainTree: EnrichedNode;
  cteTrees: Array<{
    cteName: string;
    tree: EnrichedNode;
  }>;
  cteReferences: Array<{
    nodeId: string;
    cteName: string;
    targetCTENodeId: string;
  }>;
}

export class CTETreeExtractor {
  /**
   * Extract CTE subtrees from main tree
   * @param tree - Original enriched tree
   * @param cteMetadata - CTE relationship metadata
   * @returns ForestLayout with separated trees
   */
  extract(tree: EnrichedNode, cteMetadata: CTEMetadata): ForestLayout {
    // Deep clone tree to avoid mutation
    const clonedTree = this.deepClone(tree);

    // Extract CTE trees and remove them from main tree
    const cteTrees: Array<{ cteName: string; tree: EnrichedNode }> = [];
    const cteNodesToRemove = new Set<string>();

    // Identify all CTE root node IDs to remove
    cteMetadata.cteDefinitions.forEach((cteInfo, cteName) => {
      cteNodesToRemove.add(cteInfo.rootNodeId);
    });

    // Extract CTE trees
    cteMetadata.cteDefinitions.forEach((cteInfo, cteName) => {
      const cteNode = this.findNodeById(clonedTree, cteInfo.rootNodeId);
      if (cteNode) {
        cteTrees.push({
          cteName,
          tree: cteNode
        });
      }
    });

    // Remove CTE subtrees from main tree
    this.removeCTENodes(clonedTree, cteNodesToRemove);

    return {
      mainTree: clonedTree,
      cteTrees,
      cteReferences: [...cteMetadata.cteReferences]
    };
  }

  /**
   * Deep clone a node and its children
   */
  private deepClone(node: EnrichedNode): EnrichedNode {
    const cloned: EnrichedNode = {
      ...node,
      children: node.children ? node.children.map(child => this.deepClone(child)) : []
    };
    return cloned;
  }

  /**
   * Find a node by ID in the tree
   */
  private findNodeById(node: EnrichedNode, targetId: string): EnrichedNode | null {
    if (node.id === targetId) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, targetId);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Remove CTE nodes from tree (recursively)
   */
  private removeCTENodes(node: EnrichedNode, cteNodeIds: Set<string>): void {
    if (!node.children) return;

    // Filter out children that are CTE root nodes
    node.children = node.children.filter(child => !cteNodeIds.has(child.id || ''));

    // Recursively remove from remaining children
    node.children.forEach(child => this.removeCTENodes(child, cteNodeIds));
  }
}
