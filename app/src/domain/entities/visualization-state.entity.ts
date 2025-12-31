/**
 * Visualization State Entity
 * Represents the current state of the visualization application
 * Immutable entity following domain-driven design principles
 */

export type ViewType = 'graph' | 'grid';

export interface VisualizationState {
  currentView: ViewType;
  selectedNodeId: string | null;
  criticalPathEnabled: boolean;
  leftSidebarWidth: number;
  rightSidebarCollapsed: boolean;
}

export class VisualizationStateEntity {
  private constructor(private readonly state: VisualizationState) {}

  /**
   * Create a new visualization state entity
   */
  static create(initial?: Partial<VisualizationState>): VisualizationStateEntity {
    const defaultState: VisualizationState = {
      currentView: 'graph',
      selectedNodeId: null,
      criticalPathEnabled: false,
      leftSidebarWidth: 350,
      rightSidebarCollapsed: false,
    };

    return new VisualizationStateEntity({
      ...defaultState,
      ...initial,
    });
  }

  /**
   * Select a node (immutable update)
   */
  selectNode(nodeId: string | null): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      selectedNodeId: nodeId,
    });
  }

  /**
   * Toggle view type (immutable update)
   */
  setView(viewType: ViewType): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      currentView: viewType,
    });
  }

  /**
   * Toggle critical path display (immutable update)
   */
  toggleCriticalPath(): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      criticalPathEnabled: !this.state.criticalPathEnabled,
    });
  }

  /**
   * Set sidebar width (immutable update)
   */
  setSidebarWidth(width: number): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      leftSidebarWidth: width,
    });
  }

  /**
   * Toggle sidebar collapsed state (immutable update)
   */
  toggleRightSidebar(): VisualizationStateEntity {
    return new VisualizationStateEntity({
      ...this.state,
      rightSidebarCollapsed: !this.state.rightSidebarCollapsed,
    });
  }

  /**
   * Get current state (returns copy to prevent mutations)
   */
  getState(): VisualizationState {
    return { ...this.state };
  }

  /**
   * Get current view type
   */
  get currentView(): ViewType {
    return this.state.currentView;
  }

  /**
   * Get selected node ID
   */
  get selectedNodeId(): string | null {
    return this.state.selectedNodeId;
  }

  /**
   * Check if critical path is enabled
   */
  get isCriticalPathEnabled(): boolean {
    return this.state.criticalPathEnabled;
  }
}
