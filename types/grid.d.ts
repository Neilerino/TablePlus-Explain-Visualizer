/**
 * Type definitions for grid view data structures
 */

import { EnrichedNode } from './plan-data';

/**
 * Grid row data for ag-grid
 */
export interface GridRowData {
  id: string;
  nodeType: string;
  table: string;
  alias: string;
  cost: number;
  costPercent: number;
  time: number;
  timePercent: number;
  planRows: number;
  actualRows: number;
  loops: number;
  keyInfo: string;

  // For hierarchy display
  path: string[];
  depth: number; // For indentation
  subRows?: GridRowData[]; // Child rows for hierarchical display

  // Reference to original node
  _node: EnrichedNode;
}

/**
 * Grid configuration returned by adapter
 */
export interface GridConfig {
  rowData: GridRowData[];
  autoGroupColumnDef?: any;
  treeData: boolean;
  getDataPath?: (data: GridRowData) => string[];
}
