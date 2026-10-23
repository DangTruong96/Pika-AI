import { describe, it, expect } from 'vitest';
import { applyReplacements } from '../utils/promptTemplate';

describe('applyReplacements', () => {
  it('replaces every occurrence of a placeholder', () => {
    expect(applyReplacements('Hello {name}, goodbye {name}.', { name: 'An' })).toBe(
      'Hello An, goodbye An.',
    );
  });
  it('stringifies non-string values', () => {
    expect(applyReplacements('n={n} ok={ok}', { n: 42, ok: true })).toBe('n=42 ok=true');
  });
  it('leaves unknown placeholders untouched', () => {
    expect(applyReplacements('Keep {missing} as-is.', {})).toBe('Keep {missing} as-is.');
  });
  it('returns the template unchanged without replacements', () => {
    expect(applyReplacements('Plain template.')).toBe('Plain template.');
  });
});
