/**
 * Critical Path Visualizer - Applies visual styling to critical path in graph view
 * Handles node highlighting, edge styling, and animations
 */

import * as d3 from 'd3';
import { EnrichedNode } from '../../../types/plan-data';

export class CriticalPathVisualizer {
  private svg: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(svgElement: d3.Selection<SVGGElement, unknown, null, undefined>) {
    this.svg = svgElement;
  }

  /**
   * Highlight nodes and edges on the critical path
   * @param criticalPath - Array of nodes on the critical path
   */
  highlightPath(criticalPath: EnrichedNode[]): void {
    if (!criticalPath || criticalPath.length === 0) {
      return;
    }

    // Create Set of critical path node IDs for fast lookup
    const criticalNodeIds = new Set(criticalPath.map(node => node.id));

    // Apply critical-path class to nodes
    this.svg.selectAll('.node')
      .classed('critical-path', (d: any) => {
        return criticalNodeIds.has(d.data.id);
      });

    // Apply critical-path class to edges between critical nodes
    this.svg.selectAll('.link')
      .classed('critical-path', (d: any) => {
        const sourceId = d.source.data.id;
        const targetId = d.target.data.id;
        return criticalNodeIds.has(sourceId) && criticalNodeIds.has(targetId);
      });
  }

  /**
   * Remove critical path highlighting
   */
  clearHighlight(): void {
    this.svg.selectAll('.node').classed('critical-path', false);
    this.svg.selectAll('.link').classed('critical-path', false);
  }

  /**
   * Toggle critical path highlighting on/off
   * @param enabled - Whether to show critical path
   * @param criticalPath - Array of nodes on the critical path
   */
  toggle(enabled: boolean, criticalPath: EnrichedNode[]): void {
    if (enabled) {
      this.highlightPath(criticalPath);
    } else {
      this.clearHighlight();
    }
  }
}
