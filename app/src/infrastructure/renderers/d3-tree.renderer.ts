/**
 * D3 Tree Renderer
 * Clean implementation of tree visualization using D3.js
 * Implements ITreeRenderer interface
 */

import { ITreeRenderer, TreeRenderConfig } from '../../application/interfaces/i-tree-renderer';
import { EnrichedNode } from '../../../../types/plan-data';
import { CriticalPathVisualizer } from '../../services/critical-path-visualizer';
import { NodeService } from '../../domain/services/node.service';
import { NodeRendererFactory } from './node-renderers/node-renderer.factory';

export class D3TreeRenderer implements ITreeRenderer {
  private d3: any;
  private svgContainer: any = null;
  private svg: any = null;
  private zoom: any = null;
  private criticalPathVisualizer: CriticalPathVisualizer | null = null;
  private currentConfig: TreeRenderConfig | null = null;
  private nodeService: NodeService | null = null;

  // Layout constants
  private readonly MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };
  private readonly MIN_WIDTH = 1200;
  private readonly MIN_HEIGHT = 800;
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

  render(config: TreeRenderConfig): void {
    this.currentConfig = config;
    this.clear();
    this.createSvg(config.container);
    this.renderTree(config.treeData, config.onNodeClick);
  }

  highlightNode(nodeId: string): void {
    if (!this.svg) return;

    // Remove previous selection
    this.svg.selectAll('.node').classed('selected', false);

    // Highlight selected node
    this.svg.selectAll('.node')
      .filter((d: any) => d.data.id === nodeId)
      .classed('selected', true);
  }

  highlightPath(nodeIds: string[]): void {
    if (!this.svg || !this.criticalPathVisualizer) return;

    // Convert node IDs to node data
    const nodes: EnrichedNode[] = [];
    this.svg.selectAll('.node').each((d: any) => {
      if (nodeIds.includes(d.data.id)) {
        nodes.push(d.data);
      }
    });

    this.criticalPathVisualizer.highlightPath(nodes);
  }

  destroy(): void {
    this.clear();
    this.currentConfig = null;
  }

  /**
   * Clear existing visualization
   */
  private clear(): void {
    if (this.currentConfig?.container) {
      this.d3.select(this.currentConfig.container).selectAll('*').remove();
    }
    this.svgContainer = null;
    this.svg = null;
    this.zoom = null;
    this.criticalPathVisualizer = null;
  }

  /**
   * Create SVG container and main group
   */
  private createSvg(container: HTMLElement): void {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const width = Math.max(containerWidth, this.MIN_WIDTH) - this.MARGIN.left - this.MARGIN.right;
    const height = Math.max(containerHeight, this.MIN_HEIGHT) - this.MARGIN.top - this.MARGIN.bottom;

    // Create SVG with viewBox for better scaling
    this.svgContainer = this.d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + this.MARGIN.left + this.MARGIN.right} ${height + this.MARGIN.top + this.MARGIN.bottom}`);

    // Create main group for zoom/pan
    this.svg = this.svgContainer.append('g')
      .attr('transform', `translate(${this.MARGIN.left},${this.MARGIN.top})`);

    // Setup zoom behavior
    this.setupZoom(width, height);
  }

  /**
   * Render the tree using D3 hierarchy and tree layout
   */
  private renderTree(treeData: EnrichedNode, onNodeClick: (nodeId: string) => void): void {
    if (!this.svg) return;

    const container = this.currentConfig!.container;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const width = Math.max(containerWidth, this.MIN_WIDTH) - this.MARGIN.left - this.MARGIN.right;
    const height = Math.max(containerHeight, this.MIN_HEIGHT) - this.MARGIN.top - this.MARGIN.bottom;

    // Create tree layout
    const tree = this.d3.tree().size([width, height - this.NODE_HEIGHT]);

    // Create hierarchy
    const root = this.d3.hierarchy(treeData);
    const treeLayout = tree(root);

    // Render links (connections between nodes)
    this.renderLinks(treeLayout);

    // Render nodes
    this.renderNodes(treeLayout, onNodeClick);
  }

  /**
   * Render links between nodes
   */
  private renderLinks(treeLayout: any): void {
    const linkGenerator = this.d3.linkVertical()
      .x((d: any) => d.x)
      .y((d: any) => d.y + this.NODE_HEIGHT / 2);

    this.svg.selectAll('.link')
      .data(treeLayout.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'var(--link-color, #555)')
      .attr('stroke-width', 2);
  }

  /**
   * Render nodes with labels
   */
  private renderNodes(treeLayout: any, onNodeClick: (nodeId: string) => void): void {
    const nodeGroup = this.svg.selectAll('.node')
      .data(treeLayout.descendants())
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
   * Setup zoom and pan controls
   */
  private setupZoom(width: number, height: number): void {
    this.zoom = this.d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event: any) => {
        this.svg.attr('transform', event.transform);
      });

    this.svgContainer.call(this.zoom);

    // Setup zoom control buttons
    this.setupZoomControls();
  }

  /**
   * Setup zoom control buttons
   */
  private setupZoomControls(): void {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');

    if (zoomIn) {
      zoomIn.onclick = () => {
        this.svgContainer.transition().call(this.zoom.scaleBy, 1.3);
      };
    }

    if (zoomOut) {
      zoomOut.onclick = () => {
        this.svgContainer.transition().call(this.zoom.scaleBy, 0.7);
      };
    }

    if (zoomReset) {
      zoomReset.onclick = () => {
        this.svgContainer.transition().call(
          this.zoom.transform,
          this.d3.zoomIdentity
        );
      };
    }
  }

  /**
   * Initialize critical path visualizer
   */
  initializeCriticalPath(criticalPath: EnrichedNode[]): void {
    if (!this.svg || !criticalPath || criticalPath.length === 0) return;

    this.criticalPathVisualizer = new CriticalPathVisualizer(this.svg);
  }

  /**
   * Toggle critical path visualization
   */
  toggleCriticalPath(criticalPath: EnrichedNode[], enabled: boolean): void {
    if (!this.criticalPathVisualizer) {
      this.initializeCriticalPath(criticalPath);
    }

    if (this.criticalPathVisualizer) {
      if (enabled) {
        this.criticalPathVisualizer.highlightPath(criticalPath);
      } else {
        this.criticalPathVisualizer.clearHighlight();
      }
    }
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
