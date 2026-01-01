/**
 * Sequential Scan Node Details Component
 * Specialized component for rendering Seq Scan node details
 */

import { BaseNodeDetailsComponent } from './base-node-details.component';
import { SeqScanNode } from '../../../domain/entities/explain-nodes/seq-scan.entity';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class SeqScanDetailsComponent extends BaseNodeDetailsComponent {
  /**
   * Render a Sequential Scan node's details
   */
  renderNode(node: BaseExplainNode): void {
    if (!(node instanceof SeqScanNode)) {
      this.clear();
      return;
    }

    let content = '';
    content += this.renderTitle(node);
    content += this.renderTableInfo(node);
    content += this.renderCostTiming(node);
    content += this.renderRowsInfo(node);
    content += this.renderParallelInfo(node);
    content += this.renderFilterInfo(node);
    content += this.renderBufferInfo(node);
    content += this.renderIOTiming(node);
    content += this.renderOutputInfo(node);

    this.container.innerHTML = content;
    this.applySyntaxHighlighting();
  }

  // ============================================
  // Seq Scan Specific Rendering
  // ============================================

  private renderTableInfo(node: SeqScanNode): string {
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

  private renderFilterInfo(node: SeqScanNode): string {
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
}
