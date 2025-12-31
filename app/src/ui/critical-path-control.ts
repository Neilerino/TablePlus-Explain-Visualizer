/**
 * Critical Path Control Component
 * Renders toggle checkbox for critical path highlighting in stats panel
 */

import { ToggleCriticalPathUseCase } from '../application/use-cases/toggle-critical-path.use-case';
import { ViewStateManager } from '../application/services/view-state-manager';
import { IEventBus } from '../application/interfaces/i-event-bus';
import { CriticalPathToggledEvent } from '../application/events/application-events';

/**
 * Render critical path toggle control
 * @param container - DOM element to render into
 * @param toggleCriticalPathUseCase - Use case for toggling critical path
 * @param stateManager - State manager for reading current state
 * @param eventBus - Event bus for subscribing to state changes
 */
export function renderCriticalPathControl(
  container: HTMLElement,
  toggleCriticalPathUseCase: ToggleCriticalPathUseCase,
  stateManager: ViewStateManager,
  eventBus: IEventBus,
  criticalPathLength: number
): void {
  const state = stateManager.getState();

  const controlHtml = `
    <div class="critical-path-control">
      <label class="critical-path-label">
        <input
          type="checkbox"
          id="criticalPathToggle"
          class="critical-path-checkbox"
          ${state.criticalPathEnabled ? 'checked' : ''}
        >
        <span class="critical-path-text">Highlight Critical Path</span>
        ${criticalPathLength > 0 ? `<span class="critical-path-info">(${criticalPathLength} nodes)</span>` : ''}
      </label>
    </div>
  `;

  // Insert after stats
  const existingControl = container.querySelector('.critical-path-control');
  if (existingControl) {
    existingControl.remove();
  }

  container.insertAdjacentHTML('beforeend', controlHtml);

  // Attach event listener
  const checkbox = document.getElementById('criticalPathToggle') as HTMLInputElement;
  if (checkbox) {
    checkbox.addEventListener('change', () => {
      toggleCriticalPathUseCase.execute();
    });
  }

  // Subscribe to state changes
  eventBus.subscribe(CriticalPathToggledEvent, (event) => {
    const checkbox = document.getElementById('criticalPathToggle') as HTMLInputElement;
    if (checkbox && checkbox.checked !== event.enabled) {
      checkbox.checked = event.enabled;
    }
  });
}
