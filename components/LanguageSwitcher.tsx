/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, type Language } from '../contexts/LanguageContext';
import { UKFlagIcon, VNFlagIcon, JPFlagIcon } from './icons';

// Define language options in a structured way for easier mapping.
const languageOptions: Record<Language, { name: string; Flag: React.FC }> = {
  en: { name: 'English', Flag: UKFlagIcon },
  vi: { name: 'Tiếng Việt', Flag: VNFlagIcon },
  ja: { name: '日本語', Flag: JPFlagIcon },
};

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const CurrentFlag = languageOptions[language].Flag;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Button to toggle the dropdown, showing the current language's flag */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full transition-all duration-200 overflow-hidden ring-2 ring-offset-2 ring-offset-gray-900 ring-transparent hover:ring-cyan-400 focus:ring-cyan-400 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('switchLanguage')}
        title={t('switchLanguage')}
      >
        <CurrentFlag />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 bg-gray-900/50 border border-white/10 rounded-lg shadow-xl backdrop-blur-lg animate-fade-in z-20"
          role="menu"
        >
          <ul className="py-1" role="none">
            {(Object.keys(languageOptions) as Language[]).map((langKey) => {
              const { name, Flag } = languageOptions[langKey];
              return (
                <li key={langKey} role="none">
                  <button
                    onClick={() => {
                      setLanguage(langKey);
                      setIsOpen(false);
                    }}
                    role="menuitem"
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      language === langKey
                        ? 'bg-cyan-500/20 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <Flag />
                    </div>
                    <span>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;