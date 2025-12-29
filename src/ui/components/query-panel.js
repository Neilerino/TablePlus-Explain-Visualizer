/**
 * Query panel component
 * Displays the original SQL query with syntax highlighting
 */

import { escapeHtml } from '../../utils/escape.js';

/**
 * Render the query display panel
 * @param {string} query - SQL query to display
 * @returns {string} HTML string
 */
export function renderQueryPanel(query) {
  const escapedQuery = escapeHtml(query);

  return `
    <div class="query-panel">
      <h4>Original Query</h4>
      <pre class="query-text"><code class="language-sql">${escapedQuery}</code></pre>
    </div>
  `;
}
