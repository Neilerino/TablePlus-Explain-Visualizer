/**
 * Grid Renderer - TanStack Table integration for plan visualization
 * Custom dark-themed table with hierarchical display
 */

import {
  createTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  Row,
  Table,
  TableOptions,
} from '@tanstack/table-core';

import { GridRowData, GridConfig } from '../../../types/grid';
import { ViewManager } from '../services/view-manager';

export class GridRenderer {
  private container: HTMLElement;
  private viewManager: ViewManager;
  private table: Table<GridRowData> | null = null;
  private onNodeSelect: ((rowData: GridRowData) => void) | null = null;
  private tableState: any = {
    expanded: true, // Expand all by default
    columnPinning: {
      left: [],
      right: []
    },
    columnSizing: {},
    columnSizingInfo: {},
    columnVisibility: {},
    columnOrder: [],
    sorting: [],
    grouping: [],
    columnFilters: [],
    globalFilter: undefined,
    rowSelection: {},
    pagination: {
      pageIndex: 0,
      pageSize: 10
    }
  };

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

    // Define columns
    const columns: ColumnDef<GridRowData>[] = [
      {
        accessorKey: 'nodeType',
        header: 'Node Type',
        size: 250,
        cell: (info) => {
          const row = info.row;
          const depth = row.original.depth || 0;
          const canExpand = row.getCanExpand();
          const isExpanded = row.getIsExpanded();

          // Create indentation
          const indent = '&nbsp;'.repeat(depth * 4); // 4 spaces per level

          // Expand/collapse button (only for expandable rows)
          const expandButton = canExpand
            ? `<span class="expand-btn" data-row-id="${row.original.id}" style="cursor: pointer; user-select: none; margin-right: 4px;">${isExpanded ? '▼' : '▶'}</span>`
            : '<span style="margin-right: 4px; opacity: 0;">▶</span>'; // Invisible placeholder for alignment

          // Tree connector symbol
          const treeSymbol = depth > 0 ? '└─&nbsp;' : '';

          return `${indent}${expandButton}${treeSymbol}${info.getValue()}`;
        },
      },
      {
        accessorKey: 'table',
        header: 'Table',
        size: 120,
      },
      {
        accessorKey: 'alias',
        header: 'Alias',
        size: 80,
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        size: 100,
        cell: (info) => {
          const value = info.getValue() as number;
          return value.toFixed(2);
        },
      },
      {
        accessorKey: 'costPercent',
        header: 'Cost %',
        size: 100,
        cell: (info) => {
          const value = info.getValue() as number;
          return `${value.toFixed(1)}%`;
        },
      },
      {
        accessorKey: 'time',
        header: 'Time (ms)',
        size: 120,
        cell: (info) => {
          const value = info.getValue() as number;
          return value.toFixed(3);
        },
      },
      {
        accessorKey: 'timePercent',
        header: 'Time %',
        size: 100,
        cell: (info) => {
          const value = info.getValue() as number;
          return `${value.toFixed(1)}%`;
        },
      },
      {
        accessorKey: 'planRows',
        header: 'Rows (Plan)',
        size: 120,
        cell: (info) => {
          const value = info.getValue() as number;
          return value.toLocaleString();
        },
      },
      {
        accessorKey: 'actualRows',
        header: 'Rows (Actual)',
        size: 120,
        cell: (info) => {
          const value = info.getValue() as number;
          return value.toLocaleString();
        },
      },
      {
        accessorKey: 'loops',
        header: 'Loops',
        size: 80,
      },
      {
        accessorKey: 'keyInfo',
        header: 'Key Info',
        size: 200,
      },
    ];

    // Create table instance - cast to any to work around TypeScript issues with TanStack Table Core
    const tableOptions = {
      data: gridConfig.rowData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getSubRows: (row: GridRowData) => row.subRows, // Simple: just return the subRows property
      state: this.tableState,
      onStateChange: (updater: any) => {
        this.tableState = typeof updater === 'function' ? updater(this.tableState) : updater;
      },
      renderFallbackValue: null,
    } as any;

    this.table = createTable(tableOptions) as Table<GridRowData>;

    // Render the table
    this.renderTable();
  }

  /**
   * Render table HTML
   */
  private renderTable(): void {
    const tableHtml = `
      <div class="explain-table-container">
        <table class="explain-table">
          <thead class="explain-table-head">
            ${this.renderHeader()}
          </thead>
          <tbody class="explain-table-body">
            ${this.renderRows()}
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = tableHtml;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render table header
   */
  private renderHeader(): string {
    if (!this.table) return '';

    return this.table.getHeaderGroups().map((headerGroup: any) => `
      <tr>
        ${headerGroup.headers.map((header: any) => {
          const headerValue = typeof header.column.columnDef.header === 'function'
            ? header.column.columnDef.header(header.getContext())
            : header.column.columnDef.header;
          return `<th style="width: ${header.getSize()}px">${headerValue}</th>`;
        }).join('')}
      </tr>
    `).join('');
  }

  /**
   * Render table rows
   */
  private renderRows(): string {
    if (!this.table) return '';

    return this.table.getRowModel().rows.map((row: Row<GridRowData>) => {
      const rowData = row.original;

      return `
        <tr
          data-row-id="${rowData.id}"
          class="explain-table-row ${rowData.depth > 0 ? 'child-row' : 'root-row'}"
        >
          ${row.getVisibleCells().map((cell: any) => {
            // Render cell value
            const cellValue = typeof cell.column.columnDef.cell === 'function'
              ? cell.column.columnDef.cell(cell.getContext())
              : cell.getValue();

            const columnId = cell.column.id;
            const cellClass = this.getCellClass(columnId, rowData);

            return `<td class="${cellClass}">${cellValue}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');
  }

  /**
   * Get CSS class for cell based on column and value
   */
  private getCellClass(columnId: string, rowData: GridRowData): string {
    const classes = ['explain-table-cell'];

    // Add color classes for metric columns
    if (columnId === 'cost') {
      const cost = rowData.cost;
      if (cost > 1000) classes.push('cell-red');
      else if (cost > 100) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    if (columnId === 'time') {
      const time = rowData.time;
      if (time > 1000) classes.push('cell-red');
      else if (time > 100) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    if (columnId === 'costPercent' || columnId === 'timePercent') {
      const percent = columnId === 'costPercent' ? rowData.costPercent : rowData.timePercent;
      if (percent > 50) classes.push('cell-red');
      else if (percent > 10) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    return classes.join(' ');
  }

  /**
   * Attach event listeners to rows
   */
  private attachEventListeners(): void {
    if (!this.table) return;

    // Attach expand button listeners
    const expandButtons = this.container.querySelectorAll('.expand-btn');
    expandButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent row click
        const rowId = button.getAttribute('data-row-id');
        if (!rowId || !this.table) return;

        // Find the row in the table
        const row = this.table.getRowModel().rowsById[rowId];
        if (row && row.getCanExpand()) {
          row.toggleExpanded();
          // Re-render the table
          this.renderTable();
        }
      });
    });

    // Attach row click listeners
    const rows = this.container.querySelectorAll('.explain-table-row');
    rows.forEach((row) => {
      const rowId = row.getAttribute('data-row-id');
      if (!rowId || !this.table) return;

      // Find row data
      const rowData = this.table.options.data.find((r: GridRowData) => r.id === rowId);
      if (!rowData) return;

      // Click handler
      row.addEventListener('click', () => {
        if (this.onNodeSelect) {
          this.onNodeSelect(rowData);
        }

        // Update selected state
        this.viewManager.selectNode(rowData.id);

        // Visual feedback
        rows.forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });
  }

  /**
   * Select a specific row by node ID
   */
  selectNode(nodeId: string): void {
    const rows = this.container.querySelectorAll('.explain-table-row');

    rows.forEach((row) => {
      const rowId = row.getAttribute('data-row-id');
      if (rowId === nodeId) {
        row.classList.add('selected');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        row.classList.remove('selected');
      }
    });
  }

  /**
   * Destroy the table instance
   */
  destroy(): void {
    this.table = null;
    this.container.innerHTML = '';
  }
}
