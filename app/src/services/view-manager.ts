/**
 * View Manager - Manages view state and switching between graph and grid
 * Implements observer pattern for state changes
 */

import { EnrichedNode } from '../../../types/plan-data';

export type ViewType = 'graph' | 'grid';

export interface ViewManagerState {
  currentView: ViewType;
  selectedNodeId: string | null;
  criticalPath: EnrichedNode[];
  criticalPathEnabled: boolean;
}

export type StateChangeListener = (state: ViewManagerState) => void;

export class ViewManager {
  private state: ViewManagerState;
  private listeners: StateChangeListener[] = [];

  constructor() {
    this.state = {
      currentView: 'graph',
      selectedNodeId: null,
      criticalPath: [],
      criticalPathEnabled: false
    };
  }

  /**
   * Get current state
   */
  getState(): ViewManagerState {
    return { ...this.state };
  }

  /**
   * Switch to a different view
   */
  switchView(viewType: ViewType): void {
    if (this.state.currentView !== viewType) {
      this.state.currentView = viewType;
      this.notifyListeners();
    }
  }

  /**
   * Select a node
   */
  selectNode(nodeId: string | null): void {
    if (this.state.selectedNodeId !== nodeId) {
      this.state.selectedNodeId = nodeId;
      this.notifyListeners();
    }
  }

  /**
   * Set critical path data
   */
  setCriticalPath(path: EnrichedNode[]): void {
    this.state.criticalPath = path;
    this.notifyListeners();
  }

  /**
   * Toggle critical path highlighting
   */
  toggleCriticalPath(enabled: boolean): void {
    if (this.state.criticalPathEnabled !== enabled) {
      this.state.criticalPathEnabled = enabled;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }
}
