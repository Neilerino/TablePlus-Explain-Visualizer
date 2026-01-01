/**
 * Domain Events Base
 * Base class for all events in the system
 */

/**
 * Base event interface that all events must implement
 */
export interface IEvent {
  readonly timestamp: Date;
  readonly eventType: string;
}

/**
 * Base event class that provides common functionality
 */
export abstract class BaseEvent implements IEvent {
  readonly timestamp: Date;
  readonly eventType: string;

  constructor(eventType: string) {
    this.timestamp = new Date();
    this.eventType = eventType;
  }
}
