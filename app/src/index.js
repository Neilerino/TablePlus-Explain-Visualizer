/**
 * PostgreSQL EXPLAIN Visualizer - Entry Point
 * This file serves as the entry point for the webpack-bundled app
 */
import { initializeApp, renderVisualization } from './main.js';
import './styles/main.css';

console.log('EXPLAIN Visualizer app loaded');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Expose API for plugin communication
window.ExplainViz = window.ExplainViz || {};
window.ExplainViz.init = function(data) {
  console.log('ExplainViz.init() called with data:', data);
  renderVisualization(data);
};
