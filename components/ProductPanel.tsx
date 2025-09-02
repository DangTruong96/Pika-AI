/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { RemoveBgIcon, SunIcon, PaletteIcon } from './icons';

interface ProductPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyScene: () => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

const ProductPanel: React.FC<ProductPanelProps> = ({ 
    onApplyAdjustment, 
    onApplyScene,
    isLoading, 
    isImageLoaded,
    prompt,
    onPromptChange
}) => {
  const { t } = useTranslation();

  const cleanupPresets = [
    { 
      name: t('productBgRemove'), 
      prompt: "Accurately segment the main product from the background and place it on a solid, clean white background, suitable for e-commerce.", 
      icon: <RemoveBgIcon /> 
    },
    { 
      name: t('productImproveLighting'), 
      prompt: "You are an expert product photographer. Your task is to automatically and realistically improve the lighting on this product. Analyze the brightness, contrast, shadows, and highlights. Adjust them to create a balanced, well-lit image with good dynamic range that makes the product look appealing. Do not alter colors or the background.", 
      icon: <SunIcon /> 
    },
    { 
      name: t('productEnhanceColors'), 
      prompt: "You are an expert product photographer. Your task is to automatically and realistically enhance the colors of the product in this image. Improve the vibrancy and saturation to make the product's colors pop, but avoid oversaturation. Correct any minor color casts to achieve an accurate and appealing color balance. Do not alter lighting, contrast, or the background.", 
      icon: <PaletteIcon /> 
    },
  ];
  
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
        onApplyScene();
    }
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
        <h3 className="text-lg font-semibold text-gray-200">{t('productTitle')}</h3>
        <p className="text-sm text-gray-400 -mt-2 text-center">{t('productDescription')}</p>

        {/* Product Cleanup Section */}
        <div className="w-full bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-3">
            <h4 className="font-semibold text-center text-gray-200">{t('productCleanupTitle')}</h4>
            <div className="grid grid-cols-3 gap-2">
            {cleanupPresets.map(preset => (
                <button
                    key={preset.name}
                    onClick={() => onApplyAdjustment(preset.prompt)}
                    disabled={isLoading || !isImageLoaded}
                    className="w-full flex flex-col items-center justify-center text-center gap-2 bg-white/5 border border-white/10 text-gray-200 font-semibold py-3 px-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={preset.name}
                >
                {React.cloneElement(preset.icon, { className: 'w-8 h-8 text-gray-300' })}
                <span className="leading-tight">{preset.name}</span>
                </button>
            ))}
            </div>
        </div>

        <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">{t('orSeparator')}</span>
            <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Scene Generation Section */}
        <div className="w-full flex flex-col gap-2">
             <div className="text-center">
                <h4 className="font-semibold text-gray-200">{t('productSceneGenTitle')}</h4>
                <p className="text-xs text-gray-400">{t('productSceneGenDesc')}</p>
             </div>
            <form onSubmit={handleApply} className="w-full flex flex-col items-center gap-3">
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={t('productPlaceholder')}
                    className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10 h-24 resize-none"
                    disabled={isLoading || !isImageLoaded}
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    disabled={isLoading || !prompt.trim() || !isImageLoaded}
                >
                    {t('productApply')}
                </button>
            </form>
        </div>
    </div>
  );
};

export default ProductPanel;
