/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { MakeupIcon, FaceSlimIcon, BlemishRemovalIcon, SparklesIcon } from './icons';

interface BeautyPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

const BeautyPanel: React.FC<BeautyPanelProps> = ({ onApplyAdjustment, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();

  const beautyPresets = [
    {
      name: t('beautyApplyMakeup'),
      prompt: "Analyze the person's face and apply natural, flattering makeup. Enhance the eyes with subtle eyeliner and mascara, add a touch of color to the cheeks, and apply a suitable lipstick color. The result should be realistic and enhance their features.",
      icon: <MakeupIcon />
    },
    {
      name: t('beautySlimFace'),
      prompt: "Subtly and realistically slim the person's face and jawline. The change should be very slight and natural, preserving their identity. Do not make any other changes.",
      icon: <FaceSlimIcon />
    },
    {
      name: t('beautyRemoveBlemishes'),
      prompt: "You are an expert retoucher. Your task is to remove any temporary skin blemishes, like pimples or acne, from the person's face. The result must be photorealistic. Preserve the natural skin texture, including pores and fine lines. Do not smooth the skin excessively or give it a plastic look.",
      icon: <BlemishRemovalIcon />
    },
    {
      name: t('beautyRemoveFreckles'),
      prompt: "You are an expert retoucher. Your task is to completely remove all freckles from the person's skin, while preserving a completely natural skin texture. The result should be realistic and should not look airbrushed.",
      icon: <SparklesIcon />
    }
  ];

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('beautyTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('beautyDescription')}</p>
      
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
        {beautyPresets.map(preset => (
          <button
            key={preset.name}
            onClick={() => onApplyAdjustment(preset.prompt)}
            disabled={isLoading || !isImageLoaded}
            className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={preset.name}
          >
            {React.cloneElement(preset.icon, { className: 'w-8 h-8 text-gray-300' })}
            <span className="leading-tight">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BeautyPanel;
