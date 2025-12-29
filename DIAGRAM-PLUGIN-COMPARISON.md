# Diagram Plugin Pattern Comparison

This document compares the known working pattern from TablePlus's diagram-plugin with our implementation to identify differences.

## Diagram Plugin (Known Working)

### File Structure
```
diagram.tableplusplugin/
├── manifest.json
├── diagram.js                    # Bundled plugin code
└── diagram/                      # WebView directory
    ├── index.html               # Entry HTML
    ├── static/
    │   ├── css/
    │   └── js/
    └── asset-manifest.json
```

### Code Pattern (from diagram.js)

```javascript
// 1. Get working path
var workingPath = Application.pluginRootPath() +
  '/com.tableplus.TablePlus.diagram.tableplusplugin';

// 2. Load HTML file
var webView = context.loadFile(
  workingPath + '/diagram/index.html',
  null
);

// 3. Pass data via evaluate
webView.evaluate(
  "window.Diagram.importDiagramObject(" +
  JSON.stringify(data) +
  ")"
);
```

### HTML Pattern
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="static/css/main.css">
</head>
<body>
  <div id="root"></div>
  <script src="static/js/main.chunk.js"></script>
  <script src="static/js/2.chunk.js"></script>
  <!-- Window global setup -->
  <script>
    window.Diagram = {
      importDiagramObject: function(data) {
        // Receives data from plugin
      }
    };
  </script>
</body>
</html>
```

**Key characteristics:**
- ✅ Multiple separate files (HTML, CSS, JS chunks)
- ✅ HTML loads external CSS and JS via `<link>` and `<script src="">`
- ✅ Uses `context.loadFile()` with relative path
- ✅ Uses `webView.evaluate()` to pass data
- ✅ Window global object for communication

---

## Our Implementation (PostgresExplain)

### File Structure
```
PostgresExplain.tableplusplugin/
├── manifest.json
├── explain.js                    # Bundled plugin code
└── app/dist/                     # WebView directory
    ├── index.html               # Single-file HTML (all inlined)
    ├── app.bundle.js            # (only used for inlining)
    └── app.bundle.js.map
```

### Code Pattern (current)

```javascript
// 1. Get working path
const PLUGIN_IDENTIFER = 'com.tinyapp.TablePlus.PostgresExplain.tableplusplugin';
workingPath() {
  return Application.pluginRootPath() + `/${PLUGIN_IDENTIFER}`;
}

// 2. Load HTML file
loadWebView(htmlPath) {
  return this.context.loadFile(`${this.workingPath()}/${htmlPath}`, null);
}

// 3. Pass data via evaluate
sendDataToWebView(webView, data) {
  const jsonData = JSON.stringify(data);
  webView.evaluate(`window.ExplainViz.init(${jsonData})`);
}
```

### HTML Pattern
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PostgreSQL EXPLAIN Visualization</title>
</head>
<body>
  <div class="app-container">...</div>
  <script>
    window.ExplainViz = window.ExplainViz || {};
  </script>
  <script>
    // ALL JavaScript inlined here (366KB)
    // Including D3.js, highlight.js, all app code, all CSS
  </script>
</body>
</html>
```

**Key characteristics:**
- ⚠️ Single HTML file with everything inlined
- ⚠️ All CSS inlined via style-loader into JS
- ⚠️ All JS inlined via post-build script
- ✅ Uses `context.loadFile()` with relative path
- ✅ Uses `webView.evaluate()` to pass data
- ✅ Window global object for communication

---

## Key Differences

| Aspect | Diagram Plugin | Our Plugin | Issue? |
|--------|---------------|------------|--------|
| **File Structure** | Multiple files (HTML + external CSS/JS) | Single file (all inlined) | ❓ Unknown |
| **Plugin ID** | `com.tableplus.TablePlus.diagram.tableplusplugin` | `com.tinyapp.TablePlus.PostgresExplain.tableplusplugin` | ✅ OK |
| **HTML Location** | `/diagram/index.html` | `/app/dist/index.html` | ✅ OK |
| **Data Passing** | `window.Diagram.importDiagramObject()` | `window.ExplainViz.init()` | ✅ OK |
| **Bundle Size** | ~100KB total (split chunks) | 366KB (single file) | ⚠️ Large |

---

## Hypotheses to Test

### Hypothesis 1: External Resources Don't Load
**Theory:** TablePlus webView can't load external CSS/JS referenced via `<link>` and `<script src="">`
**Evidence:** We initially bundled separately and it didn't work
**Status:** ✅ ADDRESSED - We inline everything now

### Hypothesis 2: Path Resolution Issue
**Theory:** The path we're constructing doesn't match where TablePlus expects files
**Test:** Phase 2 debugging will show actual vs expected path
**Status:** ⏳ TESTING

### Hypothesis 3: webView API Different
**Theory:** The webView object or evaluate() method works differently than we expect
**Test:** Phase 3 & 4 debugging will reveal webView structure
**Status:** ⏳ TESTING

### Hypothesis 4: Bundle Size Too Large
**Theory:** 366KB inlined HTML might be too large or cause parsing issues
**Test:** Check if there's a size limit
**Status:** ⏳ TESTING

### Hypothesis 5: JavaScript Error in Bundle
**Theory:** There's a runtime error in our inlined JavaScript that prevents initialization
**Test:** Phase 4 will show if evaluate() succeeds
**Status:** ⏳ TESTING

### Hypothesis 6: Context Timing Issue
**Theory:** webView.evaluate() is called before the page is fully loaded
**Test:** Add delay or ready check before evaluate
**Status:** ⏳ TO TEST

---

## Questions for Debugging

1. **Does `context.loadFile()` successfully return a webView object?**
   - If no: Maybe method name is different
   - If yes: Proceed to question 2

2. **Does the webView have an `evaluate()` method?**
   - If no: Find the correct method name
   - If yes: Proceed to question 3

3. **Does `webView.evaluate()` execute without errors?**
   - If no: What's the error message?
   - If yes: Proceed to question 4

4. **Is `window.ExplainViz.init()` being called in the webView?**
   - If no: Check if JavaScript is executing
   - If yes: Check if data is received correctly

5. **Is there a console or error log we can check?**
   - How to access webView console/errors?
   - Any TablePlus debug mode?

---

## Possible Fixes Based on Findings

### If path is wrong:
```javascript
// Try variations:
- `${this.workingPath()}/app/dist/index.html`
- `app/dist/index.html` (without workingPath)
- Absolute path construction
```

### If evaluate() timing issue:
```javascript
// Add delay
setTimeout(() => {
  webView.evaluate(`window.ExplainViz.init(${jsonData})`);
}, 500);

// Or check for ready state
webView.evaluate(`
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ExplainViz.init(${jsonData});
    });
  } else {
    window.ExplainViz.init(${jsonData});
  }
`);
```

### If bundle too large:
- Split into external files like diagram-plugin
- Load D3.js and highlight.js from CDN
- Reduce bundle size with code splitting

### If JavaScript error:
- Check browser console in dev server (works there)
- Add try-catch in evaluate code
- Simplify to minimal test case

---

## Success Criteria

✅ WebView loads HTML file successfully
✅ JavaScript executes in webView context
✅ `window.ExplainViz.init()` is called
✅ Data is received correctly
✅ Tree visualization renders
✅ All interactions work (clicks, zoom, sidebars)

---

## Next Actions

1. Run plugin in TablePlus with DEBUG_MODE enabled
2. Copy all 4 alert dialog contents
3. Fill in `TABLEPLUS-RUNTIME-DEBUG.md` with findings
4. Analyze results against this comparison
5. Identify the root cause
6. Implement targeted fix
7. Test and verify
