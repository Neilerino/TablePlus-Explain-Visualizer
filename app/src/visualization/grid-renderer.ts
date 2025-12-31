/**
 * Grid Renderer - ag-Grid integration for plan visualization
 * Handles grid initialization, configuration, and interactions
 */

import { createGrid, GridOptions, RowClickedEvent, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { GridRowData, GridConfig } from '../../../types/grid';
import { ViewManager } from '../services/view-manager';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export class GridRenderer {
  private container: HTMLElement;
  private viewManager: ViewManager;
  private gridApi: GridApi | null = null;
  private onNodeSelect: ((rowData: GridRowData) => void) | null = null;

  constructor(container: HTMLElement, viewManager: ViewManager) {
    this.container = container;
    this.viewManager = viewManager;
  }

  /**
   * Initialize and render the grid
   */
  render(gridConfig: GridConfig, onNodeSelect: (rowData: GridRowData) => void): void {
    console.log('GridRenderer.render called', { rowDataLength: gridConfig.rowData.length });
    this.onNodeSelect = onNodeSelect;

    const gridOptions: GridOptions = {
      rowData: gridConfig.rowData,
      columnDefs: [
        {
          field: 'nodeType',
          headerName: 'Node Type',
          minWidth: 200,
          flex: 1,
          cellRenderer: (params: any) => {
            const depth = params.data?.depth || 0;
            const indent = '  '.repeat(depth); // 2 spaces per level
            const symbol = depth > 0 ? '└─ ' : '';
            return `${indent}${symbol}${params.value}`;
          }
        },
        {
          field: 'table',
          headerName: 'Table',
          minWidth: 120
        },
        {
          field: 'alias',
          headerName: 'Alias',
          minWidth: 100
        },
        {
          field: 'cost',
          headerName: 'Cost',
          minWidth: 100,
          valueFormatter: (params) => params.value ? params.value.toFixed(2) : 'N/A',
          cellClass: (params) => this.getCostCellClass(params.value)
        },
        {
          field: 'costPercent',
          headerName: 'Cost %',
          minWidth: 100,
          valueFormatter: (params) => params.value ? `${params.value.toFixed(1)}%` : 'N/A',
          cellClass: (params) => this.getPercentCellClass(params.value)
        },
        {
          field: 'time',
          headerName: 'Time (ms)',
          minWidth: 120,
          valueFormatter: (params) => params.value ? params.value.toFixed(3) : 'N/A',
          cellClass: (params) => this.getTimeCellClass(params.value)
        },
        {
          field: 'timePercent',
          headerName: 'Time %',
          minWidth: 100,
          valueFormatter: (params) => params.value ? `${params.value.toFixed(1)}%` : 'N/A',
          cellClass: (params) => this.getPercentCellClass(params.value)
        },
        {
          field: 'planRows',
          headerName: 'Rows (Plan)',
          minWidth: 120,
          valueFormatter: (params) => params.value ? params.value.toLocaleString() : 'N/A'
        },
        {
          field: 'actualRows',
          headerName: 'Rows (Actual)',
          minWidth: 120,
          valueFormatter: (params) => params.value ? params.value.toLocaleString() : 'N/A'
        },
        {
          field: 'loops',
          headerName: 'Loops',
          minWidth: 80
        },
        {
          field: 'keyInfo',
          headerName: 'Key Info',
          minWidth: 200,
          flex: 2
        }
      ],
      animateRows: true,
      rowSelection: 'single',
      onRowClicked: (event: RowClickedEvent) => this.handleRowClick(event),
      defaultColDef: {
        sortable: true,
        resizable: true
      },
      suppressContextMenu: true,
      rowHeight: 32
    };

    // Clear container and create grid
    this.container.innerHTML = '';
    this.container.classList.add('ag-theme-quartz-dark');

    const gridDiv = document.createElement('div');
    gridDiv.style.width = '100%';
    gridDiv.style.height = '100%';
    this.container.appendChild(gridDiv);

    console.log('Creating ag-Grid...', { containerSize: `${this.container.clientWidth}x${this.container.clientHeight}` });
    this.gridApi = createGrid(gridDiv, gridOptions);
    console.log('ag-Grid created successfully', { gridApi: !!this.gridApi });
  }

  /**
   * Handle row click - populate node details
   */
  private handleRowClick(event: RowClickedEvent): void {
    if (event.data && this.onNodeSelect) {
      const rowData = event.data as GridRowData;
      this.onNodeSelect(rowData);

      // Update selected node in view manager
      this.viewManager.selectNode(rowData.id);
    }
  }

  /**
   * Select a specific row by node ID
   */
  selectNode(nodeId: string): void {
    if (!this.gridApi) return;

    // Find and select the row
    this.gridApi.forEachNode((rowNode) => {
      if (rowNode.data && rowNode.data.id === nodeId) {
        rowNode.setSelected(true);
        this.gridApi?.ensureNodeVisible(rowNode, 'middle');
      } else {
        rowNode.setSelected(false);
      }
    });
  }

  /**
   * Destroy the grid instance
   */
  destroy(): void {
    if (this.gridApi) {
      this.gridApi.destroy();
      this.gridApi = null;
    }
  }

  /**
   * Get CSS class for cost cells based on threshold
   */
  private getCostCellClass(cost: number): string {
    if (cost > 1000) return 'cell-red';
    if (cost > 100) return 'cell-orange';
    return 'cell-green';
  }

  /**
   * Get CSS class for time cells based on threshold
   */
  private getTimeCellClass(time: number): string {
    if (time > 1000) return 'cell-red';
    if (time > 100) return 'cell-orange';
    return 'cell-green';
  }

  /**
   * Get CSS class for percentage cells
   */
  private getPercentCellClass(percent: number): string {
    if (percent > 50) return 'cell-red';
    if (percent > 10) return 'cell-orange';
    return 'cell-green';
  }
}
