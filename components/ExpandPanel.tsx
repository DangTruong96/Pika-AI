/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ExpandPanelProps {
  onApplyExpansion: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  hasExpansion: boolean;
}

const ExpandPanel: React.FC<ExpandPanelProps> = ({ onApplyExpansion, isLoading, isImageLoaded, prompt, onPromptChange, hasExpansion }) => {
  const { t } = useTranslation();
  
  const handleApply = () => {
    if (hasExpansion) {
      onApplyExpansion(prompt);
    }
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('expandTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('expandDescription')}</p>
      
      <div className="flex flex-col items-center gap-4 w-full">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('expandPlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />

        <button
            onClick={handleApply}
            disabled={isLoading || !isImageLoaded || !hasExpansion}
            className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
        >
            {t('expandApply')}
        </button>
      </div>
    </div>
  );
};

export default ExpandPanel;
