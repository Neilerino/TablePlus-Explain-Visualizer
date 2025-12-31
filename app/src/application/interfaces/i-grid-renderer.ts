/**
 * Grid Renderer Interface
 * Abstraction for rendering query execution plan in grid/table format
 */

import { GridConfig } from '../../../../types/grid';

export interface IGridRenderer {
  /**
   * Render the grid visualization
   */
  render(config: GridConfig, onNodeSelect: (rowData: any) => void): void;

  /**
   * Select and highlight a specific row by node ID
   */
  selectNode(nodeId: string): void;

  /**
   * Clean up and destroy the renderer
   */
  destroy(): void;
}
