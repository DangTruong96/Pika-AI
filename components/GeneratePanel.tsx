/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LightbulbIcon, IdCardIcon, UsersIcon } from './icons';
import type { Tab, AspectRatio } from '../types';

export type { AspectRatio };

interface GeneratePanelProps {
  isLoading: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (aspect: AspectRatio) => void;
  numImages: number;
  onNumImagesChange: (num: number) => void;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

const GeneratePanel: React.FC<GeneratePanelProps> = React.memo(({
  isLoading, prompt, onPromptChange, onGenerate,
  aspectRatio, onAspectRatioChange, numImages, onNumImagesChange,
  setActiveTab, onToggleToolbox, isMobile
}) => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate();
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };
  
  const titleContent = (
    <>
      <LightbulbIcon className="w-6 h-6"/>
      <span>{t('generateTitle')}</span>
    </>
  );
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('studio')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipStudio')}
          disabled={isLoading}
          aria-label={t('tooltipStudio')}
        >
          <UsersIcon className="w-6 h-6" />
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
          onClick={() => setActiveTab('idphoto')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipIdPhoto')}
          disabled={isLoading}
          aria-label={t('tooltipIdPhoto')}
        >
          <IdCardIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('generateDescription')}</p>
      
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('generatePlaceholder')}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
          disabled={isLoading}
          onFocus={handleInputFocus}
          rows={4}
        />
        
        <div className="w-full flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-gray-300">{t('generateAspectRatio')}:</span>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1 flex-wrap">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ar => (
                    <button type="button" key={ar} onClick={() => onAspectRatioChange(ar)} disabled={isLoading}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${aspectRatio === ar ? 'bg-white/15 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                        {ar}
                    </button>
                ))}
            </div>
        </div>

        <div className="w-full flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-gray-300">{t('generateNumImages')}:</span>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1">
                {[1, 2, 4].map(num => (
                    <button type="button" key={num} onClick={() => onNumImagesChange(num)} disabled={isLoading}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${numImages === num ? 'bg-white/15 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                        {num}
                    </button>
                ))}
            </div>
        </div>

        <button
            type="submit"
            className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
            disabled={isLoading || !prompt.trim()}
        >
            {t('generate')}
        </button>
      </form>
    </div>
  );
});

export default GeneratePanel;