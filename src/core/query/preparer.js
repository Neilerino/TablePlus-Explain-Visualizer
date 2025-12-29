/**
 * Clean and prepare a SQL query
 * Removes trailing semicolons and trims whitespace
 * @param {string} query - Raw SQL query
 * @returns {string} Cleaned query
 */
export function prepareQuery(query) {
  if (!query) return '';

  return query.trim().replace(/;+$/, '').trim();
}
