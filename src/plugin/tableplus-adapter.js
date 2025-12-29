import { handleError } from './error-handler.js';

const PLUGIN_IDENTIFER = 'com.tinyapp.TablePlus.PostgresExplain.tableplusplugin';


export class TablePlusAdapter {
  constructor(context) {
    this.context = context;
    this.application = Application;
  }

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

  executeQuery(query, callback) {
    this.context.execute(query, callback);
  }

  displayHTML(html) {
    this.context.loadHTML(html);
  }


  workingPath() {
    return Application.pluginRootPath()  + `/${PLUGIN_IDENTIFER}` ;
  }

  /**
   * Load HTML file into webView
   * @param {string} htmlPath - Path to HTML file
   * @returns {object} webView object
   */
  loadWebView(htmlPath) {
    return this.context.loadFile(`${this.workingPath()}/${htmlPath}`, null);
  }

  /**
   * Pass data to webView via JavaScript evaluation
   * @param {object} webView - WebView object
   * @param {object} data - Data to pass
   */
  sendDataToWebView(webView, data) {
    const jsonData = JSON.stringify(data);
    webView.evaluate(`window.ExplainViz.init(${jsonData})`);
  }

  showAlert(title, message) {
    this.context.alert(title, message);
  }

  showError(errorCode, additionalMessage = '') {
    handleError(errorCode, this.context, additionalMessage);
  }
}
