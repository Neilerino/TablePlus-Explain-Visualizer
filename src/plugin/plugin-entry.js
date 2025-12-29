/**
 * Plugin entry point
 * Main runExplain function that orchestrates the entire workflow
 */

import { TablePlusAdapter } from './tableplus-adapter.js';
import { validateQuery } from '../core/query/validator.js';
import { prepareQuery } from '../core/query/preparer.js';
import { buildExplainQuery } from '../core/query/explain-builder.js';
import { extractPlan } from '../core/parser/plan-extractor.js';
import { parsePlan } from '../core/parser/plan-parser.js';
import { transformToD3Tree } from '../core/transformer/tree-transformer.js';
import { buildHTML } from '../ui/html-builder.js';
import { getTreeVisualizationCode } from '../visualization/tree-renderer.js';

/**
 * Main plugin entry point
 * Called by TablePlus when user triggers the plugin
 * @param {Object} context - TablePlus context object
 */
export function runExplain(context) {
  const adapter = new TablePlusAdapter(context);

  try {
    // Step 1: Get query from editor
    const queryResult = adapter.getQuery();
    if (!queryResult.success) {
      adapter.showError(queryResult.error);
      return;
    }

    let query = queryResult.query;

    // Step 2: Prepare query (clean, trim)
    query = prepareQuery(query);

    // Step 3: Validate query
    const validation = validateQuery(query);
    if (!validation.valid) {
      adapter.showError(validation.error);
      return;
    }

    // Step 4: Build EXPLAIN query
    const explainQuery = buildExplainQuery(query);

    // Step 5: Execute EXPLAIN query
    adapter.executeQuery(explainQuery, (result) => {
      try {
        // Step 6: Extract plan JSON from result
        const extraction = extractPlan(result);
        if (!extraction.success) {
          adapter.showError(extraction.error);
          return;
        }

        // Step 7: Parse plan JSON
        const parsed = parsePlan(extraction.data);
        if (!parsed.success) {
          adapter.showError(parsed.error, parsed.message);
          return;
        }

        const planData = parsed.data;

        // Step 8: Transform to D3 tree
        const treeData = transformToD3Tree(planData);

        // Step 9: Generate visualization code
        const visualizationCode = getTreeVisualizationCode();

        // Step 10: Build HTML
        const html = buildHTML({
          query: query,
          planData: planData,
          treeData: treeData,
          visualizationCode: visualizationCode
        });

        // Step 11: Display HTML
        adapter.displayHTML(html);

      } catch (error) {
        adapter.showAlert('Error Processing EXPLAIN', error.message || String(error));
      }
    });

  } catch (error) {
    adapter.showAlert('Unexpected Error', error.message || String(error));
  }
}
