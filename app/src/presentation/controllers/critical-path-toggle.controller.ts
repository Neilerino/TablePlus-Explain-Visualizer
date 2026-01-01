/**
 * Critical Path Toggle Controller
 * Handles critical path toggle interactions and state updates
 */

import { CriticalPathToggleComponent } from '../components/critical-path-toggle.component';
import { ToggleCriticalPathUseCase } from '../../application/use-cases/toggle-critical-path.use-case';
import { ViewStateManager } from '../../application/services/view-state-manager';
import { IEventBus } from '../../application/interfaces/i-event-bus';
import { CriticalPathToggledEvent } from '../../application/events/application-events';

export class CriticalPathToggleController {
  constructor(
    private component: CriticalPathToggleComponent,
    private toggleCriticalPathUseCase: ToggleCriticalPathUseCase,
    private stateManager: ViewStateManager,
    private eventBus: IEventBus
  ) {
    this.initializeEventHandlers();
    this.subscribeToEvents();
    this.syncWithState();
  }

  /**
   * Initialize change handler on checkbox
   */
  private initializeEventHandlers(): void {
    const checkbox = this.component.getCheckbox();
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        this.toggleCriticalPathUseCase.execute();
      });
    }
  }

  /**
   * Subscribe to critical path toggle events
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribe(CriticalPathToggledEvent, (event) => {
      this.component.setEnabled(event.enabled);
    });
  }

  /**
   * Sync component with current state
   */
  private syncWithState(): void {
    const state = this.stateManager.getState();
    this.component.setEnabled(state.criticalPathEnabled);
  }

  /**
   * Update the critical path node count
   * @param count - Number of nodes in the critical path
   */
  updateCriticalPathCount(count: number): void {
    this.component.setCriticalPathCount(count);
  }
}
