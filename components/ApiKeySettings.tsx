/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import {
  getStoredApiKey,
  storeApiKey,
  clearStoredApiKey,
  isPlausibleApiKey,
  maskApiKey,
} from '../services/apiKey';
import { validateApiKey, hasConfiguredApiKey } from '../services/geminiService';

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H4.25v2.818c0 .596.237 1.17.659 1.591l6.499 6.499c.404.404 1 .53 1.563.43A6 6 0 1 1 21.75 8.25Z" transform="scale(0.92) translate(1 1)" />
  </svg>
);

// Auto-open the dialog only once per page load, and only when no key exists.
let autoOpenChecked = false;

type Status = 'idle' | 'validating' | 'saved' | 'removed' | 'error-implausible' | 'error-invalid';

const ApiKeySettings: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [storedKey, setStoredKey] = useState<string | null>(() => getStoredApiKey());

  useEffect(() => {
    if (!autoOpenChecked) {
      autoOpenChecked = true;
      if (!hasConfiguredApiKey()) {
        setIsOpen(true);
      }
    }
  }, []);

  const refreshStoredKey = () => setStoredKey(getStoredApiKey());

  const handleSave = async () => {
    if (!isPlausibleApiKey(input)) {
      setStatus('error-implausible');
      return;
    }
    setStatus('validating');
    try {
      await validateApiKey(input);
      storeApiKey(input);
      setInput('');
      refreshStoredKey();
      setStatus('saved');
    } catch {
      // Deliberately generic: never surface or log anything key-adjacent.
      setStatus('error-invalid');
    }
  };

  const handleRemove = () => {
    clearStoredApiKey();
    refreshStoredKey();
    setInput('');
    setStatus('removed');
  };

  const close = () => {
    setIsOpen(false);
    setStatus('idle');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-1.5 p-2 sm:px-3 rounded-lg transition-colors text-sm bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-gray-200"
        title={t('apiKeySettings')}
      >
        <KeyIcon className="w-5 h-5" />
        <span className="hidden md:inline">{t('apiKeySettings')}</span>
        <span
          className={`w-2 h-2 rounded-full ${storedKey ? 'bg-emerald-400' : 'bg-amber-400'}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('apiKeyTitle')}
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-5 sm:p-6 text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">{t('apiKeyTitle')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed">{t('apiKeyIntro')}</p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-medium text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              {t('apiKeyGetKey')}
            </a>

            <div className="mt-4 text-sm">
              <span className="text-gray-400">{t('apiKeyCurrent')}: </span>
              {storedKey ? (
                <span className="font-mono text-emerald-300">{maskApiKey(storedKey)}</span>
              ) : (
                <span className="text-amber-300">{t('apiKeyNotSet')}</span>
              )}
            </div>

            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setStatus('idle');
              }}
              placeholder={t('apiKeyPlaceholder')}
              autoComplete="off"
              spellCheck={false}
              className="mt-3 w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            />

            {status === 'saved' && <p className="mt-3 text-sm text-emerald-300">{t('apiKeySaved')}</p>}
            {status === 'removed' && <p className="mt-3 text-sm text-gray-300">{t('apiKeyRemoved')}</p>}
            {status === 'error-implausible' && <p className="mt-3 text-sm text-red-300">{t('apiKeyImplausible')}</p>}
            {status === 'error-invalid' && <p className="mt-3 text-sm text-red-300">{t('apiKeyInvalid')}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={handleSave}
                disabled={status === 'validating' || !input.trim()}
                className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-cyan-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'validating' ? t('apiKeyValidating') : t('apiKeySave')}
              </button>
              {storedKey && (
                <button
                  onClick={handleRemove}
                  disabled={status === 'validating'}
                  className="bg-white/5 border border-white/10 text-gray-200 font-semibold py-2 px-4 rounded-lg text-sm transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-50"
                >
                  {t('apiKeyRemove')}
                </button>
              )}
              <button
                onClick={close}
                className="ml-auto text-sm text-gray-300 hover:text-white py-2 px-3"
              >
                {t('apiKeyClose')}
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-gray-400">{t('apiKeyStoredNote')}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeySettings;
