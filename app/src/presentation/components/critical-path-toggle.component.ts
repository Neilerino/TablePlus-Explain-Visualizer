/**
 * Critical Path Toggle Component
 * Renders checkbox control for critical path highlighting
 * UI only - no business logic
 */

import { Component } from './base.component';

export class CriticalPathToggleComponent extends Component {
  private checkbox: HTMLInputElement | null = null;
  private infoSpan: HTMLElement | null = null;
  private criticalPathCount: number = 0;

  constructor(container: HTMLElement, criticalPathCount: number = 0) {
    super(container);
    this.criticalPathCount = criticalPathCount;
    this.render();
  }

  /**
   * Render the critical path toggle control
   */
  render(): void {
    const controlHtml = `
      <div class="critical-path-control">
        <label class="critical-path-label">
          <input
            type="checkbox"
            id="criticalPathToggle"
            class="critical-path-checkbox"
          >
          <span class="critical-path-text">Highlight Critical Path</span>
          ${this.criticalPathCount > 0 ? `<span class="critical-path-info">(${this.criticalPathCount} nodes)</span>` : ''}
        </label>
      </div>
    `;

    // Remove existing control if present
    const existingControl = this.container.querySelector('.critical-path-control');
    if (existingControl) {
      existingControl.remove();
    }

    this.container.insertAdjacentHTML('beforeend', controlHtml);

    // Cache element references
    this.checkbox = document.getElementById('criticalPathToggle') as HTMLInputElement;
    this.infoSpan = this.container.querySelector('.critical-path-info');
  }

  /**
   * Set the enabled state of the checkbox
   * @param enabled - Whether the checkbox should be checked
   */
  setEnabled(enabled: boolean): void {
    if (this.checkbox && this.checkbox.checked !== enabled) {
      this.checkbox.checked = enabled;
    }
  }

  /**
   * Update the critical path node count
   * @param count - Number of nodes in the critical path
   */
  setCriticalPathCount(count: number): void {
    this.criticalPathCount = count;

    // Update or create the info span
    if (count > 0) {
      if (this.infoSpan) {
        this.infoSpan.textContent = `(${count} nodes)`;
      } else {
        const label = this.container.querySelector('.critical-path-label');
        if (label) {
          label.insertAdjacentHTML('beforeend', `<span class="critical-path-info">(${count} nodes)</span>`);
          this.infoSpan = this.container.querySelector('.critical-path-info');
        }
      }
    } else if (this.infoSpan) {
      this.infoSpan.remove();
      this.infoSpan = null;
    }
  }

  /**
   * Get the checkbox element
   * @returns The checkbox input element
   */
  getCheckbox(): HTMLInputElement | null {
    return this.checkbox;
  }

  /**
   * Check if the checkbox is currently enabled
   * @returns True if checkbox is checked
   */
  isEnabled(): boolean {
    return this.checkbox?.checked ?? false;
  }
}
