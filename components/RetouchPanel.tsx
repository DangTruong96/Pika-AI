/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BullseyeIcon, BrushIcon, PhotoIcon, UserCircleIcon, SparklesIcon } from './icons';

export type SelectionMode = 'point' | 'brush';
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
}

const RetouchPanel: React.FC<RetouchPanelProps> = ({ 
  onApplyRetouch, 
  isLoading, 
  isHotspotSelected,
  selectionMode,
  onSelectionModeChange,
  brushMode,
  onBrushModeChange,
  brushSize,
  onBrushSizeChange,
  onClearMask,
  isImageLoaded,
  isMaskPresent,
  prompt,
  onPromptChange,
  promptInputRef,
}) => {
  const { t } = useTranslation();

  const removalPresets = [
    { name: t('retouchRemoveObject'), prompt: t('retouchRemoveObjectPrompt'), icon: <PhotoIcon /> },
    { name: t('retouchRemovePerson'), prompt: t('retouchRemovePersonPrompt'), icon: <UserCircleIcon /> },
    { name: t('retouchRemoveReflection'), prompt: t('retouchRemoveReflectionPrompt'), icon: <SparklesIcon /> }
  ];

  const handlePresetClick = (presetPrompt: string) => {
    // Update the prompt in the UI for user feedback
    onPromptChange(presetPrompt);
    // Immediately trigger generation with the correct prompt to avoid state-based race conditions
    onApplyRetouch(presetPrompt);
  };

  const isPointModeReady = selectionMode === 'point' && isHotspotSelected;
  const isBrushModeReady = selectionMode === 'brush';
  const canType = (isPointModeReady || isBrushModeReady) && isImageLoaded;
  const canGenerate = (isPointModeReady || (isBrushModeReady && isMaskPresent)) && isImageLoaded;


  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('retouchTitle')}</h3>
      
      {/* Selection Mode Toggle */}
      <div className="w-full flex flex-col items-center gap-3">
        <label className="text-sm font-medium text-gray-400">{t('retouchSelectionMode')}</label>
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
        </div>
      </div>
      
      {/* Brush Controls - only shown in brush mode */}
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

      <p className="text-sm text-gray-400 text-center">
        {t('retouchDescription')}
      </p>
      
      <form onSubmit={(e) => { e.preventDefault(); onApplyRetouch(); }} className={`w-full flex-col items-center gap-3 ${selectionMode === 'point' ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-full flex items-center gap-2">
            <input
              ref={promptInputRef}
              type="text"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={canType ? t('retouchPlaceholderGenerative') : t('retouchPlaceholder')}
              className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
              disabled={isLoading || !canType}
            />
            <button
              type="submit"
              className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
              disabled={isLoading || !prompt.trim() || !canGenerate}
            >
              {t('generate')}
            </button>
        </div>

        {/* AI Removal Section - only shown in brush mode */}
        {selectionMode === 'brush' && isImageLoaded && (
          <div className="w-full flex flex-col gap-3 animate-fade-in">
              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">{t('orSeparator')}</span>
                  <div className="flex-grow border-t border-white/10"></div>
              </div>
              <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-gray-300 text-center">{t('retouchRemovalTitle')}</h4>
                  <div className="grid grid-cols-3 gap-2">
                      {removalPresets.map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handlePresetClick(preset.prompt)}
                          disabled={isLoading || !isImageLoaded || !isMaskPresent}
                          className="w-full h-20 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          title={preset.name}
                        >
                          {React.cloneElement(preset.icon, { className: 'w-6 h-6 text-gray-300' })}
                          <span className="leading-tight">{preset.name}</span>
                        </button>
                      ))}
                  </div>
              </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default RetouchPanel;