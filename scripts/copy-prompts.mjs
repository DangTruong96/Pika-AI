// Copies the runtime prompt templates into dist/ after `vite build`.
// The app fetches /prompts/*.txt at runtime, but Vite only publishes the
// public/ directory, so without this step the deployed site would 404 on
// every prompt template.
import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'prompts');
const dest = join(root, 'dist', 'prompts');

if (existsSync(src)) {
  cpSync(src, dest, { recursive: true });
  console.log('copy-prompts: prompts/ -> dist/prompts/');
} else {
  console.warn('copy-prompts: no prompts/ directory found, skipping.');
}
