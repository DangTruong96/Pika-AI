

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { MagicWandIcon } from './icons';

interface ExpandPanelProps {
  onApplyExpansion: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  hasExpansion: boolean;
  imageDimensions: { width: number, height: number } | null;
  onSetAspectExpansion: (aspect: number | null) => void;
  activeAspect: number | null;
}

const ExpandPanel: React.FC<ExpandPanelProps> = ({ 
  onApplyExpansion, isLoading, isImageLoaded, prompt, 
  onPromptChange, hasExpansion, onSetAspectExpansion, activeAspect
}) => {
  const { t } = useTranslation();

  const handleApply = () => {
    if (hasExpansion) {
      onApplyExpansion(prompt);
    }
  };

  const handleAspectClick = (aspectValue: number | null) => {
    onSetAspectExpansion(aspectValue);
  };
  
  const aspects = [
    { name: t('expandAspectFree'), value: null },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
  ];

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('expandTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('expandDescription')}</p>
      
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-wrap items-center justify-center gap-2">
            {aspects.map(({ name, value }) => (
            <button
                key={name}
                onClick={() => handleAspectClick(value)}
                disabled={isLoading || !isImageLoaded}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    activeAspect === value 
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'bg-transparent hover:bg-white/10 text-gray-300'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
        
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('expandPlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />

        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <button
                onClick={() => onApplyExpansion('')}
                disabled={isLoading || !isImageLoaded || !hasExpansion}
                title={t('expandMagic')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-400/20 hover:shadow-xl hover:shadow-purple-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
            >
                <MagicWandIcon className="w-5 h-5"/>
                {t('expandMagic')}
            </button>
            <button
                onClick={handleApply}
                disabled={isLoading || !isImageLoaded || !hasExpansion || !prompt.trim()}
                className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
            >
                {t('expandApply')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExpandPanel);