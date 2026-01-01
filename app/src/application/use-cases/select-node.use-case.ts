/**
 * Select Node Use Case
 * Handles the business logic for selecting a node in the visualization
 */

import { ViewStateManager } from '../services/view-state-manager';

export class SelectNodeUseCase {
  constructor(private stateManager: ViewStateManager) {}

  /**
   * Execute the use case to select a node
   * @param nodeId - ID of the node to select (null to deselect)
   */
  execute(nodeId: string | null): void {
    this.stateManager.selectNode(nodeId);
  }
}
