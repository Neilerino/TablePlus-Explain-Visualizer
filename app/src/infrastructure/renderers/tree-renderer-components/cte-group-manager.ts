/**
 * CTE Group Manager
 * Handles CTE (Common Table Expression) detection, separation, and visual grouping
 */

import { TreeLayout } from './tree-layout-engine';

interface BoundingBox {
  name: string;
  nodes: any[];
  isCTE: boolean;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class CTEGroupManager {
  private d3: any;
  private readonly NODE_WIDTH = 180;
  private readonly MIN_GAP = 30;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Separate overlapping CTE groups by adjusting node positions
   */
  separateGroups(layout: TreeLayout): void {
    const treeLayout = layout.layout;

    // Find all CTE groups and track which nodes belong to CTEs
    const cteGroups = new Map<string, any[]>();
    const allCTENodes = new Set<any>();

    treeLayout.descendants().forEach((node: any) => {
      const subplanName = node.data.details?.subplanName;
      if (subplanName) {
        if (!cteGroups.has(subplanName)) {
          cteGroups.set(subplanName, []);
        }
        const descendants = node.descendants();
        cteGroups.get(subplanName)!.push(...descendants);
        descendants.forEach((n: any) => allCTENodes.add(n));
      }
    });

    // Get all non-CTE nodes
    const nonCTENodes = treeLayout.descendants().filter((n: any) => !allCTENodes.has(n));

    // Calculate bounding boxes for all groups (CTEs + non-CTE nodes as one group)
    const boxes: BoundingBox[] = [];

    // Add CTE group boxes
    cteGroups.forEach((nodes, cteName) => {
      if (nodes.length === 0) return;

      const xs = nodes.map((n: any) => n.x);
      const ys = nodes.map((n: any) => n.y);

      boxes.push({
        name: cteName,
        nodes,
        isCTE: true,
        minX: Math.min(...xs) - this.NODE_WIDTH / 2 - 20,
        maxX: Math.max(...xs) + this.NODE_WIDTH / 2 + 20,
        minY: Math.min(...ys) - 20,
        maxY: Math.max(...ys) + 100,
      });
    });

    // Add non-CTE nodes as a single group
    if (nonCTENodes.length > 0) {
      const xs = nonCTENodes.map((n: any) => n.x);
      const ys = nonCTENodes.map((n: any) => n.y);

      boxes.push({
        name: '__non_cte__', // Special identifier for non-CTE group
        nodes: nonCTENodes,
        isCTE: false,
        minX: Math.min(...xs) - this.NODE_WIDTH / 2 - 20,
        maxX: Math.max(...xs) + this.NODE_WIDTH / 2 + 20,
        minY: Math.min(...ys) - 20,
        maxY: Math.max(...ys) + 100,
      });
    }

    // Use the same separation logic for all groups (CTE and non-CTE)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];

        if (this.checkBoxesOverlap(box1, box2)) {
          const xOverlap = Math.min(box1.maxX, box2.maxX) - Math.max(box1.minX, box2.minX);
          const yOverlap = Math.min(box1.maxY, box2.maxY) - Math.max(box1.minY, box2.minY);

          if (xOverlap < yOverlap) {
            const shiftAmount = xOverlap + this.MIN_GAP;
            if (box1.minX < box2.minX) {
              box2.nodes.forEach((node: any) => { node.x += shiftAmount; });
              box2.minX += shiftAmount;
              box2.maxX += shiftAmount;
            } else {
              box1.nodes.forEach((node: any) => { node.x += shiftAmount; });
              box1.minX += shiftAmount;
              box1.maxX += shiftAmount;
            }
          } else {
            const shiftAmount = yOverlap + this.MIN_GAP;
            if (box1.minY < box2.minY) {
              box2.nodes.forEach((node: any) => { node.y += shiftAmount; });
              box2.minY += shiftAmount;
              box2.maxY += shiftAmount;
            } else {
              box1.nodes.forEach((node: any) => { node.y += shiftAmount; });
              box1.minY += shiftAmount;
              box1.maxY += shiftAmount;
            }
          }
        }
      }
    }
  }

  /**
   * Render visual borders around CTE groups
   */
  renderGroups(svg: any, layout: TreeLayout): void {
    const treeLayout = layout.layout;

    // Find all CTE groups (nodes with subplanName)
    const cteGroups = new Map<string, any[]>();

    treeLayout.descendants().forEach((node: any) => {
      const subplanName = node.data.details?.subplanName;
      if (subplanName) {
        if (!cteGroups.has(subplanName)) {
          cteGroups.set(subplanName, []);
        }
        // Add this node and all its descendants
        const descendants = node.descendants();
        cteGroups.get(subplanName)!.push(...descendants);
      }
    });

    // Draw a border around each CTE group
    cteGroups.forEach((nodes, cteName) => {
      if (nodes.length === 0) return;

      // Calculate bounding box (nodes have already been positioned/shifted)
      const xs = nodes.map((n: any) => n.x);
      const ys = nodes.map((n: any) => n.y);
      const minX = Math.min(...xs) - this.NODE_WIDTH / 2 - 20;
      const maxX = Math.max(...xs) + this.NODE_WIDTH / 2 + 20;
      const minY = Math.min(...ys) - 20;
      const maxY = Math.max(...ys) + 100; // Extra space for node height

      const width = maxX - minX;
      const height = maxY - minY;

      // Draw CTE group container
      const cteGroup = svg.insert('g', ':first-child')
        .attr('class', 'cte-group');

      // Background rectangle
      cteGroup.append('rect')
        .attr('x', minX)
        .attr('y', minY)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 12)
        .attr('fill', 'rgba(100, 150, 200, 0.08)')
        .attr('stroke', 'rgba(100, 150, 200, 0.3)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      // CTE label
      cteGroup.append('text')
        .attr('x', minX + 12)
        .attr('y', minY - 5)
        .attr('fill', 'rgba(100, 150, 200, 0.9)')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(`CTE: ${cteName}`);
    });
  }

  /**
   * Check if two bounding boxes overlap
   */
  private checkBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    return !(box1.maxX < box2.minX || box2.maxX < box1.minX ||
             box1.maxY < box2.minY || box2.maxY < box1.minY);
  }
}
