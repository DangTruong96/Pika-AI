/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ExtractPanelProps {
  onApplyExtract: () => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  extractedItemUrls: string[];
  onUseAsStyle: (index: number) => void;
}

const ExtractPanel: React.FC<ExtractPanelProps> = ({ 
  onApplyExtract, 
  isLoading, 
  isImageLoaded,
  prompt,
  onPromptChange,
  extractedItemUrls,
  onUseAsStyle
}) => {
  const { t } = useTranslation();
  
  const handleApply = () => {
    if (prompt.trim()) {
      onApplyExtract();
    }
  };

  const canGenerate = isImageLoaded && !isLoading && prompt.trim();

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('extractTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('extractDescription')}</p>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="w-full flex flex-col items-center gap-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('extractPlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />

        <button
            type="submit"
            disabled={!canGenerate}
            className="w-full max-w-xs bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
        >
            {t('extractApply')}
        </button>
      </form>

      {extractedItemUrls.length > 0 && (
        <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4 animate-fade-in">
          <h4 className="text-md font-semibold text-gray-300">{t('extractResultTitle')}</h4>
          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
            {extractedItemUrls.map((url, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div 
                  className="w-full aspect-square rounded-lg bg-black/20 p-2 border border-white/10"
                  style={{ 
                      backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)',
                      backgroundSize: '16px 16px'
                  }}
                >
                  <img src={url} alt={`${t('extractResultTitle')} ${index + 1}`} className="w-full h-full object-contain"/>
                </div>
                <button
                  onClick={() => onUseAsStyle(index)}
                  disabled={isLoading}
                  className="w-full text-xs bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-2 px-3 rounded-lg transition-all active:scale-95 disabled:from-gray-600"
                >
                  {t('extractUseAsStyle')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ExtractPanel;