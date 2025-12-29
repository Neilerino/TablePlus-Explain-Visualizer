/**
 * Application state management
 * Manages UI state with persistence
 */

import { loadState, saveState } from './storage.js';

/**
 * Application state class
 */
export class AppState {
  constructor() {
    // Default state
    this.state = {
      leftSidebarWidth: 350,
      rightSidebarWidth: 400,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: true,
      selectedNode: null
    };

    // Restore persisted state
    this.restore();
  }

  /**
   * Get current state
   * @returns {Object} Current state object
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Persist state to storage
   */
  persist() {
    saveState(this.state);
  }

  /**
   * Restore state from storage
   */
  restore() {
    const saved = loadState();
    if (saved) {
      this.state = { ...this.state, ...saved };
    }
  }
}

/**
 * Export singleton instance
 */
export const appState = new AppState();
