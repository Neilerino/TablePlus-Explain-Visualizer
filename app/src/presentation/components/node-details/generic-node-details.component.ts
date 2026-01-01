/**
 * Generic Node Details Component
 * Fallback component for rendering any node type that doesn't have a specialized component
 * Renders common properties available on all nodes
 */

import { BaseNodeDetailsComponent } from './base-node-details.component';
import { BaseExplainNode } from '../../../domain/entities/explain-nodes/base-node.entity';

export class GenericNodeDetailsComponent extends BaseNodeDetailsComponent {
  /**
   * Render a generic node's details
   * Shows all common properties available on BaseExplainNode
   */
  renderNode(node: BaseExplainNode): void {
    let content = '';
    content += this.renderTitle(node);
    content += this.renderCostTiming(node);
    content += this.renderRowsInfo(node);
    content += this.renderParallelInfo(node);
    content += this.renderBufferInfo(node);
    content += this.renderIOTiming(node);
    content += this.renderOutputInfo(node);

    this.container.innerHTML = content;
    this.applySyntaxHighlighting();
  }
}
