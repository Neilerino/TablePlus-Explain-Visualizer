/**
 * Generic Node
 * Fallback entity for node types that don't have specialized classes
 */

import { BaseExplainNode } from './base-node.entity';

export class GenericNode extends BaseExplainNode {
  get nodeType(): string {
    // Try to get node type from various possible locations in raw data
    return this.details.nodeType ||
           this.rawData.nodeType ||
           this.name ||
           'Unknown';
  }

  // ============================================
  // Generic Access
  // ============================================

  /**
   * Get any detail property by key
   * Useful for accessing node-specific properties not in BaseExplainNode
   */
  getDetail(key: string): any {
    return this.details[key];
  }

  /**
   * Check if a detail property exists
   */
  hasDetail(key: string): boolean {
    return this.details[key] !== undefined;
  }

  /**
   * Get all available detail keys
   */
  getDetailKeys(): string[] {
    return Object.keys(this.details);
  }
}
