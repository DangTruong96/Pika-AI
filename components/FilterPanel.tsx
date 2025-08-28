/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: t('filterPreset1'), prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: t('filterPreset2'), prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: t('filterPreset3'), prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: t('filterPreset4'), prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  const handleApplyCustom = () => {
    if (customPrompt) {
        onApplyFilter(customPrompt);
        setCustomPrompt('');
    }
  };

  const handlePresetClick = (prompt: string) => {
    setCustomPrompt(''); // Clear custom prompt when a preset is used
    onApplyFilter(prompt);
  }

  return (
    <div className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-lg">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('filterTitle')}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className="w-full text-center bg-white/5 border border-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">Or</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApplyCustom(); }} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t('filterPlaceholder')}
          className="flex-grow bg-black/20 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !customPrompt.trim()}
        >
          {t('applyFilter')}
        </button>
      </form>
    </div>
  );
};

export default FilterPanel;