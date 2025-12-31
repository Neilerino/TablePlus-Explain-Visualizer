/**
 * Abstract base class for path analysis strategies
 * Implements the Strategy pattern for different types of critical path analysis
 */

import { EnrichedNode } from '../../../types/plan-data';
import { MetricExtractor } from './metric-extractors';

/**
 * Abstract base class for path analyzers
 * Subclasses implement specific algorithms for finding critical paths
 */
export abstract class PathAnalyzer {
  protected metricExtractor: MetricExtractor;

  constructor(metricExtractor: MetricExtractor) {
    this.metricExtractor = metricExtractor;
  }

  /**
   * Analyze the tree and return the critical path
   * @param rootNode - Root of the execution plan tree
   * @returns Array of nodes representing the critical path from root to leaf
   */
  abstract analyze(rootNode: EnrichedNode): EnrichedNode[];

  /**
   * Mark nodes on the critical path with isOnCriticalPath flag
   * @param criticalPath - Array of nodes on the critical path
   */
  protected markCriticalPath(criticalPath: EnrichedNode[]): void {
    criticalPath.forEach(node => {
      node.isOnCriticalPath = true;
    });
  }
}
