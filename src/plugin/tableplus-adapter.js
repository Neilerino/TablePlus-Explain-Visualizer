import { handleError } from './error-handler.js';


export class TablePlusAdapter {
  constructor(context) {
    this.context = context;
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

  showAlert(title, message) {
    this.context.alert(title, message);
  }

  showError(errorCode, additionalMessage = '') {
    handleError(errorCode, this.context, additionalMessage);
  }
}
