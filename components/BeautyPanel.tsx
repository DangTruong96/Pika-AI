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
      prompt: "You are an expert, subtle makeup artist. Your task is to apply **extremely subtle, barely-there, 'no-makeup' makeup**. The goal is to enhance natural beauty without looking like makeup is being worn.\n- **Skin:** Very lightly even out the skin tone. Do NOT apply heavy foundation.\n- **Cheeks:** Add the faintest, most natural hint of a healthy flush.\n- **Eyes:** Do NOT apply noticeable eyeliner or mascara. You may very subtly define the lash line if needed.\n- **Lips:** Apply a sheer, natural color that is very close to the person's own lip shade.\n**CRITICAL:** The result must be extremely natural and light. The person's identity and facial structure MUST be perfectly preserved.",
      icon: <MakeupIcon />
    },
    {
      name: t('beautySlimFace'),
      prompt: "Subtly and realistically slim the person's face and jawline. The change should be very slight and natural, preserving their identity and fundamental facial structure. Do not make any other changes.",
      icon: <FaceSlimIcon />
    },
    {
      name: t('beautyRemoveBlemishes'),
      prompt: "You are an expert retoucher. Your task is to remove any temporary skin blemishes, like pimples or acne, from the person's face. The result must be photorealistic. CRITICAL: Preserve the natural skin texture, including pores and fine lines, and perfectly maintain the person's identity and facial structure. Do not smooth the skin excessively or give it a plastic look.",
      icon: <BlemishRemovalIcon />
    },
    {
      name: t('beautyRemoveFreckles'),
      prompt: "You are an expert retoucher. Your task is to completely remove all freckles from the person's skin. CRITICAL: You must preserve a completely natural skin texture and perfectly maintain the person's identity and facial structure. The result should be realistic and should not look airbrushed.",
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