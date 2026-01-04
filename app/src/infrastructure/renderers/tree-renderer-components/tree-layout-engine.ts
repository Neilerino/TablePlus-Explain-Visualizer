/**
 * Tree Layout Engine
 * Handles D3 hierarchy creation and tree layout calculation
 */

import { EnrichedNode } from '../../../../../types/plan-data';

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

export interface TreeLayout {
  layout: any;  // D3 tree layout result
  descendants: () => any[];
  links: () => any[];
}

export class TreeLayoutEngine {
  private d3: any;
  private readonly DEFAULT_NODE_WIDTH = 180;
  private readonly DEFAULT_NODE_HEIGHT = 90;
  private readonly DEFAULT_HORIZONTAL_SPACING = 50;
  private readonly DEFAULT_VERTICAL_SPACING = 120;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Calculate tree layout using D3's tree algorithm
   */
  calculateLayout(treeData: EnrichedNode, config?: LayoutConfig): TreeLayout {
    const nodeWidth = config?.nodeWidth || this.DEFAULT_NODE_WIDTH;
    const horizontalSpacing = config?.horizontalSpacing || this.DEFAULT_HORIZONTAL_SPACING;
    const verticalSpacing = config?.verticalSpacing || this.DEFAULT_VERTICAL_SPACING;

    // Create tree layout with fixed node spacing (not constrained to viewport)
    // This allows large trees to extend beyond viewport - users can pan/zoom
    const tree = this.d3.tree()
      .nodeSize([nodeWidth + horizontalSpacing, verticalSpacing])
      .separation((a: any, b: any) => {
        // Extra separation for siblings vs cousins
        return a.parent === b.parent ? 1 : 1.2;
      });

    // Create hierarchy
    const root = this.d3.hierarchy(treeData);
    const treeLayout = tree(root);

    return {
      layout: treeLayout,
      descendants: () => treeLayout.descendants(),
      links: () => treeLayout.links()
    };
  }

  /**
   * Calculate bounding box for a tree layout
   */
  getBounds(layout: TreeLayout, nodeWidth: number, nodeHeight: number): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const nodes = layout.descendants();
    const xs = nodes.map((n: any) => n.x);
    const ys = nodes.map((n: any) => n.y);

    return {
      minX: Math.min(...xs) - nodeWidth / 2,
      maxX: Math.max(...xs) + nodeWidth / 2,
      minY: Math.min(...ys),
      maxY: Math.max(...ys) + nodeHeight
    };
  }

  /**
   * Get node positions from layout
   */
  getNodePositions(layout: TreeLayout): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    layout.descendants().forEach((node: any) => {
      if (node.data.id) {
        positions.set(node.data.id, { x: node.x, y: node.y });
      }
    });

    return positions;
  }
}
