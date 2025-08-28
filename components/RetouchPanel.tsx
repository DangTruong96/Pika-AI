/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BullseyeIcon, BrushIcon } from './icons';

export type SelectionMode = 'point' | 'brush';
export type BrushMode = 'draw' | 'erase';

interface RetouchPanelProps {
  onApplyRetouch: (prompt: string) => void;
  isLoading: boolean;
  isHotspotSelected: boolean;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  brushMode: BrushMode;
  onBrushModeChange: (mode: BrushMode) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
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
}) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt) {
      onApplyRetouch(prompt);
      setPrompt('');
    }
  };

  const isPointModeReady = selectionMode === 'point' && isHotspotSelected;
  const isBrushModeReady = selectionMode === 'brush'; // Ready as soon as brush mode is selected
  const canType = isPointModeReady || isBrushModeReady;

  return (
    <div className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-lg">
      <h3 className="text-lg font-semibold text-gray-200">{t('retouchTitle')}</h3>
      
      {/* Selection Mode Toggle */}
      <div className="w-full flex flex-col items-center gap-3">
        <label className="text-sm font-medium text-gray-400">{t('retouchSelectionMode')}</label>
        <div className="p-1 bg-black/20 rounded-lg flex gap-1">
          <button 
            onClick={() => onSelectionModeChange('point')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${selectionMode === 'point' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <BullseyeIcon className="w-5 h-5" /> {t('retouchModePoint')}
          </button>
          <button 
            onClick={() => onSelectionModeChange('brush')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${selectionMode === 'brush' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <BrushIcon className="w-5 h-5" /> {t('retouchModeBrush')}
          </button>
        </div>
      </div>
      
      {/* Brush Controls - only shown in brush mode */}
      {selectionMode === 'brush' && (
        <div className="w-full bg-black/20 border border-white/10 rounded-lg p-3 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-400">{t('retouchBrushTool')}</label>
            <div className="p-1 bg-black/20 rounded-lg flex gap-1">
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <button onClick={onClearMask} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors self-center">{t('retouchClearMask')}</button>
        </div>
      )}

      <p className="text-sm text-gray-400 text-center">
        {selectionMode === 'point' && (isHotspotSelected ? t('retouchPromptClicked') : t('retouchPrompt'))}
        {selectionMode === 'brush' && t('retouchPromptBrush')}
      </p>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={canType ? t('retouchPlaceholderClicked') : t('retouchPlaceholder')}
          className="flex-grow bg-black/20 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading || !canType}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !prompt.trim() || !canType}
        >
          {t('generate')}
        </button>
      </form>
    </div>
  );
};

export default RetouchPanel;