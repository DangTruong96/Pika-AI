/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, SparklesIcon, TagIcon, ExpandIcon, EyeIcon } from './icons';
import type { Tab, SelectionMode } from '../types';
import { SegmentedControl } from './IdPhotoPanel';

export type { SelectionMode };

interface RetouchPanelProps {
  onApplyRetouch: (promptOverride?: string) => void;
  isLoading: boolean;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  isImageLoaded: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
  onApplyExtract: () => void;
  extractPrompt: string;
  onExtractPromptChange: (prompt: string) => void;
  extractHistoryFiles: File[][];
  extractedHistoryItemUrls: string[][];
  onUseExtractedAsOutfit: (file: File) => void;
  onDownloadExtractedItem: (file: File) => void;
  onClearExtractHistory: () => void;
  onViewExtractedItem: (setIndex: number, itemIndex: number) => void;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

const RetouchPanel: React.FC<RetouchPanelProps> = (props) => {
  const { t } = useTranslation();
  const { 
    onApplyRetouch, isLoading, selectionMode, onSelectionModeChange, 
    isImageLoaded, prompt, onPromptChange, promptInputRef,
    onApplyExtract, extractPrompt, onExtractPromptChange, extractHistoryFiles, 
    extractedHistoryItemUrls, onUseExtractedAsOutfit, onDownloadExtractedItem, onClearExtractHistory,
    onViewExtractedItem,
    setActiveTab, onToggleToolbox, isMobile
  } = props;

  const allExtractedItems = React.useMemo(() => {
    return extractHistoryFiles.flatMap((fileSet, setIndex) =>
      fileSet.map((file, itemIndex) => ({
        file,
        url: extractedHistoryItemUrls[setIndex]?.[itemIndex] || '',
        key: `${setIndex}-${itemIndex}-${file.lastModified}`,
        setIndex,
        itemIndex
      }))
    ).filter(item => item.url);
  }, [extractHistoryFiles, extractedHistoryItemUrls]);

  const handleRetouchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onApplyRetouch();
    }
  };
  
  const handleExtractFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (extractPrompt.trim()) {
          onApplyExtract();
      }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };

  const canGenerateRetouch = isImageLoaded && !isLoading && !!prompt.trim();
  const canGenerateExtract = isImageLoaded && !isLoading && !!extractPrompt.trim();

  const titleContent = (
    <>
      {selectionMode === 'extract' ? <TagIcon className="w-6 h-6" /> : <BrushIcon className="w-6 h-6" />}
      <span>{selectionMode === 'extract' ? t('extractTitle') : t('retouchTitle')}</span>
    </>
  );
  
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";

  const modeOptions = React.useMemo(() => [
    { value: 'retouch' as SelectionMode, label: t('retouchTitle'), icon: BrushIcon },
    { value: 'extract' as SelectionMode, label: t('extractTitle'), icon: TagIcon },
  ], [t]);


  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
        <div className="w-full flex items-center justify-between">
            <button 
              onClick={() => setActiveTab('expand')} 
              className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              title={t('tooltipExpand')} disabled={isLoading}>
              <ExpandIcon className="w-6 h-6" />
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
              onClick={() => setActiveTab('adjust')} 
              className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              title={t('tooltipAdjust')} disabled={isLoading}>
              <SparklesIcon className="w-6 h-6" />
            </button>
        </div>

        <SegmentedControl
            options={modeOptions}
            selected={selectionMode}
            onSelect={onSelectionModeChange}
            disabled={isLoading || !isImageLoaded}
            fullWidth
        />

        {selectionMode === 'retouch' && (
            <form onSubmit={handleRetouchFormSubmit} className="w-full flex flex-col items-center gap-4 animate-fade-in">
                <p className="text-sm text-gray-400 text-center">{t('retouchDescription')}</p>
                <textarea
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={t('retouchPlaceholder')}
                    className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
                    disabled={isLoading || !isImageLoaded}
                    onFocus={handleInputFocus}
                    rows={4}
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    disabled={!canGenerateRetouch}
                >
                    {t('generate')}
                </button>
            </form>
        )}

        {selectionMode === 'extract' && (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                <form onSubmit={handleExtractFormSubmit} className="w-full flex flex-col items-center gap-4">
                    <p className="text-sm text-gray-400 text-center">{t('extractDescription')}</p>
                    <textarea
                        value={extractPrompt}
                        onChange={(e) => onExtractPromptChange(e.target.value)}
                        placeholder={t('extractPlaceholder')}
                        className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
                        disabled={isLoading || !isImageLoaded}
                        onFocus={handleInputFocus}
                        rows={2}
                    />
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                        disabled={!canGenerateExtract}
                    >
                        {t('extractApply')}
                    </button>
                </form>

                {allExtractedItems.length > 0 && (
                    <div className="w-full flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-gray-300">{t('extractHistoryTitle')}</h4>
                            <button onClick={onClearExtractHistory} className="text-xs text-cyan-400 hover:underline">{t('extractClearHistory')}</button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                            {allExtractedItems.map(item => (
                                <div key={item.key} className="relative aspect-square rounded-lg bg-black/20 border border-white/10 overflow-hidden group">
                                    <img src={item.url} alt={t('extractedItemAlt', { key: item.key })} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                        <button onClick={() => onViewExtractedItem(item.setIndex, item.itemIndex)} className="text-xs text-white hover:underline p-1 rounded bg-white/10"><EyeIcon className="w-4 h-4"/></button>
                                        <button onClick={() => onUseExtractedAsOutfit(item.file)} className="text-xs text-white hover:underline p-1 rounded bg-white/10">{t('extractUseAsOutfit')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default React.memo(RetouchPanel);