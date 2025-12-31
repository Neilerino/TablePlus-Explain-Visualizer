# TablePlus EXPLAIN Visualizer - CLEAN Architecture

## Table of Contents

- [Vision: Target Architecture](#vision-target-architecture)
- [Current State Analysis](#current-state-analysis)
- [Progressive Migration Phases](#progressive-migration-phases)
- [Architecture Principles](#architecture-principles)
- [Implementation Examples](#implementation-examples)

---

## Vision: Target Architecture

### Architectural Layers

The target architecture follows **CLEAN Architecture** principles with clear separation of concerns across four distinct layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  Controllers, View Models, UI Components                         │
│  - VisualizationController, SidebarController                    │
│  - TreeViewModel, GridViewModel, NodeDetailsViewModel            │
│  - NodeDetailsComponent, StatsPanelComponent                     │
│                                                                   │
│  Responsibility: Handle user interactions, format data for UI    │
│  Dependencies: Application Layer (use cases)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses (one-way dependency)
┌────────────────────────────▼────────────────────────────────────┐
│                       APPLICATION LAYER                          │
│  Use Cases, Application Services, DTOs, Adapters                 │
│  - RenderVisualizationUseCase, SelectNodeUseCase                 │
│  - ViewStateManager, VisualizationOrchestrator                   │
│  - GridAdapter, TreeAdapter                                      │
│                                                                   │
│  Responsibility: Orchestrate business logic, manage state        │
│  Dependencies: Domain Layer (entities, interfaces)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses (one-way dependency)
┌────────────────────────────▼────────────────────────────────────┐
│                         DOMAIN LAYER                             │
│  Entities, Value Objects, Domain Services, Interfaces            │
│  - VisualizationStateEntity, NodeSelectionEntity                 │
│  - PathAnalyzer, MetricExtractor, NodeEnricher                   │
│  - IStateStore, ITreeRenderer, IGridRenderer                     │
│                                                                   │
│  Responsibility: Core business logic, domain rules               │
│  Dependencies: None (pure domain logic)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ implements (dependency inversion)
┌────────────────────────────▼────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                        │
│  Rendering Implementations, Persistence, External Libraries      │
│  - D3TreeRenderer, TanStackGridRenderer                          │
│  - LocalStorageAdapter, HighlightJsAdapter                       │
│  - EventBus, DIContainer                                         │
│                                                                   │
│  Responsibility: Technical implementations, external integrations│
│  Dependencies: Domain Layer (implements interfaces)              │
└─────────────────────────────────────────────────────────────────┘
```

### Target Directory Structure

```
/app/src/
├── domain/                          # Pure business logic
│   ├── entities/
│   │   ├── visualization-state.entity.ts
│   │   └── node-selection.entity.ts
│   ├── value-objects/
│   │   ├── node-id.ts
│   │   ├── critical-path.ts
│   │   └── view-type.ts
│   ├── services/
│   │   └── node-validator.service.ts
│   ├── interfaces/
│   │   └── i-state-store.ts
│   └── events/
│       └── domain-events.ts
│
├── application/                     # Use cases & orchestration
│   ├── use-cases/
│   │   ├── render-visualization.use-case.ts
│   │   ├── select-node.use-case.ts
│   │   ├── toggle-view.use-case.ts
│   │   └── toggle-critical-path.use-case.ts
│   ├── services/
│   │   ├── view-state-manager.ts
│   │   └── visualization-orchestrator.ts
│   ├── adapters/
│   │   ├── grid-data.adapter.ts
│   │   └── tree-data.adapter.ts
│   ├── dto/
│   │   ├── visualization.dto.ts
│   │   └── node-details.dto.ts
│   ├── interfaces/
│   │   ├── i-tree-renderer.ts
│   │   ├── i-grid-renderer.ts
│   │   └── i-event-bus.ts
│   └── events/
│       └── application-events.ts
│
├── presentation/                    # UI layer
│   ├── controllers/
│   │   ├── app.controller.ts
│   │   ├── visualization.controller.ts
│   │   └── sidebar.controller.ts
│   ├── view-models/
│   │   ├── tree.view-model.ts
│   │   ├── grid.view-model.ts
│   │   └── node-details.view-model.ts
│   └── components/
│       ├── node-details.component.ts
│       ├── stats-panel.component.ts
│       └── query-panel.component.ts
│
└── infrastructure/                  # Technical implementations
    ├── renderers/
    │   ├── d3-tree.renderer.ts
    │   ├── tanstack-grid.renderer.ts
    │   └── critical-path.renderer.ts
    ├── persistence/
    │   └── local-storage.adapter.ts
    ├── events/
    │   └── event-bus.ts
    ├── di/
    │   ├── container.ts
    │   └── bootstrap.ts
    └── adapters/
        └── highlight-js.adapter.ts
```

### Data Flow in Target Architecture

```
User Action (e.g., clicks a node)
       ↓
[PRESENTATION] VisualizationController.handleNodeClick(nodeId)
       ↓
[APPLICATION] SelectNodeUseCase.execute(nodeId)
       ↓
[APPLICATION] ViewStateManager.selectNode(nodeId)
       ↓
[DOMAIN] VisualizationStateEntity.selectNode(nodeId) → new state
       ↓
[APPLICATION] EventBus.publish(NodeSelectedEvent)
       ↓
[PRESENTATION] Multiple subscribers react:
       ├─→ SidebarController.showNodeDetails(nodeId)
       ├─→ D3TreeRenderer.highlightNode(nodeId)
       └─→ LocalStorageAdapter.saveState(newState)
```

### Key Architectural Principles

1. **Dependency Rule**: Dependencies point inward (toward domain)

   - Presentation depends on Application
   - Application depends on Domain
   - Infrastructure implements Domain interfaces
   - Domain depends on nothing

2. **Single Responsibility**: Each module has one reason to change

   - `SelectNodeUseCase`: Only changes if node selection logic changes
   - `D3TreeRenderer`: Only changes if rendering technology changes
   - `NodeDetailsViewModel`: Only changes if presentation format changes

3. **Dependency Inversion**: Depend on abstractions, not concretions

   ```typescript
   // ✅ GOOD: Use case depends on interface
   class RenderVisualizationUseCase {
     constructor(private treeRenderer: ITreeRenderer) {}
   }

   // ❌ BAD: Use case depends on concrete implementation
   class RenderVisualizationUseCase {
     constructor(private treeRenderer: D3TreeRenderer) {}
   }
   ```

4. **Interface Segregation**: Clients shouldn't depend on interfaces they don't use

   ```typescript
   // ✅ GOOD: Small, focused interfaces
   interface ITreeRenderer {
     render(config: TreeRenderConfig): void;
     highlightNode(nodeId: NodeId): void;
   }

   interface IGridRenderer {
     render(config: GridConfig): void;
     selectRow(rowId: string): void;
   }
   ```

5. **Open/Closed**: Open for extension, closed for modification
   ```typescript
   // Can add new renderer without modifying existing code
   class CanvasTreeRenderer implements ITreeRenderer {}
   class WebGLTreeRenderer implements ITreeRenderer {}
   ```

---

## Current State Analysis

### What's Already CLEAN

#### ✅ Domain Analysis Layer (`/src/core/analysis/`)

```typescript
// Already follows CLEAN architecture principles
export abstract class PathAnalyzer {
  protected metricExtractor: MetricExtractor;
  abstract analyze(rootNode: EnrichedNode): EnrichedNode[];
}

export class ExecutionTimeAnalyzer extends PathAnalyzer {
  analyze(rootNode: EnrichedNode): EnrichedNode[] {
    // Pure business logic
  }
}
```

**Why it's good:**

- Abstract base class with strategy pattern
- Dependency inversion (depends on `MetricExtractor` interface)
- Single responsibility
- Testable (pure functions)

#### ✅ Service Layer (Partial)

- `ViewManager` - Clean state management
- `GridAdapter` - Pure transformation logic
- `CriticalPathVisualizer` - Focused responsibility

### What Needs Refactoring

#### ❌ Monolithic Controller (`/app/src/main.js` - 327 lines)

**Current Problems:**

```javascript
// Mixed concerns: state + UI + orchestration + persistence
const appState = {
  leftSidebarWidth: 350,
  selectedNode: null,
  viewManager: null,
  criticalPathEnabled: false,
  criticalPathVisualizer: null,
};

function initializeApp() {
  // Initialize UI
  // Setup event listeners
  // Load state from localStorage
  // ALL IN ONE FUNCTION
}

function renderVisualization(data) {
  // Determine view type
  // Clear containers
  // Render tree OR grid
  // Update sidebar
  // ALL TIGHTLY COUPLED
}
```

**Why it's problematic:**

- Violates Single Responsibility Principle (does everything)
- Global mutable state (hard to reason about)
- Cannot test individual pieces
- Cannot reuse logic in different contexts
- Changes ripple across entire file

#### ❌ Coupled Tree Renderer (`/app/src/visualization/tree-renderer.js`)

**Current Problems:**

```javascript
// 7 coupled parameters!
export function renderTree(
  d3, // External library
  treeData, // Data
  appState, // Global state
  toggleSidebar, // UI callback
  populateNodeDetails, // UI callback
  saveState, // Persistence callback
  criticalPath // More data
) {
  // D3 rendering logic
  // + State mutations
  // + Callback invocations
  // ALL MIXED TOGETHER
}
```

**Why it's problematic:**

- Cannot render tree without entire application context
- Cannot test D3 logic in isolation
- Cannot swap D3 for another rendering library
- Violates Dependency Inversion (depends on concrete `appState`)

#### ❌ Procedural UI Components (`/app/src/ui/node-details.js`)

**Current Problems:**

```javascript
// 218 lines of string concatenation
export function populateNodeDetails(node, hljs) {
  let content = '<div class="detail-title">' + node.name + "</div>";

  // Business logic in presentation!
  if (node.details.sharedHitBlocks > 0) {
    const hitRate = (
      (node.details.sharedHitBlocks /
        (node.details.sharedHitBlocks + node.details.sharedReadBlocks)) *
      100
    ).toFixed(1);
    content += "<div>Cache Hit Rate: " + hitRate + "%</div>";
  }

  // Direct DOM manipulation
  document.getElementById("node-details").innerHTML = content;
}
```

**Why it's problematic:**

- Business logic (cache hit rate calculation) in presentation
- No separation between data and display
- Cannot test logic without DOM
- Cannot reuse in different UI frameworks

### Architecture Debt Summary

| Component          | Lines | Issues                                   | Refactor Effort |
| ------------------ | ----- | ---------------------------------------- | --------------- |
| `main.js`          | 327   | Monolithic controller, mixed concerns    | HIGH            |
| `tree-renderer.js` | 75    | 7 coupled params, mixed responsibilities | MEDIUM          |
| `node-details.js`  | 218   | Business logic in UI, string concat      | MEDIUM          |
| `interactions.js`  | 45    | Scattered event handling                 | LOW             |
| `stats-panel.js`   | 89    | Similar issues to node-details           | LOW             |

**Total debt: ~754 lines** requiring refactoring

## Progressive Migration Phases

### Phase 1: Foundation (Weeks 1-2) - ZERO Risk

**Goal**: Create new architecture structure without touching working code

**What to create:**

```
/app/src/domain/
  /entities/
  /interfaces/
  /value-objects/

/app/src/application/
  /interfaces/
  /dto/

/app/src/presentation/
  /controllers/

/app/src/infrastructure/
  /di/
```

**Concrete tasks:**

#### Task 1.1: Define Core Interfaces

```typescript
// /app/src/application/interfaces/i-tree-renderer.ts
export interface ITreeRenderer {
  render(config: TreeRenderConfig): void;
  destroy(): void;
  highlightNode(nodeId: NodeId): void;
  highlightPath(path: CriticalPath): void;
}

export interface TreeRenderConfig {
  treeData: EnrichedNode;
  container: HTMLElement;
  onNodeClick: (nodeId: NodeId) => void;
  dimensions?: { width: number; height: number };
}
```

#### Task 1.2: Create Domain Entities

```typescript
// /app/src/domain/entities/visualization-state.entity.ts
export interface VisualizationState {
  currentView: "graph" | "grid";
  selectedNodeId: string | null;
  criticalPathEnabled: boolean;
  leftSidebarWidth: number;
  rightSidebarCollapsed: boolean;
}

export class VisualizationStateEntity {
  private constructor(private state: VisualizationState) {}

  static create(
    initial?: Partial<VisualizationState>
  ): VisualizationStateEntity {
    return new VisualizationStateEntity({
      currentView: "graph",
      selectedNodeId: null,
      criticalPathEnabled: false,
      leftSidebarWidth: 350,
      rightSidebarCollapsed: false,
      ...initial,
    });
  }

  // Immutable updates
  selectNode(nodeId: string): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      selectedNodeId: nodeId,
    });
  }

  getState(): VisualizationState {
    return { ...this.state };
  }
}
```

**Impact:** ✅ Zero - No changes to running code

---

### Phase 2: Application Layer (Weeks 3-4) - LOW Risk

**Goal**: Create use cases and services that can run alongside legacy code

#### Task 2.1: Create First Use Case

```typescript
// /app/src/application/use-cases/select-node.use-case.ts
export class SelectNodeUseCase {
  constructor(
    private stateManager: ViewStateManager,
    private eventBus: IEventBus
  ) {}

  execute(nodeId: string): void {
    // Update state
    this.stateManager.selectNode(nodeId);

    // Publish event for subscribers
    this.eventBus.publish(new NodeSelectedEvent(nodeId));
  }
}
```

#### Task 2.2: Enhance State Management

```typescript
// /app/src/application/services/view-state-manager.ts
export class ViewStateManager {
  private state: VisualizationStateEntity;

  constructor(
    private eventBus: IEventBus,
    private persistenceAdapter: IStateStore
  ) {
    // Load persisted state or create fresh
    const persisted = this.persistenceAdapter.load();
    this.state = VisualizationStateEntity.create(persisted || {});
  }

  selectNode(nodeId: string): void {
    this.state = this.state.selectNode(nodeId);
    this.persistenceAdapter.save(this.state.getState());
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  getState(): VisualizationState {
    return this.state.getState();
  }
}
```

#### Task 2.3: Test Use Cases Independently

```typescript
// Test new use cases in isolation before integrating
describe("SelectNodeUseCase", () => {
  it("should update state and publish event", () => {
    const mockStateManager = MockFactories.createStateManager();
    const mockEventBus = MockFactories.createEventBus();
    const useCase = new SelectNodeUseCase(mockStateManager, mockEventBus);

    useCase.execute("node-123");

    expect(mockStateManager.selectNode).toHaveBeenCalledWith("node-123");
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(NodeSelectedEvent)
    );
  });
});
```

**Impact:** ✅ LOW - New code fully tested before integration

---

### Phase 3: Infrastructure (Week 5) - MEDIUM Risk

**Goal**: Extract rendering logic into clean implementations

#### Task 3.1: Extract D3TreeRenderer

```typescript
// /app/src/infrastructure/renderers/d3-tree.renderer.ts
export class D3TreeRenderer implements ITreeRenderer {
  private d3: typeof d3;
  private svg: d3.Selection<SVGGElement, unknown, null, undefined> | null =
    null;

  constructor(d3Instance: typeof d3) {
    this.d3 = d3Instance;
  }

  render(config: TreeRenderConfig): void {
    const { treeData, container, onNodeClick } = config;

    // Pure D3 rendering logic (extracted from tree-renderer.js)
    this.createSvg(container);
    this.renderTree(treeData);
    this.attachClickHandlers(onNodeClick);
  }

  highlightNode(nodeId: string): void {
    this.svg
      ?.selectAll(".node")
      .classed("selected", (d: any) => d.data.id === nodeId);
  }

  destroy(): void {
    this.svg?.selectAll("*").remove();
    this.svg = null;
  }

  // Private helper methods (extracted from old code)
  private createSvg(container: HTMLElement): void {
    /* ... */
  }
  private renderTree(data: EnrichedNode): void {
    /* ... */
  }
  private attachClickHandlers(onClick: (id: string) => void): void {
    /* ... */
  }
}
```

#### Task 3.2: Replace Renderer Implementation

```typescript
// Replace tree-renderer.js with new clean implementation
// OLD: /app/src/visualization/tree-renderer.js
export function renderTree(d3, treeData, appState, ...) { }

// NEW: /app/src/infrastructure/renderers/d3-tree.renderer.ts
export class D3TreeRenderer implements ITreeRenderer {
  render(config: TreeRenderConfig): void { }
}

// Update usage in main application
const renderer = new D3TreeRenderer(d3);
renderer.render({
  treeData: treeData,
  container: document.getElementById('tree-container')!,
  onNodeClick: (nodeId) => handleNodeSelection(nodeId)
});
```

**Impact:** ⚠️ MEDIUM - Changes rendering implementation, test thoroughly before committing

---

### Phase 4: Presentation Refactor (Week 6) - HIGH Risk

**Goal**: Replace monolithic main.js with controllers

#### Task 4.1: Create VisualizationController

```typescript
// /app/src/presentation/controllers/visualization.controller.ts
export class VisualizationController {
  constructor(
    private renderVisualizationUseCase: RenderVisualizationUseCase,
    private toggleViewUseCase: ToggleViewUseCase,
    private eventBus: IEventBus
  ) {
    this.subscribeToEvents();
  }

  initialize(data: VisualizationData): void {
    const dto = this.toDTO(data);
    this.renderVisualizationUseCase.execute(dto);
  }

  handleViewToggle(viewType: "graph" | "grid"): void {
    this.toggleViewUseCase.execute(viewType);
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe(NodeSelectedEvent, (event) => {
      this.handleNodeSelection(event.nodeId);
    });
  }

  private toDTO(data: VisualizationData): VisualizationDTO {
    return {
      treeData: data.treeData,
      planData: data.planData,
      criticalPath: data.criticalPath,
    };
  }
}
```

#### Task 4.2: Incremental Migration of main.js

**Strategy:** Migrate main.js piece by piece, committing working code at each step

**Step 1:** Extract sidebar logic (commit when working)

```typescript
// Create SidebarController
class SidebarController {
  constructor(private toggleSidebarUseCase: ToggleSidebarUseCase) {}

  toggle(side: "left" | "right"): void {
    this.toggleSidebarUseCase.execute(side);
  }
}

// Replace old function in main.js
const sidebarController = new SidebarController(toggleSidebarUseCase);

// OLD: function toggleSidebar(side) { ... }
// NEW: sidebarController.toggle(side)
```

**Step 2:** Extract view toggle logic (commit when working)

```typescript
// Create ViewToggleController
class ViewToggleController {
  handleViewChange(viewType: ViewType): void {
    this.toggleViewUseCase.execute(viewType);
  }
}
```

**Step 3:** Extract visualization rendering (commit when working)

```typescript
// Create VisualizationController
class VisualizationController {
  initialize(data: VisualizationData): void {
    this.renderVisualizationUseCase.execute(this.toDTO(data));
  }
}
```

**Step 4:** Wire everything together with DI container

```typescript
// Bootstrap application
const app = bootstrapApplication();
app.initialize(visualizationData);
```

**Step 5:** Delete main.js (everything migrated)

**Impact:** ⚠️ HIGH - Test each step thoroughly, commit working code frequently

---

### Phase 5: Finalization (Week 7)

**Goal**: Complete testing, remove legacy code, celebrate! 🎉

#### Task 5.1: Comprehensive Testing

```typescript
describe("VisualizationController E2E", () => {
  it("should render graph view and handle node selection", () => {
    const controller = bootstrapApplication();

    controller.initialize(mockData);
    controller.handleNodeClick("node-123");

    expect(nodeDetailsComponent.isVisible()).toBe(true);
    expect(nodeDetailsComponent.getNodeId()).toBe("node-123");
  });
});
```

#### Task 5.2: Remove Legacy Code

```bash
# Delete old files
rm app/src/main.js
rm app/src/visualization/tree-renderer.js
rm app/src/ui/node-details.js

# Update imports
# Test everything
# Deploy!
```

---

## Architecture Principles

### 1. Dependency Rule (The Sacred Law)

**Rule:** Source code dependencies must point inward, toward higher-level policies.

```typescript
// ✅ CORRECT: Outer layers depend on inner layers
class VisualizationController {
  // Presentation Layer
  constructor(
    private useCase: RenderVisualizationUseCase // Application Layer
  ) {}
}

class RenderVisualizationUseCase {
  // Application Layer
  constructor(
    private renderer: ITreeRenderer // Domain Interface
  ) {}
}

class D3TreeRenderer implements ITreeRenderer {
  // Infrastructure Layer
  // Implements domain interface
}

// ❌ WRONG: Inner layer depends on outer layer
class RenderVisualizationUseCase {
  constructor(
    private controller: VisualizationController // BAD! Use case depends on controller
  ) {}
}
```

**Why it matters:**

- Domain logic remains pure and testable
- Can swap infrastructure without changing business logic
- Changes to UI don't ripple into domain

### 2. Single Responsibility Principle

**Rule:** A module should have one, and only one, reason to change.

```typescript
// ❌ WRONG: Multiple responsibilities
class VisualizationManager {
  renderTree() {
    /* D3 rendering */
  }
  saveState() {
    /* localStorage */
  }
  calculateMetrics() {
    /* business logic */
  }
  formatNodeDetails() {
    /* presentation */
  }
}
// Changes to ANY of these concerns requires changing this class!

// ✅ CORRECT: Single responsibilities
class D3TreeRenderer {
  renderTree() {
    /* Only changes when D3 rendering changes */
  }
}

class LocalStorageAdapter {
  saveState() {
    /* Only changes when persistence mechanism changes */
  }
}

class MetricCalculator {
  calculateMetrics() {
    /* Only changes when metric formulas change */
  }
}

class NodeDetailsViewModel {
  formatNodeDetails() {
    /* Only changes when presentation format changes */
  }
}
```

### 3. Dependency Inversion Principle

**Rule:** Depend on abstractions, not on concretions.

```typescript
// ❌ WRONG: Depends on concrete implementation
class RenderVisualizationUseCase {
  private renderer = new D3TreeRenderer(d3); // Tightly coupled to D3

  execute(data: VisualizationDTO): void {
    this.renderer.render(data);
  }
}

// ✅ CORRECT: Depends on abstraction
class RenderVisualizationUseCase {
  constructor(private renderer: ITreeRenderer) {} // Can be any implementation

  execute(data: VisualizationDTO): void {
    this.renderer.render(data);
  }
}

// Can now inject different implementations:
new RenderVisualizationUseCase(new D3TreeRenderer(d3));
new RenderVisualizationUseCase(new CanvasTreeRenderer());
new RenderVisualizationUseCase(new MockTreeRenderer()); // For testing!
```

**Benefits:**

- Easy to test (inject mocks)
- Easy to swap implementations
- Loose coupling

### 4. Interface Segregation Principle

**Rule:** Clients should not be forced to depend on interfaces they don't use.

```typescript
// ❌ WRONG: Fat interface
interface IRenderer {
  renderTree(data: TreeData): void;
  renderGrid(data: GridData): void;
  renderChart(data: ChartData): void;
  exportPDF(): void;
  exportCSV(): void;
}

class SimpleTreeRenderer implements IRenderer {
  renderTree(data: TreeData): void {
    /* implement */
  }

  // Forced to implement things we don't need!
  renderGrid(data: GridData): void {
    throw new Error("Not supported");
  }
  renderChart(data: ChartData): void {
    throw new Error("Not supported");
  }
  exportPDF(): void {
    throw new Error("Not supported");
  }
  exportCSV(): void {
    throw new Error("Not supported");
  }
}

// ✅ CORRECT: Segregated interfaces
interface ITreeRenderer {
  renderTree(data: TreeData): void;
}

interface IGridRenderer {
  renderGrid(data: GridData): void;
}

interface IExporter {
  exportPDF(): void;
  exportCSV(): void;
}

class SimpleTreeRenderer implements ITreeRenderer {
  renderTree(data: TreeData): void {
    /* implement only what we need */
  }
}
```

### 5. Open/Closed Principle

**Rule:** Software entities should be open for extension, closed for modification.

```typescript
// ✅ GOOD: Can extend with new renderers without modifying existing code
interface ITreeRenderer {
  render(config: TreeRenderConfig): void;
}

class D3TreeRenderer implements ITreeRenderer {}
class CanvasTreeRenderer implements ITreeRenderer {}
class WebGLTreeRenderer implements ITreeRenderer {} // NEW! No existing code modified

// Use case doesn't change
class RenderVisualizationUseCase {
  constructor(private renderer: ITreeRenderer) {} // Works with any renderer
}
```

---

## Implementation Examples

### Example 1: Node Selection Flow

#### Current Implementation (Problematic)

```javascript
// In tree-renderer.js
node.on("click", function (event, d) {
  // Direct state mutation
  appState.selectedNode = d.data;

  // Direct UI manipulation
  populateNodeDetails(d.data, hljs);

  // Direct DOM manipulation
  d3.selectAll(".node").classed("selected", false);
  d3.select(this).classed("selected", true);

  // Direct persistence
  saveState(appState);
});
```

**Problems:**

- Tight coupling to global state
- Cannot test without DOM
- Cannot reuse logic
- Violates Single Responsibility

#### Target Implementation (CLEAN)

```typescript
// 1. PRESENTATION: Controller handles user event
class VisualizationController {
  handleNodeClick(nodeId: string): void {
    this.selectNodeUseCase.execute(nodeId);
  }
}

// 2. APPLICATION: Use case orchestrates business logic
class SelectNodeUseCase {
  constructor(
    private stateManager: ViewStateManager,
    private eventBus: IEventBus
  ) {}

  execute(nodeId: string): void {
    this.stateManager.selectNode(nodeId);
    this.eventBus.publish(new NodeSelectedEvent(nodeId));
  }
}

// 3. APPLICATION: State manager manages state
class ViewStateManager {
  private state: VisualizationStateEntity;

  selectNode(nodeId: string): void {
    this.state = this.state.selectNode(nodeId); // Immutable update
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }
}

// 4. INFRASTRUCTURE: Multiple subscribers react to event
eventBus.subscribe(NodeSelectedEvent, (event) => {
  // Update sidebar
  sidebarController.showNodeDetails(event.nodeId);

  // Update visualization
  treeRenderer.highlightNode(event.nodeId);

  // Persist state
  localStorageAdapter.saveState(stateManager.getState());
});
```

**Benefits:**

- Each piece testable in isolation
- Can add new reactions without modifying existing code
- Clear separation of concerns

### Example 2: View Toggle Flow

#### Current Implementation

```javascript
// In main.js
function handleViewChange() {
  const view = document.querySelector('input[name="view"]:checked').value;
  appState.currentView = view;

  if (view === "graph") {
    document.getElementById("tree-container").style.display = "flex";
    document.getElementById("grid-container").style.display = "none";
    document.querySelector(".zoom-controls").style.display = "flex";
    renderTree(
      d3,
      appState.treeData,
      appState,
      toggleSidebar,
      populateNodeDetails,
      saveState,
      appState.criticalPath
    );
  } else {
    document.getElementById("tree-container").style.display = "none";
    document.getElementById("grid-container").style.display = "flex";
    document.querySelector(".zoom-controls").style.display = "none";
    renderGridView(
      appState.treeData,
      appState.planData,
      appState.rootCost,
      appState.rootTime,
      populateNodeDetails
    );
  }

  saveState(appState);
}
```

#### Target Implementation

```typescript
// PRESENTATION: Controller
class VisualizationController {
  handleViewToggle(viewType: ViewType): void {
    this.toggleViewUseCase.execute(viewType);
  }
}

// APPLICATION: Use Case
class ToggleViewUseCase {
  constructor(
    private stateManager: ViewStateManager,
    private renderVisualizationUseCase: RenderVisualizationUseCase
  ) {}

  execute(viewType: ViewType): void {
    this.stateManager.setView(viewType);
    this.renderVisualizationUseCase.execute();
  }
}

// APPLICATION: Orchestration
class RenderVisualizationUseCase {
  constructor(
    private treeRenderer: ITreeRenderer,
    private gridRenderer: IGridRenderer,
    private stateManager: ViewStateManager,
    private uiManager: IUIManager
  ) {}

  execute(): void {
    const state = this.stateManager.getState();

    if (state.currentView === "graph") {
      this.renderGraphView();
    } else {
      this.renderGridView();
    }
  }

  private renderGraphView(): void {
    this.uiManager.showContainer("tree");
    this.uiManager.hideContainer("grid");
    this.uiManager.showZoomControls();

    this.treeRenderer.render({
      treeData: this.stateManager.getTreeData(),
      container: this.uiManager.getContainer("tree"),
      onNodeClick: (id) => this.selectNodeUseCase.execute(id),
    });
  }
}
```

**Benefits:**

- Testable (inject mock renderers)
- Single responsibility per class
- Easy to add new view types

### Example 3: Node Details Display

#### Current Implementation

```javascript
// 218 lines of string concatenation
export function populateNodeDetails(node, hljs) {
  let content = "";

  content += '<div class="detail-title">' + node.name + "</div>";

  if (node.details.relation) {
    content += '<div class="detail-section">';
    content += '<div class="detail-section-title">Table Info</div>';
    content += '<div class="detail-item">';
    content += '<span class="detail-label">Table:</span>';
    content +=
      '<span class="detail-value">' + node.details.relation + "</span>";
    content += "</div>";
    // ... 200 more lines
  }

  // Business logic in presentation!
  if (node.details.sharedHitBlocks > 0) {
    const hitRate = (
      (node.details.sharedHitBlocks /
        (node.details.sharedHitBlocks + node.details.sharedReadBlocks)) *
      100
    ).toFixed(1);
    content += "<div>Cache Hit Rate: " + hitRate + "%</div>";
  }

  document.getElementById("node-details").innerHTML = content;
}
```

#### Target Implementation

```typescript
// PRESENTATION: ViewModel (presentation logic)
class NodeDetailsViewModel {
  constructor(private node: EnrichedNode) {}

  get title(): string {
    return this.node.name;
  }

  get tableInfo(): TableInfo | null {
    if (!this.node.details.relation) return null;
    return {
      schema: this.node.details.schema,
      table: this.node.details.relation,
      alias: this.node.details.alias,
    };
  }

  // Business logic in view model (appropriate place)
  get cacheHitRate(): number | null {
    const hit = this.node.details.sharedHitBlocks;
    const read = this.node.details.sharedReadBlocks;
    if (hit === 0 && read === 0) return null;
    return (hit / (hit + read)) * 100;
  }

  get metrics(): MetricsSection {
    return {
      cost: this.formatCost(this.node.details.cost),
      time: this.formatTime(this.node.details.actualTime),
      rows: this.node.details.actualRows,
    };
  }
}

// PRESENTATION: Component (display logic)
class NodeDetailsComponent {
  constructor(
    private container: HTMLElement,
    private templateRenderer: ITemplateRenderer
  ) {}

  render(viewModel: NodeDetailsViewModel): void {
    const template = `
      <div class="detail-title">${viewModel.title}</div>
      ${viewModel.tableInfo ? this.renderTableInfo(viewModel.tableInfo) : ""}
      ${this.renderMetrics(viewModel.metrics)}
      ${
        viewModel.cacheHitRate
          ? this.renderCacheHitRate(viewModel.cacheHitRate)
          : ""
      }
    `;

    this.container.innerHTML = template;
  }

  private renderTableInfo(info: TableInfo): string {
    return `
      <div class="detail-section">
        <div class="detail-section-title">Table Info</div>
        ${
          info.schema
            ? `
          <div class="detail-item">
            <span class="detail-label">Schema:</span>
            <span class="detail-value">${info.schema}</span>
          </div>
        `
            : ""
        }
        <div class="detail-item">
          <span class="detail-label">Table:</span>
          <span class="detail-value">${info.table}</span>
        </div>
      </div>
    `;
  }

  private renderCacheHitRate(rate: number): string {
    return `
      <div class="detail-item">
        <span class="detail-label">Cache Hit Rate:</span>
        <span class="detail-value">${rate.toFixed(1)}%</span>
      </div>
    `;
  }
}

// PRESENTATION: Controller (orchestration)
class SidebarController {
  constructor(private nodeDetailsComponent: NodeDetailsComponent) {}

  showNodeDetails(nodeId: string): void {
    const node = this.getNode(nodeId);
    const viewModel = new NodeDetailsViewModel(node);
    this.nodeDetailsComponent.render(viewModel);
  }
}
```

**Benefits:**

- ViewModel is testable (no DOM)
- Business logic separate from display logic
- Component reusable with different templates
- Can switch to React/Vue/etc without changing ViewModel

---

## Success Metrics

### Code Quality Metrics

| Metric                    | Current             | Target           | How to Measure          |
| ------------------------- | ------------------- | ---------------- | ----------------------- |
| **Test Coverage**         | 0%                  | 80%+             | Jest coverage report    |
| **Cyclomatic Complexity** | 15+                 | <10              | ESLint complexity rules |
| **File Size**             | 327 lines (main.js) | <100 lines       | Line count              |
| **Coupling**              | High (7 params)     | Low (2-3 params) | Parameter count         |
| **Testability**           | Cannot test         | 100% testable    | Mock/stub ability       |

### Business Metrics

| Metric               | Goal                               |
| -------------------- | ---------------------------------- |
| **Bug Rate**         | 50% reduction (fewer regressions)  |
| **Feature Velocity** | 2x faster (easier to add features) |
| **Onboarding Time**  | 50% faster (clearer architecture)  |
| **Maintenance Time** | 70% reduction (isolated changes)   |

### Migration Metrics

| Week | Legacy Code | New Code   | Tests | Risk        |
| ---- | ----------- | ---------- | ----- | ----------- |
| 0    | 754 lines   | 0 lines    | 0%    | ✅ None     |
| 2    | 754 lines   | 500 lines  | 20%   | ✅ Low      |
| 4    | 600 lines   | 1200 lines | 50%   | ⚠️ Medium   |
| 6    | 200 lines   | 2000 lines | 75%   | ⚠️ High     |
| 7    | 0 lines     | 2200 lines | 80%+  | ✅ Complete |

---

## Conclusion

### The Journey Ahead

We're transforming from a **monolithic, tightly-coupled codebase** to a **CLEAN, modular architecture**:

**From:**

```
main.js (327 lines) → Everything coupled together
```

**To:**

```
Presentation → Application → Domain → Infrastructure
(Separated, testable, flexible)
```

### Key Takeaways

1. **Use Strangler Fig Pattern** - Migrate incrementally, not big bang
2. **Follow Dependency Rule** - Dependencies point inward
3. **Test Everything** - Use cases are fully testable
4. **Keep Old Code** - Until new code is proven
5. **Celebrate Small Wins** - Each migrated piece is progress

### Simplified Migration Workflow

Since this is a Git-distributed plugin, our workflow is straightforward:

```bash
# 1. Tag current stable version
git tag -a v2.0.0-pre-clean -m "Stable version before CLEAN migration"

# 2. Create migration branch
git checkout -b feature/clean-architecture

# 3. Implement Phase 1 (foundation)
# ... create interfaces, entities, etc ...
git add .
git commit -m "feat: add domain layer foundation"

# 4. Implement Phase 2 (application layer)
# ... create use cases, services ...
git add .
git commit -m "feat: add application layer use cases"

# 5. Continue through phases...
# Commit frequently, test after each commit

# 6. When complete, merge to main
git checkout main
git merge feature/clean-architecture

# 7. Tag new version
git tag -a v3.0.0 -m "CLEAN architecture implementation"
git push origin v3.0.0

# Users can always choose their version:
# - v2.0.0-pre-clean (legacy, stable)
# - v3.0.0 (CLEAN architecture)
```

### Next Steps

1. **Review this architecture** - Understand CLEAN principles
2. **Tag current version** - Create rollback point
3. **Create migration branch** - Work in isolation
4. **Start Phase 1** - Create foundation (zero risk)
5. **Commit frequently** - Small, working increments
6. **Test continuously** - Catch issues early
7. **Merge when complete** - Delete old code, ship it!

### The Promise

By following this architecture, you'll have:

- ✅ **Testable** code (80%+ coverage)
- ✅ **Maintainable** code (< 100 lines per file)
- ✅ **Flexible** code (swap implementations easily)
- ✅ **Extensible** code (add features without fear)
- ✅ **Understandable** code (clear separation of concerns)

**Let's build something we can be proud of!** 🚀

---

_Last updated: 2025_
_Version: 1.0_
_Status: Ready for implementation_
