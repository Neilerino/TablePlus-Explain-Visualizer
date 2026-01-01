/**
 * View Toggle Component
 * Renders tab-style toggle between graph and grid views
 * UI only - no business logic
 */

import { Component } from './base.component';
import { ViewType } from '../../domain/entities/visualization-state.entity';

export class ViewToggleComponent extends Component {
  private graphButton: HTMLElement | null = null;
  private gridButton: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    super(container);
    this.render();
  }

  /**
   * Render the view toggle tabs
   */
  render(): void {
    const html = `
      <div class="view-tabs">
        <button class="view-tab" data-view="graph">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 14l4-4 3 3 7-7"/>
            <circle cx="5" cy="10" r="1.5"/>
            <circle cx="8" cy="7" r="1.5"/>
            <circle cx="15" cy="3" r="1.5"/>
          </svg>
          <span>Graph</span>
        </button>
        <button class="view-tab" data-view="grid">
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

    this.container.innerHTML = html;

    // Cache button references
    this.graphButton = this.container.querySelector('[data-view="graph"]');
    this.gridButton = this.container.querySelector('[data-view="grid"]');
  }

  /**
   * Set the active view tab
   * @param viewType - The view type to activate ('graph' or 'grid')
   */
  setActiveView(viewType: ViewType): void {
    const tabs = this.container.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
      const tabViewType = tab.getAttribute('data-view');
      if (tabViewType === viewType) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * Get all view toggle buttons
   * @returns Array of button elements
   */
  getButtons(): HTMLElement[] {
    const buttons: HTMLElement[] = [];
    if (this.graphButton) buttons.push(this.graphButton);
    if (this.gridButton) buttons.push(this.gridButton);
    return buttons;
  }

  /**
   * Get the graph button element
   */
  getGraphButton(): HTMLElement | null {
    return this.graphButton;
  }

  /**
   * Get the grid button element
   */
  getGridButton(): HTMLElement | null {
    return this.gridButton;
  }
}
