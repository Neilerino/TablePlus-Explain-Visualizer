/**
 * Populate the stats panel with execution statistics
 * @param {Object} planData - EXPLAIN plan data
 */
export function populateStatsPanel(planData) {
  const statsContainer = document.getElementById('statsContainer');

  const formatTime = (time) => time ? `${time.toFixed(3)} ms` : 'N/A';
  const formatNumber = (num) => num ? num.toFixed(2) : 'N/A';

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
      value: planData.Plan && planData.Plan['Total Cost'] ? formatNumber(planData.Plan['Total Cost']) : 'N/A'
    },
    {
      label: 'Actual Rows',
      value: planData.Plan && planData.Plan['Actual Rows'] ? planData.Plan['Actual Rows'] : 'N/A'
    }
  ];

  let html = '';
  for (const stat of stats) {
    html += `
      <div class="stat-item">
        <span class="stat-label">${stat.label}</span>
        <span class="stat-value">${stat.value}</span>
      </div>
    `;
  }

  statsContainer.innerHTML = html;
}
