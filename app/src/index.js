/**
 * PostgreSQL EXPLAIN Visualizer - Entry Point
 * This file serves as the entry point for the webpack-bundled app
 */
import { initializeApp, renderVisualization } from './main.js';
import { transformToD3Tree } from '../../src/core/transformer/tree-transformer.js';
import './styles/main.css';

console.log('EXPLAIN Visualizer app loaded');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadTestDataIfDev();
  });
} else {
  initializeApp();
  loadTestDataIfDev();
}

// Expose API for plugin communication
window.ExplainViz = window.ExplainViz || {};
window.ExplainViz.init = function(data) {
  console.log('ExplainViz.init() called with data:', data);
  renderVisualization(data);
};

/**
 * Auto-load test data in development mode
 */
async function loadTestDataIfDev() {
  // Check if we're in development mode (webpack dev server or file:// protocol)
  const isDev = window.location.hostname === 'localhost' ||
                window.location.protocol === 'file:' ||
                window.location.search.includes('dev=true');

  if (isDev) {
    console.log('%c[DEV MODE] Loading test data...', 'color: #4CAF50; font-weight: bold');

    try {
      // Fetch test data
      const response = await fetch('/test-data.json');
      const rawData = await response.json();

      // Transform the data
      const transformedData = transformToD3Tree(rawData.planData);

      // Create final data structure
      const testData = {
        query: rawData.query,
        planData: rawData.planData,
        treeData: transformedData.tree,
        criticalPath: transformedData.criticalPath,
        rootCost: transformedData.rootCost,
        rootTime: transformedData.rootTime
      };

      console.log('%c[DEV MODE] Test data loaded and transformed', 'color: #4CAF50; font-weight: bold', testData);

      setTimeout(() => {
        window.ExplainViz.init(testData);
      }, 100);
    } catch (error) {
      console.error('[DEV MODE] Failed to load test data:', error);
    }
  }
}
