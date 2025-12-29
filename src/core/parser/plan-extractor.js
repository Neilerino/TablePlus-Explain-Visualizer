/**
 * Extract plan JSON string from execution result
 * @param {Object} result - TablePlus execution result
 * @returns {{success: boolean, data?: string, error?: string}} Extraction result
 */
export function extractPlan(result) {
  // Validate result structure
  if (!result || !result.rows || result.rows.length === 0) {
    return {
      success: false,
      error: 'NO_RESULT'
    };
  }

  const columnNames = Object.keys(result.columns || {});
  if (columnNames.length === 0) {
    return {
      success: false,
      error: 'NO_COLUMNS'
    };
  }

  const columnName = columnNames[0];
  const firstRow = result.rows[0];

  const planJsonString = firstRow.raw(columnName);
  if (!planJsonString) {
    return {
      success: false,
      error: 'NO_PLAN_DATA'
    };
  }

  return {
    success: true,
    data: planJsonString
  };
}
