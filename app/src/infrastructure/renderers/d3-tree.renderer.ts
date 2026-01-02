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

    // Create tree layout with fixed node spacing (not constrained to viewport)
    // This allows large trees to extend beyond viewport - users can pan/zoom
    const tree = this.d3.tree()
      .nodeSize([this.NODE_WIDTH + 50, 120])  // [horizontal spacing, vertical spacing]
      .separation((a: any, b: any) => {
        // Extra separation for siblings vs cousins
        return a.parent === b.parent ? 1 : 1.2;
      });

    // Create hierarchy
    const root = this.d3.hierarchy(treeData);
    const treeLayout = tree(root);

    // Adjust node positions to separate overlapping CTE groups
    this.separateCTEGroups(treeLayout);

    // Render links (connections between nodes)
    this.renderLinks(treeLayout);

    // Render CTE groupings (before nodes so they appear behind)
    this.renderCTEGroups(treeLayout);

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
   * Separate overlapping groups (CTEs and non-CTE nodes) by adjusting node positions
   */
  private separateCTEGroups(treeLayout: any): void {
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
    const boxes: any[] = [];

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
    const MIN_GAP = 30;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];

        if (this.checkBoxesOverlap(box1, box2)) {
          const xOverlap = Math.min(box1.maxX, box2.maxX) - Math.max(box1.minX, box2.minX);
          const yOverlap = Math.min(box1.maxY, box2.maxY) - Math.max(box1.minY, box2.minY);

          if (xOverlap < yOverlap) {
            const shiftAmount = xOverlap + MIN_GAP;
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
            const shiftAmount = yOverlap + MIN_GAP;
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
   * Check if two bounding boxes overlap
   */
  private checkBoxesOverlap(box1: any, box2: any): boolean {
    return !(box1.maxX < box2.minX || box2.maxX < box1.minX ||
             box1.maxY < box2.minY || box2.maxY < box1.minY);
  }

  /**
   * Render visual groupings for CTE (Common Table Expression) nodes
   */
  private renderCTEGroups(treeLayout: any): void {
    if (!this.svg) return;

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
      const cteGroup = this.svg.insert('g', ':first-child')
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
