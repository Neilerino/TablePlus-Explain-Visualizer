/**
 * HTML head section
 * Generates <head> with meta tags and embedded libraries
 */

// Import bundled libraries as strings using raw-loader
import d3Code from '../../libs/d3.bundled.js';
import hljsCode from '../../libs/hljs.bundled.js';

/**
 * Render the HTML head section
 * @param {string} styles - CSS styles to embed
 * @returns {string} HTML string
 */
export function renderHead(styles = '') {
  return `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PostgreSQL EXPLAIN Visualization (Enhanced)</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script>${d3Code}</script>
  <script>${hljsCode}</script>
  <style>${styles}</style>
</head>
  `;
}
