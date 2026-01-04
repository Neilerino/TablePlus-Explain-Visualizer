/**
 * Interaction Controller
 * Handles zoom, pan, node selection, and critical path highlighting
 */

import { Canvas } from './svg-canvas-manager';
import { CriticalPathVisualizer } from '../../../services/critical-path-visualizer';
import { EnrichedNode } from '../../../../../types/plan-data';

export class InteractionController {
  private d3: any;
  private zoom: any = null;
  private svg: any = null;
  private svgContainer: any = null;
  private criticalPathVisualizer: CriticalPathVisualizer | null = null;

  constructor(d3Instance: any) {
    this.d3 = d3Instance;
  }

  /**
   * Setup zoom and pan behavior
   */
  setupZoom(canvas: Canvas): void {
    this.svg = canvas.svg;
    this.svgContainer = canvas.svgContainer;

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
   * Setup zoom control buttons (zoom in/out/reset)
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
   * Highlight a specific node by ID
   */
  highlightNode(nodeId: string): void {
    if (!this.svg) return;

    // Remove previous selection
    this.svg.selectAll('.node').classed('selected', false);

    // Highlight selected node
    this.svg.selectAll('.node')
      .filter((d: any) => d.data.id === nodeId)
      .classed('selected', true);
  }

  /**
   * Highlight a path of nodes (e.g., critical path)
   */
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

  /**
   * Initialize critical path visualizer
   */
  initializeCriticalPath(criticalPath: EnrichedNode[]): void {
    if (!this.svg || !criticalPath || criticalPath.length === 0) return;

    this.criticalPathVisualizer = new CriticalPathVisualizer(this.svg);
  }

  /**
   * Toggle critical path visualization on/off
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
   * Fit the view to show specific bounds
   */
  fitToView(container: HTMLElement, bounds: any): void {
    if (!this.zoom || !this.svgContainer) return;

    const containerWidth = container.clientWidth || 1200;
    const containerHeight = container.clientHeight || 800;

    // Calculate scale to fit entire content
    const scaleX = containerWidth / (bounds.width + 200);
    const scaleY = containerHeight / (bounds.height + 200);
    const calculatedScale = Math.min(scaleX, scaleY, 1);

    // Apply minimum scale to keep content readable (don't zoom out too much)
    const minScale = 0.5; // 50% minimum - keeps forest visible but readable
    const scale = Math.max(calculatedScale, minScale);

    // Calculate translation to center
    const translateX = (containerWidth - bounds.width * scale) / 2 - bounds.minX * scale;
    const translateY = 40; // Small top margin

    // Apply transform
    const transform = this.d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    this.svgContainer.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }

  /**
   * Center view on a specific point at a readable zoom level
   */
  centerOnPoint(container: HTMLElement, x: number, y: number, scale: number = 0.8): void {
    if (!this.zoom || !this.svgContainer) return;

    const containerWidth = container.clientWidth || 1200;
    const containerHeight = container.clientHeight || 800;

    // Center the point in the viewport
    const translateX = containerWidth / 2 - x * scale;
    const translateY = containerHeight / 3 - y * scale; // 1/3 from top to leave room for tree below

    const transform = this.d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    this.svgContainer.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }

  /**
   * Clean up interaction state
   */
  destroy(): void {
    this.zoom = null;
    this.svg = null;
    this.svgContainer = null;
    this.criticalPathVisualizer = null;
  }
}
