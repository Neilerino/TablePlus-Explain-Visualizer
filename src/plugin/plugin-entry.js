import { TablePlusAdapter } from './tableplus-adapter.js';
import { validateQuery } from '../core/query/validator.js';
import { prepareQuery } from '../core/query/preparer.js';
import { buildExplainQuery } from '../core/query/explain-builder.js';
import { extractPlan } from '../core/parser/plan-extractor.js';
import { parsePlan } from '../core/parser/plan-parser.js';
import { transformToD3Tree } from '../core/transformer/tree-transformer.js';
import { buildHTML } from '../ui/html-builder.js';
import { getTreeVisualizationCode } from '../visualization/tree-renderer.js';

export function runExplain(context) {
  const adapter = new TablePlusAdapter(context);

  try {
    const queryResult = adapter.getQuery();
    if (!queryResult.success) {
      adapter.showError(queryResult.error);
      return;
    }

    let query = queryResult.query;
    query = prepareQuery(query);

    const validation = validateQuery(query);
    if (!validation.valid) {
      adapter.showError(validation.error);
      return;
    }

    const explainQuery = buildExplainQuery(query);

    adapter.executeQuery(explainQuery, (result) => {
      try {
        const extraction = extractPlan(result);
        if (!extraction.success) {
          adapter.showError(extraction.error);
          return;
        }

        const parsed = parsePlan(extraction.data);
        if (!parsed.success) {
          adapter.showError(parsed.error, parsed.message);
          return;
        }

        const planData = parsed.data;
        const treeData = transformToD3Tree(planData);
        const visualizationCode = getTreeVisualizationCode();

        const html = buildHTML({
          query: query,
          planData: planData,
          treeData: treeData,
          visualizationCode: visualizationCode
        });

        adapter.displayHTML(html);

      } catch (error) {
        adapter.showAlert('Error Processing EXPLAIN', error.message || String(error));
      }
    });

  } catch (error) {
    adapter.showAlert('Unexpected Error', error.message || String(error));
  }
}
