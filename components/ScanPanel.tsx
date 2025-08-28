/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

export type Enhancement = 'color' | 'grayscale' | 'bw';

interface ScanPanelProps {
  onApplyScan: (mode: 'auto' | 'manual', enhancement: Enhancement, removeShadows: boolean) => void;
  isLoading: boolean;
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onApplyScan, isLoading }) => {
  const { t } = useTranslation();
  const [enhancement, setEnhancement] = useState<Enhancement>('color');
  const [removeShadows, setRemoveShadows] = useState<boolean>(false);

  const enhancementOptions: { name: string; value: Enhancement }[] = [
    { name: t('scanColor'), value: 'color' },
    { name: t('scanGrayscale'), value: 'grayscale' },
    { name: t('scanBW'), value: 'bw' },
  ];

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">{t('scanTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('scanDescription')}</p>
      
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        {/* Enhancement & Shadow Controls */}
        <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium text-gray-400">{t('scanEnhancement')}:</span>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-black/20 p-1">
              {enhancementOptions.map(({ name, value }) => (
                <button
                  key={value}
                  onClick={() => setEnhancement(value)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    enhancement === value 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-transparent hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                  type="checkbox"
                  id="remove-shadows-checkbox"
                  checked={removeShadows}
                  onChange={(e) => setRemoveShadows(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 ring-offset-gray-800 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="remove-shadows-checkbox" className="text-sm font-medium text-gray-300 cursor-pointer">
                  {t('scanRemoveShadows')}
              </label>
            </div>
        </div>

        <div className="w-full max-w-xs border-t border-gray-700/80 my-1"></div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          <button
            onClick={() => onApplyScan('auto', enhancement, removeShadows)}
            disabled={isLoading}
            className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            {t('scanAuto')}
          </button>
          <button
            onClick={() => onApplyScan('manual', enhancement, removeShadows)}
            disabled={isLoading}
            className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            {t('scanApply')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanPanel;