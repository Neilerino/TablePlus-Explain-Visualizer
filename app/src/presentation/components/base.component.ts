/**
 * Base Component
 * Abstract base class for all UI components
 * Provides common lifecycle methods and contracts
 */

export abstract class Component {
  protected container: HTMLElement;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error('Component container cannot be null or undefined');
    }
    this.container = container;
  }

  /**
   * Render the component's UI
   * Must be implemented by derived classes
   */
  abstract render(): void;

  /**
   * Destroy the component and clean up resources
   * Override in derived classes if additional cleanup is needed
   */
  destroy(): void {
    this.container.innerHTML = '';
  }

  /**
   * Get the container element
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Check if component is visible
   */
  isVisible(): boolean {
    return this.container.style.display !== 'none';
  }

  /**
   * Show the component
   */
  show(): void {
    this.container.style.display = '';
  }

  /**
   * Hide the component
   */
  hide(): void {
    this.container.style.display = 'none';
  }
}
