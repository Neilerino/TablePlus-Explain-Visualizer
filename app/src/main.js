/**
 * Main application logic for PostgreSQL EXPLAIN Visualizer
 */
import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css';
import { populateNodeDetails } from './ui/node-details.js';
import { populateStatsPanel } from './ui/stats-panel.js';
import { populateQueryPanel } from './ui/query-panel.js';
import { renderViewToggle } from './ui/view-toggle.ts';
import { renderCriticalPathControl } from './ui/critical-path-control.ts';
import { bootstrapApplication } from './infrastructure/di/bootstrap.ts';

// Register SQL language for syntax highlighting
hljs.registerLanguage('sql', sql);

// ============================================
// APPLICATION STATE (CLEAN Architecture)
// ============================================
const appState = {
  diContainer: null,
  visualizationController: null,
  sidebarController: null
};

// ============================================
// MAIN INITIALIZATION
// ============================================
export function initializeApp() {
  console.log('Initializing PostgreSQL EXPLAIN Visualizer...');

  // Bootstrap CLEAN architecture DI container
  appState.diContainer = bootstrapApplication(d3);

  // Initialize controllers
  appState.sidebarController = appState.diContainer.resolve('sidebarController');

  // Initialize sidebar resize handles through controller
  appState.sidebarController.initializeResizeHandles();

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

    // Wrapper for populateNodeDetails that includes hljs
    const onNodeSelect = (node) => {
      populateNodeDetails(node, hljs);
    };

    // Initialize controller with visualization data
    appState.visualizationController.initialize({
      treeData,
      planData,
      criticalPath,
      query
    }, onNodeSelect);
  }

  // Populate query panel
  populateQueryPanel(query, hljs);

  // Populate stats panel
  populateStatsPanel(planData);

  // Get services from DI container
  const toggleCriticalPathUseCase = appState.diContainer.resolve('toggleCriticalPathUseCase');
  const toggleViewUseCase = appState.diContainer.resolve('toggleViewUseCase');
  const stateManager = appState.diContainer.resolve('viewStateManager');
  const eventBus = appState.diContainer.resolve('eventBus');

  // Add critical path control to stats panel
  const statsContainer = document.getElementById('statsContainer');
  renderCriticalPathControl(statsContainer, toggleCriticalPathUseCase, stateManager, eventBus, criticalPath.length);

  // Add view toggle
  const viewToggleContainer = document.getElementById('viewToggleContainer');
  if (viewToggleContainer) {
    renderViewToggle(viewToggleContainer, toggleViewUseCase, stateManager, eventBus);
  }

  // Initialize syntax highlighting for query
  if (hljs) {
    hljs.highlightAll();
  }

  console.log('Visualization rendered successfully');
}
