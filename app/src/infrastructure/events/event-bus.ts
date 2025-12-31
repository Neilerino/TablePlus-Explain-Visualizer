/**
 * Event Bus Implementation
 * Simple in-memory event bus for publish-subscribe pattern
 */

import { IEventBus, EventHandler } from '../../application/interfaces/i-event-bus';
import { IEvent } from '../../domain/events/domain-events';

export class EventBus implements IEventBus {
  private subscriptions: Map<new (...args: any[]) => IEvent, Set<EventHandler>> = new Map();

  publish<T extends IEvent>(event: T): void {
    const eventType = event.constructor as new (...args: any[]) => T;
    const handlers = this.subscriptions.get(eventType);

    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  subscribe<T extends IEvent>(eventType: new (...args: any[]) => T, handler: EventHandler<T>): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    this.subscriptions.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe<T extends IEvent>(eventType: new (...args: any[]) => T, handler: EventHandler<T>): void {
    const handlers = this.subscriptions.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}
