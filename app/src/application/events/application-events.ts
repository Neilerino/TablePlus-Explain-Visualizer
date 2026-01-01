/**
 * Application Events
 * Domain events published by use cases and application services
 */

import { BaseEvent } from '../../domain/events/domain-events';
import { VisualizationState, ViewType } from '../../domain/entities/visualization-state.entity';

/**
 * Fired when a node is selected
 */
export class NodeSelectedEvent extends BaseEvent {
  constructor(public readonly nodeId: string) {
    super('NodeSelected');
  }
}

/**
 * Fired when the visualization view type changes
 */
export class ViewChangedEvent extends BaseEvent {
  constructor(public readonly viewType: ViewType) {
    super('ViewChanged');
  }
}

/**
 * Fired when critical path display is toggled
 */
export class CriticalPathToggledEvent extends BaseEvent {
  constructor(public readonly enabled: boolean) {
    super('CriticalPathToggled');
  }
}

/**
 * Fired when the application state changes
 */
export class StateChangedEvent extends BaseEvent {
  constructor(public readonly state: VisualizationState) {
    super('StateChanged');
  }
}

/**
 * Fired when the sidebar is toggled
 */
export class SidebarToggledEvent extends BaseEvent {
  constructor(
    public readonly side: 'left' | 'right',
    public readonly collapsed: boolean
  ) {
    super('SidebarToggled');
  }
}
