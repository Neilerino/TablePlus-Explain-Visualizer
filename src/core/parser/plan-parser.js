/**
 * Plan parser module
 * Parses PostgreSQL EXPLAIN JSON output
 */

/**
 * Parse EXPLAIN JSON string
 * PostgreSQL returns an array with one plan object - this unwraps it
 * @param {string} jsonString - JSON string from EXPLAIN
 * @returns {{success: boolean, data?: Object, error?: string}} Parse result
 */
export function parsePlan(jsonString) {
  try {
    let planData = JSON.parse(jsonString);

    // PostgreSQL returns an array with one plan object - extract it
    if (Array.isArray(planData) && planData.length > 0) {
      planData = planData[0];
    }

    // Validate plan structure
    if (!planData || !planData.Plan) {
      return {
        success: false,
        error: 'INVALID_PLAN_STRUCTURE'
      };
    }

    return {
      success: true,
      data: planData
    };
  } catch (e) {
    return {
      success: false,
      error: 'PARSE_ERROR',
      message: e.message
    };
  }
}
