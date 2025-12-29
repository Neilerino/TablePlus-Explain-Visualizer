# TablePlus Runtime Environment Documentation

This document captures information about the TablePlus plugin runtime environment through systematic debugging.

## Debugging Setup

The plugin has been instrumented with debugging code that displays 4 phases of information via `context.alert()`:

### Phase 1: Object Inspection
Shows available properties and methods on:
- `context` object - The plugin execution context
- `Application` object - Global application object

### Phase 2: Path Resolution
Tests path resolution functions:
- `Application.pluginRootPath()` - Where TablePlus looks for plugins
- `adapter.workingPath()` - Full path to plugin directory
- Full HTML path construction

### Phase 3: WebView Loading
Tests `context.loadFile()`:
- What type of object is returned
- Available properties/methods on the webView object
- Whether the file loads successfully

### Phase 4: Data Passing
Tests `webView.evaluate()`:
- Whether evaluate() method exists
- Whether it executes without errors
- Test data passing with simple object

## How to Use

1. Open TablePlus
2. Load the PostgresExplain plugin
3. Run EXPLAIN on any query
4. Four alert dialogs will appear in sequence with debugging information
5. Copy each alert's content and paste it into the sections below

## Debug Results

### Phase 1: Objects

**context object:**
```
[Paste alert content here]
```

**Application object:**
```
[Paste alert content here]
```

**Analysis:**
- Available methods:
- Available properties:
- Notable observations:

---

### Phase 2: Paths

```
[Paste alert content here]
```

**Analysis:**
- Plugin root path:
- Working path:
- Full HTML path:
- Does path look correct? (Y/N)
- Expected vs Actual:

---

### Phase 3: WebView

```
[Paste alert content here]
```

**Analysis:**
- webView type/constructor:
- Available methods on webView:
- Does webView have evaluate()? (Y/N)
- Does webView have other methods?
- Comparison to diagram-plugin pattern:

---

### Phase 4: Evaluate

```
[Paste alert content here]
```

**Analysis:**
- Did evaluate() execute? (Y/N)
- Error messages (if any):
- Test data passed successfully? (Y/N)

---

## TablePlus Plugin API Reference

Based on debugging results, document the confirmed API:

### Context Object

**Confirmed Methods:**
- `context.execute(query, callback)` - Execute SQL query
- `context.alert(title, message)` - Show alert dialog
- `context.loadHTML(html)` - Load HTML string (old method)
- `context.loadFile(path, options)` - Load file into webView (new method)
- `context.currentQueryEditor()` - Get current query editor

**Confirmed Properties:**
- [To be filled after debugging]

### Application Object

**Confirmed Methods:**
- `Application.pluginRootPath()` - Get plugin directory path

**Confirmed Properties:**
- [To be filled after debugging]

### WebView Object

**Type:** [To be determined]

**Confirmed Methods:**
- `webView.evaluate(jsCode)` - Execute JavaScript in webView context
- [To be filled after debugging]

**Confirmed Properties:**
- [To be filled after debugging]

---

## Known Issues and Fixes

### Issue 1: [Title]
**Problem:** [Description]
**Cause:** [Root cause]
**Solution:** [How we fixed it]

---

## Next Steps

After collecting debugging information:

1. ✅ Identify what's different from diagram-plugin pattern
2. ✅ Verify path resolution is correct
3. ✅ Confirm webView object structure
4. ✅ Test if evaluate() is being called correctly
5. ✅ Check if window.ExplainViz.init() is accessible in webView context
6. ✅ Fix rendering issue based on findings

---

## Disabling Debug Mode

To disable debugging and return to normal operation:

Edit `src/plugin/plugin-entry.js` and change:
```javascript
const DEBUG_MODE = true;
```
to:
```javascript
const DEBUG_MODE = false;
```

Then rebuild: `npm run build`
