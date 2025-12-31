/**
 * View Toggle Component
 * Renders tab-style toggle between graph and grid views
 */

import { ViewManager, ViewType } from '../services/view-manager';

/**
 * Render view toggle tabs
 * @param container - DOM element to render into
 * @param viewManager - View manager instance
 */
export function renderViewToggle(container: HTMLElement, viewManager: ViewManager): void {
  const state = viewManager.getState();

  const html = `
    <div class="view-tabs">
      <button class="view-tab ${state.currentView === 'graph' ? 'active' : ''}" data-view="graph">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 14l4-4 3 3 7-7"/>
          <circle cx="5" cy="10" r="1.5"/>
          <circle cx="8" cy="7" r="1.5"/>
          <circle cx="15" cy="3" r="1.5"/>
        </svg>
        <span>Graph</span>
      </button>
      <button class="view-tab ${state.currentView === 'grid' ? 'active' : ''}" data-view="grid">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6"/>
          <rect x="9" y="1" width="6" height="6"/>
          <rect x="1" y="9" width="6" height="6"/>
          <rect x="9" y="9" width="6" height="6"/>
        </svg>
        <span>Grid</span>
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  const tabs = container.querySelectorAll('.view-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const viewType = (e.currentTarget as HTMLElement).getAttribute('data-view') as ViewType;
      viewManager.switchView(viewType);
    });
  });

  // Subscribe to view changes to update active state
  viewManager.subscribe((newState) => {
    tabs.forEach(tab => {
      const viewType = tab.getAttribute('data-view');
      if (viewType === newState.currentView) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  });
}
