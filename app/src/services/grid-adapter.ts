/**
 * Grid Adapter - Transforms hierarchical tree data to ag-Grid format
 * Calculates percentage metrics and prepares data for tree mode display
 */

import { EnrichedNode, PostgresPlanData } from '../../../types/plan-data';
import { GridRowData, GridConfig } from '../../../types/grid';

export class GridAdapter {
  /**
   * Transform D3 tree to ag-Grid compatible format
   * @param treeData - Root node of the tree
   * @param planData - Original PostgreSQL plan data for root metrics
   * @returns Grid configuration with row data and column definitions
   */
  static toGridData(treeData: EnrichedNode, planData: PostgresPlanData): GridConfig {
    console.log('GridAdapter.toGridData called', { treeData, planData });

    const rootCost = planData.Plan['Total Cost'] || 0;
    const rootTime = planData.Plan['Actual Total Time'] || 0;

    console.log('Root metrics:', { rootCost, rootTime });

    // Create hierarchical structure with subRows
    const createGridRow = (node: EnrichedNode, depth: number = 0): GridRowData => {
      const nodeCost = parseFloat(node.details.cost) || 0;
      const nodeTime = node.details.actualTime !== 'N/A' ? parseFloat(node.details.actualTime) : 0;

      // Calculate percentages
      const costPercent = rootCost > 0 ? (nodeCost / rootCost) * 100 : 0;
      const timePercent = rootTime > 0 ? (nodeTime / rootTime) * 100 : 0;

      // Extract key info (join conditions, filters, etc.)
      const keyInfo = GridAdapter.extractKeyInfo(node);

      const row: GridRowData = {
        id: node.id || `node-${Math.random()}`,
        nodeType: node.name,
        table: node.details.relation || '',
        alias: node.details.alias || '',
        cost: nodeCost,
        costPercent: Math.round(costPercent * 10) / 10,
        time: nodeTime,
        timePercent: Math.round(timePercent * 10) / 10,
        planRows: typeof node.details.planRows === 'number' ? node.details.planRows : parseInt(String(node.details.planRows), 10) || 0,
        actualRows: typeof node.details.actualRows === 'number' ? node.details.actualRows : parseInt(String(node.details.actualRows), 10) || 0,
        loops: node.details.loops,
        keyInfo,
        path: [],
        depth: depth,
        _node: node,
        subRows: undefined // Will be filled below if there are children
      };

      // Recursively create child rows
      if (node.children && node.children.length > 0) {
        row.subRows = node.children.map(child => createGridRow(child, depth + 1));
      }

      return row;
    };

    const rowData = [createGridRow(treeData, 0)];

    console.log('GridAdapter.toGridData complete', { rowCount: rowData.length, sampleRow: rowData[0] });

    return {
      rowData,
      autoGroupColumnDef: undefined,
      treeData: false,
      getDataPath: undefined
    };
  }

  /**
   * Extract key information for display (join conditions, filters, etc.)
   */
  private static extractKeyInfo(node: EnrichedNode): string {
    const info: string[] = [];

    if (node.details.joinType) {
      info.push(`${node.details.joinType} Join`);
    }

    if (node.details.hashCond) {
      info.push(`Hash: ${node.details.hashCond}`);
    }

    if (node.details.filter) {
      info.push(`Filter: ${node.details.filter}`);
    }

    if (node.details.indexName) {
      info.push(`Index: ${node.details.indexName}`);
    }

    if (node.details.sortKey) {
      info.push(`Sort: ${node.details.sortKey}`);
    }

    return info.join(' | ') || '-';
  }
}
