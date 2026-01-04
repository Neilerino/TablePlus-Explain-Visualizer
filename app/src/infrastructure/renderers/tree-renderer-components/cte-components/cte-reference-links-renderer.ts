/**
 * CTE Reference Links Renderer
 * Renders dashed reference links from CTE Scan nodes to CTE definitions
 */

import { CTEPosition } from './cte-border-renderer';

export class CTEReferenceLinksRenderer {
  private d3: any;
  private svg: any;

  constructor(d3Instance: any, svg: any) {
    this.d3 = d3Instance;
    this.svg = svg;
  }

  /**
   * Render reference links from CTE Scan nodes to CTE definitions
   */
  renderLinks(
    mainLayout: any,
    mainTreeX: number,
    mainTreeY: number,
    cteTreePositions: CTEPosition[],
    positionedCTETrees: any[],
    cteReferences: any[]
  ): void {
    // Build node position map from all trees
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Collect positions from main tree
    mainLayout.descendants().forEach((node: any) => {
      if (node.data.id) {
        nodePositions.set(node.data.id, {
          x: node.x + mainTreeX,
          y: node.y + mainTreeY
        });
      }
    });

    // Collect positions from CTE trees
    positionedCTETrees.forEach((positionedTree: any) => {
      // Match by CTE name, not by index (arrays may be in different orders due to layering)
      const ctePos = cteTreePositions.find(p => p.cteName === positionedTree.cteName);
      if (!ctePos) {
        console.warn(`⚠️ Could not find position for CTE: ${positionedTree.cteName}`);
        return;
      }

      positionedTree.layout.descendants().forEach((node: any) => {
        if (node.data.id) {
          nodePositions.set(node.data.id, {
            x: node.x + ctePos.x,
            y: node.y + ctePos.y
          });
        }
      });
    });

    cteReferences.forEach((ref, idx) => {
      const sourcePos = nodePositions.get(ref.nodeId);
      const targetPos = ref.targetCTENodeId ? nodePositions.get(ref.targetCTENodeId) : null;

      if (sourcePos && targetPos) {
        const linkGenerator = this.d3.linkVertical()
          .x((d: any) => d.x)
          .y((d: any) => d.y);

        const link = this.svg.append('path')
          .attr('class', 'cte-reference-link')
          .attr('d', linkGenerator({
            source: { x: sourcePos.x, y: sourcePos.y + 45 },  // From bottom of scan node
            target: { x: targetPos.x, y: targetPos.y }         // To top of CTE node
          }))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(100, 150, 200, 0.6)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('marker-end', 'url(#cte-arrow)');

        // Interactive hover effects
        link.on('mouseenter', () => {
          // Highlight link
          link.attr('stroke', 'rgba(100, 150, 200, 1)')
            .attr('stroke-width', 3);

          // Highlight source and target nodes
          this.svg.selectAll('.node')
            .filter((d: any) => d.data?.id === ref.nodeId || d.data?.id === ref.targetCTENodeId)
            .classed('cte-link-hover', true);
        })
        .on('mouseleave', () => {
          // Restore link
          link.attr('stroke', 'rgba(100, 150, 200, 0.6)')
            .attr('stroke-width', 2);

          // Remove highlight from nodes
          this.svg.selectAll('.node')
            .classed('cte-link-hover', false);
        });
      }
    });
  }
}
