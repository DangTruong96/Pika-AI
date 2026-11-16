import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build-output sanity for index.html: the favicon used to point at
 * `/vite.svg`, a file that exists nowhere in the repo, so every load of
 * the deployed demo (served under /Pika-AI/ on GitHub Pages, where even a
 * root-absolute /vite.svg would miss) logged a 404. The icon is now an
 * inline data URI, which resolves under any base path.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');

describe('index.html — favicon', () => {
  it('does not reference the missing /vite.svg', () => {
    expect(html).not.toContain('/vite.svg');
    expect(html).not.toContain('vite.svg');
  });

  it('favicon link resolves under any base path (data URI or an existing file)', () => {
    const match = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    const href = match![1];
    if (href.startsWith('data:')) return;
    const target = href.startsWith('/') ? href.slice(1) : href.replace(/^\.\//, '');
    expect(
      existsSync(join(root, 'public', target)) || existsSync(join(root, target)),
    ).toBe(true);
  });
});
