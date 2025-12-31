/**
 * Analysis layer entry point
 * Exports all analysis utilities and analyzers
 */

export * from './metric-extractors';
export * from './tree-utils';
export * from './path-analyzer';
export * from './execution-time-analyzer';
export * from './cost-analyzer';

// Convenience function for calculating critical path
import { EnrichedNode } from '../../../types/plan-data';
import { ExecutionTimeAnalyzer } from './execution-time-analyzer';
import { CostAnalyzer } from './cost-analyzer';
import { timeMetricExtractor, costMetricExtractor, MetricExtractor } from './metric-extractors';
import { assignNodeIds } from './tree-utils';

export type CriticalPathMetric = 'time' | 'cost' | 'custom';

/**
 * Calculate critical path for a tree
 * @param rootNode - Root of the execution plan tree
 * @param metric - Metric to use ('time' or 'cost' or 'custom')
 * @param customExtractor - Optional custom metric extractor (required if metric is 'custom')
 * @returns Array of nodes on the critical path
 */
export function calculateCriticalPath(
  rootNode: EnrichedNode,
  metric: CriticalPathMetric = 'time',
  customExtractor?: MetricExtractor
): EnrichedNode[] {
  // Ensure all nodes have IDs
  if (!rootNode.id) {
    assignNodeIds(rootNode);
  }

  let analyzer;

  if (metric === 'time') {
    analyzer = new ExecutionTimeAnalyzer(timeMetricExtractor);
  } else if (metric === 'cost') {
    analyzer = new CostAnalyzer(costMetricExtractor);
  } else if (metric === 'custom' && customExtractor) {
    analyzer = new ExecutionTimeAnalyzer(customExtractor);
  } else {
    throw new Error('Invalid metric or missing custom extractor');
  }

  return analyzer.analyze(rootNode);
}
