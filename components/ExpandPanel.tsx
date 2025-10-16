/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { MagicWandIcon, ExpandIcon, IdCardIcon, BrushIcon, LightbulbIcon } from './icons';
import type { Tab } from '../types';

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
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

// Fix: Changed to a named export to resolve a module resolution error.
export const ExpandPanel: React.FC<ExpandPanelProps> = React.memo(({ 
  onApplyExpansion, isLoading, isImageLoaded, prompt, 
  onPromptChange, hasExpansion, onSetAspectExpansion, activeAspect,
  setActiveTab, onToggleToolbox, isMobile
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

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };
  
  const aspects = [
    { name: t('expandAspectFree'), value: null },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
  ];
  
  const titleContent = (
    <>
      <ExpandIcon className="w-6 h-6"/>
      <span>{t('expandTitle')}</span>
    </>
  );
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";


  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('idphoto')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipIdPhoto')}
          disabled={isLoading}
          aria-label={t('tooltipIdPhoto')}
        >
          <IdCardIcon className="w-6 h-6" />
        </button>
        {isMobile ? (
            <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
                {titleContent}
            </button>
        ) : (
            <h3 className={commonTitleClasses}>
                {titleContent}
            </h3>
        )}
        <button 
          onClick={() => setActiveTab('retouch')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipRetouch')}
          disabled={isLoading}
          aria-label={t('tooltipRetouch')}
        >
          <BrushIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('expandDescription')}</p>
      
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-wrap items-center justify-center gap-2">
            {aspects.map(({ name, value }) => (
            <button
                key={name}
                onClick={() => handleAspectClick(value)}
                disabled={isLoading || !isImageLoaded}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 min-h-11 flex items-center justify-center ${
                    activeAspect === value 
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'bg-transparent hover:bg-white/10 text-gray-300'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
        
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('expandPlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
          disabled={isLoading || !isImageLoaded}
          onFocus={handleInputFocus}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <button
                onClick={() => onApplyExpansion('')}
                disabled={isLoading || !isImageLoaded || !hasExpansion}
                title={t('tooltipExpandAuto')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-400/20 hover:shadow-xl hover:shadow-purple-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
            >
                <MagicWandIcon className="w-5 h-5"/>
                {t('expandMagic')}
            </button>
            <button
                onClick={handleApply}
                disabled={isLoading || !isImageLoaded || !hasExpansion || !prompt.trim()}
                title={t('tooltipExpandGenerate')}
                className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
            >
                {t('expandApply')}
            </button>
        </div>
      </div>
    </div>
  );
});