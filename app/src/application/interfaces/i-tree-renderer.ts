/**
 * Tree Renderer Interface
 * Abstraction for rendering query execution plan trees
 */

import { EnrichedNode, CTEMetadata } from '../../../../types/plan-data';

export interface TreeRenderConfig {
  treeData: EnrichedNode;
  container: HTMLElement;
  onNodeClick: (nodeId: string) => void;
  cteMetadata?: CTEMetadata;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ITreeRenderer {
  /**
   * Render the tree visualization
   */
  render(config: TreeRenderConfig): void;

  /**
   * Highlight a specific node by ID
   */
  highlightNode(nodeId: string): void;

  /**
   * Highlight a path of nodes (e.g., critical path)
   */
  highlightPath(nodeIds: string[]): void;

  /**
   * Clean up and destroy the renderer
   */
  destroy(): void;
}
