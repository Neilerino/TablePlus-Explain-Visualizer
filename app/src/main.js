/**
 * Main application logic for PostgreSQL EXPLAIN Visualizer
 */
import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css';

// Infrastructure
import { EventBus } from './infrastructure/events/event-bus.ts';
import { LocalStorageAdapter } from './infrastructure/persistence/local-storage.adapter.ts';
import { ViewStateManager } from './application/services/view-state-manager.ts';

// Domain Services
import { NodeService } from './domain/services/node.service.ts';

// Use Cases
import { SelectNodeUseCase } from './application/use-cases/select-node.use-case.ts';
import { ToggleViewUseCase } from './application/use-cases/toggle-view.use-case.ts';
import { ToggleCriticalPathUseCase } from './application/use-cases/toggle-critical-path.use-case.ts';

// Renderers
import { D3TreeRenderer } from './infrastructure/renderers/d3-tree.renderer.ts';
import { GridRenderer } from './infrastructure/renderers/grid-renderer.ts';

// Controllers
import { VisualizationController } from './presentation/controllers/visualization.controller.ts';
import { SidebarController } from './presentation/controllers/sidebar.controller.ts';
import { NodeDetailsController } from './presentation/controllers/node-details.controller.ts';
import { ViewToggleController } from './presentation/controllers/view-toggle.controller.ts';
import { CriticalPathToggleController } from './presentation/controllers/critical-path-toggle.controller.ts';

// Components
import { SidebarComponent } from './presentation/components/sidebar.component.ts';
import { QueryPanelComponent } from './presentation/components/query-panel.component.ts';
import { StatsPanelComponent } from './presentation/components/stats-panel.component.ts';
import { ViewToggleComponent } from './presentation/components/view-toggle.component.ts';
import { CriticalPathToggleComponent } from './presentation/components/critical-path-toggle.component.ts';

// Register SQL language for syntax highlighting
hljs.registerLanguage('sql', sql);

// ============================================
// APPLICATION STATE
// ============================================
const app = {
  // Infrastructure
  eventBus: null,
  viewStateManager: null,

  // Domain Services
  nodeService: null,

  // Renderers
  treeRenderer: null,
  gridRenderer: null,

  // Use Cases
  selectNodeUseCase: null,
  toggleViewUseCase: null,
  toggleCriticalPathUseCase: null,

  // Controllers
  visualizationController: null,
  leftSidebarController: null,
  rightSidebarController: null,
  nodeDetailsController: null,
  viewToggleController: null,
  criticalPathToggleController: null,

  // Components
  queryPanelComponent: null,
  statsPanelComponent: null
};

// ============================================
// SETUP FUNCTION - Creates everything in one clear place
// ============================================
function setupApp() {
  console.log('Setting up application...');

  // 1. Create infrastructure
  app.eventBus = new EventBus();
  const stateStore = new LocalStorageAdapter('pgexplain-state');
  app.viewStateManager = new ViewStateManager(app.eventBus, stateStore);

  // 2. Create domain services
  app.nodeService = new NodeService();

  // 3. Create use cases
  app.selectNodeUseCase = new SelectNodeUseCase(app.viewStateManager);
  app.toggleViewUseCase = new ToggleViewUseCase(app.viewStateManager);
  app.toggleCriticalPathUseCase = new ToggleCriticalPathUseCase(app.viewStateManager);

  // 4. Create renderers
  app.treeRenderer = new D3TreeRenderer(d3);
  app.treeRenderer.setNodeService(app.nodeService); // Enable specialized node rendering
  app.gridRenderer = new GridRenderer(
    document.getElementById('grid-container'),
    app.viewStateManager
  );

  // 5. Create visualization controller
  app.visualizationController = new VisualizationController(
    app.treeRenderer,
    app.gridRenderer,
    app.viewStateManager,
    app.selectNodeUseCase,
    app.toggleViewUseCase,
    app.toggleCriticalPathUseCase,
    app.eventBus
  );

  // 6. Create sidebar components and controllers
  const leftSidebarElement = document.getElementById('leftSidebar');
  const leftSidebarComponent = new SidebarComponent(leftSidebarElement, 'left');
  app.leftSidebarController = new SidebarController(
    leftSidebarComponent,
    app.eventBus,
    () => app.viewStateManager.saveState()
  );

  const rightSidebarElement = document.getElementById('rightSidebar');
  const rightSidebarComponent = new SidebarComponent(rightSidebarElement, 'right');
  app.rightSidebarController = new SidebarController(
    rightSidebarComponent,
    app.eventBus,
    () => app.viewStateManager.saveState()
  );

  // 7. Create node details controller (uses factory pattern internally)
  const nodeDetailsElement = document.getElementById('nodeDetails');
  app.nodeDetailsController = new NodeDetailsController(
    nodeDetailsElement,
    app.nodeService,
    hljs
  );

  // 8. Create view toggle component and controller
  const viewToggleElement = document.getElementById('viewToggleContainer');
  const viewToggleComponent = new ViewToggleComponent(viewToggleElement);
  app.viewToggleController = new ViewToggleController(
    viewToggleComponent,
    app.toggleViewUseCase,
    app.viewStateManager,
    app.eventBus
  );

  // 9. Create critical path toggle component and controller
  const statsContainer = document.getElementById('statsContainer');
  const criticalPathComponent = new CriticalPathToggleComponent(statsContainer, 0);
  app.criticalPathToggleController = new CriticalPathToggleController(
    criticalPathComponent,
    app.toggleCriticalPathUseCase,
    app.viewStateManager,
    app.eventBus
  );

  // 10. Create display-only panel components
  const queryPanelContainer = document.getElementById('queryPanel');
  app.queryPanelComponent = new QueryPanelComponent(queryPanelContainer);

  app.statsPanelComponent = new StatsPanelComponent(statsContainer);

  console.log('App setup complete');
}

// ============================================
// INITIALIZATION
// ============================================
export function initializeApp() {
  console.log('Initializing PostgreSQL EXPLAIN Visualizer...');
  setupApp();
  console.log('App initialized successfully');
}

// ============================================
// RENDER FUNCTION (Called by plugin via window.ExplainViz.render)
// ============================================
export function renderVisualization(data) {
  const { query, planData, treeData, criticalPath = [] } = data;

  console.log('Rendering visualization with data:', { query, planData, treeData, criticalPath });

  // Initialize NodeService with tree data
  if (app.nodeService && treeData) {
    app.nodeService.initialize(treeData);
    console.log('NodeService initialized with', app.nodeService.getNodeCount(), 'nodes');
  }

  // Initialize visualization controller with data (only done once)
  if (!app.visualizationController._initialized) {
    const onNodeSelect = app.nodeDetailsController.getNodeSelectCallback();

    app.visualizationController.initialize({
      treeData,
      planData,
      criticalPath,
      query
    }, onNodeSelect);
  }

  // Update panels with current data
  if (app.queryPanelComponent) {
    app.queryPanelComponent.setQuery(query, hljs);
  }

  if (app.statsPanelComponent) {
    app.statsPanelComponent.setStats(planData);
  }

  // Update critical path count
  if (app.criticalPathToggleController) {
    app.criticalPathToggleController.updateCriticalPathCount(criticalPath.length);
  }

  // Apply syntax highlighting
  if (hljs) {
    hljs.highlightAll();
  }

  console.log('Visualization rendered successfully');
}
