/**
 * dev.ts — Watches src/ for changes and rebuilds dist/index.html.
 *
 * Tailwind watch runs separately via concurrently (see package.json "dev" script).
 * When Tailwind regenerates output.css, this watcher picks it up and rebuilds.
 */

import { execSync } from 'node:child_process';
import { watch } from 'node:fs';

let building = false;
let queued = false;

function rebuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  console.log('\n\u{1f504} Rebuilding...');
  try {
    execSync('bun run stencil && bun run bundle', { stdio: 'inherit' });
  } catch {
    console.error('\u274c Build failed');
  }
  building = false;
  if (queued) {
    queued = false;
    rebuild();
  }
}

// Debounce: wait 300ms after last change before rebuilding
let timer: ReturnType<typeof setTimeout> | null = null;

watch('./src', { recursive: true }, (_event, filename) => {
  if (!filename || filename.includes('output.css')) return; // Tailwind output triggers via its own path
  if (timer) clearTimeout(timer);
  timer = setTimeout(rebuild, 300);
});

// Also watch for Tailwind output changes
watch('./src/global', { recursive: false }, (_event, filename) => {
  if (filename === 'output.css') {
    if (timer) clearTimeout(timer);
    timer = setTimeout(rebuild, 300);
  }
});

console.log('\u{1f440} Watching src/ for changes... (Ctrl+C to stop)\n');
