/**
 * Toggle Critical Path Use Case
 * Handles enabling/disabling critical path visualization
 */

import { ViewStateManager } from '../services/view-state-manager';

export class ToggleCriticalPathUseCase {
  constructor(private stateManager: ViewStateManager) {}

  /**
   * Execute the use case to toggle critical path display
   */
  execute(): void {
    this.stateManager.toggleCriticalPath();
  }
}
