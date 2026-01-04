/**
 * PostgreSQL EXPLAIN Visualizer - Entry Point
 * This file serves as the entry point for the webpack-bundled app
 */
import { initializeApp, renderVisualization } from './main.js';
import { transformToD3Tree } from '../../src/core/transformer/tree-transformer.js';
import './styles/main.css';


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadTestDataIfDev();
  });
} else {
  initializeApp();
  loadTestDataIfDev();
}

window.ExplainViz = window.ExplainViz || {};
window.ExplainViz.init = function(data) {
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
    try {
      const response = await fetch('/test-data.json');
      const rawData = await response.json();
      const transformedData = transformToD3Tree(rawData.planData);

      const testData = {
        query: rawData.query,
        planData: rawData.planData,
        treeData: transformedData.tree,
        criticalPath: transformedData.criticalPath,
        rootCost: transformedData.rootCost,
        rootTime: transformedData.rootTime,
        cteMetadata: transformedData.cteMetadata
      };

      setTimeout(() => {
        window.ExplainViz.init(testData);
      }, 100);
    } catch (error) {
      console.error('[DEV MODE] Failed to load test data:', error);
    }
  }
}
