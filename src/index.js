import { runExplain } from './plugin/plugin-entry.js';

if (typeof global !== 'undefined') {
  global.runExplain = runExplain;
}

export default runExplain;
