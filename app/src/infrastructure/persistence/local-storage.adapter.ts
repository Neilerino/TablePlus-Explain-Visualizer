/**
 * Local Storage Adapter
 * Implements state persistence using browser localStorage
 */

import { IStateStore } from '../../domain/interfaces/i-state-store';

export class LocalStorageAdapter<T = any> implements IStateStore<T> {
  private readonly storageKey: string;

  constructor(storageKey: string = 'pgexplain-state') {
    this.storageKey = storageKey;
  }

  save(state: T): void {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  load(): T | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear state from localStorage:', error);
    }
  }
}
