/**
 * Node Details Component Factory
 * Creates the appropriate specialized component based on node type
 */

import { BaseExplainNode } from '../../domain/entities/explain-nodes/base-node.entity';
import { SeqScanNode } from '../../domain/entities/explain-nodes/seq-scan.entity';
import { IndexScanNode } from '../../domain/entities/explain-nodes/index-scan.entity';
import { BaseNodeDetailsComponent } from '../components/node-details/base-node-details.component';
import { SeqScanDetailsComponent } from '../components/node-details/seq-scan-details.component';
import { IndexScanDetailsComponent } from '../components/node-details/index-scan-details.component';
import { GenericNodeDetailsComponent } from '../components/node-details/generic-node-details.component';

export class NodeDetailsComponentFactory {
  /**
   * Create the appropriate component for a given node
   * @param container - DOM element to render into
   * @param node - The node entity to render
   * @param hljs - Highlight.js instance for syntax highlighting
   * @returns The specialized component instance
   */
  static createComponent(
    container: HTMLElement,
    node: BaseExplainNode,
    hljs?: any
  ): BaseNodeDetailsComponent {
    // Create specialized component based on node type
    if (node instanceof SeqScanNode) {
      return new SeqScanDetailsComponent(container, hljs);
    }

    if (node instanceof IndexScanNode) {
      return new IndexScanDetailsComponent(container, hljs);
    }

    // Fallback to generic component for unknown types
    return new GenericNodeDetailsComponent(container, hljs);
  }

  /**
   * Render a node directly (convenience method)
   * Creates component, renders, and returns the component
   * @param container - DOM element to render into
   * @param node - The node entity to render
   * @param hljs - Highlight.js instance for syntax highlighting
   * @returns The component that was created and rendered
   */
  static renderNode(
    container: HTMLElement,
    node: BaseExplainNode,
    hljs?: any
  ): BaseNodeDetailsComponent {
    const component = this.createComponent(container, node, hljs);
    component.renderNode(node);
    return component;
  }
}
