/**
 * Forest Layout Engine
 * Handles positioning of multiple disconnected trees (main tree + CTE trees)
 */

import { EnrichedNode } from '../../../../../types/plan-data';
import { TreeLayout } from './tree-layout-engine';

export interface TreeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface PositionedTree {
  layout: TreeLayout;
  offsetX: number;
  offsetY: number;
  bounds: TreeBounds;
  cteName?: string;
}

export interface ForestLayoutResult {
  mainTree: PositionedTree;
  cteTrees: PositionedTree[];
  totalBounds: TreeBounds;
}

export class ForestLayoutEngine {
  private d3: any;
  private readonly VERTICAL_GAP = 200;      // Gap between main tree and CTE row
  private readonly HORIZONTAL_GAP = 300;    // Gap between CTE trees

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Calculate forest layout with main tree at top and CTEs horizontally below
   * @param mainTreeLayout - Layout for main query tree
   * @param cteTreeLayouts - Layouts for CTE trees
   * @returns Positioned trees with offsets
   */
  calculateForestLayout(
    mainTreeLayout: TreeLayout,
    cteTreeLayouts: Array<{ cteName: string; layout: TreeLayout }>
  ): ForestLayoutResult {
    // 1. Position main tree at origin
    const mainBounds = this.calculateBounds(mainTreeLayout);
    const mainTree: PositionedTree = {
      layout: mainTreeLayout,
      offsetX: 0,
      offsetY: 0,
      bounds: mainBounds
    };

    // 2. Position CTE trees horizontally below main tree
    const cteTrees: PositionedTree[] = [];
    let currentX = 0;
    const startY = mainBounds.maxY + this.VERTICAL_GAP;

    cteTreeLayouts.forEach(({ cteName, layout }) => {
      const bounds = this.calculateBounds(layout);

      cteTrees.push({
        layout,
        offsetX: currentX - bounds.minX,  // Align left edge to currentX
        offsetY: startY - bounds.minY,    // Align top edge to startY
        bounds,
        cteName
      });

      // Move to next position
      currentX += bounds.width + this.HORIZONTAL_GAP;
    });

    // 3. Calculate total bounds
    const totalBounds = this.calculateTotalBounds(mainTree, cteTrees);

    return {
      mainTree,
      cteTrees,
      totalBounds
    };
  }

  /**
   * Calculate bounding box for a tree layout
   */
  private calculateBounds(layout: TreeLayout): TreeBounds {
    const nodes = layout.descendants();

    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    const xs = nodes.map((n: any) => n.x);
    const ys = nodes.map((n: any) => n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Add padding for node dimensions
    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 100;  // Approximate max height

    return {
      minX: minX - NODE_WIDTH / 2,
      maxX: maxX + NODE_WIDTH / 2,
      minY: minY,
      maxY: maxY + NODE_HEIGHT,
      width: (maxX - minX) + NODE_WIDTH,
      height: (maxY - minY) + NODE_HEIGHT
    };
  }

  /**
   * Calculate total bounding box encompassing all trees
   */
  private calculateTotalBounds(mainTree: PositionedTree, cteTrees: PositionedTree[]): TreeBounds {
    const allTrees = [mainTree, ...cteTrees];

    if (allTrees.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    // Calculate effective bounds for each positioned tree
    const effectiveBounds = allTrees.map(tree => ({
      minX: tree.bounds.minX + tree.offsetX,
      maxX: tree.bounds.maxX + tree.offsetX,
      minY: tree.bounds.minY + tree.offsetY,
      maxY: tree.bounds.maxY + tree.offsetY
    }));

    const minX = Math.min(...effectiveBounds.map(b => b.minX));
    const maxX = Math.max(...effectiveBounds.map(b => b.maxX));
    const minY = Math.min(...effectiveBounds.map(b => b.minY));
    const maxY = Math.max(...effectiveBounds.map(b => b.maxY));

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}
