/**
 * Query preparation module
 * Cleans and prepares SQL queries for execution
 */

/**
 * Clean and prepare a SQL query
 * Removes trailing semicolons and trims whitespace
 * @param {string} query - Raw SQL query
 * @returns {string} Cleaned query
 */
export function prepareQuery(query) {
  if (!query) return '';

  // Trim and remove trailing semicolons
  return query.trim().replace(/;+$/, '').trim();
}
