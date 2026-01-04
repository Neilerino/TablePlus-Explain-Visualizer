/**
 * CTE Border Renderer
 * Renders border boxes and labels around CTE trees
 */

export interface CTEPosition {
  cteName: string;
  x: number;
  y: number;
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  layer: number;
}

export class CTEBorderRenderer {
  private svg: any;

  constructor(svg: any) {
    this.svg = svg;
  }

  /**
   * Render border boxes and labels for all CTE trees
   */
  renderBorders(ctePositions: CTEPosition[]): void {
    const padding = 20;
    const labelHeight = 30;

    ctePositions.forEach((pos) => {
      // Calculate border box position accounting for bounds offsets
      const boxX = pos.x + pos.bounds.minX - padding;
      const boxY = pos.y + pos.bounds.minY - labelHeight - padding;
      const boxWidth = pos.bounds.width + padding * 2;
      const boxHeight = pos.bounds.height + labelHeight + padding * 2;

      // Border box
      this.svg.append('rect')
        .attr('class', 'cte-group-border')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(100, 150, 200, 0.6)')
        .attr('stroke-width', '2')
        .attr('stroke-dasharray', '5,5')
        .attr('rx', '8');

      // Label background
      this.svg.append('rect')
        .attr('class', 'cte-label-bg')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxWidth)
        .attr('height', labelHeight)
        .attr('fill', 'rgba(100, 150, 200, 0.15)')
        .attr('rx', '8');

      // Label text
      this.svg.append('text')
        .attr('class', 'cte-label')
        .attr('x', boxX + padding)
        .attr('y', boxY + labelHeight - 10)
        .attr('fill', 'rgba(100, 150, 200, 1)')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text(`CTE: ${pos.cteName} (Layer ${pos.layer})`);
    });
  }
}
