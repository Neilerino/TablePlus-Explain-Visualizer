/**
 * Sidebar Controller
 * Manages sidebar visibility and interactions
 */

import { IEventBus } from '../../application/interfaces/i-event-bus';
import { NodeSelectedEvent } from '../../application/events/application-events';

export class SidebarController {
  constructor(
    private eventBus: IEventBus,
    private saveStateCallback: () => void
  ) {
    this.subscribeToEvents();
    this.initializeSidebarButtons();
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(side: 'left' | 'right'): void {
    const sidebar = document.getElementById(side === 'left' ? 'leftSidebar' : 'rightSidebar');
    const btn = document.getElementById(
      side === 'left' ? 'leftSidebarCollapseBtn' : 'rightSidebarCollapseBtn'
    );

    if (!sidebar || !btn) return;

    const isCollapsed = sidebar.classList.contains('collapsed');

    if (isCollapsed) {
      sidebar.classList.remove('collapsed');
      btn.textContent = side === 'left' ? '◀' : '✕';
    } else {
      sidebar.classList.add('collapsed');
      btn.textContent = side === 'left' ? '▶' : '✕';
    }

    this.saveStateCallback();
  }

  /**
   * Open right sidebar (e.g., when node is selected)
   */
  openRightSidebar(): void {
    const rightSidebar = document.getElementById('rightSidebar');
    if (rightSidebar && rightSidebar.classList.contains('collapsed')) {
      this.toggleSidebar('right');
    }
  }

  /**
   * Subscribe to events
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribe(NodeSelectedEvent, (event) => {
      if (event.nodeId) {
        this.openRightSidebar();
      }
    });
  }

  /**
   * Initialize sidebar collapse buttons
   */
  private initializeSidebarButtons(): void {
    const leftBtn = document.getElementById('leftSidebarCollapseBtn');
    const rightBtn = document.getElementById('rightSidebarCollapseBtn');

    if (leftBtn) {
      leftBtn.onclick = () => this.toggleSidebar('left');
    }

    if (rightBtn) {
      rightBtn.onclick = () => this.toggleSidebar('right');
    }
  }

  /**
   * Initialize resize handles for sidebars
   */
  initializeResizeHandles(): void {
    const leftHandle = document.getElementById('leftResizeHandle');
    const rightHandle = document.getElementById('rightResizeHandle');
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');

    if (!leftHandle || !rightHandle || !leftSidebar || !rightSidebar) return;

    let isResizing = false;
    let currentHandle: 'left' | 'right' | null = null;

    const startResize = (handle: 'left' | 'right') => {
      isResizing = true;
      currentHandle = handle;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const stopResize = () => {
      if (isResizing) {
        isResizing = false;
        currentHandle = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.saveStateCallback();
      }
    };

    const resize = (e: MouseEvent) => {
      if (!isResizing || !currentHandle) return;

      if (currentHandle === 'left') {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        leftSidebar.style.width = newWidth + 'px';
      } else {
        const newWidth = Math.max(200, Math.min(800, window.innerWidth - e.clientX));
        rightSidebar.style.width = newWidth + 'px';
      }
    };

    leftHandle.addEventListener('mousedown', () => startResize('left'));
    rightHandle.addEventListener('mousedown', () => startResize('right'));
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }
}
