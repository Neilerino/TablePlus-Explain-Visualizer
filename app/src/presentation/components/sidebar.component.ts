/**
 * Sidebar Component
 * Manages sidebar DOM elements and visual state
 * Pure UI component - no business logic
 */

import { Component } from './base.component';

export type SidebarSide = 'left' | 'right';

export class SidebarComponent extends Component {
  private side: SidebarSide;
  private collapseBtn: HTMLElement | null;
  private resizeHandle: HTMLElement | null;

  // Icons for collapse button
  private readonly COLLAPSE_ICON = {
    left: { collapsed: '▶', expanded: '◀' },
    right: { collapsed: '◀', expanded: '▶' }
  };

  constructor(container: HTMLElement, side: SidebarSide) {
    super(container);
    this.side = side;

    // Find child elements
    this.collapseBtn = document.getElementById(`${side}SidebarCollapseBtn`);
    this.resizeHandle = document.getElementById(`${side}ResizeHandle`);

    if (!this.collapseBtn) {
      console.warn(`Collapse button not found for ${side} sidebar`);
    }
    if (!this.resizeHandle) {
      console.warn(`Resize handle not found for ${side} sidebar`);
    }
  }

  /**
   * Render method (required by base class)
   * Sidebar structure is already in HTML, so this is a no-op
   */
  render(): void {
    // Sidebar structure is already in the HTML
    // This component manages existing DOM rather than creating it
  }

  /**
   * Check if sidebar is collapsed
   */
  get isCollapsed(): boolean {
    return this.container.classList.contains('collapsed');
  }

  /**
   * Get current width in pixels
   */
  get width(): number {
    return this.container.offsetWidth;
  }

  /**
   * Set sidebar width
   */
  setWidth(width: number): void {
    this.container.style.width = `${width}px`;
  }

  /**
   * Collapse the sidebar
   */
  collapse(): void {
    this.container.classList.add('collapsed');
    this.updateCollapseButtonIcon(true);
  }

  /**
   * Expand the sidebar
   */
  expand(): void {
    this.container.classList.remove('collapsed');
    this.updateCollapseButtonIcon(false);
  }

  /**
   * Toggle collapse state
   */
  toggle(): void {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Get the collapse button element
   */
  getCollapseButton(): HTMLElement | null {
    return this.collapseBtn;
  }

  /**
   * Get the resize handle element
   */
  getResizeHandle(): HTMLElement | null {
    return this.resizeHandle;
  }

  /**
   * Get the sidebar side
   */
  getSide(): SidebarSide {
    return this.side;
  }

  /**
   * Update collapse button icon based on state
   */
  private updateCollapseButtonIcon(isCollapsed: boolean): void {
    if (!this.collapseBtn) return;

    const icons = this.COLLAPSE_ICON[this.side];
    this.collapseBtn.textContent = isCollapsed ? icons.collapsed : icons.expanded;
  }

  /**
   * Initialize collapse button icon to match current state
   */
  initializeButtonState(): void {
    this.updateCollapseButtonIcon(this.isCollapsed);
  }
}
