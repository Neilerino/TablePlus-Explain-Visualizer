# TablePlus Plugin API Type Definitions

This directory contains TypeScript definition files (`.d.ts`) that document the TablePlus plugin API.

## Purpose

These type definitions serve multiple purposes:

1. **Documentation** - Comprehensive reference for available APIs
2. **IDE Support** - Enable IntelliSense/autocomplete in VS Code and other editors
3. **TypeScript Migration** - Prepare for future TypeScript conversion
4. **Type Safety** - Catch errors early with JSDoc type hints

## How They Were Created

These types were reverse-engineered through:

- Runtime inspection using `Object.getOwnPropertyNames()`
- Analysis of the [diagram-plugin](https://github.com/TablePlus/diagram-plugin) reference implementation
- Testing and observation of API behavior
- Trial and error with the TablePlus plugin environment

## Files

- `tableplus.d.ts` - Complete TablePlus plugin API definitions

## Using These Types

### In JavaScript Files (Current)

Add a reference comment at the top of your files:

```javascript
/// <reference path="../../types/tableplus.d.ts" />

/**
 * @param {TablePlusContext} context
 */
export function runExplain(context) {
  // Now you get autocomplete for context.execute(), context.alert(), etc.
}
```

### In TypeScript Files (Future)

Simply import the types:

```typescript
import type { TablePlusContext } from '../../types/tableplus';

export function runExplain(context: TablePlusContext) {
  // Full type checking
}
```

## API Coverage

### ✅ Documented and Tested

**Application:**
- `Application.pluginRootPath()` - Confirmed working

**Context:**
- `context.execute(query, callback)` - Confirmed working
- `context.alert(title, message)` - Confirmed working
- `context.loadFile(path, null)` - Confirmed working
- `context.currentQueryEditor()` - Confirmed working

**WebView:**
- `webView.evaluate(jsCode)` - Confirmed working

**QueryEditor (Complete API via runtime inspection):**
- `queryEditor.currentSelectedString()` - ✅ Confirmed
- `queryEditor.value()` - ✅ Confirmed
- `queryEditor.currentSelectedRange()` - ✅ Discovered
- `queryEditor.replaceStringInRange(range, text)` - ✅ Discovered

### ⚠️ Partially Documented

- `Application.saveFile()` - Exists but not tested
- `QueryResult` structure - Inferred from EXPLAIN results
- `context.loadHTML()` - Legacy method, works but deprecated

### ❓ Unknown/Untested

- Other potential Application methods
- Other potential context methods
- Advanced WebView APIs
- Plugin lifecycle hooks

## Contributing

If you discover additional APIs or corrections:

1. Test the API behavior
2. Update `tableplus.d.ts` with proper JSDoc comments
3. Document your findings here
4. Update the API Coverage section

## Example Usage

See `src/plugin/tableplus-adapter.js` for practical examples of using these APIs.

## References

- [TablePlus Plugin Documentation](https://tableplus.com/blog/2018/07/how-to-write-a-plugin-for-tableplus.html) (outdated but useful)
- [Diagram Plugin Source](https://github.com/TablePlus/diagram-plugin) (best reference implementation)
- Our debugging documentation: `TABLEPLUS-RUNTIME-DEBUG.md`
