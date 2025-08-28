/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:4' | '3:2' | '2:3';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const { t } = useTranslation();
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: AspectRatio, label: string, value: number | undefined }[] = [
    { name: 'free', label: t('cropAspectFree'), value: undefined },
    { name: '1:1', label: '1:1', value: 1 / 1 },
    { name: '16:9', label: '16:9', value: 16 / 9 },
    { name: '4:3', label: '4:3', value: 4 / 3 },
    { name: '3:4', label: '3:4', value: 3 / 4 },
    { name: '3:2', label: '3:2', value: 3 / 2 },
    { name: '2:3', label: '2:3', value: 2 / 3 }, // Equivalent to 4:6
  ];

  return (
    <div className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-lg">
      <h3 className="text-lg font-semibold text-gray-200">{t('cropTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2">{t('cropDescription')}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-300">{t('cropAspectRatio')}:</span>
        {aspects.map(({ name, label, value }) => (
          <button
            key={name}
            onClick={() => handleAspectChange(name, value)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              activeAspect === name 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30' 
              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        {t('applyCrop')}
      </button>
    </div>
  );
};

export default CropPanel;