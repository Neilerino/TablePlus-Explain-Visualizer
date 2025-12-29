/**
 * Storage adapter module
 * Wraps localStorage with graceful fallback
 */

const STORAGE_KEY = 'pgexplain-state';

/**
 * Load state from localStorage
 * @returns {Object|null} Stored state or null if unavailable
 */
export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // localStorage not available or failed - graceful degradation
    console.warn('State persistence not available:', e.message);
  }
  return null;
}

/**
 * Save state to localStorage
 * @param {Object} state - State to persist
 * @returns {boolean} True if save successful
 */
export function saveState(state) {
  try {
    // Don't persist selectedNode (transient state)
    const { selectedNode, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    return true;
  } catch (e) {
    // localStorage not available - that's OK
    console.warn('Could not persist state:', e.message);
    return false;
  }
}

/**
 * Clear saved state
 * @returns {boolean} True if clear successful
 */
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
