/**
 * Index Scan Node
 * Represents an index scan operation
 */

import { BaseExplainNode } from './base-node.entity';

export class IndexScanNode extends BaseExplainNode {
  get nodeType(): string {
    return 'Index Scan';
  }

  // ============================================
  // Table Information
  // ============================================

  get schema(): string | null {
    return this.details.schema || null;
  }

  get tableName(): string | null {
    return this.details.relation || null;
  }

  get alias(): string | null {
    return this.details.alias || null;
  }

  // ============================================
  // Index Information
  // ============================================

  get indexName(): string | null {
    return this.details.indexName || null;
  }

  get scanDirection(): string | null {
    return this.details.scanDirection || null;
  }

  get indexCondition(): string | null {
    return this.details.indexCond || null;
  }

  // ============================================
  // Filter Information
  // ============================================

  get filter(): string | null {
    return this.details.filter || null;
  }

  get rowsRemovedByFilter(): number | null {
    return this.details.rowsRemovedByFilter !== undefined
      ? this.details.rowsRemovedByFilter
      : null;
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Calculate filter selectivity (percentage of rows kept)
   */
  get filterSelectivity(): number | null {
    if (this.rowsRemovedByFilter === null) return null;

    const totalRows = this.actualRows + this.rowsRemovedByFilter;
    if (totalRows === 0) return null;

    return (this.actualRows / totalRows) * 100;
  }

  /**
   * Check if this scan has a filter
   */
  get hasFilter(): boolean {
    return this.filter !== null;
  }

  /**
   * Check if this scan has an index condition
   */
  get hasIndexCondition(): boolean {
    return this.indexCondition !== null;
  }

  /**
   * Get full table name (schema.table or just table)
   */
  get fullTableName(): string {
    if (this.schema && this.tableName) {
      return `${this.schema}.${this.tableName}`;
    }
    return this.tableName || 'unknown';
  }

  /**
   * Check if scan is using backward direction
   */
  get isBackwardScan(): boolean {
    return this.scanDirection === 'Backward';
  }
}
