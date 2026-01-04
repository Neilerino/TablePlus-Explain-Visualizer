/**
 * Link Renderer
 * Handles rendering of parent-child links (bezier curves) between nodes
 */

import { TreeLayout } from './tree-layout-engine';

export interface LinkStyle {
  color?: string;
  width?: number;
  className?: string;
}

export class LinkRenderer {
  private d3: any;
  private readonly DEFAULT_NODE_HEIGHT = 90;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Render links between parent and child nodes
   */
  renderLinks(
    svg: any,
    layout: TreeLayout,
    nodeHeight?: number,
    style?: LinkStyle
  ): void {
    const height = nodeHeight || this.DEFAULT_NODE_HEIGHT;
    const linkColor = style?.color || 'var(--link-color, #555)';
    const linkWidth = style?.width || 2;
    const className = style?.className || 'link';

    // Create vertical link generator (Bezier curve from parent to child)
    const linkGenerator = this.d3.linkVertical()
      .x((d: any) => d.x)
      .y((d: any) => d.y + height / 2);  // Link from middle of node

    svg.selectAll(`.${className}`)
      .data(layout.links())
      .enter()
      .append('path')
      .attr('class', className)
      .attr('d', linkGenerator)
      .attr('fill', 'none')
      .attr('stroke', linkColor)
      .attr('stroke-width', linkWidth);
  }

  /**
   * Render links with offset (for multi-tree layouts)
   */
  renderLinksWithOffset(
    svg: any,
    layout: TreeLayout,
    offsetX: number,
    offsetY: number,
    nodeHeight?: number,
    style?: LinkStyle
  ): void {
    const height = nodeHeight || this.DEFAULT_NODE_HEIGHT;
    const linkColor = style?.color || 'var(--link-color, #555)';
    const linkWidth = style?.width || 2;
    const className = style?.className || 'link';

    const linkGenerator = this.d3.linkVertical()
      .x((d: any) => d.x + offsetX)
      .y((d: any) => d.y + offsetY + height / 2);

    svg.selectAll(`.${className}-${layout.layout.data.id}`)
      .data(layout.links())
      .enter()
      .append('path')
      .attr('class', `${className} ${className}-${layout.layout.data.id}`)
      .attr('d', linkGenerator)
      .attr('fill', 'none')
      .attr('stroke', linkColor)
      .attr('stroke-width', linkWidth);
  }
}
