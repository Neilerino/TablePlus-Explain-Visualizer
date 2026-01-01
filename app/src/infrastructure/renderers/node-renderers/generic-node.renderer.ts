/**
 * Generic Node Renderer
 * Fallback renderer for nodes without specialized rendering
 */

import { BaseNodeRenderer, NodeTextLine } from './base-node.renderer';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class GenericNodeRenderer extends BaseNodeRenderer {
  getNodeLines(node: BaseExplainNode): NodeTextLine[] {
    const lines: NodeTextLine[] = [];
    const contextText = this.getContextText(node);
    const lineCount = contextText ? 3 : 2;
    const yPositions = this.getCenteredYPositions(lineCount);

    // Title (node type)
    lines.push({
      text: node.nodeType,
      y: yPositions[0],
      fontSize: 14,
      fontWeight: 'bold',
      fill: 'var(--text-primary, #fff)'
    });

    // Add context if available
    let nextLineIndex = 1;
    if (contextText) {
      lines.push({
        text: this.truncate(contextText, 22),
        y: yPositions[1],
        fontSize: 11,
        fill: 'var(--text-secondary, #aaa)'
      });
      nextLineIndex = 2;
    }

    // Cost & Time
    lines.push(this.getCostTimeLine(node, yPositions[nextLineIndex]));

    return lines;
  }

  /**
   * Try to extract contextual information from common properties
   * Returns just the value without labels
   */
  private getContextText(node: BaseExplainNode): string | null {
    // Check for common contextual properties
    const groupKey = node.getDetail('groupKey');
    const sortKey = node.getDetail('sortKey');
    const hashCond = node.getDetail('hashCond');
    const strategy = node.getDetail('strategy');

    // Return the most relevant context (priority order)
    return groupKey || sortKey || hashCond || strategy || null;
  }
}
