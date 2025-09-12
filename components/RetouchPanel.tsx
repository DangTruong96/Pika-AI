/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BullseyeIcon, BrushIcon, PhotoIcon, UserCircleIcon, SparklesIcon, TagIcon } from './icons';

export type SelectionMode = 'point' | 'brush' | 'extract';
export type BrushMode = 'draw' | 'erase';

interface RetouchPanelProps {
  onApplyRetouch: (promptOverride?: string) => void;
  isLoading: boolean;
  isHotspotSelected: boolean;
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
  extractedItemsFiles: File[];
  extractedItemUrls: string[];
  extractHistoryFiles: File[][];
  extractedHistoryItemUrls: string[][];
  onUseExtractedAsStyle: (file: File) => void;
  onDownloadExtractedItem: (file: File) => void;
}

const RetouchPanel: React.FC<RetouchPanelProps> = (props) => {
  const { t } = useTranslation();
  const { 
    onApplyRetouch, isLoading, isHotspotSelected, selectionMode, onSelectionModeChange, 
    brushMode, onBrushModeChange, brushSize, onBrushSizeChange, onClearMask, isImageLoaded, 
    isMaskPresent, prompt, onPromptChange, promptInputRef,
    onApplyExtract, extractPrompt, onExtractPromptChange, extractedItemsFiles, extractedItemUrls, 
    extractHistoryFiles, extractedHistoryItemUrls, onUseExtractedAsStyle, onDownloadExtractedItem
  } = props;

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

  const isPointModeReady = selectionMode === 'point' && isHotspotSelected;
  const isBrushModeReady = selectionMode === 'brush';
  const canType = isImageLoaded && (isPointModeReady || isBrushModeReady);

  const canGenerateRetouch = (isPointModeReady || (isBrushModeReady && isMaskPresent)) && isImageLoaded && !!prompt.trim();
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
        <form onSubmit={handleRetouchFormSubmit} className={`w-full flex-col items-center gap-3 ${selectionMode === 'point' ? 'hidden md:flex' : 'flex'}`}>
          <div className="w-full flex items-center gap-2">
              <input
                ref={promptInputRef}
                type="text"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={canType ? t('retouchPlaceholderGenerative') : t('retouchPlaceholder')}
                className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
                disabled={isLoading || !isImageLoaded || (selectionMode === 'point' && !isHotspotSelected)}
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
                      className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
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
    
          {extractedItemUrls.length > 0 && (
              <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4">
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
                              <div className="grid grid-cols-2 gap-2">
                                  <button
                                      onClick={() => onUseExtractedAsStyle(extractedItemsFiles[index])}
                                      disabled={isLoading}
                                      className="w-full text-xs text-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                      title={t('extractUseAsStyle')}
                                  >
                                      {t('extractUseAsStyle')}
                                  </button>
                                  <button
                                      onClick={() => onDownloadExtractedItem(extractedItemsFiles[index])}
                                      disabled={isLoading}
                                      className="w-full text-xs text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
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

          {extractedHistoryItemUrls.length > 0 && (
              <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4">
                  <h4 className="text-md font-semibold text-gray-300">{t('extractHistoryTitle')}</h4>
                  <div className="w-full flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                      {extractedHistoryItemUrls.map((urlSet, setIndex) => (
                          <div key={setIndex} className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                              {urlSet.map((url, itemIndex) => (
                                  <div key={`${setIndex}-${itemIndex}`} className="flex flex-col gap-2">
                                      <div 
                                          className="w-full aspect-square rounded-lg bg-black/20 p-2 border border-white/10"
                                          style={{ 
                                              backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)',
                                              backgroundSize: '16px 16px'
                                          }}
                                      >
                                          <img src={url} alt={`History item ${setIndex}-${itemIndex}`} className="w-full h-full object-contain"/>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <button
                                              onClick={() => onUseExtractedAsStyle(extractHistoryFiles[setIndex][itemIndex])}
                                              disabled={isLoading}
                                              className="w-full text-xs text-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                              title={t('extractUseAsStyle')}
                                          >
                                              {t('extractUseAsStyle')}
                                          </button>
                                          <button
                                              onClick={() => onDownloadExtractedItem(extractHistoryFiles[setIndex][itemIndex])}
                                              disabled={isLoading}
                                              className="w-full text-xs text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                              title={t('downloadImage')}
                                          >
                                              {t('downloadImage')}
                                          </button>
                                      </div>
                                  </div>
                              ))}
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

export default RetouchPanel;