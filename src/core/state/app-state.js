import { loadState, saveState } from './storage.js';

export class AppState {
  constructor() {
    this.state = {
      leftSidebarWidth: 350,
      rightSidebarWidth: 400,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: true,
      selectedNode: null
    };

    this.restore();
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  persist() {
    saveState(this.state);
  }

  restore() {
    const saved = loadState();
    if (saved) {
      this.state = { ...this.state, ...saved };
    }
  }
}

export const appState = new AppState();
