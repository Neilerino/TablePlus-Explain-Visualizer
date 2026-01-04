/**
 * Node Renderer
 * Handles rendering of individual nodes with specialized content
 */

import { TreeLayout } from './tree-layout-engine';
import { NodeService } from '../../../domain/services/node.service';
import { NodeRendererFactory } from '../node-renderers/node-renderer.factory';

export class NodeRenderer {
  private d3: any;
  private nodeService: NodeService | null = null;
  private readonly NODE_WIDTH = 180;
  private readonly NODE_HEIGHT = 90;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Set the NodeService for accessing typed entities
   */
  setNodeService(nodeService: NodeService): void {
    this.nodeService = nodeService;
  }

  /**
   * Render nodes with specialized content based on node type
   */
  renderNodes(
    svg: any,
    layout: TreeLayout,
    onNodeClick: (nodeId: string) => void
  ): void {
    const nodeGroup = svg.selectAll('.node')
      .data(layout.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x - this.NODE_WIDTH / 2},${d.y})`);

    // Node rectangle (with dynamic height)
    nodeGroup.append('rect')
      .attr('width', this.NODE_WIDTH)
      .attr('height', (d: any) => {
        const nodeId = d.data.id;
        if (nodeId && this.nodeService) {
          const entity = this.nodeService.getNode(nodeId);
          if (entity) {
            return NodeRendererFactory.getNodeHeight(entity);
          }
        }
        return this.NODE_HEIGHT; // Fallback
      })
      .attr('rx', 8)
      .attr('fill', 'var(--node-bg, #2a2a2a)')
      .attr('stroke', 'var(--node-border, #444)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Render node text using specialized renderers
    nodeGroup.each((d: any, i: number, nodes: any) => {
      const nodeId = d.data.id;
      if (!nodeId || !this.nodeService) {
        // Fallback to basic rendering if no NodeService
        this.renderBasicNodeText(this.d3.select(nodes[i]), d);
        return;
      }

      // Get typed entity from NodeService
      const entity = this.nodeService.getNode(nodeId);
      if (!entity) {
        this.renderBasicNodeText(this.d3.select(nodes[i]), d);
        return;
      }

      // Use factory to get text lines
      const lines = NodeRendererFactory.getNodeLines(entity);

      // Render each line
      const group = this.d3.select(nodes[i]);
      lines.forEach(line => {
        group.append('text')
          .attr('x', this.NODE_WIDTH / 2)
          .attr('y', line.y)
          .attr('text-anchor', 'middle')
          .attr('fill', line.fill || 'var(--text-primary, #fff)')
          .attr('font-size', `${line.fontSize}px`)
          .attr('font-weight', line.fontWeight || 'normal')
          .attr('opacity', line.opacity !== undefined ? line.opacity : 1)
          .text(line.text)
          .style('pointer-events', 'none');
      });
    });

    // Click handler
    nodeGroup.on('click', (event: any, d: any) => {
      event.stopPropagation();
      if (d.data.id) {
        onNodeClick(d.data.id);
      }
    });

    // Hover effect
    nodeGroup.selectAll('rect')
      .on('mouseenter', (event: any) => {
        this.d3.select(event.currentTarget).attr('fill', 'var(--node-bg-hover, #333)');
      })
      .on('mouseleave', (event: any) => {
        this.d3.select(event.currentTarget).attr('fill', 'var(--node-bg, #2a2a2a)');
      });
  }

  /**
   * Fallback rendering for when NodeService is not available
   */
  private renderBasicNodeText(group: any, d: any): void {
    // Node label (name)
    group.append('text')
      .attr('x', this.NODE_WIDTH / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-primary, #fff)')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(d.data.name)
      .style('pointer-events', 'none');

    // Node details (cost/time)
    group.append('text')
      .attr('x', this.NODE_WIDTH / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary, #aaa)')
      .attr('font-size', '11px')
      .text(() => {
        const cost = d.data.details?.cost || '0';
        const time = d.data.details?.actualTime || 'N/A';
        return `Cost: ${cost} | Time: ${time}ms`;
      })
      .style('pointer-events', 'none');
  }
}
