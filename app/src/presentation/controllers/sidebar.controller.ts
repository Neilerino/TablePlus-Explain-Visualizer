/**
 * Sidebar Controller
 * Handles sidebar business logic and event coordination
 * Uses SidebarComponent for all DOM manipulation
 */

import { IEventBus } from '../../application/interfaces/i-event-bus';
import { NodeSelectedEvent } from '../../application/events/application-events';
import { SidebarComponent } from '../components/sidebar.component';

export class SidebarController {
  private isResizing = false;

  constructor(
    private component: SidebarComponent,
    private eventBus: IEventBus,
    private saveStateCallback: () => void
  ) {
    this.initializeEventHandlers();
    this.subscribeToEvents();
  }

  /**
   * Toggle sidebar visibility
   */
  toggle(): void {
    this.component.toggle();
    this.saveStateCallback();
  }

  /**
   * Expand sidebar if collapsed
   */
  expand(): void {
    if (this.component.isCollapsed) {
      this.component.expand();
      this.saveStateCallback();
    }
  }

  /**
   * Collapse sidebar if expanded
   */
  collapse(): void {
    if (!this.component.isCollapsed) {
      this.component.collapse();
      this.saveStateCallback();
    }
  }

  /**
   * Subscribe to events
   * Only right sidebar opens on node selection
   */
  private subscribeToEvents(): void {
    if (this.component.getSide() === 'right') {
      this.eventBus.subscribe(NodeSelectedEvent, (event) => {
        if (event.nodeId) {
          this.expand();
        }
      });
    }
  }

  /**
   * Initialize event handlers for user interactions
   */
  private initializeEventHandlers(): void {
    // Collapse button click handler
    const collapseBtn = this.component.getCollapseButton();
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => this.toggle());
    }

    // Resize handle
    const resizeHandle = this.component.getResizeHandle();
    if (resizeHandle) {
      this.initializeResizeHandler(resizeHandle);
    }

    // Initialize button state to match current collapse state
    this.component.initializeButtonState();
  }

  /**
   * Initialize resize handler for this sidebar
   */
  private initializeResizeHandler(handle: HTMLElement): void {
    const side = this.component.getSide();
    const minWidth = side === 'left' ? 200 : 200;
    const maxWidth = side === 'left' ? 600 : 800;

    const startResize = () => {
      this.isResizing = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const stopResize = () => {
      if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.saveStateCallback();
      }
    };

    const resize = (e: MouseEvent) => {
      if (!this.isResizing) return;

      let newWidth: number;
      if (side === 'left') {
        newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      } else {
        newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX));
      }

      this.component.setWidth(newWidth);
    };

    handle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }
}

