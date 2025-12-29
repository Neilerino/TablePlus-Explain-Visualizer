/**
 * TablePlus adapter module
 * Abstracts TablePlus API for easier testing and potential standalone version
 */

import { handleError } from './error-handler.js';

/**
 * TablePlus adapter class
 * Provides abstraction over TablePlus context API
 */
export class TablePlusAdapter {
  constructor(context) {
    this.context = context;
  }

  /**
   * Get the current query editor
   * @returns {{success: boolean, editor?: Object, error?: string}}
   */
  getQueryEditor() {
    const editor = this.context.currentQueryEditor();
    if (!editor) {
      return {
        success: false,
        error: 'NO_QUERY_EDITOR'
      };
    }
    return {
      success: true,
      editor: editor
    };
  }

  /**
   * Extract query from editor (selected or full)
   * @returns {{success: boolean, query?: string, error?: string}}
   */
  getQuery() {
    const editorResult = this.getQueryEditor();
    if (!editorResult.success) {
      return editorResult;
    }

    const editor = editorResult.editor;

    // Try to get selected text first, then fall back to full query
    let query = editor.currentSelectedString();
    if (!query || query.trim().length === 0) {
      query = editor.value();
    }

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'NO_QUERY'
      };
    }

    return {
      success: true,
      query: query
    };
  }

  /**
   * Execute a query
   * @param {string} query - SQL query to execute
   * @param {Function} callback - Callback function(result)
   */
  executeQuery(query, callback) {
    this.context.execute(query, callback);
  }

  /**
   * Display HTML in TablePlus
   * @param {string} html - HTML content to display
   */
  displayHTML(html) {
    this.context.loadHTML(html);
  }

  /**
   * Show an alert dialog
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   */
  showAlert(title, message) {
    this.context.alert(title, message);
  }

  /**
   * Show error using error handler
   * @param {string} errorCode - Error code
   * @param {string} additionalMessage - Additional message
   */
  showError(errorCode, additionalMessage = '') {
    handleError(errorCode, this.context, additionalMessage);
  }
}
