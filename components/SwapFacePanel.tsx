/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UploadIcon } from './icons';

interface SwapFacePanelProps {
  onApplySwap: (targetFace: File) => void;
  isLoading: boolean;
}

const SwapFacePanel: React.FC<SwapFacePanelProps> = ({ onApplySwap, isLoading }) => {
  const { t } = useTranslation();
  const [targetFace, setTargetFace] = useState<File | null>(null);
  const [targetFaceUrl, setTargetFaceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (targetFace) {
      const url = URL.createObjectURL(targetFace);
      setTargetFaceUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setTargetFaceUrl(null);
    }
  }, [targetFace]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTargetFace(e.target.files[0]);
    }
  };

  const handleApply = () => {
    if (targetFace) {
      onApplySwap(targetFace);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">{t('swapFaceTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('swapFaceDescription')}</p>

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <label htmlFor="face-upload-input" className="w-full cursor-pointer">
          <div className={`relative w-full h-48 border-2 ${targetFace ? 'border-blue-500' : 'border-dashed border-gray-600'} rounded-lg flex items-center justify-center transition-colors hover:border-blue-400`}>
            {targetFaceUrl ? (
              <img src={targetFaceUrl} alt="New face preview" className="w-full h-full object-contain rounded-md p-1" />
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                <UploadIcon className="w-8 h-8" />
                <span>{t('swapFaceUploadPrompt')}</span>
              </div>
            )}
          </div>
        </label>
        <input id="face-upload-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        
        <button
          onClick={handleApply}
          disabled={isLoading || !targetFace}
          className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          {t('swapFaceApply')}
        </button>
      </div>
    </div>
  );
};

export default SwapFacePanel;
