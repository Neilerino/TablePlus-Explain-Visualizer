import { TablePlusAdapter } from './tableplus-adapter.js';
import { validateQuery } from '../core/query/validator.js';
import { prepareQuery } from '../core/query/preparer.js';
import { buildExplainQuery } from '../core/query/explain-builder.js';
import { extractPlan } from '../core/parser/plan-extractor.js';
import { parsePlan } from '../core/parser/plan-parser.js';
import { transformToD3Tree } from '../core/transformer/tree-transformer.js';

// Debug flag - set to true to enable runtime inspection
const DEBUG_MODE = false;

function inspectObject(obj, name, maxDepth = 2) {
  const seen = new WeakSet();

  function inspect(obj, depth = 0) {
    if (depth > maxDepth) return '[Max depth reached]';
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object' && typeof obj !== 'function') return String(obj);
    if (seen.has(obj)) return '[Circular]';

    seen.add(obj);

    const type = typeof obj;
    const constructor = obj.constructor ? obj.constructor.name : 'Unknown';
    let info = `[${type} ${constructor}]\n`;

    try {
      const keys = Object.keys(obj);
      const props = Object.getOwnPropertyNames(obj);

      info += `Keys (${keys.length}): ${keys.join(', ')}\n`;
      if (props.length !== keys.length) {
        info += `Properties (${props.length}): ${props.join(', ')}\n`;
      }

      if (depth < maxDepth) {
        for (const key of keys.slice(0, 10)) { // First 10 keys
          try {
            const val = obj[key];
            const valType = typeof val;
            if (valType === 'function') {
              info += `  ${key}: [Function]\n`;
            } else if (valType === 'object' && val !== null) {
              info += `  ${key}: ${inspect(val, depth + 1)}\n`;
            } else {
              info += `  ${key}: ${String(val).substring(0, 50)}\n`;
            }
          } catch (e) {
            info += `  ${key}: [Error accessing: ${e.message}]\n`;
          }
        }
      }
    } catch (e) {
      info += `Error inspecting: ${e.message}\n`;
    }

    return info;
  }

  return `=== ${name} ===\n${inspect(obj)}`;
}

export function runExplain(context) {
  const adapter = new TablePlusAdapter(context);

  if (DEBUG_MODE) {
    // Phase 1: Inspect context object
    let debugInfo = 'TABLEPLUS RUNTIME INSPECTION\n\n';
    debugInfo += inspectObject(context, 'context');
    debugInfo += '\n\n';
    debugInfo += inspectObject(Application, 'Application');

    adapter.showAlert('Phase 1: Objects', debugInfo);

    // Phase 2: Test path resolution
    let pathInfo = 'PATH RESOLUTION\n\n';
    try {
      const pluginRoot = Application.pluginRootPath();
      pathInfo += `pluginRootPath(): ${pluginRoot}\n\n`;

      const workingPath = adapter.workingPath();
      pathInfo += `workingPath(): ${workingPath}\n\n`;

      const webViewPath = 'app/dist/index.html';
      const fullPath = `${workingPath}/${webViewPath}`;
      pathInfo += `Full HTML path: ${fullPath}\n`;
    } catch (e) {
      pathInfo += `Error: ${e.message}\n${e.stack}`;
    }

    adapter.showAlert('Phase 2: Paths', pathInfo);
  }

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

        if (DEBUG_MODE) {
          // Phase 3: Test webView loading
          let webViewInfo = 'WEBVIEW LOADING\n\n';
          try {
            const webViewPath = 'app/dist/index.html';
            webViewInfo += `Loading: ${webViewPath}\n\n`;

            const webView = adapter.loadWebView(webViewPath);
            webViewInfo += `WebView returned:\n`;
            webViewInfo += inspectObject(webView, 'webView', 1);

            adapter.showAlert('Phase 3: WebView', webViewInfo);

            // Phase 4: Test data passing
            if (webView) {
              let evalInfo = 'DATA PASSING\n\n';
              const testData = { test: 'hello', query: query.substring(0, 50) };
              evalInfo += `Test data: ${JSON.stringify(testData, null, 2)}\n\n`;

              try {
                const evalCode = `window.ExplainViz.init(${JSON.stringify(testData)})`;
                evalInfo += `Eval code: ${evalCode.substring(0, 100)}...\n\n`;

                webView.evaluate(evalCode);
                evalInfo += 'evaluate() called successfully';
              } catch (e) {
                evalInfo += `Error in evaluate(): ${e.message}\n${e.stack}`;
              }

              adapter.showAlert('Phase 4: Evaluate', evalInfo);
            }

            return; // Stop here for debugging
          } catch (e) {
            webViewInfo += `Error: ${e.message}\n${e.stack}`;
            adapter.showAlert('Phase 3: Error', webViewInfo);
            return;
          }
        }

        // Normal flow (when DEBUG_MODE is false)
        const webViewPath = 'app/dist/index.html';
        const webView = adapter.loadWebView(webViewPath);

        adapter.sendDataToWebView(webView, {
          query: query,
          planData: planData,
          treeData: treeData
        });

      } catch (error) {
        adapter.showAlert('Error Processing EXPLAIN', error.message || String(error));
      }
    });

  } catch (error) {
    adapter.showAlert('Unexpected Error', error.message || String(error));
  }
}
