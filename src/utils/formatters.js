/**
 * Formatting utilities for numbers, times, and metrics
 */

/**
 * Format a number with optional decimal places
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number or 'N/A'
 */
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  return Number(num).toFixed(decimals);
}

/**
 * Format time in milliseconds
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time with unit
 */
export function formatTime(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }
  return `${Number(ms).toFixed(3)} ms`;
}

/**
 * Format bytes into human-readable size
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size with unit
 */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return 'N/A';
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format a metric value with appropriate unit
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement
 * @returns {string} Formatted metric
 */
export function formatMetric(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return unit ? `${value} ${unit}` : String(value);
}
