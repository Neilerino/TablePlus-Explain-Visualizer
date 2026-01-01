# Component Architecture Migration Plan

## Overview
Migrate from function-based UI to a Component + Controller pattern with clear separation of concerns.

## Architecture Pattern

### Component (UI/DOM Only)
- Extends base `Component` class
- Manages DOM elements and rendering
- Exposes public API via getters/methods
- **No business logic, no events**

### Controller (Business Logic)
- One instance per component instance
- Handles event subscriptions
- Coordinates with use cases and state
- **No DOM manipulation**

---

## Current UI Files

| File | Type | Status |
|------|------|--------|
| `node-details.js` | Function | ❌ Needs migration |
| `query-panel.js` | Function | ❌ Needs migration |
| `stats-panel.js` | Function | ❌ Needs migration |
| `critical-path-control.ts` | Function (uses use cases) | ❌ Needs migration |
| `view-toggle.ts` | Function (uses use cases) | ❌ Needs migration |

---

## Migration Plan

### Phase 1: Foundation
- [ ] Create `base.component.ts` - Abstract base class for all components
- [ ] Create `/presentation/components/` directory structure
- [ ] Create `/presentation/controllers/` directory structure (already exists)

### Phase 2: Sidebar Components (Proof of Concept)
- [ ] Create `SidebarComponent` class
  - Manages DOM (collapse button, resize handle)
  - Public API: `collapse()`, `expand()`, `setWidth()`, `isCollapsed`, `width`
- [ ] Refactor `SidebarController` to accept a component
  - Remove DOM manipulation
  - Use component's public API
  - Keep event handling logic
- [ ] Create TWO controller instances (left + right)
- [ ] Update bootstrap to wire up both sidebar instances
- [ ] Test and verify functionality

### Phase 3: Panel Components (Display Only)
- [ ] Create `QueryPanelComponent`
  - Renders SQL query with syntax highlighting
  - Public API: `setQuery(query: string, hljs)`
  - **No controller needed** - simple render
- [ ] Create `StatsPanelComponent`
  - Renders execution statistics
  - Public API: `setStats(planData)`
  - **No controller needed** - simple render
- [ ] Update `main.js` to use components instead of functions

### Phase 4: Details Panel (Event-Driven)
- [ ] Create `NodeDetailsComponent`
  - Renders node details content
  - Public API: `setNodeData(nodeData, hljs)`
- [ ] Create `NodeDetailsController`
  - Subscribes to `NodeSelectedEvent`
  - Fetches node data from VisualizationController
  - Calls component.setNodeData()
- [ ] Wire up in bootstrap

### Phase 5: Toggle Components (Interactive)
- [ ] Create `ViewToggleComponent`
  - Renders view toggle tabs
  - Public API: `setActiveView(viewType)`, `getButtons()`
- [ ] Create `ViewToggleController` (optional - might stay inline)
  - Attaches click handlers
  - Calls `ToggleViewUseCase`
  - Subscribes to `ViewChangedEvent` to update UI
- [ ] Create `CriticalPathToggleComponent`
  - Renders checkbox
  - Public API: `setEnabled(enabled)`, `getCheckbox()`
- [ ] Create `CriticalPathToggleController` (optional)
  - Attaches change handler
  - Calls `ToggleCriticalPathUseCase`
  - Subscribes to `CriticalPathToggledEvent`

### Phase 6: Cleanup
- [ ] Delete `/ui/` folder files
- [ ] Update all imports in main.js
- [ ] Remove old function calls
- [ ] Verify all functionality works

---

## Component Mapping

| Current File | Component | Controller | Notes |
|--------------|-----------|------------|-------|
| N/A (in SidebarController) | `SidebarComponent` | `SidebarController` | Two instances (left + right) |
| `node-details.js` | `NodeDetailsComponent` | `NodeDetailsController` | Event-driven |
| `query-panel.js` | `QueryPanelComponent` | None | Simple render only |
| `stats-panel.js` | `StatsPanelComponent` | None | Simple render only |
| `critical-path-control.ts` | `CriticalPathToggleComponent` | Optional inline | Use case already handles logic |
| `view-toggle.ts` | `ViewToggleComponent` | Optional inline | Use case already handles logic |

---

## File Structure (Target)

```
/presentation/
├── components/
│   ├── base.component.ts              # Abstract base class
│   ├── sidebar.component.ts           # Sidebar UI
│   ├── node-details.component.ts      # Node details panel UI
│   ├── query-panel.component.ts       # Query display UI
│   ├── stats-panel.component.ts       # Stats display UI
│   ├── view-toggle.component.ts       # View tabs UI
│   └── critical-path-toggle.component.ts  # Critical path checkbox UI
├── controllers/
│   ├── sidebar.controller.ts          # Sidebar logic (one instance per sidebar)
│   ├── node-details.controller.ts     # Details panel logic
│   └── visualization.controller.ts    # Existing - orchestrates rendering
```

---

## Benefits

✅ **Single Responsibility** - Each component/controller has one job
✅ **Reusability** - Components can be reused (e.g., two sidebars)
✅ **Testability** - Components and controllers can be unit tested separately
✅ **Consistency** - All UI follows same pattern
✅ **Maintainability** - Clear separation of UI and logic
✅ **Scalability** - Easy to add new UI components

---

## Progress Tracking

**Phase 1:** ✅ Complete
**Phase 2:** ✅ Complete
**Phase 3:** ✅ Complete
**Phase 4:** ✅ Complete
**Phase 5:** ✅ Complete
**Phase 6:** ✅ Complete

---

## Completed Work

### Phase 1: Foundation ✅
- ✅ Created `base.component.ts` - Abstract base class
- ✅ Created `/presentation/components/` directory
- ✅ Created `/presentation/controllers/` directory (already existed)

### Phase 2: Sidebar Components ✅
- ✅ Created `SidebarComponent` class with public API
- ✅ Refactored `SidebarController` to use component (no DOM manipulation)
- ✅ Created two controller instances in bootstrap (left + right)
- ✅ Updated main.js to resolve both controllers
- ✅ Build successful - ready for runtime testing

### Phase 3: Panel Components ✅
- ✅ Created `QueryPanelComponent` - Display SQL with syntax highlighting
- ✅ Created `StatsPanelComponent` - Display execution statistics
- ✅ Updated main.js to use components instead of functions
- ✅ No controllers needed (display-only components)
- ✅ Build successful

### Phase 4: Node Details Component ✅
- ✅ Created `NodeDetailsComponent` - Renders comprehensive node details
  - Private render methods for each section (title, table info, cost/timing, rows, joins, etc.)
  - Public API: `setNodeData(nodeData, hljs)`, `clear()`
- ✅ Created `NodeDetailsController` - Event-driven controller
  - Method: `displayNodeDetails(nodeData)`
  - Method: `getNodeSelectCallback()` - Returns callback for integration
- ✅ Updated bootstrap.ts to register NodeDetailsController as singleton
- ✅ Updated main.js to use NodeDetailsController callback
- ✅ Build successful

### Phase 5: Toggle Components ✅
- ✅ Created `ViewToggleComponent` - Renders view toggle tabs (graph/grid)
  - Public API: `setActiveView(viewType)`, `getButtons()`, `getGraphButton()`, `getGridButton()`
- ✅ Created `ViewToggleController` - Handles view toggle interactions
  - Attaches click handlers to buttons
  - Subscribes to ViewChangedEvent
  - Calls ToggleViewUseCase
- ✅ Created `CriticalPathToggleComponent` - Renders critical path checkbox
  - Public API: `setEnabled(enabled)`, `setCriticalPathCount(count)`, `getCheckbox()`, `isEnabled()`
- ✅ Created `CriticalPathToggleController` - Handles critical path toggle interactions
  - Attaches change handler to checkbox
  - Subscribes to CriticalPathToggledEvent
  - Calls ToggleCriticalPathUseCase
  - Method: `updateCriticalPathCount(count)` - Updates node count display
- ✅ Updated bootstrap.ts to register both toggle controllers as singletons
- ✅ Updated main.js to initialize controllers and remove old function calls
- ✅ Build successful

### Phase 6: Cleanup ✅
- ✅ Verified no remaining references to old UI files in active codebase
- ✅ Deleted `/ui/` folder and all legacy files:
  - `node-details.js`
  - `query-panel.js`
  - `stats-panel.js`
  - `view-toggle.ts`
  - `critical-path-control.ts`
- ✅ Fixed critical path checkbox rendering (StatsPanelComponent now preserves toggle)
- ✅ Fixed query panel display (added missing `id="queryPanel"` to HTML)
- ✅ All imports verified and cleaned up
- ✅ Final build successful

---

## Open Questions

1. Should ViewToggle and CriticalPathToggle have dedicated controllers, or keep logic inline since use cases already handle it?
   - **Recommendation:** Keep inline initially, extract if complexity grows

2. Should we have a PanelsController to orchestrate query/stats/details panels?
   - **Recommendation:** Start without, add if coordination logic emerges

3. How to handle hljs (syntax highlighting) dependency?
   - **Recommendation:** Pass as parameter to components that need it
