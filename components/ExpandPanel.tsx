/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ExpandPanelProps {
  onApplyExpansion: (aspectRatio: number, prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const ExpandPanel: React.FC<ExpandPanelProps> = ({ onApplyExpansion, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('16:9');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const handleApply = () => {
    const aspectValue = aspects.find(a => a.name === activeAspect)?.value;
    if (aspectValue) {
      onApplyExpansion(aspectValue, customPrompt);
    }
  };

  const aspects: { name: AspectRatio; label: string; value: number }[] = [
    { name: '1:1', label: '1:1', value: 1 },
    { name: '16:9', label: '16:9', value: 16 / 9 },
    { name: '9:16', label: '9:16', value: 9 / 16 },
    { name: '4:3', label: '4:3', value: 4 / 3 },
    { name: '3:4', label: '3:4', value: 3 / 4 },
  ];

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('expandTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('expandDescription')}</p>
      
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-medium text-gray-300">{t('expandAspectRatio')}:</span>
            {aspects.map(({ name, label }) => (
            <button
                key={name}
                onClick={() => setActiveAspect(name)}
                disabled={isLoading || !isImageLoaded}
                className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                activeAspect === name 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-400/25 ring-1 ring-white/20' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200'
                }`}
            >
                {label}
            </button>
            ))}
        </div>

        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t('expandPlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />

        <button
            onClick={handleApply}
            disabled={isLoading || !isImageLoaded}
            className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
        >
            {t('expandApply')}
        </button>
      </div>
    </div>
  );
};

export default ExpandPanel;