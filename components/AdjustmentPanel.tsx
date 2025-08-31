/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Corrected a syntax error in the import statement to properly import `useState`.
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
    MagicWandIcon, UserCircleIcon, CloudIcon, PhotoIcon, ArrowPathIcon, ChevronUpIcon,
    BlurBackgroundIcon, SharpenIcon, TemperatureIcon, SpotlightIcon, FaceRestoreIcon, 
    SmileIcon, EyeIcon, SunIcon, MoonIcon, RemoveBgIcon, UpscaleIcon, SparklesIcon, PaletteIcon
} from './icons';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, isOpen, onToggle }) => {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left text-gray-200 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <ChevronUpIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </button>
      {isOpen && (
        <div className="p-3 border-t border-white/10 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};


const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string | null>('pro');

  const oneClickFixes = [
    { 
      name: t('oneClickAutoEnhance'), 
      prompt: "Perform a professional, automatic enhancement on this image. Your goal is to make it look as good as possible while maintaining photorealism. Adjust the following aspects as needed: \n- **Lighting & Contrast:** Balance brightness, contrast, shadows, and highlights to improve overall dynamic range. \n- **Color Correction:** Correct any color casts, enhance vibrancy and saturation naturally, and ensure accurate skin tones if people are present. \n- **Sharpness & Clarity:** Increase sharpness and local contrast to make details pop, but avoid over-sharpening or creating halos. \n- **Noise Reduction:** Subtly reduce any digital noise if present. \n The final result should be a clean, vibrant, and well-balanced version of the original image.", 
      icon: <SparklesIcon /> 
    },
    { 
      name: t('oneClickFixLighting'), 
      prompt: "You are an expert photo editor. Your task is to automatically and realistically improve the lighting of this image. Analyze the brightness, contrast, shadows, and highlights. Adjust them to create a balanced, well-lit image with good dynamic range. Do not alter colors or content. The result should look natural, as if it were shot in better lighting conditions.", 
      icon: <SunIcon /> 
    },
    { 
      name: t('oneClickBoostColor'), 
      prompt: "You are an expert photo editor. Your task is to automatically and realistically enhance the colors in this image. Improve the vibrancy and saturation to make the colors pop, but avoid oversaturation. Correct any minor color casts to achieve a natural and appealing color balance. Do not alter lighting, contrast, or content.", 
      icon: <PaletteIcon /> 
    },
    { 
      name: t('oneClickIncreaseClarity'), 
      prompt: "You are an expert photo editor. Your task is to automatically and realistically increase the clarity and sharpness of this image. Enhance local contrast and fine details to make the image appear crisper. Apply sharpening carefully to avoid creating halos or digital artifacts. Do not alter colors, lighting, or content.", 
      icon: <SharpenIcon /> 
    },
  ];

  const adjustmentPresets = [
    { name: t('adjustmentPreset1'), prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.', icon: <BlurBackgroundIcon /> },
    { name: t('adjustmentPreset2'), prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.', icon: <SharpenIcon /> },
    { name: t('adjustmentPreset3'), prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.', icon: <TemperatureIcon /> },
    { name: t('adjustmentPreset4'), prompt: 'Add dramatic, professional studio lighting to the main subject.', icon: <SpotlightIcon /> },
  ];
  
  const portraitPresets = [
    { name: t('adjustmentPortraitPreset1'), prompt: "Perform a subtle and photorealistic skin smoothing on any faces in the image. Reduce minor blemishes and wrinkles but preserve natural skin texture. Do not make the skin look plastic or artificial.", icon: <FaceRestoreIcon /> },
    { name: t('adjustmentPortraitPreset2'), prompt: "Subtly and realistically alter the expression of the main person in the photo to show a gentle, closed-mouth smile. The change should be believable and natural.", icon: <SmileIcon /> },
    { name: t('adjustmentPortraitPreset3'), prompt: "Slightly enhance the eyes of any person in the photo. Increase sharpness, brightness, and add a subtle sparkle to the pupils to make them more expressive, while keeping the result photorealistic.", icon: <EyeIcon /> }
  ];

  const skyPresets = [
    { name: t('adjustmentSkyPreset1'), prompt: "Realistically replace the sky in the image with a beautiful, dramatic sunset sky. Ensure the lighting on the rest of the image is adjusted to match the new sunset lighting.", icon: <SunIcon /> },
    { name: t('adjustmentSkyPreset2'), prompt: "Realistically replace the sky in the image with a clear, bright blue sky with a few wispy clouds. Ensure the lighting on the rest of the image is adjusted to match the new daytime lighting.", icon: <CloudIcon /> },
    { name: t('adjustmentSkyPreset3'), prompt: "Realistically replace the sky in the image with a clear, dark night sky full of stars. Ensure the lighting on the rest of the image is adjusted to match the new nighttime lighting.", icon: <MoonIcon /> }
  ];

  const backgroundPresets = [
    { name: t('adjustmentBgRemove'), prompt: 'Accurately remove the background from this image, making it transparent. The output must be a PNG file.', icon: <RemoveBgIcon /> },
    { name: t('adjustmentBgWhite'), prompt: 'Accurately segment the main subject from the background and place it on a solid, clean white background.', icon: <PhotoIcon /> },
    { name: t('adjustmentBgBlue'), prompt: 'Accurately segment the main subject from the background and place it on a solid, professional blue background, suitable for a profile picture.', icon: <PhotoIcon /> },
    { name: t('adjustmentBgGreen'), prompt: 'Accurately segment the main subject from the background and place it on a solid green screen background.', icon: <PhotoIcon /> },
    { name: t('adjustmentBgBlack'), prompt: 'Accurately segment the main subject from the background and place it on a solid, clean black background.', icon: <PhotoIcon /> },
  ];
  
  const restorationPresets = [
      { name: t('adjustmentUpscale2x'), prompt: "Perform a technical 2x upscale of this image.\n\n**INSTRUCTIONS:**\n1. Double the image's resolution (width and height).\n2. Enhance the sharpness and clarity of ONLY the details that are already present.\n3. The final image content MUST be IDENTICAL to the original.\n\n**FORBIDDEN ACTIONS:**\n- DO NOT add new objects.\n- DO NOT remove existing objects.\n- DO NOT alter colors or lighting.\n- **DO NOT change any person's face or identity.**\n\nThink of this as a high-quality resolution boost, not a creative edit.", icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale4x'), prompt: "Perform a technical 4x upscale of this image.\n\n**INSTRUCTIONS:**\n1. Quadruple the image's resolution (width and height).\n2. Enhance the sharpness and clarity of ONLY the details that are already present.\n3. The final image content MUST be IDENTICAL to the original.\n\n**FORBIDDEN ACTIONS:**\n- DO NOT add new objects.\n- DO NOT remove existing objects.\n- DO NOT alter colors or lighting.\n- **DO NOT change any person's face or identity.**\n\nThink of this as a high-quality resolution boost, not a creative edit.", icon: <UpscaleIcon /> },
      { name: t('adjustmentFaceRestore'), prompt: "You are a technical photo restoration tool. Your ONLY task is to enhance the face(s) in this image.\n\n**OBJECTIVE:**\n- Increase sharpness, clarity, and detail.\n- Correct blur and low resolution.\n- Make the existing person look like they were photographed with a better camera.\n\n**ABSOLUTELY FORBIDDEN:**\n- **DO NOT CHANGE THE PERSON'S IDENTITY.**\n- **DO NOT CHANGE THE SHAPE OF THE FACE, EYES, NOSE, OR MOUTH.**\n- **DO NOT CHANGE THEIR ETHNICITY.**\n- **DO NOT 'BEAUTIFY' OR ALTER FEATURES.**\n- **DO NOT ADD MAKEUP.**\n\nThe final result **MUST** be the **EXACT SAME PERSON**, just clearer. Preserving identity is the most critical rule.", icon: <FaceRestoreIcon /> }
  ];

  const handlePresetClick = (prompt: string) => {
    onApplyAdjustment(prompt);
  }

  const handleToggleSection = (sectionId: string) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };
  
  const SECTIONS = [
    { id: 'pro', title: t('adjustmentProTitle'), icon: <MagicWandIcon className="w-5 h-5 text-cyan-400" />, presets: adjustmentPresets, columns: 4 },
    { id: 'portrait', title: t('adjustmentPortraitTitle'), icon: <UserCircleIcon className="w-5 h-5 text-cyan-400" />, presets: portraitPresets, columns: 3 },
    { id: 'sky', title: t('adjustmentSkyTitle'), icon: <CloudIcon className="w-5 h-5 text-cyan-400" />, presets: skyPresets, columns: 3 },
    { id: 'background', title: t('adjustmentBackgroundTitle'), icon: <PhotoIcon className="w-5 h-5 text-cyan-400" />, presets: backgroundPresets, columns: 5 },
    { id: 'restoration', title: t('adjustmentRestorationTitle'), icon: <ArrowPathIcon className="w-5 h-5 text-cyan-400" />, presets: restorationPresets, columns: 3 },
  ];

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('adjustmentTitle')}</h3>
      
      <div className="w-full bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-3">
        <h4 className="font-semibold text-center text-gray-200">{t('oneClickTitle')}</h4>
        <div className="grid grid-cols-2 gap-2">
          {oneClickFixes.map(fix => (
            <button
              key={fix.name}
              onClick={() => handlePresetClick(fix.prompt)}
              disabled={isLoading || !isImageLoaded}
              className="w-full flex flex-col items-center justify-center text-center gap-2 bg-white/5 border border-white/10 text-gray-200 font-semibold py-3 px-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={fix.name}
            >
              {React.cloneElement(fix.icon, { className: 'w-8 h-8 text-gray-300' })}
              <span className="leading-tight">{fix.name}</span>
            </button>
          ))}
        </div>
      </div>

      {SECTIONS.map(({ id, title, icon, presets, columns }) => (
        <CollapsibleSection
          key={id}
          title={title}
          icon={icon}
          isOpen={openSection === id}
          onToggle={() => handleToggleSection(id)}
        >
          <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-2`}>
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.prompt)}
                disabled={isLoading || !isImageLoaded}
                className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title={preset.name}
              >
                {React.cloneElement(preset.icon, { className: 'w-7 h-7 text-gray-300' })}
                <span className="leading-tight">{preset.name}</span>
              </button>
            ))}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default AdjustmentPanel;