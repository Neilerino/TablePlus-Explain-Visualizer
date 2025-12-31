/**
 * Execution time-based critical path analyzer
 * Finds the path from root to leaf with the highest cumulative execution time
 */

import { EnrichedNode } from '../../../types/plan-data';
import { PathAnalyzer } from './path-analyzer';
import { MetricExtractor } from './metric-extractors';

export class ExecutionTimeAnalyzer extends PathAnalyzer {
  constructor(metricExtractor: MetricExtractor) {
    super(metricExtractor);
  }

  /**
   * Find the critical path using depth-first search
   * Returns the path with maximum cumulative metric value
   */
  analyze(rootNode: EnrichedNode): EnrichedNode[] {
    let maxPath: EnrichedNode[] = [];
    let maxValue = 0;

    /**
     * Recursive DFS to find path with maximum cumulative metric
     */
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

      // For nodes with children, continue DFS on each child
      // but track which child path is most expensive
      let maxChildValue = 0;
      let maxChild: EnrichedNode | null = null;

      // First pass: find the most expensive child
      node.children.forEach(child => {
        const childMetric = this.getSubtreeMetric(child);
        if (childMetric > maxChildValue) {
          maxChildValue = childMetric;
          maxChild = child;
        }
      });

      // Follow only the most expensive child (single path)
      if (maxChild) {
        dfs(maxChild, newPath, newCumulativeValue);
      }
    };

    dfs(rootNode, [], 0);
    this.markCriticalPath(maxPath);

    return maxPath;
  }

  /**
   * Calculate total metric value for a subtree
   * This helps us choose which child to follow in the critical path
   */
  private getSubtreeMetric(node: EnrichedNode): number {
    let total = this.metricExtractor(node);

    if (node.children && node.children.length > 0) {
      // For critical path, we want the maximum path through children, not sum
      const childMetrics = node.children.map(child => this.getSubtreeMetric(child));
      total += Math.max(...childMetrics, 0);
    }

    return total;
  }
}
