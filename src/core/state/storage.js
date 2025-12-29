const STORAGE_KEY = 'pgexplain-state';

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('State persistence not available:', e.message);
  }
  return null;
}

export function saveState(state) {
  try {
    const { selectedNode, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    return true;
  } catch (e) {
    console.warn('Could not persist state:', e.message);
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
