/**
 * Bundle D3.js and highlight.js for embedding in HTML
 */

import { readFileSync, writeFileSync } from 'fs';
import { build } from 'esbuild';

console.log('Bundling libraries for HTML embedding...');

// Bundle D3.js
const d3Result = await build({
  entryPoints: ['./src/libs/d3-bundle.js'],
  bundle: true,
  format: 'iife',
  globalName: 'd3',
  outfile: './src/libs/d3.bundled.js',
  minify: true,
  write: false
});

// Wrap to assign to window (extract default export)
const d3Code = d3Result.outputFiles[0].text;
writeFileSync('./src/libs/d3.bundled.js', `(function() { ${d3Code}; if (typeof window !== 'undefined') window.d3 = d3.default || d3; })();`);

// Bundle highlight.js
const hljsResult = await build({
  entryPoints: ['./src/libs/hljs-bundle.js'],
  bundle: true,
  format: 'iife',
  globalName: 'hljs',
  outfile: './src/libs/hljs.bundled.js',
  minify: true,
  write: false
});

// Wrap to assign to window (extract default export)
const hljsCode = hljsResult.outputFiles[0].text;
writeFileSync('./src/libs/hljs.bundled.js', `(function() { ${hljsCode}; if (typeof window !== 'undefined') window.hljs = hljs.default || hljs; })();`);

console.log('✅ Libraries bundled successfully!');
