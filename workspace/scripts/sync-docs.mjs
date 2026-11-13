// Copies the single-file production build into /docs so GitHub Pages can
// serve it straight from this branch (Settings → Pages → branch → /docs).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const docsDir = resolve(projectRoot, '..', 'docs');

mkdirSync(docsDir, { recursive: true });
copyFileSync(resolve(projectRoot, 'dist/index.html'), resolve(docsDir, 'index.html'));
writeFileSync(resolve(docsDir, '.nojekyll'), '');

console.log('Synced dist/index.html → docs/index.html (GitHub Pages)');
