/**
 * Event Bus Interface
 * Abstraction for publish-subscribe event system
 */

import { IEvent } from '../../domain/events/domain-events';

export type EventHandler<T extends IEvent = IEvent> = (event: T) => void;

export interface IEventBus {
  /**
   * Publish an event to all subscribers
   */
  publish<T extends IEvent>(event: T): void;

  /**
   * Subscribe to events of a specific type
   * @returns Unsubscribe function
   */
  subscribe<T extends IEvent>(eventType: new (...args: any[]) => T, handler: EventHandler<T>): () => void;

  /**
   * Unsubscribe from events
   */
  unsubscribe<T extends IEvent>(eventType: new (...args: any[]) => T, handler: EventHandler<T>): void;

  /**
   * Clear all subscriptions
   */
  clear(): void;
}
