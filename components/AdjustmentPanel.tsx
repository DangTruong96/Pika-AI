/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');

  const adjustmentPresets = [
    { name: t('adjustmentPreset1'), prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: t('adjustmentPreset2'), prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: t('adjustmentPreset3'), prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: t('adjustmentPreset4'), prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ];
  
  const backgroundPresets = [
    { name: t('adjustmentBgRemove'), prompt: 'Accurately remove the background from this image, making it transparent. The output must be a PNG file.' },
    { name: t('adjustmentBgWhite'), prompt: 'Accurately segment the main subject from the background and place it on a solid, clean white background.' },
    { name: t('adjustmentBgBlue'), prompt: 'Accurately segment the main subject from the background and place it on a solid, professional blue background, suitable for a profile picture.' },
    { name: t('adjustmentBgGreen'), prompt: 'Accurately segment the main subject from the background and place it on a solid green screen background.' },
    { name: t('adjustmentBgBlack'), prompt: 'Accurately segment the main subject from the background and place it on a solid, clean black background.' },
  ];
  
  const restorationPresets = [
      { name: t('adjustmentUpscale2x'), prompt: "Enhance and upscale the image to twice its original resolution (2x). Increase sharpness and detail, but do not add, remove, or change any content." },
      { name: t('adjustmentUpscale4x'), prompt: "Enhance and upscale the image to four times its original resolution (4x). Dramatically increase sharpness and detail, but do not add, remove, or change any content. The result should be photorealistic." },
      { name: t('adjustmentFaceRestore'), prompt: "Restore and enhance any faces in this image. Increase sharpness, clarity, and detail in all facial features. Correct for blur, compression artifacts, and low resolution to achieve a natural, photorealistic result. Do not alter the person's identity or fundamental features." }
  ];

  const handleApplyCustom = () => {
    if (customPrompt) {
      onApplyAdjustment(customPrompt);
      setCustomPrompt('');
    }
  };
  
  const handlePresetClick = (prompt: string) => {
    setCustomPrompt(''); // Clear custom prompt when a preset is used
    onApplyAdjustment(prompt);
  }

  return (
    <div className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-lg">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('adjustmentTitle')}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {adjustmentPresets.map(preset => (
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
        <span className="flex-shrink mx-4 text-gray-300 text-sm font-medium">{t('adjustmentBackgroundTitle')}</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {backgroundPresets.map(preset => (
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
        <span className="flex-shrink mx-4 text-gray-300 text-sm font-medium">{t('adjustmentRestorationTitle')}</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {restorationPresets.map(preset => (
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
          placeholder={t('adjustmentPlaceholder')}
          className="flex-grow bg-black/20 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !customPrompt.trim()}
        >
          {t('applyAdjustment')}
        </button>
      </form>
    </div>
  );
};

export default AdjustmentPanel;