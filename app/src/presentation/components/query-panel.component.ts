/**
 * Query Panel Component
 * Displays SQL query with syntax highlighting
 * Display-only component - no controller needed
 */

import { Component } from './base.component';

export class QueryPanelComponent extends Component {
  private queryCodeElement: HTMLElement | null;

  constructor(container: HTMLElement) {
    super(container);
    // Look for queryCode element within the container, not globally
    this.queryCodeElement = container.querySelector('#queryCode');

    if (!this.queryCodeElement) {
      console.warn('queryCode element not found in container');
      console.log('Container:', container);
    }
  }

  /**
   * Render method (required by base class)
   * Query panel structure is already in HTML
   */
  render(): void {
    // Query panel structure is already in the HTML
    // This component manages existing DOM
  }

  /**
   * Set the SQL query and apply syntax highlighting
   * @param query - SQL query string
   * @param hljs - Highlight.js instance (optional)
   */
  setQuery(query: string, hljs?: any): void {
    if (!this.queryCodeElement) {
      console.warn('Cannot set query: queryCode element not found');
      return;
    }

    // Set query text content (this also escapes HTML to prevent XSS)
    this.queryCodeElement.textContent = query;

    // Apply syntax highlighting if available
    if (hljs) {
      hljs.highlightElement(this.queryCodeElement);
    }
  }

  /**
   * Clear the query display
   */
  clear(): void {
    if (this.queryCodeElement) {
      this.queryCodeElement.textContent = '';
    }
  }
}
