# Node Details Component Refactoring Plan

## Problem

Current `NodeDetailsComponent` has too many responsibilities:
- Renders ALL node types (Seq Scan, Index Scan, Hash Join, etc.)
- 300+ lines of conditional rendering logic
- Hard to test and maintain
- Violates Single Responsibility Principle

## Goal

1. Create typed entity definitions for each EXPLAIN node type
2. Break apart into specialized components (one per node type)
3. Conditionally render the correct component based on node type

## Proposed Architecture

### 1. Domain Layer: Typed Node Entities

Create base class and specific node types:

```typescript
// /domain/entities/explain-nodes/base-node.entity.ts
export abstract class ExplainNode {
  constructor(protected data: any) {}

  abstract get nodeType(): string;

  // Common properties all nodes have
  get name(): string { return this.data.name; }
  get cost(): number { return this.data.details.cost; }
  get actualTime(): number { return this.data.details.actualTime; }
  get planRows(): number { return this.data.details.planRows; }
  get actualRows(): number { return this.data.details.actualRows; }
}

// /domain/entities/explain-nodes/seq-scan.entity.ts
export class SeqScanNode extends ExplainNode {
  get nodeType() { return 'Seq Scan'; }

  // Seq Scan specific properties
  get tableName(): string { return this.data.details.relation; }
  get schema(): string | null { return this.data.details.schema; }
  get filter(): string | null { return this.data.details.filter; }
  get rowsRemovedByFilter(): number | null {
    return this.data.details.rowsRemovedByFilter;
  }
}

// /domain/entities/explain-nodes/index-scan.entity.ts
export class IndexScanNode extends ExplainNode {
  get nodeType() { return 'Index Scan'; }

  get indexName(): string { return this.data.details.indexName; }
  get scanDirection(): string { return this.data.details.scanDirection; }
  get indexCond(): string | null { return this.data.details.indexCond; }
}

// /domain/entities/explain-nodes/hash-join.entity.ts
export class HashJoinNode extends ExplainNode {
  get nodeType() { return 'Hash Join'; }

  get joinType(): string { return this.data.details.joinType; }
  get hashCondition(): string { return this.data.details.hashCond; }
  get innerUnique(): boolean { return this.data.details.innerUnique; }
}

// ... more node types (Aggregate, Sort, etc.)
```

### 2. Node Service (Application Layer)

Single source of truth for all nodes - creates and manages typed entities:

```typescript
// /application/services/node.service.ts
export class NodeService {
  private nodes = new Map<string, ExplainNode>();

  /**
   * Initialize service with visualization data
   * Creates typed entities for all nodes once
   */
  initialize(treeData: any): void {
    this.nodes.clear();
    this.traverseAndRegister(treeData);
  }

  /**
   * Get a typed node by ID
   */
  getNode(nodeId: string): ExplainNode | null {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType(nodeType: string): ExplainNode[] {
    return Array.from(this.nodes.values())
      .filter(node => node.nodeType === nodeType);
  }

  private traverseAndRegister(nodeData: any): void {
    if (!nodeData) return;

    // Create typed entity and register
    const node = this.createTypedNode(nodeData);
    this.nodes.set(nodeData.id || nodeData.data.id, node);

    // Recursively register children
    if (nodeData.children) {
      nodeData.children.forEach(child => this.traverseAndRegister(child));
    }
  }

  private createTypedNode(rawData: any): ExplainNode {
    const nodeType = rawData.name || rawData.data.name;

    switch (nodeType) {
      case 'Seq Scan':
        return new SeqScanNode(rawData);
      case 'Index Scan':
        return new IndexScanNode(rawData);
      case 'Hash Join':
        return new HashJoinNode(rawData);
      case 'Aggregate':
        return new AggregateNode(rawData);
      case 'Sort':
        return new SortNode(rawData);
      // ... more types
      default:
        return new GenericNode(rawData);
    }
  }
}
```

### 3. Specialized Detail Components

One component per node type:

```typescript
// /presentation/components/node-details/base-node-details.component.ts
export abstract class BaseNodeDetailsComponent extends Component {
  protected node: ExplainNode;

  setNode(node: ExplainNode): void {
    this.node = node;
    this.render();
  }

  render(): void {
    let html = this.renderHeader();
    html += this.renderSpecificDetails(); // Abstract - implemented by subclasses
    html += this.renderCommonMetrics();
    this.container.innerHTML = html;
  }

  protected renderHeader(): string {
    return `
      <div class="detail-title">${this.node.name}</div>
    `;
  }

  protected renderCommonMetrics(): string {
    return `
      <div class="detail-section">
        <div class="detail-section-title">Performance</div>
        <div class="detail-item">
          <span class="detail-label">Cost:</span>
          <span class="detail-value">${this.node.cost}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${this.node.actualTime} ms</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Rows:</span>
          <span class="detail-value">${this.node.actualRows}</span>
        </div>
      </div>
    `;
  }

  // Each subclass implements this
  protected abstract renderSpecificDetails(): string;
}

// /presentation/components/node-details/seq-scan-details.component.ts
export class SeqScanDetailsComponent extends BaseNodeDetailsComponent {
  protected node: SeqScanNode; // Typed!

  protected renderSpecificDetails(): string {
    return `
      <div class="detail-section">
        <div class="detail-section-title">Table Scan</div>
        <div class="detail-item">
          <span class="detail-label">Table:</span>
          <span class="detail-value">${this.node.tableName}</span>
        </div>
        ${this.node.schema ? `
          <div class="detail-item">
            <span class="detail-label">Schema:</span>
            <span class="detail-value">${this.node.schema}</span>
          </div>
        ` : ''}
        ${this.node.filter ? this.renderFilter() : ''}
      </div>
    `;
  }

  private renderFilter(): string {
    const selectivity = this.calculateSelectivity();
    return `
      <div class="detail-item">
        <span class="detail-label">Filter:</span>
        <span class="detail-value">${this.node.filter}</span>
      </div>
      ${this.node.rowsRemovedByFilter !== null ? `
        <div class="detail-item">
          <span class="detail-label">Rows Removed:</span>
          <span class="detail-value">${this.node.rowsRemovedByFilter}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Selectivity:</span>
          <span class="detail-value">${selectivity}%</span>
        </div>
      ` : ''}
    `;
  }

  private calculateSelectivity(): string {
    const total = this.node.actualRows + (this.node.rowsRemovedByFilter || 0);
    return total > 0 ? ((this.node.actualRows / total) * 100).toFixed(1) : '0';
  }
}

// /presentation/components/node-details/hash-join-details.component.ts
export class HashJoinDetailsComponent extends BaseNodeDetailsComponent {
  protected node: HashJoinNode; // Typed!

  protected renderSpecificDetails(): string {
    return `
      <div class="detail-section">
        <div class="detail-section-title">Join Details</div>
        <div class="detail-item">
          <span class="detail-label">Join Type:</span>
          <span class="detail-value">${this.node.joinType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hash Condition:</span>
          <span class="detail-value">${this.node.hashCondition}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Inner Unique:</span>
          <span class="detail-value">${this.node.innerUnique}</span>
        </div>
      </div>
    `;
  }
}
```

### 4. Component Factory

Select the right component for the node type:

```typescript
// /presentation/factories/node-details-component.factory.ts
export class NodeDetailsComponentFactory {
  private static COMPONENT_MAP = {
    'Seq Scan': SeqScanDetailsComponent,
    'Index Scan': IndexScanDetailsComponent,
    'Index Only Scan': IndexOnlyScanDetailsComponent,
    'Hash Join': HashJoinDetailsComponent,
    'Nested Loop': NestedLoopDetailsComponent,
    'Aggregate': AggregateDetailsComponent,
    'Sort': SortDetailsComponent,
    // ... more mappings
  };

  static create(
    nodeType: string,
    container: HTMLElement
  ): BaseNodeDetailsComponent {
    const ComponentClass = this.COMPONENT_MAP[nodeType];

    if (ComponentClass) {
      return new ComponentClass(container);
    }

    // Fallback to generic component
    return new GenericNodeDetailsComponent(container);
  }
}
```

### 5. Updated Controller

Controller works with node IDs and uses NodeService + ComponentFactory:

```typescript
// /presentation/controllers/node-details.controller.ts
export class NodeDetailsController {
  private currentComponent: BaseNodeDetailsComponent | null = null;

  constructor(
    private container: HTMLElement,
    private hljs: any,
    private nodeService: NodeService,                     // Service instead of raw data!
    private componentFactory: NodeDetailsComponentFactory
  ) {}

  /**
   * Display details for a node by ID
   */
  displayNodeDetails(nodeId: string): void {
    // 1. Get typed entity from service
    const node = this.nodeService.getNode(nodeId);

    if (!node) {
      console.warn(`Node not found: ${nodeId}`);
      this.clearDetails();
      return;
    }

    // 2. Get appropriate component for this node type
    const component = this.componentFactory.create(
      node.nodeType,
      this.container
    );

    // 3. Destroy old component if exists
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // 4. Render new component
    component.setNode(node);
    this.currentComponent = component;

    // 5. Apply syntax highlighting if needed
    if (this.hljs) {
      this.container.querySelectorAll('code.language-sql').forEach((block) => {
        this.hljs.highlightElement(block);
      });
    }
  }

  clearDetails(): void {
    if (this.currentComponent) {
      this.currentComponent.destroy();
      this.currentComponent = null;
    }
    this.container.innerHTML = '<div class="detail-empty">Select a node to view details</div>';
  }

  getNodeSelectCallback(): (nodeId: string) => void {
    return (nodeId: string) => this.displayNodeDetails(nodeId);
  }
}
```

## Benefits

### 1. Single Source of Truth
All nodes created once and managed by NodeService:
```typescript
// Initialize once when data loads
app.nodeService.initialize(treeData);

// Everywhere else, just pass IDs
selectNode('node-123');         // Lightweight!
displayNodeDetails('node-123'); // Just a string!
highlightNode('node-123');
```

### 2. Single Responsibility
Each component only knows how to render ONE node type:
- `SeqScanDetailsComponent` → Seq Scan nodes
- `HashJoinDetailsComponent` → Hash Join nodes
- Easy to understand and maintain

### 3. Type Safety
```typescript
class SeqScanDetailsComponent {
  protected node: SeqScanNode; // Compiler knows exact type!

  renderFilter() {
    // Auto-complete works!
    this.node.tableName // ✅
    this.node.filter    // ✅
    this.node.hashCond  // ❌ Compile error - not on SeqScanNode
  }
}
```

### 4. Performance
Nodes created once, fast lookups:
```typescript
// Nodes created once during initialization
nodeService.initialize(treeData);  // O(n) - happens once

// Lookups are instant
nodeService.getNode('node-123');   // O(1) - Map lookup

// No recreation on every render
// No parsing raw data repeatedly
```

### 5. Testability
Each component can be tested in isolation:
```typescript
describe('SeqScanDetailsComponent', () => {
  it('should render filter selectivity', () => {
    const node = new SeqScanNode({
      name: 'Seq Scan',
      details: {
        actualRows: 50,
        rowsRemovedByFilter: 50
      }
    });

    const component = new SeqScanDetailsComponent(container);
    component.setNode(node);

    expect(component.container.textContent).toContain('50%');
  });
});

describe('NodeDetailsController', () => {
  it('should display node details by ID', () => {
    const mockService = {
      getNode: jest.fn().mockReturnValue(mockSeqScanNode)
    };

    const controller = new NodeDetailsController(
      container,
      hljs,
      mockService,
      componentFactory
    );

    controller.displayNodeDetails('node-123');

    expect(mockService.getNode).toHaveBeenCalledWith('node-123');
  });
});
```

### 6. Easy to Extend
Adding a new node type is simple:
```typescript
// 1. Create entity
class MaterializeNode extends ExplainNode { ... }

// 2. Create component
class MaterializeDetailsComponent extends BaseNodeDetailsComponent { ... }

// 3. Register in factories
NODE_TYPE_MAP['Materialize'] = MaterializeNode;
COMPONENT_MAP['Materialize'] = MaterializeDetailsComponent;

// Done! No changes to existing code
```

### 5. Encapsulation
Business logic lives in entities:
```typescript
class SeqScanNode extends ExplainNode {
  get selectivity(): number {
    const total = this.actualRows + (this.rowsRemovedByFilter || 0);
    return total > 0 ? (this.actualRows / total) * 100 : 0;
  }
}

// Component just displays it
renderFilter() {
  return `<span>Selectivity: ${this.node.selectivity}%</span>`;
}
```

## File Structure

```
/domain/entities/explain-nodes/
  ├── base-node.entity.ts          # Abstract base
  ├── seq-scan.entity.ts
  ├── index-scan.entity.ts
  ├── hash-join.entity.ts
  ├── aggregate.entity.ts
  └── ... (one per node type)

/application/services/
  └── node.service.ts              # Manages all nodes, single source of truth

/presentation/components/node-details/
  ├── base-node-details.component.ts
  ├── seq-scan-details.component.ts
  ├── index-scan-details.component.ts
  ├── hash-join-details.component.ts
  ├── aggregate-details.component.ts
  └── ... (one per node type)

/presentation/factories/
  └── node-details-component.factory.ts
```

## Migration Strategy

### Phase 1: Create Entities & Service
1. Create `BaseExplainNode` abstract class
2. Create 2-3 node types (start with most common: SeqScan, IndexScan)
3. Create `NodeService` to manage entities
4. Test service initialization and lookups

### Phase 2: Create Base Component
1. Extract common rendering to `BaseNodeDetailsComponent`
2. Keep existing `NodeDetailsComponent` working
3. Test base component in isolation

### Phase 3: Create Specialized Components
1. Create `SeqScanDetailsComponent` (extract from old component)
2. Create `IndexScanDetailsComponent`
3. Test each in isolation

### Phase 4: Integrate Service & Factory
1. Create `NodeDetailsComponentFactory`
2. Update `NodeDetailsController` to accept `NodeService` and factory
3. Update controller to work with node IDs instead of raw data
4. Initialize `NodeService` in `renderVisualization()`
5. Test end-to-end

### Phase 5: Expand
1. Add remaining node types one at a time
2. Each is a small, isolated change
3. Delete old `NodeDetailsComponent` when all types covered

## Implementation Order

**Start with most common nodes:**
1. Seq Scan (table scans)
2. Index Scan (index lookups)
3. Hash Join (joins)
4. Aggregate (GROUP BY)
5. Sort (ORDER BY)
6. ... (add rest as needed)

## Questions?

**Q: Isn't this more code?**
A: Initially yes, but each piece is:
- Smaller (< 100 lines)
- Focused (one responsibility)
- Testable (no giant conditionals)
- Maintainable (change one, don't touch others)

**Q: What about shared rendering?**
A: That's what `BaseNodeDetailsComponent` is for - all common metrics, headers, etc. are there.

**Q: Performance?**
A: Factory overhead is negligible (simple Map lookup). Creating a new component per node is fine - they're lightweight.

**Q: Can we reuse components?**
A: Yes! If two node types have identical rendering, they can share a component:
```typescript
COMPONENT_MAP['Bitmap Index Scan'] = IndexScanDetailsComponent;
COMPONENT_MAP['Index Scan'] = IndexScanDetailsComponent;
```

## Data Flow: Complete Picture

```
1. Visualization data loads
        ↓
renderVisualization(data)
        ↓
app.nodeService.initialize(treeData)
        ↓
    [NodeService creates typed entities for all nodes]
    [Stores in Map: 'node-123' → SeqScanNode instance]
        ↓
2. User clicks node in D3 tree
        ↓
onNodeSelect('node-123')  ← Just the ID!
        ↓
controller.displayNodeDetails('node-123')
        ↓
const node = nodeService.getNode('node-123')  ← O(1) lookup
        ↓
    [Returns: SeqScanNode instance]
        ↓
const component = componentFactory.create(node.nodeType, container)
        ↓
    [Returns: SeqScanDetailsComponent instance]
        ↓
component.setNode(node)
        ↓
component.render()
        ↓
    [Specialized rendering for Seq Scan]
        ↓
DOM updated with node details
```

**Key Points:**
- Nodes created once when data loads (Phase 1)
- IDs passed everywhere (lightweight)
- Fast lookups via service (O(1))
- Right component selected automatically
- Each component specialized for its node type

---

**This pattern scales beautifully. Start small, prove it works, then expand.**
