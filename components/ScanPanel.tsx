/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import type { Enhancement } from '../services/geminiService';

interface ScanPanelProps {
  onApplyScan: (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  scanHistory: string[];
  onReviewScan: (url: string) => void;
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onApplyScan, isLoading, isImageLoaded, scanHistory, onReviewScan }) => {
  const { t } = useTranslation();
  const [enhancement, setEnhancement] = useState<Enhancement>('color');
  const [removeShadows, setRemoveShadows] = useState<boolean>(true);
  const [restoreText, setRestoreText] = useState<boolean>(false);

  const enhancementOptions: { name: string; value: Enhancement }[] = [
    { name: t('scanColor'), value: 'color' },
    { name: t('scanGrayscale'), value: 'grayscale' },
    { name: t('scanBW'), value: 'bw' },
  ];

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('scanTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('scanDescription')}</p>
      
      <div className="flex flex-col items-start justify-center gap-4 w-full">
        <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-sm font-medium text-gray-300">{t('scanEnhancement')}:</span>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-black/30 p-1">
              {enhancementOptions.map(({ name, value }) => (
                <button
                  key={value}
                  onClick={() => setEnhancement(value)}
                  disabled={isLoading || !isImageLoaded}
                  className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    enhancement === value 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-start gap-2 pt-2 self-stretch pl-8">
              <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="remove-shadows-checkbox"
                    checked={removeShadows}
                    onChange={(e) => setRemoveShadows(e.target.checked)}
                    disabled={isLoading || !isImageLoaded}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 ring-offset-gray-900 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor="remove-shadows-checkbox" className="text-sm font-medium text-gray-300 cursor-pointer">
                    {t('scanRemoveShadows')}
                </label>
              </div>
              <div className="flex items-start gap-2" title={t('scanRestoreTextTooltip')}>
                <input
                    type="checkbox"
                    id="restore-text-checkbox"
                    checked={restoreText}
                    onChange={(e) => setRestoreText(e.target.checked)}
                    disabled={isLoading || !isImageLoaded}
                    className="w-4 h-4 mt-0.5 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 ring-offset-gray-900 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor="restore-text-checkbox" className="text-sm font-medium text-gray-300 cursor-pointer">
                    {t('scanRestoreText')} <span className="text-xs text-cyan-400">(Beta)</span>
                </label>
              </div>
            </div>
        </div>

        <button
          onClick={() => onApplyScan(enhancement, removeShadows, restoreText)}
          disabled={isLoading || !isImageLoaded}
          className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10 self-center"
        >
          {t('scanAuto')}
        </button>
      </div>

      {scanHistory.length > 0 && (
        <>
          <div className="relative flex py-2 items-center w-full">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-300 font-semibold">{t('scanHistoryTitle')}</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          <div className="w-full flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {scanHistory.map((url, index) => (
              <button
                key={index}
                onClick={() => onReviewScan(url)}
                disabled={isLoading}
                className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ring-2 ring-transparent hover:ring-cyan-400 focus:ring-cyan-400 focus:outline-none group disabled:opacity-50"
                title={`${t('scanHistoryReview')} ${index + 1}`}
              >
                <img src={url} alt={`${t('scanHistoryReview')} ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ScanPanel;