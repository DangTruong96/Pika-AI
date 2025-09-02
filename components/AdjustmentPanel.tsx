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

  // Fix: Removed explicit type annotations to allow TypeScript to correctly infer icon component props,
  // resolving the `React.cloneElement` type errors.
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
      prompt: "You are a professional photo restoration AI. Your task is to dramatically and realistically increase the clarity, sharpness, and fine detail of this image. Enhance local contrast to make textures and edges pop. Apply intelligent sharpening to make the entire image appear crisper and more defined, as if it were taken with a higher-quality lens. The result should be noticeably sharper than the original, but avoid creating artificial halos or a 'digital' look. Do not alter the fundamental colors, lighting, or content of the image.", 
      icon: <SharpenIcon /> 
    },
  ];

  const adjustmentPresets = [
    { name: t('adjustmentPreset1'), prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.', icon: <BlurBackgroundIcon /> },
    { name: t('adjustmentPreset2'), prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.', icon: <SharpenIcon /> },
    { name: t('adjustmentPreset3'), prompt: 'Adjust the color temperature to give the image a warmer, golden-hour style lighting.', icon: <TemperatureIcon /> },
    { name: t('adjustmentPreset4'), prompt: 'Add dramatic, professional studio lighting to the main subject.', icon: <SpotlightIcon /> },
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
      { name: t('adjustmentUpscale2x'), prompt: `**TASK: 2x AI Restoration & Detail Enhancement**

**OBJECTIVE:** Perform a high-quality 2x upscale, focusing on restoring and enhancing fine details for a visibly clearer and sharper result. The output should look like a better, cleaner version of the original photograph.

**CRITICAL RULE: PRESERVE CONTENT & IDENTITY**
The final image content **MUST** be identical to the original. Do not add, remove, or change any objects or elements. If people are present, their facial structure, features, and identity **MUST BE PERFECTLY PRESERVED**. This is a technical restoration, not a creative alteration.

**INSTRUCTIONS:**
1.  **Analyze Image:** Identify areas with softness, blur, digital noise, or compression artifacts.
2.  **Restore & Enhance Details:** Intelligently increase sharpness and local contrast to make the image noticeably crisper. **Your primary goal is to recover and clarify existing details.** Bring out fine textures like skin pores, hair strands, fabric weaves, and environmental surfaces.
3.  **Clean Up:** Subtly remove digital noise and compression artifacts without over-smoothing or losing natural texture.
4.  **Maintain Photorealism:** The result must look natural. Avoid any artificial, over-sharpened appearance or glowing halos.

**OUTPUT:**
Return only the restored image. It must be a visibly sharper, cleaner, and more detailed version of the original.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale4x'), prompt: `**TASK: 4x AI Super-Resolution & Restoration**

**OBJECTIVE:** Perform an intense 4x upscale, pushing detail to its maximum realistic potential. The result should be dramatically sharper and clearer, as if shot with a much higher-resolution camera.

**CRITICAL RULE: PRESERVE CONTENT & IDENTITY**
The final image content **MUST** be identical to the original. Do not add, remove, or change any objects or elements. If people are present, their facial structure, features, and identity **MUST BE PERFECTLY PRESERVED**. This is a technical restoration, not a creative alteration.

**INSTRUCTIONS:**
1.  **Deep Analysis:** Perform a deep analysis of the image to identify all areas with blur, softness, noise, or compression artifacts.
2.  **Maximize & Reconstruct Details:** Aggressively increase sharpness and local contrast. Where detail is lost, **intelligently reconstruct plausible, fine-grained textures** that are consistent with the original image. The goal is to bring out the finest details possible, such as individual skin pores, fabric threads, and distant environmental textures. The result MUST be significantly sharper than the original.
3.  **Pristine Cleanup:** Completely eliminate all digital noise and compression artifacts, resulting in a pristine image.
4.  **Maintain Photorealism:** Despite the intense enhancement, the result must look like a real photograph. Avoid creating an overly digital, "fried," or artificial look with excessive halos.

**OUTPUT:**
Return only the restored image. It must be a maximally crisp, clear, and visibly superior version of the original.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale8x'), prompt: `**TASK: 8x Ultimate AI Gigapixel Restoration**

**OBJECTIVE:** Perform an EXTREME, MAXIMUM-EFFORT restoration to create a final image that appears to be at EIGHT TIMES its original resolution. The quality increase must be dramatic and immediately obvious. Your goal is to maximize sharpness, **creatively invent plausible, high-frequency details where none existed**, eliminate all digital artifacts, and define textures with unparalleled, hyper-realistic clarity.

**CRITICAL RULE: PRESERVE CONTENT & IDENTITY**
The final image content **MUST** be identical to the original. Do not add, remove, or change any objects or elements. If people are present, their facial structure, features, and identity **MUST BE PERFECTLY PRESERVED**. The output must be the same person, just in ultra-high definition. This is a technical restoration, not a creative alteration.

**INSTRUCTIONS:**
1.  **Forensic Analysis:** Deeply analyze the image for any blur, softness, noise, or compression artifacts at a microscopic level.
2.  **Invent & Maximize Details:** This goes beyond sharpening. You must intelligently **generate and invent realistic micro-details** that would be present in a higher-resolution photograph. Push sharpness and local contrast to their absolute maximum realistic potential. The result MUST be vastly sharper than the original. Bring out the finest details imaginable, such as individual threads on clothing, subtle skin imperfections, distant foliage textures, and complex material patterns.
3.  **Eliminate All Artifacts:** Completely remove all digital noise, color banding, and compression artifacts. The output must be absolutely pristine.
4.  **Maintain Hyper-Realism:** Despite the extreme enhancement, the result must look like a real photograph taken with a very high-end, large-format camera. Avoid any digital, "overcooked," or artificial appearance with excessive halos.

**OUTPUT:**
Return only the restored image. It must be a maximally crisp, clear, and vastly superior version of the original.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentFaceRestore'), prompt: `**TASK: High-Definition Face Restoration**

**OBJECTIVE:** Restore all faces in the image to a dramatically higher quality. The goal is to make them look as if captured with a professional, high-resolution camera, making the result visibly superior to the original.

**CRITICAL RULE: ABSOLUTE IDENTITY PRESERVATION**
The final image **MUST** feature the **EXACT SAME PERSON**. You are forbidden from altering their fundamental facial structure, features (eyes, nose, mouth), age, or ethnicity. This is a technical restoration, not a creative 'beautification' or alteration. The output must be the same person, just in high definition.

**INSTRUCTIONS:**
1.  **Analyze Faces:** Identify all faces in the image.
2.  **Dramatically Enhance Detail:** Aggressively increase sharpness and local contrast. The final image should be noticeably sharper than the original. Bring out fine, realistic details like skin texture (pores, fine lines), hair strands, and eye definition.
3.  **Deblur & Denoise:** Remove all motion blur, focus issues, pixelation, and compression artifacts to achieve a crisp, clean result.
4.  **Maintain Realism:** The result must look natural and photorealistic. Avoid an artificial, 'airbrushed', or 'plastic' look. The original skin texture should be enhanced, not erased.

**OUTPUT:**
Return only the restored image. It must be a crisp, clear, and visibly more detailed version of the original.`, icon: <FaceRestoreIcon /> }
  ];

  const handlePresetClick = (prompt: string) => {
    onApplyAdjustment(prompt);
  }

  const handleToggleSection = (sectionId: string) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };
  
  const SECTIONS = [
    { id: 'pro', title: t('adjustmentProTitle'), icon: <MagicWandIcon className="w-5 h-5 text-cyan-400" />, presets: adjustmentPresets, columns: 4 },
    { id: 'sky', title: t('adjustmentSkyTitle'), icon: <CloudIcon className="w-5 h-5 text-cyan-400" />, presets: skyPresets, columns: 3 },
    { id: 'background', title: t('adjustmentBackgroundTitle'), icon: <PhotoIcon className="w-5 h-5 text-cyan-400" />, presets: backgroundPresets, columns: 5 },
    { id: 'restoration', title: t('adjustmentRestorationTitle'), icon: <ArrowPathIcon className="w-5 h-5 text-cyan-400" />, presets: restorationPresets, columns: 4 },
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