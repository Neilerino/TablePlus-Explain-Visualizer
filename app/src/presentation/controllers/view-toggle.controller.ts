/**
 * View Toggle Controller
 * Handles view toggle interactions and state updates
 */

import { ViewToggleComponent } from '../components/view-toggle.component';
import { ToggleViewUseCase } from '../../application/use-cases/toggle-view.use-case';
import { ViewStateManager } from '../../application/services/view-state-manager';
import { IEventBus } from '../../application/interfaces/i-event-bus';
import { ViewChangedEvent } from '../../application/events/application-events';
import { ViewType } from '../../domain/entities/visualization-state.entity';

export class ViewToggleController {
  constructor(
    private component: ViewToggleComponent,
    private toggleViewUseCase: ToggleViewUseCase,
    private stateManager: ViewStateManager,
    private eventBus: IEventBus
  ) {
    this.initializeEventHandlers();
    this.subscribeToEvents();
    this.syncWithState();
  }

  /**
   * Initialize click handlers on toggle buttons
   */
  private initializeEventHandlers(): void {
    const buttons = this.component.getButtons();
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const viewType = (e.currentTarget as HTMLElement).getAttribute('data-view') as ViewType;
        this.toggleViewUseCase.execute(viewType);
      });
    });
  }

  /**
   * Subscribe to view change events
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribe(ViewChangedEvent, (event) => {
      this.component.setActiveView(event.viewType);
    });
  }

  /**
   * Sync component with current state
   */
  private syncWithState(): void {
    const state = this.stateManager.getState();
    this.component.setActiveView(state.currentView);
  }
}
