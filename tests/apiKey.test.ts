import { describe, it, expect } from 'vitest';
import {
  API_KEY_STORAGE_KEY,
  normalizeApiKey,
  isPlausibleApiKey,
  getStoredApiKey,
  storeApiKey,
  clearStoredApiKey,
  resolveApiKey,
  maskApiKey,
  type KeyValueStorage,
} from '../services/apiKey';

const fakeStorage = (initial: Record<string, string> = {}): KeyValueStorage => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
};

const SAMPLE_KEY = 'AIzaSyDUMMYKEYFORTESTS1234567890abcd';

describe('normalizeApiKey', () => {
  it('trims surrounding whitespace and newlines from pasted keys', () => {
    expect(normalizeApiKey(`  ${SAMPLE_KEY}\n`)).toBe(SAMPLE_KEY);
  });
  it('returns an empty string for empty input', () => {
    expect(normalizeApiKey('   ')).toBe('');
  });
});

describe('isPlausibleApiKey', () => {
  it('accepts a typical AI Studio key', () => {
    expect(isPlausibleApiKey(SAMPLE_KEY)).toBe(true);
  });
  it('accepts a key pasted with surrounding whitespace', () => {
    expect(isPlausibleApiKey(` ${SAMPLE_KEY} `)).toBe(true);
  });
  it('rejects empty and very short strings', () => {
    expect(isPlausibleApiKey('')).toBe(false);
    expect(isPlausibleApiKey('abc123')).toBe(false);
  });
  it('rejects strings with embedded whitespace', () => {
    expect(isPlausibleApiKey('AIzaSyDUMMY KEY WITH SPACES 123456')).toBe(false);
  });
});

describe('storage round-trip', () => {
  it('stores a normalized key and reads it back', () => {
    const storage = fakeStorage();
    expect(storeApiKey(` ${SAMPLE_KEY} `, storage)).toBe(true);
    expect(getStoredApiKey(storage)).toBe(SAMPLE_KEY);
    expect(storage.getItem(API_KEY_STORAGE_KEY)).toBe(SAMPLE_KEY);
  });
  it('refuses to store an empty key', () => {
    const storage = fakeStorage();
    expect(storeApiKey('   ', storage)).toBe(false);
    expect(getStoredApiKey(storage)).toBeNull();
  });
  it('clears the stored key', () => {
    const storage = fakeStorage({ [API_KEY_STORAGE_KEY]: SAMPLE_KEY });
    clearStoredApiKey(storage);
    expect(getStoredApiKey(storage)).toBeNull();
  });
  it('tolerates a null storage backend (private browsing)', () => {
    expect(getStoredApiKey(null)).toBeNull();
    expect(storeApiKey(SAMPLE_KEY, null)).toBe(false);
    expect(() => clearStoredApiKey(null)).not.toThrow();
  });
});

describe('resolveApiKey', () => {
  it('prefers the stored BYOK key over the dev key', () => {
    const storage = fakeStorage({ [API_KEY_STORAGE_KEY]: SAMPLE_KEY });
    expect(resolveApiKey('dev-key-from-env-1234567890', storage)).toBe(SAMPLE_KEY);
  });
  it('falls back to the dev key when nothing is stored', () => {
    expect(resolveApiKey('dev-key-from-env-1234567890', fakeStorage())).toBe(
      'dev-key-from-env-1234567890',
    );
  });
  it('returns null when neither source has a key', () => {
    expect(resolveApiKey(undefined, fakeStorage())).toBeNull();
    expect(resolveApiKey('   ', fakeStorage())).toBeNull();
  });
});

describe('maskApiKey', () => {
  it('shows only the first and last four characters', () => {
    expect(maskApiKey(SAMPLE_KEY)).toBe('AIza…abcd');
    expect(maskApiKey(SAMPLE_KEY)).not.toContain('DUMMYKEY');
  });
  it('fully masks short strings', () => {
    expect(maskApiKey('short')).toBe('••••');
    expect(maskApiKey('')).toBe('');
  });
});
