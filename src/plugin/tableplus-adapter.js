/// <reference path="../../types/tableplus.d.ts" />

import { handleError } from './error-handler.js';

const PLUGIN_IDENTIFER = 'com.tinyapp.TablePlus.PostgresExplain.tableplusplugin';

/**
 * Adapter class for TablePlus plugin API
 * Provides a clean interface to TablePlus functionality
 */
export class TablePlusAdapter {
  /**
   * @param {TablePlusContext} context - TablePlus plugin context
   */
  constructor(context) {
    /** @type {TablePlusContext} */
    this.context = context;
    /** @type {TablePlusApplication} */
    this.application = Application;
  }

  /**
   * Get the current query editor
   * @returns {{success: boolean, error?: string, editor?: TablePlusQueryEditor}}
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
   * Get the SQL query from the editor (selected text or full content)
   * @returns {{success: boolean, error?: string, query?: string}}
   */
  getQuery() {
    const editorResult = this.getQueryEditor();
    if (!editorResult.success) {
      return editorResult;
    }

    const editor = editorResult.editor;

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
   * Execute a SQL query
   * @param {string} query - SQL query to execute
   * @param {(result: QueryResult) => void} callback - Callback to handle results
   */
  executeQuery(query, callback) {
    this.context.execute(query, callback);
  }

  /**
   * Display HTML content directly (legacy method)
   * @param {string} html - HTML string to display
   * @deprecated Use loadWebView() instead
   */
  displayHTML(html) {
    this.context.loadHTML(html);
  }

  /**
   * Get the absolute path to the plugin directory
   * @returns {string} Absolute path to plugin root
   */
  workingPath() {
    return Application.pluginRootPath()  + `/${PLUGIN_IDENTIFER}` ;
  }

  /**
   * Load HTML file into webView
   * @param {string} htmlPath - Relative path to HTML file (from plugin root)
   * @returns {TablePlusWebView} webView object
   */
  loadWebView(htmlPath) {
    return this.context.loadFile(`${this.workingPath()}/${htmlPath}`, null);
  }

  /**
   * Pass data to webView via JavaScript evaluation
   * @param {TablePlusWebView} webView - WebView object
   * @param {object} data - Data to pass to the webView
   */
  sendDataToWebView(webView, data) {
    const jsonData = JSON.stringify(data);
    webView.evaluate(`window.ExplainViz.init(${jsonData})`);
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
   * Show an error dialog with localized message
   * @param {string} errorCode - Error code for localization
   * @param {string} [additionalMessage=''] - Additional error details
   */
  showError(errorCode, additionalMessage = '') {
    handleError(errorCode, this.context, additionalMessage);
  }
}
