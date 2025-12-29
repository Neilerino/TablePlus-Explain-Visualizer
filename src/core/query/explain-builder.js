/**
 * EXPLAIN query builder module
 * Constructs PostgreSQL EXPLAIN statements
 */

/**
 * Build an EXPLAIN query with analysis options
 * @param {string} query - Original SQL query
 * @param {Object} options - EXPLAIN options
 * @returns {string} EXPLAIN query
 */
export function buildExplainQuery(query, options = {}) {
  const {
    analyze = true,
    costs = true,
    verbose = true,
    buffers = true,
    format = 'JSON'
  } = options;

  const explainOptions = [];

  if (analyze) explainOptions.push('ANALYZE');
  if (costs) explainOptions.push('COSTS');
  if (verbose) explainOptions.push('VERBOSE');
  if (buffers) explainOptions.push('BUFFERS');
  if (format) explainOptions.push(`FORMAT ${format}`);

  const optionsString = explainOptions.join(', ');
  return `EXPLAIN (${optionsString}) ${query}`;
}
