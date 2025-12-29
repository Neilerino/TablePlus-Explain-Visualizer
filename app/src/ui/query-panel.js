/**
 * Populate the query panel with the original SQL query
 * @param {string} query - SQL query string
 * @param {Object} hljs - Highlight.js library (optional)
 */
export function populateQueryPanel(query, hljs) {
  const queryCode = document.getElementById('queryCode');

  // Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  queryCode.textContent = query;

  // Apply syntax highlighting if available
  if (hljs) {
    hljs.highlightElement(queryCode);
  }
}
