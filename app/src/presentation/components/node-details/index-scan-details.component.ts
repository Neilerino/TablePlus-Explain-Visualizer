/**
 * Index Scan Node Details Component
 * Specialized component for rendering Index Scan node details
 */

import { BaseNodeDetailsComponent } from './base-node-details.component';
import { IndexScanNode } from '../../../domain/entities/explain-nodes/index-scan.entity';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class IndexScanDetailsComponent extends BaseNodeDetailsComponent {
  /**
   * Render an Index Scan node's details
   */
  renderNode(node: BaseExplainNode): void {
    if (!(node instanceof IndexScanNode)) {
      this.clear();
      return;
    }

    let content = '';
    content += this.renderTitle(node);
    content += this.renderTableInfo(node);
    content += this.renderIndexInfo(node);
    content += this.renderCostTiming(node);
    content += this.renderRowsInfo(node);
    content += this.renderParallelInfo(node);
    content += this.renderFilterInfo(node);
    content += this.renderIndexScanDetails(node);
    content += this.renderBufferInfo(node);
    content += this.renderIOTiming(node);
    content += this.renderOutputInfo(node);

    this.container.innerHTML = content;
    this.applySyntaxHighlighting();
  }

  // ============================================
  // Index Scan Specific Rendering
  // ============================================

  private renderTableInfo(node: IndexScanNode): string {
    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Table Info</div>';

    if (node.schema) {
      content += `<div class="detail-item"><span class="detail-label">Schema:</span> <span class="detail-value">${node.schema}</span></div>`;
    }

    content += `<div class="detail-item"><span class="detail-label">Table:</span> <span class="detail-value">${node.tableName || 'unknown'}</span></div>`;

    if (node.alias) {
      content += `<div class="detail-item"><span class="detail-label">Alias:</span> <span class="detail-value">${node.alias}</span></div>`;
    }

    content += '</div>';
    return content;
  }

  private renderIndexInfo(node: IndexScanNode): string {
    if (!node.indexName && !node.indexCondition && !node.scanDirection) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Index Info</div>';

    if (node.indexName) {
      content += `<div class="detail-item"><span class="detail-label">Index:</span> <span class="detail-value">${node.indexName}</span></div>`;
    }

    if (node.indexCondition) {
      content += `<div class="detail-item"><span class="detail-label">Index Cond:</span> <span class="detail-value">${node.indexCondition}</span></div>`;
    }

    if (node.scanDirection) {
      let directionValue = node.scanDirection;
      if (node.isBackwardScan) {
        directionValue += ' ⬆';
      }
      content += `<div class="detail-item"><span class="detail-label">Scan Direction:</span> <span class="detail-value">${directionValue}</span></div>`;
    }

    content += '</div>';
    return content;
  }

  private renderFilterInfo(node: IndexScanNode): string {
    if (!node.hasFilter && node.rowsRemovedByFilter === null) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Filter</div>';

    if (node.filter) {
      content += `<div class="detail-item"><span class="detail-label">Condition:</span> <span class="detail-value">${node.filter}</span></div>`;
    }

    if (node.rowsRemovedByFilter !== null) {
      content += `<div class="detail-item"><span class="detail-label">Rows Removed:</span> <span class="detail-value">${node.rowsRemovedByFilter}</span></div>`;

      const selectivity = node.filterSelectivity;
      if (selectivity !== null) {
        content += `<div class="detail-item"><span class="detail-label">Selectivity:</span> <span class="detail-value">${selectivity.toFixed(1)}%</span></div>`;
      }
    }

    content += '</div>';
    return content;
  }

  private renderIndexScanDetails(node: IndexScanNode): string {
    const heapFetches = node.getDetail('heapFetches');
    const exactHeapBlocks = node.getDetail('exactHeapBlocks');
    const lossyHeapBlocks = node.getDetail('lossyHeapBlocks');

    if (!heapFetches && !exactHeapBlocks && !lossyHeapBlocks) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Index Scan Details</div>';

    if (heapFetches) {
      content += `<div class="detail-item"><span class="detail-label">Heap Fetches:</span> <span class="detail-value">${heapFetches}</span></div>`;
    }
    if (exactHeapBlocks) {
      content += `<div class="detail-item"><span class="detail-label">Exact Heap Blocks:</span> <span class="detail-value">${exactHeapBlocks}</span></div>`;
    }
    if (lossyHeapBlocks) {
      content += `<div class="detail-item"><span class="detail-label">Lossy Heap Blocks:</span> <span class="detail-value">${lossyHeapBlocks}</span></div>`;
    }

    content += '</div>';
    return content;
  }
}
