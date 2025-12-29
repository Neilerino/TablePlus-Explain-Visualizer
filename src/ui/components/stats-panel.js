/**
 * Statistics panel component
 * Displays execution statistics from EXPLAIN ANALYZE
 */

import { formatNumber, formatTime } from '../../utils/formatters.js';

/**
 * Render a single stat item
 * @param {string} label - Stat label
 * @param {string} value - Stat value
 * @returns {string} HTML string
 */
function renderStatItem(label, value) {
  return `
    <div class="stat-item">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>
  `;
}

/**
 * Render the statistics panel
 * @param {Object} planData - Parsed EXPLAIN plan data
 * @returns {string} HTML string
 */
export function renderStatsPanel(planData) {
  const stats = [
    {
      label: 'Planning Time',
      value: planData['Planning Time'] ? formatTime(planData['Planning Time']) : 'N/A'
    },
    {
      label: 'Execution Time',
      value: planData['Execution Time'] ? formatTime(planData['Execution Time']) : 'N/A'
    },
    {
      label: 'Total Cost',
      value: planData.Plan['Total Cost'] ? formatNumber(planData.Plan['Total Cost']) : 'N/A'
    },
    {
      label: 'Actual Rows',
      value: planData.Plan['Actual Rows'] || 'N/A'
    }
  ];

  return `
    <div class="stats-panel">
      <h4>Execution Statistics</h4>
      ${stats.map(stat => renderStatItem(stat.label, stat.value)).join('\n')}
    </div>
  `;
}
