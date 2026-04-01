/**
 * build.ts — Produces a single self-contained prerendered HTML file.
 *
 * Pipeline (run before this script):
 *   1. Tailwind CLI   →  src/global/output.css
 *   2. Stencil build  →  dist/components/  (custom elements, static imports)
 *                     →  dist/hydrate/     (SSR renderer)
 *                     →  www/build/        (processed CSS)
 *
 * This script:
 *   1. esbuild bundles dist/components/ into a single JS blob (no lazy loading)
 *   2. Stencil's hydrate module prerenders the HTML (server-side render)
 *   3. Everything is inlined into dist/index.html
 *
 * Result: opening the file shows prerendered HTML instantly. The JS rehydrates
 * invisibly to attach event listeners. Works from file:// — no server needed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

console.log('\n\u{1f528} Building single-file app...\n');

// ── Step 1: Bundle custom-elements JS with esbuild ───────────────
// With auto-define, each component file registers itself via customElements.define()
// when imported. We create a virtual entry that imports them all.
console.log('\u{1f4e6} Bundling JS...');

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ceDir = './dist/components';
if (!existsSync(ceDir)) {
  console.error('\u274c dist/components/ not found. Run stencil build first.');
  process.exit(1);
}

// Find all component JS files (exclude index.js and the stencil runtime chunk)
const componentFiles = readdirSync(ceDir)
  .filter(f => f.endsWith('.js') && !f.startsWith('p-') && f !== 'index.js')
  .map(f => join(ceDir, f));

// Virtual entry that imports every component + the index (runtime)
const virtualEntry = [`import '${ceDir}/index.js';`, ...componentFiles.map(f => `import './${f}';`)].join('\n');

const bundleResult = await esbuild.build({
  stdin: {
    contents: virtualEntry,
    resolveDir: '.',
    loader: 'js',
  },
  bundle: true,
  minify: true,
  format: 'esm',
  write: false,
  target: ['safari16', 'chrome111'],
});

const js = bundleResult.outputFiles[0].text;
console.log(`   ${(js.length / 1024).toFixed(1)} KB  (${componentFiles.length} components)`);

// ── Step 2: Read CSS ─────────────────────────────────────────────
console.log('\u{1f3a8} Reading CSS...');
const cssPath = existsSync('./www/build/cliterface.css') ? './www/build/cliterface.css' : './src/global/output.css';
const css = readFileSync(cssPath, 'utf-8');
console.log(`   ${(css.length / 1024).toFixed(1)} KB`);

// ── Step 3: Prerender HTML with Stencil's hydrate module ────────
console.log('\u{1f9ea} Prerendering...');
const { renderToString } = await import('./dist/hydrate/index.mjs');

const shellHtml = `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cliterface</title>
<style>${css}</style>
</head>
<body>
<app-dashboard></app-dashboard>
</body>
</html>`;

const rendered = await renderToString(shellHtml, {
  prettyHtml: false,
  removeUnusedStyles: false,
  removeScripts: true, // we'll inject our own bundled JS
  removeHtmlComments: true,
});

if (rendered.diagnostics?.length) {
  for (const d of rendered.diagnostics) {
    console.warn(`   [hydrate] ${d.messageText}`);
  }
}

// Strip Stencil SSR hydration markers so the custom-elements runtime
// treats the DOM as fresh and re-renders over it (same content, invisible).
// This preserves the prerendered visual paint while allowing full interactivity.
let html = rendered.html;
html = html.replace(/\s*s-id="[^"]*"/g, '');
html = html.replace(/\s*c-id="[^"]*"/g, '');
html = html.replace(/\s*class="hydrated"/g, '');
html = html.replace(/\s*class=""/g, '');
// Clean up 'hydrated' from class lists that have other classes too
html = html.replace(/\bhydrated\b\s*/g, '');

// Escape </ sequences in JS so they don't break the inline <script> tag.
const safeJs = js.replaceAll('</', '<\\/');

// Inject scripts before </body>.
// 1. A tiny synchronous script clears prerendered custom-element children so the
//    runtime doesn't duplicate content (it appends rather than replaces).
// 2. The module script loads the full component bundle.
// IMPORTANT: use a function replacement to avoid $& and $' patterns in the
// minified JS being interpreted as special replacement tokens.
const bootstrap = `<script>document.querySelectorAll('app-dashboard').forEach(function(e){e.textContent=''})</script>`;
html = html.replace('</body>', () => `${bootstrap}\n<script type="module">${safeJs}</script>\n</body>`);

console.log(`   ${(html.length / 1024).toFixed(1)} KB total`);

// ── Step 4: Write output ─────────────────────────────────────────
if (!existsSync('./dist')) mkdirSync('./dist', { recursive: true });
writeFileSync('./dist/index.html', html, 'utf-8');

console.log('\n\u2705 dist/index.html ready\n');
