# Quick Debugging Guide

## Current Status

✅ Plugin built with debugging instrumentation
✅ Documentation template created
⏳ Waiting for runtime inspection results

## Steps to Debug

### 1. Test in TablePlus

```bash
# The plugin is already built - just test it
open PostgresExplain.tableplusplugin
```

Then in TablePlus:
1. Connect to a PostgreSQL database
2. Write any query (e.g., `SELECT * FROM users LIMIT 10`)
3. Run the EXPLAIN plugin
4. **Four alert dialogs will appear** - copy each one's content

### 2. Share Results

For each of the 4 phases, copy the alert content and share it. I'll help you:
- Interpret what each means
- Identify the issue
- Document the API for future reference
- Implement the fix

### 3. Iterate

Based on what we find, we'll:
- Update the documentation in `TABLEPLUS-RUNTIME-DEBUG.md`
- Make targeted fixes
- Test again if needed
- Build final working version

## What We're Looking For

### Phase 1: Objects
- What methods does `context` have besides `execute()`, `alert()`, `loadHTML()`?
- Does `context` have `loadFile()`?
- What methods does `Application` have?

### Phase 2: Paths
- Is the path resolution correct?
- Does it match the diagram-plugin pattern?
- Example expected path: `/Applications/TablePlus.app/.../com.tinyapp.TablePlus.PostgresExplain.tableplusplugin/app/dist/index.html`

### Phase 3: WebView
- Is a webView object returned?
- What type/constructor does it have?
- Does it have an `evaluate()` method?
- Or does it use a different method name?

### Phase 4: Evaluate
- Does `evaluate()` work?
- Are there any errors?
- Is the syntax different from diagram-plugin?

## Common Scenarios

### Scenario A: `context.loadFile()` doesn't exist
**Fix:** Use different method name (maybe `loadWebView()` or `loadView()`)

### Scenario B: Path is wrong
**Fix:** Adjust path construction in `tableplus-adapter.js`

### Scenario C: webView object is different
**Fix:** Adapt method calls to match actual API

### Scenario D: `evaluate()` doesn't exist
**Fix:** Find the actual method for executing JS in webView

## After Debugging

Once we identify the issue:

1. Document findings in `TABLEPLUS-RUNTIME-DEBUG.md`
2. Update code with fix
3. Set `DEBUG_MODE = false` in `src/plugin/plugin-entry.js`
4. Rebuild: `npm run build`
5. Test final version
6. Create API reference for future development

## Files Modified

- ✅ `src/plugin/plugin-entry.js` - Added debugging code
- 📝 `TABLEPLUS-RUNTIME-DEBUG.md` - Documentation template (to be filled)
- 📝 `DEBUGGING-GUIDE.md` - This file

## Reverting to Original

If you need to go back to the working version (before webView refactor):

```bash
git stash  # Save current changes
git checkout [commit-hash-before-refactor]
```
