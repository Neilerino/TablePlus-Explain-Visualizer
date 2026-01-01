# Architecture Overview

A PostgreSQL EXPLAIN visualizer for TablePlus. Clean, simple architecture with separation of UI and logic.

## Quick Start

Everything starts in **`main.js`** with a simple `setupApp()` function that creates all components and controllers. Read that first to understand the app.

## Folder Structure

```
app/src/
├── main.js                      # App setup - start here!
├── domain/entities/             # Core data structures
├── application/
│   ├── services/                # ViewStateManager (manages app state)
│   └── use-cases/               # Business operations (SelectNode, ToggleView, etc.)
├── presentation/
│   ├── components/              # UI-only classes (render DOM)
│   └── controllers/             # Handle events, coordinate components
└── infrastructure/
    ├── events/                  # EventBus for pub/sub
    ├── renderers/               # D3 tree & grid rendering
    └── persistence/             # LocalStorage
```

## Key Patterns

### Component (UI Only)
Components manage DOM and expose public APIs. No business logic.

```typescript
class SidebarComponent extends Component {
  collapse() { /* update DOM */ }
  expand() { /* update DOM */ }
  get isCollapsed() { return this.container.classList.contains('collapsed'); }
}
```

### Controller (Business Logic)
Controllers handle events and coordinate components. No DOM manipulation.

```typescript
class SidebarController {
  constructor(component, eventBus, saveCallback) {
    // Attach event listeners
    component.getCollapseButton().addEventListener('click', () => this.toggle());

    // Subscribe to app events
    eventBus.subscribe(NodeSelectedEvent, () => this.expand());
  }

  toggle() {
    this.component.toggle();
    this.saveCallback();
  }
}
```

### Use Cases
Single-purpose operations that update state and emit events.

```typescript
class ToggleViewUseCase {
  execute(viewType) {
    this.viewStateManager.setState({ currentView: viewType });
    // Events emitted automatically
  }
}
```

## Data Flow

```
User clicks → Controller → UseCase → ViewStateManager → EventBus
                                                            ↓
                                    Controllers react ← Event
                                            ↓
                                    Update Components → DOM updates
```

## Adding a Feature

**Example: Add a "Download" button**

1. **Create Component** (`presentation/components/download-button.component.ts`)
```typescript
class DownloadButtonComponent extends Component {
  render() {
    this.container.innerHTML = '<button id="download">Download</button>';
  }
  getButton() {
    return this.container.querySelector('#download');
  }
}
```

2. **Create Controller** (`presentation/controllers/download.controller.ts`)
```typescript
class DownloadController {
  constructor(component, downloadUseCase) {
    component.getButton().addEventListener('click', () => {
      downloadUseCase.execute();
    });
  }
}
```

3. **Wire up in main.js** (in `setupApp()`)
```javascript
const downloadComponent = new DownloadButtonComponent(...);
app.downloadController = new DownloadController(downloadComponent, downloadUseCase);
```

## Event-Driven Architecture

Components don't talk to each other directly. They use events:

```javascript
// Controller publishes event
eventBus.publish(new NodeSelectedEvent(nodeId));

// Other controllers subscribe
eventBus.subscribe(NodeSelectedEvent, (event) => {
  this.component.highlightNode(event.nodeId);
});
```

## State Management

All app state lives in `ViewStateManager`:
- Current view (graph/grid)
- Selected node
- Sidebar state
- Critical path enabled

State updates automatically:
1. Use case calls `viewStateManager.setState(...)`
2. State persists to localStorage
3. Event emitted for subscribers
4. UI updates

## Common Tasks

**Add a new view mode:**
1. Add view type to `ViewType` enum
2. Create renderer (implements `IRenderer`)
3. Update `ToggleViewUseCase` to handle new type
4. Done - event system handles the rest

**Add new panel:**
1. Create component extending `Component`
2. Optionally create controller if interactive
3. Initialize in `setupApp()` in main.js

**Debug data flow:**
1. Add breakpoint in `setupApp()` to see initialization
2. Add breakpoint in use case to see state changes
3. Add breakpoint in event subscriber to see reactions

## Key Files

- **`main.js`** - App initialization, see this first
- **`ViewStateManager`** - Central state management
- **`EventBus`** - Pub/sub for loose coupling
- **`VisualizationController`** - Main orchestrator
- **`D3TreeRenderer`** - Tree visualization rendering

## Principles

1. **Components = UI only** (no business logic)
2. **Controllers = Logic only** (no DOM)
3. **Use cases = Single operations** (one job)
4. **Events = Loose coupling** (components don't know each other)
5. **Simple > Complex** (no over-engineering)

## Testing

Components and controllers are easily testable:

```typescript
// Test component (no real DOM needed)
const component = new SidebarComponent(mockElement);
expect(component.isCollapsed).toBe(false);

// Test controller (inject mocks)
const controller = new SidebarController(mockComponent, mockEventBus, mockSave);
controller.toggle();
expect(mockComponent.toggle).toHaveBeenCalled();
```

## Questions?

1. Read `main.js` to see the app setup
2. Pick a simple component like `QueryPanelComponent`
3. Trace an event from click → DOM update
4. Ask in issues if stuck!

## Plugin Integration

This app is embedded in a TablePlus plugin. Here's the high-level flow:

### Data Flow: TablePlus → App

```
TablePlus (user selects query)
    ↓
/src/index.js (plugin entry point)
    ↓
/src/plugin/plugin-entry.js
    • Validates query
    • Builds EXPLAIN query
    • Executes against database
    ↓
/src/core/* (data processing)
    • Parses EXPLAIN JSON
    • Transforms to D3 tree format
    • Calculates critical path
    ↓
TablePlus WebView (loads app/dist/index.html)
    ↓
window.ExplainViz.init(data)  ← Bridge between plugin and app
    ↓
/app/src/main.js → renderVisualization(data)
    ↓
App displays visualization
```

### Key Integration Points

**Plugin Side** (`/src/`)
- **`plugin-entry.js`** - Main entry point, orchestrates data flow
- **`core/`** - Query validation, parsing, transformation (pure functions)
- **`plugin/tableplus-adapter.js`** - Wraps TablePlus APIs

**App Side** (`/app/`)
- **`index.js`** - Exposes `window.ExplainViz.init(data)` API
- **`main.js`** - Receives data and renders visualization

### The Bridge

```javascript
// Plugin sends data to app (in plugin-entry.js)
adapter.sendDataToWebView(webView, {
  query: string,
  planData: object,
  treeData: object,
  criticalPath: array
});

// App receives data (in app/index.js)
window.ExplainViz.init = function(data) {
  renderVisualization(data);
};
```

### Development Mode

The app auto-loads test data when running standalone (without TablePlus):
- Checks for `localhost` or `file://` protocol
- Fetches `/test-data.json`
- Transforms and renders automatically

This lets you develop the UI without needing TablePlus running.

### Adding Plugin Features

**Most work happens in the app** (`/app/src/`). Only touch `/src/` if you need to:
- Change how queries are validated
- Modify EXPLAIN query generation
- Update data parsing/transformation
- Add new TablePlus API integrations

---

**Keep it simple. Components render. Controllers coordinate. Events connect.**
