/**
 * Index Scan Node Renderer
 * Renders Index Scan nodes with table and index name
 */

import { BaseNodeRenderer, NodeTextLine } from './base-node.renderer';
import { IndexScanNode } from '../../../domain/entities/explain-nodes/index-scan.entity';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class IndexScanNodeRenderer extends BaseNodeRenderer {
  getNodeLines(node: BaseExplainNode): NodeTextLine[] {
    if (!(node instanceof IndexScanNode)) {
      return [this.getTitleLine(node.nodeType), this.getCostTimeLine(node)];
    }

    const lines: NodeTextLine[] = [];
    const lineCount = node.indexName ? 4 : 3;
    const yPositions = this.getCenteredYPositions(lineCount);

    // Title
    lines.push({
      text: 'Index Scan',
      y: yPositions[0],
      fontSize: 14,
      fontWeight: 'bold',
      fill: 'var(--text-primary, #fff)'
    });

    // Table name
    const tableName = node.tableName || 'unknown';
    lines.push({
      text: this.truncate(tableName, 22),
      y: yPositions[1],
      fontSize: 12,
      fill: 'var(--text-accent, #61afef)'
    });

    // Index name if available
    let nextLineIndex = 2;
    if (node.indexName) {
      lines.push({
        text: this.truncate(node.indexName, 22),
        y: yPositions[2],
        fontSize: 11,
        fill: 'var(--text-secondary, #aaa)'
      });
      nextLineIndex = 3;
    }

    // Cost & Time
    lines.push(this.getCostTimeLine(node, yPositions[nextLineIndex]));

    return lines;
  }
}
