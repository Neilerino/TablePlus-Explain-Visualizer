/**
 * Metric extraction functions for path analysis
 * Each function extracts a specific metric from an enriched node
 */

import { EnrichedNode } from '../../../types/plan-data';

export type MetricExtractor = (node: EnrichedNode) => number;

/**
 * Extract execution time metric (in milliseconds)
 */
export const timeMetricExtractor: MetricExtractor = (node: EnrichedNode): number => {
  const time = node.details.actualTime;
  if (time === 'N/A' || time === null || time === undefined) {
    return 0;
  }
  return parseFloat(time) || 0;
};

/**
 * Extract cost metric
 */
export const costMetricExtractor: MetricExtractor = (node: EnrichedNode): number => {
  const cost = node.details.cost;
  if (cost === 'N/A' || cost === null || cost === undefined) {
    return 0;
  }
  return parseFloat(cost) || 0;
};

/**
 * Extract actual rows metric
 */
export const rowsMetricExtractor: MetricExtractor = (node: EnrichedNode): number => {
  const rows = node.details.actualRows;
  if (rows === 'N/A' || rows === null || rows === undefined) {
    return 0;
  }
  return typeof rows === 'number' ? rows : parseInt(String(rows), 10) || 0;
};

/**
 * Extract I/O read time metric (useful for identifying I/O bottlenecks)
 */
export const ioReadTimeExtractor: MetricExtractor = (node: EnrichedNode): number => {
  return node.details.ioReadTime || 0;
};

/**
 * Extract memory usage metric
 */
export const memoryExtractor: MetricExtractor = (node: EnrichedNode): number => {
  return node.details.peakMemoryUsage || 0;
};
