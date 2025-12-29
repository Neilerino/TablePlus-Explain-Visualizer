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
 *
 * Discovered via runtime inspection - 5 methods total.
 */
interface TablePlusApplication {
  /**
   * Get the root path where TablePlus plugins are installed
   * @returns Absolute path to the plugins directory
   * @example
   * const path = Application.pluginRootPath();
   * // "/Users/username/Library/Application Support/com.tinyapp.TablePlus/Plugins"
   * @confirmed Working
   */
  pluginRootPath(): string;

  /**
   * Get the current platform identifier
   * @returns Platform name (e.g., "darwin" for macOS, "win32" for Windows)
   * @example
   * const platform = Application.platform();
   * // "darwin"
   * @confirmed Working
   */
  platform(): string;

  /**
   * Get the TablePlus application version
   * @returns Version string (e.g., "5.3.6")
   * @example
   * const version = Application.appVersion();
   * @confirmed Working
   */
  appVersion(): string;

  /**
   * Get the TablePlus application build number
   * @returns Build number string
   * @example
   * const build = Application.appBuild();
   * @confirmed Working
   */
  appBuild(): string;

  /**
   * Save a file to disk
   * @param path - File path to save to
   * @param content - File content to write
   * @example
   * Application.saveFile('/path/to/file.txt', 'content');
   */
  saveFile(path: string, content: string): void;
}

// ============================================
// PLUGIN CONTEXT API
// ============================================

/**
 * The context object is passed to plugin entry functions.
 * It provides access to the current query editor, database execution,
 * UI display capabilities, and table data access.
 *
 * Discovered via runtime inspection - 32 methods total.
 */
interface TablePlusContext {
  // ============================================
  // UI DISPLAY METHODS
  // ============================================

  /**
   * Display an alert dialog to the user
   * @param title - Alert dialog title
   * @param message - Alert dialog message
   * @confirmed Working
   */
  alert(title: string, message: string): void;

  /**
   * Load an HTML file into a WebView for display
   * @param filePath - Absolute path to the HTML file
   * @param options - Load options (usually null)
   * @returns WebView object for further interaction
   * @confirmed Working
   */
  loadFile(filePath: string, options: null): TablePlusWebView;

  /**
   * Load HTML content directly into a WebView (legacy method)
   * @param html - HTML string to display
   * @deprecated Prefer loadFile() with external HTML files
   * @confirmed Working
   */
  loadHTML(html: string): void;

  /**
   * Load a URL into a WebView
   * @param url - URL to load
   */
  loadURL(url: string): TablePlusWebView;

  /**
   * Open a URL in the system default browser
   * @param url - URL to open
   */
  openURL(url: string): void;

  // ============================================
  // QUERY EDITOR METHODS
  // ============================================

  /**
   * Get the current query editor instance
   * @returns Query editor object or null if no editor is active
   * @confirmed Working
   */
  currentQueryEditor(): TablePlusQueryEditor | null;

  /**
   * Get the user's preferred editor setting
   * @returns Editor preference (exact type unknown)
   */
  preferredEditor(): any;

  // ============================================
  // DATABASE EXECUTION METHODS
  // ============================================

  /**
   * Execute a SQL query against the current database connection
   * @param query - SQL query string to execute
   * @param callback - Callback function to handle query results
   * @confirmed Working
   */
  execute(query: string, callback: (result: QueryResult) => void): void;

  /**
   * Commit current transaction changes
   */
  commit(): void;

  /**
   * Discard/rollback current transaction changes
   */
  discard(): void;

  /**
   * Update the current item/row
   * @param data - Data to update (exact structure unknown)
   */
  update(data: any): void;

  /**
   * Refresh the current view/data
   */
  refresh(): void;

  /**
   * Reload the current view/connection
   */
  reload(): void;

  // ============================================
  // DATA ACCESS METHODS (TABLE/ITEM CONTEXT)
  // ============================================

  /**
   * Get the column that was clicked in table view
   * @returns Column information (exact structure unknown)
   */
  clickedColumn(): any;

  /**
   * Get the item that was clicked in sidebar/tree view
   * @returns Clicked item (table, view, function, etc.)
   */
  clickedItem(): any;

  /**
   * Get the row index that was clicked in table view
   * @returns Row index or null
   */
  clickedRow(): number | null;

  /**
   * Get the value of the cell that was clicked
   * @returns Cell value
   */
  clickedRowValue(): any;

  /**
   * Get the current active item (table, view, etc.)
   * @returns Current item
   */
  currentItem(): any;

  /**
   * Get the currently displayed rows in table view
   * @returns Array of row data
   */
  currentRows(): Array<Record<string, any>>;

  /**
   * Get the current schema name
   * @returns Schema name or null
   */
  currentSchema(): string | null;

  /**
   * Get the currently selected item in sidebar
   * @returns Selected item (table, view, function, etc.)
   */
  selectedItem(): any;

  /**
   * Get all currently selected items in sidebar
   * @returns Array of selected items
   */
  selectedItems(): Array<any>;

  /**
   * Get the currently selected rows in table view
   * @returns Array of selected row indices or data
   */
  selectedRows(): Array<any>;

  /**
   * Get all items (tables, views, etc.) in current context
   * @returns Array of database items
   */
  items(): Array<any>;

  /**
   * Get the definition/schema of a database item
   * @param item - Item to get definition for
   * @returns Item definition (CREATE statement, etc.)
   */
  itemDefinition(item: any): string;

  /**
   * Fetch metadata for the current context
   * @param callback - Callback to handle metadata
   */
  fetchMeta(callback: (meta: any) => void): void;

  /**
   * Fetch rows from a table or query
   * @param options - Fetch options (limit, offset, etc.)
   * @param callback - Callback to handle fetched rows
   */
  fetchRows(options: any, callback: (rows: Array<Record<string, any>>) => void): void;

  // ============================================
  // DRIVER/CONNECTION METHODS
  // ============================================

  /**
   * Get the current database driver information
   * @returns Driver name/type (e.g., "postgres", "mysql")
   */
  driver(): string;

  // ============================================
  // FORMATTING PREFERENCES
  // ============================================

  /**
   * Get user preference for auto-uppercase SQL keywords
   * @returns True if auto-uppercase is enabled
   */
  formatAutoUppercase(): boolean;

  /**
   * Get user preference for tab width in formatting
   * @returns Tab width (number of spaces)
   */
  formatTabWidth(): number;

  /**
   * Get user preference for using tabs vs spaces
   * @returns True if tabs should be used, false for spaces
   */
  formatUseTabs(): boolean;

  /**
   * Check if should fallback to old formatter
   * @returns True if old formatter should be used
   */
  fallbackToOldFormatter(): boolean;
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
 * Represents a single row in query results
 * Row data is accessed via the raw() method
 *
 * Discovered via runtime inspection.
 */
interface QueryRow {
  /**
   * Get the raw value for a specific column
   * @param columnName - Name of the column to retrieve
   * @returns The value for that column
   * @example
   * const row = result.rows[0];
   * const id = row.raw('id');
   * const name = row.raw('name');
   * @confirmed Working
   */
  raw(columnName: string): any;
}

/**
 * Column metadata object
 *
 * Discovered via runtime inspection.
 */
interface QueryColumn {
  /**
   * Column name
   */
  name: string;

  /**
   * Column index (0-based)
   */
  index: number;

  /**
   * Column type object (NSObject)
   */
  type: any;

  /**
   * Column type as string
   * @example "int4", "text", "varchar", "timestamp"
   */
  typeString: string;
}

/**
 * Result object passed to execute() callback
 *
 * Discovered via runtime inspection.
 */
interface QueryResult {
  /**
   * Array of row objects
   * Access row data using row.raw(columnName)
   * @example
   * const rows = result.rows;
   * const firstRow = rows[0];
   * const value = firstRow.raw('column_name');
   * @confirmed Working
   */
  rows: Array<QueryRow>;

  /**
   * Column metadata indexed by column name
   * @example
   * const columns = result.columns;
   * const idColumn = columns['id'];
   * console.log(idColumn.typeString); // "int4"
   * @confirmed Working
   */
  columns: {
    [columnName: string]: QueryColumn;
  };

  /**
   * The SQL query that was executed
   * @confirmed Working
   */
  message: string;

  /**
   * Error position in query (-1 if no error)
   * @confirmed Working
   */
  errorPosition: number;
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
  QueryRow,
  QueryColumn,
  TablePlusPluginManifest
};
