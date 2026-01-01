/**
 * Sequential Scan Node Renderer
 * Renders Seq Scan nodes with table name
 */

import { BaseNodeRenderer, NodeTextLine } from './base-node.renderer';
import { SeqScanNode } from '../../../domain/entities/explain-nodes/seq-scan.entity';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class SeqScanNodeRenderer extends BaseNodeRenderer {
  getNodeLines(node: BaseExplainNode): NodeTextLine[] {
    if (!(node instanceof SeqScanNode)) {
      return [this.getTitleLine(node.nodeType), this.getCostTimeLine(node)];
    }

    const lines: NodeTextLine[] = [];
    const [y1, y2, y3] = this.getCenteredYPositions(3);

    // Title
    lines.push({
      text: 'Seq Scan',
      y: y1,
      fontSize: 14,
      fontWeight: 'bold',
      fill: 'var(--text-primary, #fff)'
    });

    // Table name as subtitle
    const tableName = node.tableName || 'unknown';
    lines.push({
      text: this.truncate(tableName, 22),
      y: y2,
      fontSize: 12,
      fill: 'var(--text-accent, #61afef)'
    });

    // Cost & Time
    lines.push(this.getCostTimeLine(node, y3));

    return lines;
  }
}
