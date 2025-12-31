/**
 * Cost-based critical path analyzer
 * Finds the path from root to leaf with the highest cumulative cost
 * This is useful when EXPLAIN is run without ANALYZE
 */

import { EnrichedNode } from '../../../types/plan-data';
import { PathAnalyzer } from './path-analyzer';
import { MetricExtractor } from './metric-extractors';

export class CostAnalyzer extends PathAnalyzer {
  constructor(metricExtractor: MetricExtractor) {
    super(metricExtractor);
  }

  /**
   * Find the critical path using depth-first search
   * Returns the path with maximum cumulative cost
   */
  analyze(rootNode: EnrichedNode): EnrichedNode[] {
    let maxPath: EnrichedNode[] = [];
    let maxValue = 0;

    const dfs = (node: EnrichedNode, currentPath: EnrichedNode[], cumulativeValue: number): void => {
      const nodeMetric = this.metricExtractor(node);
      const newCumulativeValue = cumulativeValue + nodeMetric;
      const newPath = [...currentPath, node];

      // If this is a leaf node, check if it's the max path
      if (!node.children || node.children.length === 0) {
        if (newCumulativeValue > maxValue) {
          maxValue = newCumulativeValue;
          maxPath = newPath;
        }
        return;
      }

      // For nodes with children, follow the most expensive child
      let maxChildValue = 0;
      let maxChild: EnrichedNode | null = null;

      node.children.forEach(child => {
        const childMetric = this.getSubtreeMetric(child);
        if (childMetric > maxChildValue) {
          maxChildValue = childMetric;
          maxChild = child;
        }
      });

      if (maxChild) {
        dfs(maxChild, newPath, newCumulativeValue);
      }
    };

    dfs(rootNode, [], 0);
    this.markCriticalPath(maxPath);

    return maxPath;
  }

  private getSubtreeMetric(node: EnrichedNode): number {
    let total = this.metricExtractor(node);

    if (node.children && node.children.length > 0) {
      const childMetrics = node.children.map(child => this.getSubtreeMetric(child));
      total += Math.max(...childMetrics, 0);
    }

    return total;
  }
}
