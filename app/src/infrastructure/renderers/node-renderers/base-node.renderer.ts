/**
 * Base Node Renderer
 * Abstract base for rendering specialized node information in the graph
 */

import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export interface NodeTextLine {
  text: string;
  y: number;
  fontSize: number;
  fontWeight?: string;
  fill?: string;
  opacity?: number;
}

export abstract class BaseNodeRenderer {
  protected readonly NODE_WIDTH = 180;

  /**
   * Get text lines to render for this node
   * @param node - Typed entity node
   * @returns Array of text lines with positioning and styling
   */
  abstract getNodeLines(node: BaseExplainNode): NodeTextLine[];

  /**
   * Get the height of the node based on number of lines
   * @param node - Typed entity node
   * @returns Height in pixels
   */
  getNodeHeight(node: BaseExplainNode): number {
    const lines = this.getNodeLines(node);
    // Base height of 20px + 16px per line (compact spacing)
    // 2 lines = 52px, 3 lines = 68px, 4 lines = 84px
    return 20 + (lines.length * 16);
  }

  /**
   * Calculate centered Y positions for lines based on node height
   * @param lineCount - Number of text lines
   * @returns Array of Y positions
   */
  protected getCenteredYPositions(lineCount: number): number[] {
    const nodeHeight = 20 + (lineCount * 16);
    const lineSpacing = 16;
    const totalContentHeight = lineCount * lineSpacing;
    // Reduce top offset for better visual balance
    const startY = (nodeHeight - totalContentHeight) / 2 + 12;

    const positions: number[] = [];
    for (let i = 0; i < lineCount; i++) {
      positions.push(startY + (i * lineSpacing));
    }
    return positions;
  }

  /**
   * Common method to format cost and time
   */
  protected getCostTimeLine(node: BaseExplainNode, y: number = 50): NodeTextLine {
    const cost = node.cost.toFixed(2);
    const time = node.actualTime > 0 ? `${node.actualTime.toFixed(3)}ms` : 'N/A';

    return {
      text: `Cost: ${cost} | Time: ${time}`,
      y,
      fontSize: 11,
      fill: 'var(--text-secondary, #aaa)'
    };
  }

  /**
   * Common method to create title line
   */
  protected getTitleLine(text: string): NodeTextLine {
    return {
      text,
      y: 25,
      fontSize: 14,
      fontWeight: 'bold',
      fill: 'var(--text-primary, #fff)'
    };
  }

  /**
   * Truncate text to fit within node width
   */
  protected truncate(text: string, maxLength: number = 20): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
  }
}
