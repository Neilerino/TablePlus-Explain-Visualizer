/**
 * Base Node Details Component
 * Abstract base class for all specialized node detail components
 * Contains common rendering logic shared across all node types
 */

import { Component } from '../base.component';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export abstract class BaseNodeDetailsComponent extends Component {
  protected hljs: any;

  constructor(container: HTMLElement, hljs?: any) {
    super(container);
    this.hljs = hljs;
  }

  /**
   * Render node details
   * Must be implemented by specialized components
   */
  abstract renderNode(node: BaseExplainNode): void;

  /**
   * Clear node details display
   */
  clear(): void {
    this.container.innerHTML = '<div class="detail-empty">Select a node to view details</div>';
  }

  /**
   * Required render method (from Component base class)
   */
  render(): void {
    // Details are rendered when renderNode is called
  }

  // ============================================
  // Common Rendering Methods
  // ============================================

  protected renderTitle(node: BaseExplainNode, subtitle?: string): string {
    let content = `<div class="detail-title">${node.name}`;
    if (subtitle) {
      content += ` <span style="color: #858585;">(${subtitle})</span>`;
    }
    content += '</div>';
    return content;
  }

  protected renderCostTiming(node: BaseExplainNode): string {
    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Cost & Timing</div>';
    content += `<div class="detail-item"><span class="detail-label">Total Cost:</span> <span class="detail-value">${node.cost}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Startup Cost:</span> <span class="detail-value">${node.startupCost}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Actual Time:</span> <span class="detail-value">${node.actualTime} ms</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Startup Time:</span> <span class="detail-value">${node.startupTime} ms</span></div>`;
    content += '</div>';
    return content;
  }

  protected renderRowsInfo(node: BaseExplainNode): string {
    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Rows</div>';
    content += `<div class="detail-item"><span class="detail-label">Plan Rows:</span> <span class="detail-value">${node.planRows}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Actual Rows:</span> <span class="detail-value">${node.actualRows}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Loops:</span> <span class="detail-value">${node.loops}</span></div>`;

    if (node.isEstimationOff) {
      const accuracy = node.estimationAccuracy || 1;
      const direction = accuracy < 1 ? 'underestimated' : 'overestimated';
      const percentage = (Math.abs(1 - accuracy) * 100).toFixed(0);
      content += `<div class="detail-item"><span class="detail-warning">⚠ Estimation Off: ${direction} by ${percentage}%</span></div>`;
    }

    content += '</div>';
    return content;
  }

  protected renderParallelInfo(node: BaseExplainNode): string {
    if (!node.workersPlanned && !node.workersLaunched) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Parallel Execution</div>';
    if (node.workersPlanned) {
      content += `<div class="detail-item"><span class="detail-label">Workers Planned:</span> <span class="detail-value">${node.workersPlanned}</span></div>`;
    }
    if (node.workersLaunched) {
      content += `<div class="detail-item"><span class="detail-label">Workers Launched:</span> <span class="detail-value">${node.workersLaunched}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  protected renderBufferInfo(node: BaseExplainNode): string {
    if (!node.hasBufferStats) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Buffers</div>';

    if (node.sharedHitBlocks > 0 || node.sharedReadBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Hit:</span> <span class="detail-value">${node.sharedHitBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Shared Read:</span> <span class="detail-value">${node.sharedReadBlocks} blocks</span></div>`;

      const hitRate = node.cacheHitRate;
      if (hitRate !== null) {
        content += `<div class="detail-item"><span class="detail-label">Cache Hit Rate:</span> <span class="detail-value">${hitRate.toFixed(1)}%</span></div>`;
      }
    }

    if (node.sharedDirtiedBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Dirtied:</span> <span class="detail-value">${node.sharedDirtiedBlocks} blocks</span></div>`;
    }
    if (node.sharedWrittenBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Written:</span> <span class="detail-value">${node.sharedWrittenBlocks} blocks</span></div>`;
    }

    if (node.localHitBlocks > 0 || node.localReadBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Local Hit:</span> <span class="detail-value">${node.localHitBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Local Read:</span> <span class="detail-value">${node.localReadBlocks} blocks</span></div>`;
    }

    if (node.tempReadBlocks > 0 || node.tempWrittenBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Temp Read:</span> <span class="detail-value">${node.tempReadBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Temp Written:</span> <span class="detail-value">${node.tempWrittenBlocks} blocks</span></div>`;
    }

    content += '</div>';
    return content;
  }

  protected renderIOTiming(node: BaseExplainNode): string {
    if (!node.hasIOTiming) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">I/O Timing</div>';

    if (node.ioReadTime !== null) {
      content += `<div class="detail-item"><span class="detail-label">Read Time:</span> <span class="detail-value">${node.ioReadTime.toFixed(3)} ms</span></div>`;
    }
    if (node.ioWriteTime !== null) {
      content += `<div class="detail-item"><span class="detail-label">Write Time:</span> <span class="detail-value">${node.ioWriteTime.toFixed(3)} ms</span></div>`;
    }

    content += '</div>';
    return content;
  }

  protected renderOutputInfo(node: BaseExplainNode): string {
    if (!node.output) return '';

    return `
      <div class="detail-section">
        <div class="detail-section-title">Output</div>
        <pre style="margin: 0; background: #282c34; padding: 8px; border-radius: 4px; overflow-x: auto;"><code class="language-sql" style="font-size: 11px;">${node.output}</code></pre>
      </div>
    `;
  }

  /**
   * Apply syntax highlighting after rendering
   */
  protected applySyntaxHighlighting(): void {
    if (this.hljs) {
      this.container.querySelectorAll('code.language-sql').forEach((block) => {
        this.hljs.highlightElement(block);
      });
    }
  }
}
