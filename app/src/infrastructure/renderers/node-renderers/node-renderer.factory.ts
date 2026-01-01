/**
 * Node Renderer Factory
 * Selects the appropriate renderer based on node type
 */

import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';
import { SeqScanNode } from '../../../domain/entities/explain-nodes/seq-scan.entity';
import { IndexScanNode } from '../../../domain/entities/explain-nodes/index-scan.entity';
import { BaseNodeRenderer } from './base-node.renderer';
import { SeqScanNodeRenderer } from './seq-scan-node.renderer';
import { IndexScanNodeRenderer } from './index-scan-node.renderer';
import { GenericNodeRenderer } from './generic-node.renderer';

export class NodeRendererFactory {
  private static seqScanRenderer = new SeqScanNodeRenderer();
  private static indexScanRenderer = new IndexScanNodeRenderer();
  private static genericRenderer = new GenericNodeRenderer();

  /**
   * Get the appropriate renderer for a node
   */
  static getRenderer(node: BaseExplainNode): BaseNodeRenderer {
    if (node instanceof SeqScanNode) {
      return this.seqScanRenderer;
    }

    if (node instanceof IndexScanNode) {
      return this.indexScanRenderer;
    }

    return this.genericRenderer;
  }

  /**
   * Get text lines for a node (convenience method)
   */
  static getNodeLines(node: BaseExplainNode) {
    const renderer = this.getRenderer(node);
    return renderer.getNodeLines(node);
  }

  /**
   * Get node height (convenience method)
   */
  static getNodeHeight(node: BaseExplainNode): number {
    const renderer = this.getRenderer(node);
    return renderer.getNodeHeight(node);
  }
}
