import { runExplain } from './plugin/plugin-entry.js';

// Export to global scope for TablePlus
if (typeof global !== 'undefined') {
  global.runExplain = runExplain;
}

export default runExplain;
