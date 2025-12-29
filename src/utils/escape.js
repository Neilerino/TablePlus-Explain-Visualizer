/**
 * HTML and JSON escaping utilities
 */

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape JSON for safe embedding in HTML
 * Prevents script injection by escaping < characters
 * @param {Object} obj - Object to stringify and escape
 * @returns {string} Escaped JSON string
 */
export function escapeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
