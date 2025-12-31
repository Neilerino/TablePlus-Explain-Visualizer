/**
 * View State Manager
 * Application service for managing visualization state
 * Publishes events on state changes for observers to react
 */

import { VisualizationStateEntity, VisualizationState, ViewType } from '../../domain/entities/visualization-state.entity';
import { IEventBus } from '../interfaces/i-event-bus';
import { IStateStore } from '../../domain/interfaces/i-state-store';
import { StateChangedEvent, NodeSelectedEvent, ViewChangedEvent, CriticalPathToggledEvent } from '../events/application-events';

export class ViewStateManager {
  private state: VisualizationStateEntity;

  constructor(
    private eventBus: IEventBus,
    private persistenceAdapter: IStateStore<VisualizationState>
  ) {
    // Load persisted state or create fresh
    const persisted = this.persistenceAdapter.load();
    this.state = VisualizationStateEntity.create(persisted || {});
  }

  /**
   * Select a node
   */
  selectNode(nodeId: string | null): void {
    this.state = this.state.selectNode(nodeId);
    this.persistState();
    this.eventBus.publish(new NodeSelectedEvent(nodeId || ''));
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  /**
   * Change view type (graph or grid)
   */
  setView(viewType: ViewType): void {
    this.state = this.state.setView(viewType);
    this.persistState();
    this.eventBus.publish(new ViewChangedEvent(viewType));
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  /**
   * Toggle critical path display
   */
  toggleCriticalPath(): void {
    this.state = this.state.toggleCriticalPath();
    this.persistState();
    this.eventBus.publish(new CriticalPathToggledEvent(this.state.isCriticalPathEnabled));
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  /**
   * Set sidebar width
   */
  setSidebarWidth(width: number): void {
    this.state = this.state.setSidebarWidth(width);
    this.persistState();
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  /**
   * Toggle right sidebar
   */
  toggleRightSidebar(): void {
    this.state = this.state.toggleRightSidebar();
    this.persistState();
    this.eventBus.publish(new StateChangedEvent(this.state.getState()));
  }

  /**
   * Get current state (read-only)
   */
  getState(): VisualizationState {
    return this.state.getState();
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
    return this.state.isCriticalPathEnabled;
  }

  /**
   * Manually trigger state save (public API for external components)
   */
  saveState(): void {
    this.persistState();
  }

  /**
   * Persist current state
   */
  private persistState(): void {
    this.persistenceAdapter.save(this.state.getState());
  }
}
