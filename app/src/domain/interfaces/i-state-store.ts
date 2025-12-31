/**
 * State Store Interface
 * Abstraction for persisting application state
 */

export interface IStateStore<T = any> {
  /**
   * Save state to persistent storage
   */
  save(state: T): void;

  /**
   * Load state from persistent storage
   * @returns Loaded state or null if not found
   */
  load(): T | null;

  /**
   * Clear all persisted state
   */
  clear(): void;
}
