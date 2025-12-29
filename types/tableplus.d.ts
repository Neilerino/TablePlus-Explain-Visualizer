/**
 * TablePlus Plugin API Type Definitions
 *
 * These types are based on runtime inspection and reverse engineering
 * of the TablePlus plugin environment. They document the available
 * APIs for plugin development.
 *
 * @see https://github.com/TablePlus/diagram-plugin for reference implementation
 */

// ============================================
// GLOBAL OBJECTS
// ============================================

/**
 * Global Application object available in TablePlus plugin context
 */
declare const Application: TablePlusApplication;

// ============================================
// APPLICATION API
// ============================================

/**
 * The Application object provides access to TablePlus application-level
 * functionality and metadata.
 */
interface TablePlusApplication {
  /**
   * Get the root path where TablePlus plugins are installed
   * @returns Absolute path to the plugins directory
   * @example
   * "/Users/username/Library/Application Support/com.tinyapp.TablePlus/Plugins"
   */
  pluginRootPath(): string;

  /**
   * Save a file to disk (exact API unknown - needs testing)
   * @param path - File path
   * @param content - File content
   */
  saveFile(path: string, content: string): void;

  /**
   * Platform identifier (e.g., "darwin" for macOS)
   */
  readonly platform: string;

  /**
   * TablePlus application version
   */
  readonly appVersion: string;

  /**
   * TablePlus application build number
   */
  readonly appBuild: string;
}

// ============================================
// PLUGIN CONTEXT API
// ============================================

/**
 * The context object is passed to plugin entry functions.
 * It provides access to the current query editor, database execution,
 * and UI display capabilities.
 */
interface TablePlusContext {
  /**
   * Execute a SQL query against the current database connection
   * @param query - SQL query string to execute
   * @param callback - Callback function to handle query results
   */
  execute(query: string, callback: (result: QueryResult) => void): void;

  /**
   * Display an alert dialog to the user
   * @param title - Alert dialog title
   * @param message - Alert dialog message
   */
  alert(title: string, message: string): void;

  /**
   * Load an HTML file into a WebView for display
   * @param filePath - Absolute path to the HTML file
   * @param options - Load options (usually null)
   * @returns WebView object for further interaction
   */
  loadFile(filePath: string, options: null): TablePlusWebView;

  /**
   * Load HTML content directly into a WebView (legacy method)
   * @param html - HTML string to display
   * @deprecated Prefer loadFile() with external HTML files
   */
  loadHTML(html: string): void;

  /**
   * Get the current query editor instance
   * @returns Query editor object or null if no editor is active
   */
  currentQueryEditor(): TablePlusQueryEditor | null;
}

// ============================================
// QUERY EDITOR API
// ============================================

/**
 * Represents the range of text selection in the query editor
 */
interface TablePlusTextRange {
  /**
   * Starting position of the selection
   */
  location: number;

  /**
   * Length of the selection
   */
  length: number;
}

/**
 * Represents a query editor in TablePlus
 */
interface TablePlusQueryEditor {
  /**
   * Get the currently selected text in the query editor
   * @returns Selected text, or empty string if no selection
   * @example
   * const selected = editor.currentSelectedString();
   * if (selected) {
   *   console.log('User selected:', selected);
   * }
   */
  currentSelectedString(): string;

  /**
   * Get the entire content of the query editor
   * @returns Full text content of the editor
   * @example
   * const fullQuery = editor.value();
   * console.log('Editor contains:', fullQuery);
   */
  value(): string;

  /**
   * Get the range of the current selection
   * @returns Object with location (start position) and length of selection
   * @example
   * const range = editor.currentSelectedRange();
   * console.log(`Selection from ${range.location} for ${range.length} chars`);
   */
  currentSelectedRange(): TablePlusTextRange;

  /**
   * Replace text in a specific range
   * @param range - The range to replace (location and length)
   * @param newText - The text to insert
   * @example
   * // Replace current selection with formatted text
   * const range = editor.currentSelectedRange();
   * editor.replaceStringInRange(range, formattedSql);
   *
   * @example
   * // Insert at cursor position
   * const range = editor.currentSelectedRange();
   * if (range.length === 0) {
   *   // No selection, insert at cursor
   *   editor.replaceStringInRange(range, 'EXPLAIN ANALYZE ');
   * }
   */
  replaceStringInRange(range: TablePlusTextRange, newText: string): void;
}

// ============================================
// WEBVIEW API
// ============================================

/**
 * WebView object returned by context.loadFile()
 * Allows JavaScript execution within the loaded HTML context
 */
interface TablePlusWebView {
  /**
   * Execute JavaScript code in the WebView context
   * @param jsCode - JavaScript code string to execute
   * @example
   * webView.evaluate("window.myFunction({ data: 'value' })");
   */
  evaluate(jsCode: string): void;
}

// ============================================
// QUERY RESULTS
// ============================================

/**
 * Result object passed to execute() callback
 * Structure is inferred from EXPLAIN query results
 */
interface QueryResult {
  /**
   * Rows returned by the query
   * For EXPLAIN queries, this contains the plan data
   */
  rows?: Array<Record<string, any>>;

  /**
   * Column metadata (exact structure unknown)
   */
  columns?: Array<{
    name: string;
    type?: string;
  }>;

  /**
   * Error information if query failed
   */
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================
// PLUGIN MANIFEST
// ============================================

/**
 * Plugin manifest.json structure
 * @see PostgresExplain.tableplusplugin/manifest.json
 */
interface TablePlusPluginManifest {
  /**
   * Unique plugin identifier (reverse domain notation)
   */
  id: string;

  /**
   * Plugin display name
   */
  name: string;

  /**
   * Plugin description
   */
  description: string;

  /**
   * Plugin version (semver)
   */
  version: string;

  /**
   * Supported database types
   */
  databaseTypes: Array<'postgres' | 'mysql' | 'sqlite' | 'redis' | 'mongodb' | string>;

  /**
   * Path to the main plugin JavaScript file
   */
  mainEntry: string;

  /**
   * Plugin author information
   */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };

  /**
   * Minimum required TablePlus version
   */
  minAppVersion?: string;
}

// ============================================
// GLOBAL AUGMENTATION
// ============================================

/**
 * Augment global scope with TablePlus-specific objects
 */
declare global {
  const Application: TablePlusApplication;
}

export {
  TablePlusApplication,
  TablePlusContext,
  TablePlusQueryEditor,
  TablePlusTextRange,
  TablePlusWebView,
  QueryResult,
  TablePlusPluginManifest
};
