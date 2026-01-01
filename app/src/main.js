/**
 * Main application logic for PostgreSQL EXPLAIN Visualizer
 */
import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css';
import { bootstrapApplication } from './infrastructure/di/bootstrap.ts';
import { QueryPanelComponent } from './presentation/components/query-panel.component.ts';
import { StatsPanelComponent } from './presentation/components/stats-panel.component.ts';

// Register SQL language for syntax highlighting
hljs.registerLanguage('sql', sql);

// ============================================
// APPLICATION STATE (CLEAN Architecture)
// ============================================
const appState = {
  diContainer: null,
  visualizationController: null,
  leftSidebarController: null,
  rightSidebarController: null,
  nodeDetailsController: null,
  viewToggleController: null,
  criticalPathToggleController: null,
  queryPanelComponent: null,
  statsPanelComponent: null
};

// ============================================
// MAIN INITIALIZATION
// ============================================
export function initializeApp() {
  console.log('Initializing PostgreSQL EXPLAIN Visualizer...');

  // Bootstrap CLEAN architecture DI container
  appState.diContainer = bootstrapApplication(d3, hljs);

  // Initialize sidebar controllers (event handlers and resize are set up in constructors)
  appState.leftSidebarController = appState.diContainer.resolve('leftSidebarController');
  appState.rightSidebarController = appState.diContainer.resolve('rightSidebarController');

  // Initialize node details controller (event-driven)
  appState.nodeDetailsController = appState.diContainer.resolve('nodeDetailsController');

  // Initialize toggle controllers (interactive, event-driven)
  appState.viewToggleController = appState.diContainer.resolve('viewToggleController');
  appState.criticalPathToggleController = appState.diContainer.resolve('criticalPathToggleController');

  // Initialize panel components (display-only, no controllers needed)
  const queryPanelContainer = document.getElementById('queryPanel');
  if (queryPanelContainer) {
    appState.queryPanelComponent = new QueryPanelComponent(queryPanelContainer);
  }

  const statsContainer = document.getElementById('statsContainer');
  if (statsContainer) {
    appState.statsPanelComponent = new StatsPanelComponent(statsContainer);
  }

  console.log('App initialized successfully');
}

// ============================================
// RENDER FUNCTION (Called by plugin via window.ExplainViz.render)
// ============================================
export function renderVisualization(data) {
  const { query, planData, treeData, criticalPath = [] } = data;

  console.log('Rendering visualization with data:', { query, planData, treeData, criticalPath });

  // Initialize CLEAN architecture VisualizationController
  if (!appState.visualizationController && appState.diContainer) {
    appState.visualizationController = appState.diContainer.resolve('visualizationController');

    // Get node selection callback from NodeDetailsController
    const onNodeSelect = appState.nodeDetailsController.getNodeSelectCallback();

    // Initialize controller with visualization data
    appState.visualizationController.initialize({
      treeData,
      planData,
      criticalPath,
      query
    }, onNodeSelect);
  }

  // Populate query panel using component
  if (appState.queryPanelComponent) {
    appState.queryPanelComponent.setQuery(query, hljs);
  }

  // Populate stats panel using component
  if (appState.statsPanelComponent) {
    appState.statsPanelComponent.setStats(planData);
  }

  // Update critical path count (controllers are already initialized and event-driven)
  if (appState.criticalPathToggleController) {
    appState.criticalPathToggleController.updateCriticalPathCount(criticalPath.length);
  }

  // Initialize syntax highlighting for query
  if (hljs) {
    hljs.highlightAll();
  }

  console.log('Visualization rendered successfully');
}
