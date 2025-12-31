/**
 * Critical Path Control Component
 * Renders toggle checkbox for critical path highlighting in stats panel
 */

import { ViewManager } from '../services/view-manager';

/**
 * Render critical path toggle control
 * @param container - DOM element to render into
 * @param viewManager - View manager instance
 */
export function renderCriticalPathControl(container: HTMLElement, viewManager: ViewManager): void {
  const state = viewManager.getState();

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
        ${state.criticalPath.length > 0 ? `<span class="critical-path-info">(${state.criticalPath.length} nodes)</span>` : ''}
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
    checkbox.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      viewManager.toggleCriticalPath(enabled);
    });
  }

  // Subscribe to state changes
  viewManager.subscribe((newState) => {
    const checkbox = document.getElementById('criticalPathToggle') as HTMLInputElement;
    if (checkbox && checkbox.checked !== newState.criticalPathEnabled) {
      checkbox.checked = newState.criticalPathEnabled;
    }
  });
}
