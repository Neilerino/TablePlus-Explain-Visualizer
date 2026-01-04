/**
 * Grid Adapter - Transforms hierarchical tree data to ag-Grid format
 * Calculates percentage metrics and prepares data for tree mode display
 */

import { EnrichedNode, PostgresPlanData, CTEMetadata } from '../../../types/plan-data';
import { GridRowData, GridConfig } from '../../../types/grid';
import { CTETreeExtractor } from '../infrastructure/renderers/cte-tree-extractor';

export class GridAdapter {
  /**
   * Transform D3 tree to ag-Grid compatible format
   * @param treeData - Root node of the tree
   * @param planData - Original PostgreSQL plan data for root metrics
   * @param cteMetadata - Optional CTE metadata for separated rendering
   * @returns Grid configuration with row data and column definitions
   */
  static toGridData(treeData: EnrichedNode, planData: PostgresPlanData, cteMetadata?: CTEMetadata): GridConfig {
    console.log('GridAdapter.toGridData called', { treeData, planData, hasCTEs: !!cteMetadata });

    const rootCost = planData.Plan['Total Cost'] || 0;
    const rootTime = planData.Plan['Actual Total Time'] || 0;

    console.log('Root metrics:', { rootCost, rootTime });

    // Helper function to create a grid row from a node
    const createGridRow = (node: EnrichedNode, depth: number = 0, cteName?: string): GridRowData => {
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
        selfCost: nodeCost, // Will be calculated after children
        selfCostPercent: Math.round(costPercent * 10) / 10, // Will be calculated after children
        selfTime: nodeTime, // Will be calculated after children
        selfTimePercent: Math.round(timePercent * 10) / 10, // Will be calculated after children
        planRows: typeof node.details.planRows === 'number' ? node.details.planRows : parseInt(String(node.details.planRows), 10) || 0,
        actualRows: typeof node.details.actualRows === 'number' ? node.details.actualRows : parseInt(String(node.details.actualRows), 10) || 0,
        loops: node.details.loops,
        keyInfo,
        path: [],
        depth: depth,
        _node: node,
        subRows: undefined, // Will be filled below if there are children
        // CTE-specific fields
        cteName: cteName,
        isCTENode: !!cteName
      };

      // Recursively create child rows
      if (node.children && node.children.length > 0) {
        row.subRows = node.children.map(child => createGridRow(child, depth + 1, cteName));

        // Calculate exclusive (self) values: total - sum(children)
        const childrenCost = row.subRows.reduce((sum, child) => sum + child.cost, 0);
        const childrenTime = row.subRows.reduce((sum, child) => sum + child.time, 0);

        row.selfCost = Math.max(0, nodeCost - childrenCost);
        row.selfTime = Math.max(0, nodeTime - childrenTime);

        // Calculate exclusive percentages
        row.selfCostPercent = rootCost > 0 ? Math.round((row.selfCost / rootCost) * 1000) / 10 : 0;
        row.selfTimePercent = rootTime > 0 ? Math.round((row.selfTime / rootTime) * 1000) / 10 : 0;
      }

      return row;
    };

    // Check if we have CTEs to separate
    let rowData: GridRowData[];

    if (cteMetadata && cteMetadata.cteDefinitions.size > 0) {
      console.log('📊 Creating grid with CTE separation...');

      // Extract CTE trees from main tree
      const extractor = new CTETreeExtractor();
      const forestLayout = extractor.extract(treeData, cteMetadata);

      rowData = [];

      // 1. Add main tree
      rowData.push(createGridRow(forestLayout.mainTree, 0));

      // 2. Add CTE sections
      forestLayout.cteTrees.forEach(({ cteName, tree }) => {
        // Add CTE section header
        const cteHeader: GridRowData = {
          id: `cte-header-${cteName}`,
          nodeType: `CTE: ${cteName}`,
          table: '',
          alias: '',
          cost: 0,
          costPercent: 0,
          time: 0,
          timePercent: 0,
          selfCost: 0,
          selfCostPercent: 0,
          selfTime: 0,
          selfTimePercent: 0,
          planRows: 0,
          actualRows: 0,
          loops: 0,
          keyInfo: '',
          path: [],
          depth: 0,
          _node: tree, // Reference to CTE root for node selection
          isCTESection: true,
          cteName: cteName
        };

        // Add CTE tree as a child of the header (so it appears nested)
        cteHeader.subRows = [createGridRow(tree, 0, cteName)];

        rowData.push(cteHeader);
      });

      console.log('📊 Grid with CTEs created:', {
        totalSections: rowData.length,
        mainTree: 1,
        cteSections: forestLayout.cteTrees.length
      });
    } else {
      // No CTEs, use original logic
      rowData = [createGridRow(treeData, 0)];
    }

    console.log('GridAdapter.toGridData complete', { rowCount: rowData.length, sampleRow: rowData[0] });

    return {
      rowData,
      autoGroupColumnDef: undefined,
      treeData: false,
      getDataPath: undefined,
      cteMetadata
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
