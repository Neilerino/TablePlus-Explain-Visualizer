/**
 * Grid Renderer - TanStack Table integration for plan visualization
 * Custom dark-themed table with hierarchical display
 * Implements IGridRenderer interface
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

import { GridRowData, GridConfig } from '../../../../types/grid';
import { ViewStateManager } from '../../application/services/view-state-manager';
import { IGridRenderer } from '../../application/interfaces/i-grid-renderer';

export class GridRenderer implements IGridRenderer {
  private container: HTMLElement;
  private viewManager: ViewStateManager;
  private table: Table<GridRowData> | null = null;
  private onNodeSelect: ((rowData: GridRowData) => void) | null = null;
  private gridConfig: GridConfig | null = null;
  private columns: ColumnDef<GridRowData>[] = [];
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

  constructor(container: HTMLElement, viewManager: ViewStateManager) {
    this.container = container;
    this.viewManager = viewManager;
  }

  /**
   * Initialize and render the grid
   */
  render(gridConfig: GridConfig, onNodeSelect: (rowData: GridRowData) => void): void {
    console.log('GridRenderer.render called', { rowDataLength: gridConfig.rowData.length });
    this.onNodeSelect = onNodeSelect;
    this.gridConfig = gridConfig;

    // Define columns
    this.columns = [
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
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          return info.getValue();
        },
      },
      {
        accessorKey: 'alias',
        header: 'Alias',
        size: 80,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          return info.getValue();
        },
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        size: 150,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const totalCost = info.getValue() as number;
          const selfCost = row.selfCost;

          // Show self value for parent nodes (where self != total)
          const hasChildren = row.subRows && row.subRows.length > 0;
          if (hasChildren && Math.abs(totalCost - selfCost) > 0.01) {
            return `${totalCost.toFixed(2)} <span style="color: var(--text-secondary); font-size: 11px;">(self: ${selfCost.toFixed(2)})</span>`;
          }
          return totalCost.toFixed(2);
        },
      },
      {
        accessorKey: 'costPercent',
        header: 'Cost %',
        size: 150,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const totalPercent = info.getValue() as number;
          const selfPercent = row.selfCostPercent;

          // Show self value for parent nodes (where self != total)
          const hasChildren = row.subRows && row.subRows.length > 0;
          if (hasChildren && Math.abs(totalPercent - selfPercent) > 0.1) {
            return `${totalPercent.toFixed(1)}% <span style="color: var(--text-secondary); font-size: 11px;">(self: ${selfPercent.toFixed(1)}%)</span>`;
          }
          return `${totalPercent.toFixed(1)}%`;
        },
      },
      {
        accessorKey: 'time',
        header: 'Time (ms)',
        size: 170,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const totalTime = info.getValue() as number;
          const selfTime = row.selfTime;

          // Show self value for parent nodes (where self != total)
          const hasChildren = row.subRows && row.subRows.length > 0;
          if (hasChildren && Math.abs(totalTime - selfTime) > 0.001) {
            return `${totalTime.toFixed(3)} <span style="color: var(--text-secondary); font-size: 11px;">(self: ${selfTime.toFixed(3)})</span>`;
          }
          return totalTime.toFixed(3);
        },
      },
      {
        accessorKey: 'timePercent',
        header: 'Time %',
        size: 150,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const totalPercent = info.getValue() as number;
          const selfPercent = row.selfTimePercent;

          // Show self value for parent nodes (where self != total)
          const hasChildren = row.subRows && row.subRows.length > 0;
          if (hasChildren && Math.abs(totalPercent - selfPercent) > 0.1) {
            return `${totalPercent.toFixed(1)}% <span style="color: var(--text-secondary); font-size: 11px;">(self: ${selfPercent.toFixed(1)}%)</span>`;
          }
          return `${totalPercent.toFixed(1)}%`;
        },
      },
      {
        accessorKey: 'planRows',
        header: 'Rows (Plan)',
        size: 120,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const value = info.getValue() as number;
          return value.toLocaleString();
        },
      },
      {
        accessorKey: 'actualRows',
        header: 'Rows (Actual)',
        size: 120,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          const value = info.getValue() as number;
          return value.toLocaleString();
        },
      },
      {
        accessorKey: 'loops',
        header: 'Loops',
        size: 80,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          return info.getValue();
        },
      },
      {
        accessorKey: 'keyInfo',
        header: 'Key Info',
        size: 200,
        cell: (info) => {
          const row = info.row.original;

          // CTE section headers show nothing
          if (row.isCTESection) return '';

          return info.getValue();
        },
      },
    ];

    // Create the table instance
    this.createTableInstance();

    // Render the table
    this.renderTable();
  }

  /**
   * Create or recreate the table instance with current state
   */
  private createTableInstance(): void {
    if (!this.gridConfig) return;

    const tableOptions = {
      data: this.gridConfig.rowData,
      columns: this.columns,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getSubRows: (row: GridRowData) => row.subRows, // Simple: just return the subRows property
      getRowId: (row: GridRowData) => row.id, // Tell TanStack how to identify rows
      state: this.tableState,
      onStateChange: (updater: any) => {
        this.tableState = typeof updater === 'function' ? updater(this.tableState) : updater;
      },
      renderFallbackValue: null,
    } as any;

    this.table = createTable(tableOptions) as Table<GridRowData>;
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

      // Determine row CSS classes
      const rowClasses = ['explain-table-row'];
      if (rowData.depth > 0) rowClasses.push('child-row');
      else rowClasses.push('root-row');

      if (rowData.isCTESection) rowClasses.push('cte-section-header');
      if (rowData.isCTENode) rowClasses.push('cte-node');
      if (rowData.nodeType === 'CTE Scan') rowClasses.push('cte-scan-node');

      return `
        <tr
          data-row-id="${rowData.id}"
          data-cte-name="${rowData.cteName || ''}"
          data-is-cte-scan="${rowData.nodeType === 'CTE Scan' ? 'true' : 'false'}"
          data-scan-cte-name="${rowData.nodeType === 'CTE Scan' ? rowData._node?.details?.cteName || '' : ''}"
          class="${rowClasses.join(' ')}"
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

    // Add color classes for metric columns based on SELF values
    if (columnId === 'cost') {
      const cost = rowData.selfCost; // Use self cost for color coding
      if (cost > 1000) classes.push('cell-red');
      else if (cost > 100) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    if (columnId === 'time') {
      const time = rowData.selfTime; // Use self time for color coding
      if (time > 1000) classes.push('cell-red');
      else if (time > 100) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    if (columnId === 'costPercent' || columnId === 'timePercent') {
      // Use self percentages for color coding
      const percent = columnId === 'costPercent' ? rowData.selfCostPercent : rowData.selfTimePercent;
      if (percent > 50) classes.push('cell-red');
      else if (percent > 10) classes.push('cell-orange');
      else classes.push('cell-green');
    }

    return classes.join(' ');
  }

  /**
   * Find row data by ID, searching recursively through the hierarchy
   */
  private findRowData(rowId: string, rows: GridRowData[] = this.gridConfig?.rowData || []): GridRowData | null {
    for (const row of rows) {
      if (row.id === rowId) {
        return row;
      }
      if (row.subRows) {
        const found = this.findRowData(rowId, row.subRows);
        if (found) return found;
      }
    }
    return null;
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

          // Recreate table instance with updated state, then re-render
          this.createTableInstance();
          this.renderTable();
        }
      });
    });

    // Attach row click listeners
    const rows = this.container.querySelectorAll('.explain-table-row');
    rows.forEach((row) => {
      const rowId = row.getAttribute('data-row-id');
      if (!rowId || !this.table) return;

      // Find row data recursively
      const rowData = this.findRowData(rowId);
      if (!rowData) {
        console.warn('Could not find row data for:', rowId);
        return;
      }

      // Single-click for selection (visual feedback only)
      row.addEventListener('click', (e) => {
        // Don't trigger if clicking the expand button
        if ((e.target as HTMLElement).classList.contains('expand-btn')) {
          return;
        }

        // Update selected state
        this.viewManager.selectNode(rowData.id);

        // Visual feedback - clear previous selections
        rows.forEach(r => {
          r.classList.remove('selected');
          r.classList.remove('cte-highlighted');
        });
        row.classList.add('selected');

        // CTE highlighting: if this is a CTE Scan node, highlight the corresponding CTE section
        if (rowData.nodeType === 'CTE Scan' && rowData._node?.details?.cteName) {
          const targetCTEName = rowData._node.details.cteName;
          console.log('🔗 CTE Scan clicked:', targetCTEName);

          // Highlight all rows that belong to this CTE
          rows.forEach(r => {
            const cteName = r.getAttribute('data-cte-name');
            if (cteName === targetCTEName) {
              r.classList.add('cte-highlighted');
            }
          });
        }

        // CTE highlighting: if this is a CTE node, highlight all CTE Scan nodes that reference it
        if (rowData.isCTENode && rowData.cteName) {
          const cteName = rowData.cteName;
          console.log('🌲 CTE node clicked:', cteName);

          // Highlight all CTE Scan nodes that reference this CTE
          rows.forEach(r => {
            const scanCteName = r.getAttribute('data-scan-cte-name');
            if (scanCteName === cteName) {
              r.classList.add('cte-highlighted');
            }
          });
        }
      });

      // Double-click to open sidebar with details
      row.addEventListener('dblclick', (e) => {
        // Don't trigger if clicking the expand button
        if ((e.target as HTMLElement).classList.contains('expand-btn')) {
          return;
        }

        if (this.onNodeSelect) {
          this.onNodeSelect(rowData);
        }
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
