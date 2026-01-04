/**
 * Type definitions for grid view data structures
 */

import { EnrichedNode, CTEMetadata } from './plan-data';

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
  selfCost: number; // Exclusive cost (excluding children)
  selfCostPercent: number; // Exclusive cost percentage
  selfTime: number; // Exclusive time (excluding children)
  selfTimePercent: number; // Exclusive time percentage
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

  // CTE-specific fields
  isCTESection?: boolean; // True if this row is a CTE section header
  cteName?: string; // The CTE name (for CTE section headers and CTE nodes)
  isCTENode?: boolean; // True if this row belongs to a CTE tree
}

/**
 * Grid configuration returned by adapter
 */
export interface GridConfig {
  rowData: GridRowData[];
  autoGroupColumnDef?: any;
  treeData: boolean;
  getDataPath?: (data: GridRowData) => string[];
  cteMetadata?: CTEMetadata; // CTE metadata for highlighting
}
