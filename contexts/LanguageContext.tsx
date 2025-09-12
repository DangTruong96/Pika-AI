/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations, TranslationKey } from '../translations';

export type Language = 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language] = useState<Language>('vi');

  const t = (key: TranslationKey, replacements: { [key: string]: string | number } = {}) => {
    let text = translations.vi[key] || key;
    
    Object.keys(replacements).forEach(rKey => {
      const regex = new RegExp(`\\{${rKey}\\}`, 'g');
      text = text.replace(regex, String(replacements[rKey]));
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: () => {}, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
