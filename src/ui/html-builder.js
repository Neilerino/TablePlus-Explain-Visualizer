/**
 * HTML Builder
 * Main module for assembling the complete HTML document
 */

import { renderHead } from './sections/head.js';
import { renderLayout } from './sections/layout.js';
import { renderScripts } from './sections/scripts.js';
import { escapeJson } from '../utils/escape.js';
import styles from '../styles/main.css';

/**
 * Build complete HTML document
 * @param {Object} options - Build options
 * @param {string} options.query - Original SQL query
 * @param {Object} options.planData - Parsed EXPLAIN plan data
 * @param {Object} options.treeData - D3 tree structure
 * @param {string} options.styles - CSS styles to embed
 * @param {string} options.visualizationCode - D3 visualization JavaScript code
 * @returns {string} Complete HTML document
 */
export function buildHTML({ query, planData, treeData, visualizationCode = '' }) {
  // Escape tree data for safe embedding in JavaScript
  const treeJson = escapeJson(treeData);

  const html = `<!DOCTYPE html>
<html lang="en">
${renderHead(styles)}
${renderLayout(query, planData)}
${renderScripts(treeJson, visualizationCode)}
</html>`;

  return html;
}
