/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BYOK (bring-your-own-key) storage helpers.
 *
 * The user's Gemini API key is stored ONLY in the browser's localStorage on
 * their own device. It is never sent anywhere except to Google's API
 * endpoints as part of Gemini requests, and it is never logged.
 *
 * The helpers accept an injectable Storage-like object so they can be unit
 * tested outside a browser.
 */

export const API_KEY_STORAGE_KEY = 'pika-ai:gemini-api-key';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const defaultStorage = (): KeyValueStorage | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    // localStorage can throw in hardened/private browsing contexts.
    return null;
  }
};

/** Normalize a user-pasted key: trims surrounding whitespace/newlines. */
export const normalizeApiKey = (raw: string): string => raw.trim();

/**
 * Cheap plausibility check before bothering the API. Real validation is the
 * live call in geminiService.validateApiKey(); this only rejects obvious
 * paste mistakes (empty, embedded whitespace, far too short). Google AI
 * Studio keys are typically 39 characters, but we intentionally accept any
 * whitespace-free string of at least 20 characters so future key formats
 * keep working.
 */
export const isPlausibleApiKey = (raw: string): boolean => {
  const key = normalizeApiKey(raw ?? '');
  return key.length >= 20 && !/\s/.test(key);
};

/** Returns the stored BYOK key, or null when none is saved. */
export const getStoredApiKey = (storage: KeyValueStorage | null = defaultStorage()): string | null => {
  if (!storage) return null;
  try {
    const value = storage.getItem(API_KEY_STORAGE_KEY);
    const key = value ? normalizeApiKey(value) : '';
    return key ? key : null;
  } catch {
    return null;
  }
};

/** Persists the key (normalized) to browser storage only. Returns success. */
export const storeApiKey = (rawKey: string, storage: KeyValueStorage | null = defaultStorage()): boolean => {
  if (!storage) return false;
  const key = normalizeApiKey(rawKey ?? '');
  if (!key) return false;
  try {
    storage.setItem(API_KEY_STORAGE_KEY, key);
    return true;
  } catch {
    return false;
  }
};

/** Removes the stored key (change/remove-key in settings). */
export const clearStoredApiKey = (storage: KeyValueStorage | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // Nothing else to do — the key simply stays until storage works again.
  }
};

/**
 * Resolution order for API calls:
 *  1. The user's own key saved in the browser (BYOK — the deployed app).
 *  2. A build-time development key (process.env.API_KEY, inlined by Vite
 *     from .env.local) so the owner's local dev flow keeps working.
 */
export const resolveApiKey = (
  devKey?: string,
  storage: KeyValueStorage | null = defaultStorage(),
): string | null => {
  const stored = getStoredApiKey(storage);
  if (stored) return stored;
  const dev = devKey ? normalizeApiKey(devKey) : '';
  return dev ? dev : null;
};

/** Masks a key for display, e.g. "AIza…wxyz". Never returns the full key. */
export const maskApiKey = (key: string): string => {
  const k = normalizeApiKey(key ?? '');
  if (k.length <= 8) return k ? '••••' : '';
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
};
