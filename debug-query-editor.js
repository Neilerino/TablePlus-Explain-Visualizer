/**
 * Debug script to inspect TablePlusQueryEditor object
 *
 * Usage:
 * 1. Replace src/index.js content with: export { debugQueryEditor as runExplain } from '../debug-query-editor.js';
 * 2. npm run build:plugin
 * 3. Run plugin in TablePlus
 * 4. Copy the alert output
 * 5. Revert src/index.js to original
 */

function inspectObject(obj, name, maxDepth = 3) {
  const seen = new WeakSet();
  const results = {
    type: typeof obj,
    constructor: obj?.constructor?.name || 'Unknown',
    properties: [],
    methods: [],
    values: {}
  };

  function inspect(obj, depth = 0) {
    if (depth > maxDepth) return '[Max depth]';
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object' && typeof obj !== 'function') return String(obj);
    if (seen.has(obj)) return '[Circular]';

    seen.add(obj);

    try {
      // Get all property names (including non-enumerable)
      const allProps = Object.getOwnPropertyNames(obj);
      const ownKeys = Object.keys(obj);

      // Try to get prototype properties too
      let proto = Object.getPrototypeOf(obj);
      const protoProps = proto ? Object.getOwnPropertyNames(proto) : [];

      const allUnique = [...new Set([...allProps, ...protoProps])].sort();

      for (const key of allUnique) {
        // Skip common object prototype methods
        if (['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
             'toLocaleString', 'toString', 'valueOf'].includes(key)) {
          continue;
        }

        try {
          const descriptor = Object.getOwnPropertyDescriptor(obj, key) ||
                           Object.getOwnPropertyDescriptor(proto, key);

          const val = obj[key];
          const valType = typeof val;
          const isOwn = ownKeys.includes(key);
          const isProto = protoProps.includes(key) && !allProps.includes(key);

          const info = {
            name: key,
            type: valType,
            own: isOwn,
            proto: isProto,
            enumerable: descriptor?.enumerable || false,
            writable: descriptor?.writable || false,
            configurable: descriptor?.configurable || false
          };

          if (valType === 'function') {
            // Try to get function signature
            const fnStr = val.toString();
            const match = fnStr.match(/^(?:async\s+)?function\s*\w*\s*\(([^)]*)\)/);
            info.signature = match ? `(${match[1]})` : '(?)';
            results.methods.push(info);
          } else {
            if (valType === 'object' && val !== null && depth < 2) {
              info.value = inspect(val, depth + 1);
            } else {
              info.value = String(val).substring(0, 100);
            }
            results.properties.push(info);
            results.values[key] = info.value;
          }
        } catch (e) {
          results.properties.push({
            name: key,
            error: e.message
          });
        }
      }
    } catch (e) {
      results.error = e.message;
    }

    return results;
  }

  return inspect(obj);
}

function formatResults(results, name) {
  let output = `=== ${name} ===\n\n`;
  output += `Type: ${results.constructor}\n\n`;

  if (results.methods.length > 0) {
    output += `METHODS (${results.methods.length}):\n`;
    output += '─'.repeat(50) + '\n';

    for (const method of results.methods) {
      const badge = method.own ? '[OWN]' : method.proto ? '[PROTO]' : '';
      output += `${badge} ${method.name}${method.signature}\n`;
    }
    output += '\n';
  }

  if (results.properties.length > 0) {
    output += `PROPERTIES (${results.properties.length}):\n`;
    output += '─'.repeat(50) + '\n';

    for (const prop of results.properties) {
      const badge = prop.own ? '[OWN]' : prop.proto ? '[PROTO]' : '';
      const value = prop.value ? `: ${prop.value}` : '';
      output += `${badge} ${prop.name} (${prop.type})${value}\n`;
    }
    output += '\n';
  }

  // Show sample values for testing
  output += `SAMPLE VALUES:\n`;
  output += '─'.repeat(50) + '\n';
  const sampleKeys = Object.keys(results.values).slice(0, 10);
  for (const key of sampleKeys) {
    output += `${key}: ${results.values[key]}\n`;
  }

  return output;
}

export function debugQueryEditor(context) {
  try {
    const editor = context.currentQueryEditor();

    if (!editor) {
      context.alert('Debug Error', 'No query editor found. Make sure a query tab is open.');
      return;
    }

    // Inspect the query editor
    const results = inspectObject(editor, 'TablePlusQueryEditor');
    const output = formatResults(results, 'TablePlusQueryEditor');

    context.alert('QueryEditor API', output);

    // Also create a second alert with test calls
    let testOutput = 'TESTING METHODS:\n\n';

    // Test methods we know about
    try {
      const selected = editor.currentSelectedString();
      testOutput += `currentSelectedString(): "${selected.substring(0, 50)}${selected.length > 50 ? '...' : ''}"\n\n`;
    } catch (e) {
      testOutput += `currentSelectedString(): ERROR - ${e.message}\n\n`;
    }

    try {
      const value = editor.value();
      testOutput += `value(): "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"\n\n`;
    } catch (e) {
      testOutput += `value(): ERROR - ${e.message}\n\n`;
    }

    // Try some likely method names
    const methodsToTry = [
      'getText', 'setText', 'insertText',
      'getSelection', 'setSelection',
      'getCursorPosition', 'setCursorPosition',
      'getLineCount', 'getCurrentLine',
      'replaceSelection', 'replaceText',
      'undo', 'redo',
      'focus', 'blur'
    ];

    testOutput += 'TESTING POTENTIAL METHODS:\n';
    testOutput += '─'.repeat(40) + '\n';

    for (const methodName of methodsToTry) {
      if (typeof editor[methodName] === 'function') {
        testOutput += `✓ ${methodName} - EXISTS (function)\n`;
      } else if (methodName in editor) {
        testOutput += `? ${methodName} - EXISTS (${typeof editor[methodName]})\n`;
      } else {
        testOutput += `✗ ${methodName} - not found\n`;
      }
    }

    context.alert('Method Tests', testOutput);

  } catch (error) {
    context.alert('Debug Error', `${error.message}\n\n${error.stack}`);
  }
}
