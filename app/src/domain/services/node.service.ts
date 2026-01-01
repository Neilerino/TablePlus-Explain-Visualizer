/**
 * Node Service
 * Single source of truth for all EXPLAIN nodes
 * Creates typed entity instances and provides O(1) lookup by ID
 */

import { BaseExplainNode } from '../entities/explain-nodes/base-node.entity';
import { SeqScanNode } from '../entities/explain-nodes/seq-scan.entity';
import { IndexScanNode } from '../entities/explain-nodes/index-scan.entity';
import { GenericNode } from '../entities/explain-nodes/generic-node.entity';

export class NodeService {
  private nodes: Map<string, BaseExplainNode> = new Map();

  /**
   * Initialize the service with tree data
   * Traverses the tree and creates typed entity instances for all nodes
   */
  initialize(treeData: any): void {
    this.nodes.clear();
    this.traverseAndCreateNodes(treeData);
  }

  /**
   * Get a node by its ID
   * @returns The typed node entity or null if not found
   */
  getNode(id: string): BaseExplainNode | null {
    return this.nodes.get(id) || null;
  }

  /**
   * Get all nodes
   * @returns Array of all node entities
   */
  getAllNodes(): BaseExplainNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Check if a node exists
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Get the total number of nodes
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Clear all nodes
   */
  clear(): void {
    this.nodes.clear();
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Recursively traverse tree and create node entities
   */
  private traverseAndCreateNodes(node: any): void {
    if (!node) return;

    // Create typed entity for this node
    const entity = this.createNodeEntity(node);
    const id = entity.id;

    if (id) {
      this.nodes.set(id, entity);
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseAndCreateNodes(child);
      }
    }
  }

  /**
   * Create the appropriate typed entity based on node type
   */
  private createNodeEntity(rawData: any): BaseExplainNode {
    // Get node type from name field (which contains the node type in our tree structure)
    const nodeType = rawData.name || rawData.data?.name || '';

    // Create specialized entity based on type
    switch (true) {
      case nodeType.includes('Seq Scan'):
        return new SeqScanNode(rawData);

      case nodeType.includes('Index Scan'):
      case nodeType.includes('Index Only Scan'):
      case nodeType.includes('Bitmap Index Scan'):
        return new IndexScanNode(rawData);

      // Add more specialized types here as we create them
      // case nodeType.includes('Hash Join'):
      //   return new HashJoinNode(rawData);
      //
      // case nodeType.includes('Aggregate'):
      //   return new AggregateNode(rawData);

      default:
        return new GenericNode(rawData);
    }
  }
}
