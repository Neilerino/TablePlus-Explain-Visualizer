/**
 * Query validation module
 * Validates SQL queries for EXPLAIN compatibility
 */

/**
 * Validate if a query is compatible with EXPLAIN
 * @param {string} query - SQL query to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateQuery(query) {
  if (!query || query.trim().length === 0) {
    return {
      valid: false,
      error: 'NO_QUERY'
    };
  }

  // Check if already has EXPLAIN
  if (/^\s*EXPLAIN/i.test(query)) {
    return {
      valid: false,
      error: 'ALREADY_EXPLAINED'
    };
  }

  // Validate query type - only these work with EXPLAIN
  if (!/^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)/i.test(query)) {
    return {
      valid: false,
      error: 'INVALID_QUERY'
    };
  }

  return { valid: true };
}
