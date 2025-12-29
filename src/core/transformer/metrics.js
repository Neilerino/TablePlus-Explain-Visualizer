/**
 * Metrics calculation module
 * Calculates performance metrics and indicators
 */

/**
 * Calculate estimation accuracy
 * @param {number} planRows - Planner's row estimate
 * @param {number} actualRows - Actual rows returned
 * @returns {number} Estimation accuracy ratio
 */
export function calculateEstimationAccuracy(planRows, actualRows) {
  if (!planRows || planRows === 0) return 1.0;
  return actualRows / planRows;
}

/**
 * Check if estimation is significantly off
 * @param {number} accuracy - Estimation accuracy ratio
 * @param {number} threshold - Threshold for "off" (default 2x)
 * @returns {boolean} True if estimation is off
 */
export function isEstimationOff(accuracy, threshold = 2.0) {
  return accuracy < (1 / threshold) || accuracy > threshold;
}

/**
 * Calculate buffer cache hit rate
 * @param {number} hitBlocks - Blocks found in cache
 * @param {number} readBlocks - Blocks read from disk
 * @returns {number} Hit rate as percentage (0-100)
 */
export function calculateCacheHitRate(hitBlocks, readBlocks) {
  const total = hitBlocks + readBlocks;
  if (total === 0) return 0;
  return (hitBlocks / total) * 100;
}

/**
 * Calculate filter selectivity
 * @param {number} actualRows - Rows after filter
 * @param {number} removedRows - Rows removed by filter
 * @returns {number} Selectivity as percentage (0-100)
 */
export function calculateSelectivity(actualRows, removedRows) {
  const totalRows = actualRows + removedRows;
  if (totalRows === 0) return 0;
  return (actualRows / totalRows) * 100;
}
