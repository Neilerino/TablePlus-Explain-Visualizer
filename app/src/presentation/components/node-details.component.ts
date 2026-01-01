/**
 * Node Details Component
 * Displays detailed information about a selected execution plan node
 * Requires controller to handle node selection events
 */

import { Component } from './base.component';

export class NodeDetailsComponent extends Component {
  constructor(container: HTMLElement) {
    super(container);
  }

  /**
   * Render method (required by base class)
   */
  render(): void {
    // Details are rendered when setNodeData is called
  }

  /**
   * Set and display node details
   * @param nodeData - Node data object (d.data from D3 hierarchy)
   * @param hljs - Highlight.js instance (optional)
   */
  setNodeData(nodeData: any, hljs?: any): void {
    if (!nodeData || !nodeData.data) {
      this.clear();
      return;
    }

    const data = nodeData.data;
    const details = data.details || {};

    let content = this.renderTitle(data, details);
    content += this.renderTableInfo(details);
    content += this.renderCostTiming(details);
    content += this.renderRowsInfo(details);
    content += this.renderJoinConditions(details);
    content += this.renderSortInfo(details);
    content += this.renderAggregateInfo(details);
    content += this.renderParallelInfo(details);
    content += this.renderFilterInfo(details);
    content += this.renderIndexScanInfo(details);
    content += this.renderBufferInfo(details);
    content += this.renderIOTiming(details);
    content += this.renderOutputInfo(details);

    this.container.innerHTML = content;

    // Apply syntax highlighting to SQL output
    if (details.output && hljs) {
      this.container.querySelectorAll('code.language-sql').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  /**
   * Clear node details display
   */
  clear(): void {
    this.container.innerHTML = '<div class="detail-empty">Select a node to view details</div>';
  }

  private renderTitle(data: any, details: any): string {
    let content = `<div class="detail-title">${data.name}`;
    if (details.joinType) {
      content += ` <span style="color: #858585;">(${details.joinType} Join)</span>`;
    }
    content += '</div>';
    return content;
  }

  private renderTableInfo(details: any): string {
    if (!details.relation) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Table Info</div>';
    if (details.schema) {
      content += `<div class="detail-item"><span class="detail-label">Schema:</span> <span class="detail-value">${details.schema}</span></div>`;
    }
    content += `<div class="detail-item"><span class="detail-label">Table:</span> <span class="detail-value">${details.relation}</span></div>`;
    if (details.alias) {
      content += `<div class="detail-item"><span class="detail-label">Alias:</span> <span class="detail-value">${details.alias}</span></div>`;
    }
    if (details.indexName) {
      content += `<div class="detail-item"><span class="detail-label">Index:</span> <span class="detail-value">${details.indexName}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderCostTiming(details: any): string {
    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Cost & Timing</div>';
    content += `<div class="detail-item"><span class="detail-label">Total Cost:</span> <span class="detail-value">${details.cost}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Startup Cost:</span> <span class="detail-value">${details.startupCost}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Actual Time:</span> <span class="detail-value">${details.actualTime} ms</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Startup Time:</span> <span class="detail-value">${details.startupTime} ms</span></div>`;
    content += '</div>';
    return content;
  }

  private renderRowsInfo(details: any): string {
    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Rows</div>';
    content += `<div class="detail-item"><span class="detail-label">Plan Rows:</span> <span class="detail-value">${details.planRows}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Actual Rows:</span> <span class="detail-value">${details.actualRows}</span></div>`;
    content += `<div class="detail-item"><span class="detail-label">Loops:</span> <span class="detail-value">${details.loops}</span></div>`;
    if (details.estimationOff) {
      const accuracy = details.estimationAccuracy;
      const direction = accuracy < 1 ? 'underestimated' : 'overestimated';
      const percentage = (Math.abs(1 - accuracy) * 100).toFixed(0);
      content += `<div class="detail-item"><span class="detail-warning">⚠ Estimation Off: ${direction} by ${percentage}%</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderJoinConditions(details: any): string {
    if (!details.hashCond && !details.joinFilter) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Join Conditions</div>';
    if (details.hashCond) {
      content += `<div class="detail-item"><span class="detail-label">Hash Cond:</span> <span class="detail-value">${details.hashCond}</span></div>`;
    }
    if (details.joinFilter) {
      content += `<div class="detail-item"><span class="detail-label">Join Filter:</span> <span class="detail-value">${details.joinFilter}</span></div>`;
    }
    if (details.innerUnique !== null) {
      content += `<div class="detail-item"><span class="detail-label">Inner Unique:</span> <span class="detail-value">${details.innerUnique}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderSortInfo(details: any): string {
    if (!details.sortKey) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Sort Info</div>';
    content += `<div class="detail-item"><span class="detail-label">Sort Key:</span> <span class="detail-value">${details.sortKey}</span></div>`;
    if (details.sortMethod) {
      content += `<div class="detail-item"><span class="detail-label">Method:</span> <span class="detail-value">${details.sortMethod}</span></div>`;
    }
    if (details.sortSpaceUsed) {
      content += `<div class="detail-item"><span class="detail-label">Space:</span> <span class="detail-value">${details.sortSpaceUsed} kB (${details.sortSpaceType})</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderAggregateInfo(details: any): string {
    if (!details.strategy && !details.groupKey) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Aggregate Info</div>';
    if (details.strategy) {
      content += `<div class="detail-item"><span class="detail-label">Strategy:</span> <span class="detail-value">${details.strategy}</span></div>`;
    }
    if (details.groupKey) {
      content += `<div class="detail-item"><span class="detail-label">Group Key:</span> <span class="detail-value">${details.groupKey}</span></div>`;
    }
    if (details.peakMemoryUsage) {
      content += `<div class="detail-item"><span class="detail-label">Peak Memory:</span> <span class="detail-value">${details.peakMemoryUsage} kB</span></div>`;
    }
    if (details.hashAggBatches) {
      content += `<div class="detail-item"><span class="detail-label">Hash Batches:</span> <span class="detail-value">${details.hashAggBatches}</span></div>`;
    }
    if (details.hashBuckets) {
      content += `<div class="detail-item"><span class="detail-label">Hash Buckets:</span> <span class="detail-value">${details.hashBuckets}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderParallelInfo(details: any): string {
    if (!details.workersPlanned && !details.workersLaunched) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Parallel Execution</div>';
    if (details.workersPlanned) {
      content += `<div class="detail-item"><span class="detail-label">Workers Planned:</span> <span class="detail-value">${details.workersPlanned}</span></div>`;
    }
    if (details.workersLaunched) {
      content += `<div class="detail-item"><span class="detail-label">Workers Launched:</span> <span class="detail-value">${details.workersLaunched}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderFilterInfo(details: any): string {
    if (!details.filter && details.rowsRemovedByFilter === null) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Filter</div>';
    if (details.filter) {
      content += `<div class="detail-item"><span class="detail-label">Condition:</span> <span class="detail-value">${details.filter}</span></div>`;
    }
    if (details.rowsRemovedByFilter !== null) {
      content += `<div class="detail-item"><span class="detail-label">Rows Removed:</span> <span class="detail-value">${details.rowsRemovedByFilter}</span></div>`;
      const totalRows = details.actualRows + details.rowsRemovedByFilter;
      const selectivity = totalRows > 0 ? ((details.actualRows / totalRows) * 100).toFixed(1) : 0;
      content += `<div class="detail-item"><span class="detail-label">Selectivity:</span> <span class="detail-value">${selectivity}%</span></div>`;
    }
    if (details.rowsRemovedByJoinFilter !== null) {
      content += `<div class="detail-item"><span class="detail-label">Rows Removed (Join):</span> <span class="detail-value">${details.rowsRemovedByJoinFilter}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderIndexScanInfo(details: any): string {
    if (!details.heapFetches && !details.exactHeapBlocks && !details.lossyHeapBlocks) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Index Scan Details</div>';
    if (details.heapFetches) {
      content += `<div class="detail-item"><span class="detail-label">Heap Fetches:</span> <span class="detail-value">${details.heapFetches}</span></div>`;
    }
    if (details.exactHeapBlocks) {
      content += `<div class="detail-item"><span class="detail-label">Exact Heap Blocks:</span> <span class="detail-value">${details.exactHeapBlocks}</span></div>`;
    }
    if (details.lossyHeapBlocks) {
      content += `<div class="detail-item"><span class="detail-label">Lossy Heap Blocks:</span> <span class="detail-value">${details.lossyHeapBlocks}</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderBufferInfo(details: any): string {
    const hasBufferInfo = details.sharedHitBlocks > 0 ||
                          details.sharedReadBlocks > 0 ||
                          details.sharedDirtiedBlocks > 0 ||
                          details.sharedWrittenBlocks > 0 ||
                          details.localHitBlocks > 0 ||
                          details.localReadBlocks > 0 ||
                          details.tempReadBlocks > 0 ||
                          details.tempWrittenBlocks > 0;

    if (!hasBufferInfo) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">Buffers</div>';
    if (details.sharedHitBlocks > 0 || details.sharedReadBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Hit:</span> <span class="detail-value">${details.sharedHitBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Shared Read:</span> <span class="detail-value">${details.sharedReadBlocks} blocks</span></div>`;
      if (details.sharedReadBlocks > 0) {
        const hitRate = (details.sharedHitBlocks / (details.sharedHitBlocks + details.sharedReadBlocks) * 100).toFixed(1);
        content += `<div class="detail-item"><span class="detail-label">Cache Hit Rate:</span> <span class="detail-value">${hitRate}%</span></div>`;
      }
    }
    if (details.sharedDirtiedBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Dirtied:</span> <span class="detail-value">${details.sharedDirtiedBlocks} blocks</span></div>`;
    }
    if (details.sharedWrittenBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Shared Written:</span> <span class="detail-value">${details.sharedWrittenBlocks} blocks</span></div>`;
    }
    if (details.localHitBlocks > 0 || details.localReadBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Local Hit:</span> <span class="detail-value">${details.localHitBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Local Read:</span> <span class="detail-value">${details.localReadBlocks} blocks</span></div>`;
    }
    if (details.tempReadBlocks > 0 || details.tempWrittenBlocks > 0) {
      content += `<div class="detail-item"><span class="detail-label">Temp Read:</span> <span class="detail-value">${details.tempReadBlocks} blocks</span></div>`;
      content += `<div class="detail-item"><span class="detail-label">Temp Written:</span> <span class="detail-value">${details.tempWrittenBlocks} blocks</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderIOTiming(details: any): string {
    if (details.ioReadTime === null && details.ioWriteTime === null) return '';

    let content = '<div class="detail-section">';
    content += '<div class="detail-section-title">I/O Timing</div>';
    if (details.ioReadTime !== null) {
      content += `<div class="detail-item"><span class="detail-label">Read Time:</span> <span class="detail-value">${details.ioReadTime.toFixed(3)} ms</span></div>`;
    }
    if (details.ioWriteTime !== null) {
      content += `<div class="detail-item"><span class="detail-label">Write Time:</span> <span class="detail-value">${details.ioWriteTime.toFixed(3)} ms</span></div>`;
    }
    content += '</div>';
    return content;
  }

  private renderOutputInfo(details: any): string {
    if (!details.output) return '';

    return `
      <div class="detail-section">
        <div class="detail-section-title">Output</div>
        <div class="detail-item">
          <pre style="margin: 0; background: #282c34; padding: 8px; border-radius: 4px; overflow-x: auto;">
            <code class="language-sql" style="font-size: 11px;">${details.output}</code>
          </pre>
        </div>
      </div>
    `;
  }
}
