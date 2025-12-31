/**
 * Toggle View Use Case
 * Handles switching between graph and grid views
 */

import { ViewType } from '../../domain/entities/visualization-state.entity';
import { ViewStateManager } from '../services/view-state-manager';

export class ToggleViewUseCase {
  constructor(private stateManager: ViewStateManager) {}

  /**
   * Execute the use case to change the view type
   * @param viewType - The view type to switch to ('graph' or 'grid')
   */
  execute(viewType: ViewType): void {
    this.stateManager.setView(viewType);
  }
}
