

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BullseyeIcon, BrushIcon, PhotoIcon, UserCircleIcon, SparklesIcon, TagIcon, UndoIcon, EyeIcon } from './icons';

export type SelectionMode = 'point' | 'brush' | 'extract';
export type BrushMode = 'draw' | 'erase';

interface RetouchPanelProps {
  onApplyRetouch: (promptOverride?: string) => void;
  isLoading: boolean;
  isHotspotSelected: boolean;
  onClearHotspot: () => void;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  brushMode: BrushMode;
  onBrushModeChange: (mode: BrushMode) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
  isImageLoaded: boolean;
  isMaskPresent: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  promptInputRef: React.RefObject<HTMLInputElement>;
  onApplyExtract: () => void;
  extractPrompt: string;
  onExtractPromptChange: (prompt: string) => void;
  extractHistoryFiles: File[][];
  extractedHistoryItemUrls: string[][];
  onUseExtractedAsOutfit: (file: File) => void;
  onDownloadExtractedItem: (file: File) => void;
  onClearExtractHistory: () => void;
  onViewExtractedItem: (setIndex: number, itemIndex: number) => void;
}

const RetouchPanel: React.FC<RetouchPanelProps> = (props) => {
  const { t } = useTranslation();
  const { 
    onApplyRetouch, isLoading, isHotspotSelected, onClearHotspot, selectionMode, onSelectionModeChange, 
    brushMode, onBrushModeChange, brushSize, onBrushSizeChange, onClearMask, isImageLoaded, 
    isMaskPresent, prompt, onPromptChange, promptInputRef,
    onApplyExtract, extractPrompt, onExtractPromptChange, extractHistoryFiles, 
    extractedHistoryItemUrls, onUseExtractedAsOutfit, onDownloadExtractedItem, onClearExtractHistory,
    onViewExtractedItem
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

  const canGenerateRetouch = isImageLoaded && !!prompt.trim();
  const canGenerateExtract = isImageLoaded && !isLoading && !!extractPrompt.trim();


  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{selectionMode === 'extract' ? t('extractTitle') : t('retouchTitle')}</h3>
      
      {/* Selection Mode Toggle */}
      <div className="p-1 bg-black/30 rounded-lg flex gap-1">
        <button 
          onClick={() => onSelectionModeChange('point')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${selectionMode === 'point' ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <BullseyeIcon className="w-5 h-5" /> {t('retouchModePoint')}
        </button>
        <button 
          onClick={() => onSelectionModeChange('brush')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${selectionMode === 'brush' ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <BrushIcon className="w-5 h-5" /> {t('retouchModeBrush')}
        </button>
        <button 
          onClick={() => onSelectionModeChange('extract')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${selectionMode === 'extract' ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <TagIcon className="w-5 h-5" /> {t('tooltipExtract')}
        </button>
      </div>
      
      {selectionMode === 'brush' && (
        <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-400">{t('retouchBrushTool')}</label>
            <div className="p-1 bg-black/30 rounded-lg flex gap-1">
              <button onClick={() => onBrushModeChange('draw')} className={`px-3 py-1 rounded-md text-sm font-semibold ${brushMode === 'draw' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{t('retouchToolDraw')}</button>
              <button onClick={() => onBrushModeChange('erase')} className={`px-3 py-1 rounded-md text-sm font-semibold ${brushMode === 'erase' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{t('retouchToolErase')}</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="brush-size" className="text-sm font-medium text-gray-400 whitespace-nowrap">{t('retouchBrushSize')}</label>
            <input 
              id="brush-size"
              type="range" 
              min="5" 
              max="100" 
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="mt-1">
            <button 
                onClick={onClearMask} 
                disabled={isLoading || !isImageLoaded || !isMaskPresent}
                className="w-full text-sm text-center bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t('retouchClearMask')}
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-400 text-center">{selectionMode === 'extract' ? t('extractDescription') : t('retouchDescription')}</p>
      
      {selectionMode !== 'extract' ? (
        <form onSubmit={handleRetouchFormSubmit} className="w-full flex flex-col items-center gap-3">
          <div className="w-full flex items-center gap-2">
              {selectionMode === 'point' && isHotspotSelected && (
                <button
                    type="button"
                    onClick={onClearHotspot}
                    className="flex-shrink-0 bg-white/5 text-white font-bold p-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    aria-label="Back"
                    title="Back"
                >
                    <UndoIcon className="w-5 h-5" />
                </button>
              )}
              <input
                ref={promptInputRef}
                type="text"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={isImageLoaded ? t('retouchPlaceholderGenerative') : t('retouchPlaceholder')}
                className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
                disabled={isLoading || !isImageLoaded}
              />
              <button
                type="submit"
                className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                disabled={isLoading || !canGenerateRetouch}
              >
                {t('generate')}
              </button>
          </div>
        </form>
      ) : (
        <div className="w-full animate-fade-in">
          <form onSubmit={handleExtractFormSubmit} className="w-full flex flex-col items-center gap-3">
              <div className="w-full flex items-center gap-2">
                  <input
                      type="text"
                      value={extractPrompt}
                      onChange={(e) => onExtractPromptChange(e.target.value)}
                      placeholder={t('extractPlaceholder')}
                      className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
                      disabled={isLoading || !isImageLoaded}
                  />
                  <button
                      type="submit"
                      className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                      disabled={!canGenerateExtract}
                  >
                      {t('extractApply')}
                  </button>
              </div>
          </form>
    
          {allExtractedItems.length > 0 && (
            <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4">
              <div className="w-full flex justify-between items-center">
                  <h4 className="text-md font-semibold text-gray-300">{t('extractHistoryTitle')}</h4>
                  <button 
                      onClick={onClearExtractHistory}
                      className="text-xs text-cyan-300 hover:underline disabled:opacity-50"
                      disabled={isLoading}
                  >
                      {t('extractClearHistory')}
                  </button>
              </div>
              <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                {allExtractedItems.map(item => (
                  <div key={item.key} className="flex flex-col gap-2">
                    <button 
                      onClick={() => onViewExtractedItem(item.setIndex, item.itemIndex)}
                      className="w-full aspect-square rounded-lg bg-black/20 p-2 border border-white/10 relative group transition-colors hover:border-cyan-400"
                      style={{ 
                          backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)',
                          backgroundSize: '16px 16px'
                      }}
                      title={t('viewEdited')}
                    >
                      <img src={item.url} alt={`Extracted item ${item.key}`} className="w-full h-full object-contain"/>
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <EyeIcon className="w-8 h-8 text-white" />
                      </div>
                    </button>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => onUseExtractedAsOutfit(item.file)}
                        disabled={isLoading}
                        className="w-full text-xs text-center bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold py-2 px-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        title={t('extractUseAsOutfit')}
                      >
                        {t('extractUseAsOutfit')}
                      </button>
                      <button
                        onClick={() => onDownloadExtractedItem(item.file)}
                        disabled={isLoading}
                        className="w-full text-xs text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        title={t('downloadImage')}
                      >
                        {t('downloadImage')}
                      </button>
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