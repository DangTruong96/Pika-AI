

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Corrected invalid import syntax for React hooks.
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
// Fix: Imported the missing `EyeSlashIcon` component to resolve a compilation error.
import { 
    MagicWandIcon, UserCircleIcon, CloudIcon, PhotoIcon, ArrowPathIcon, ChevronUpIcon,
    BlurBackgroundIcon, SharpenIcon, TemperatureIcon, SpotlightIcon, FaceRestoreIcon, 
    SmileIcon, EyeIcon, SunIcon, MoonIcon, RemoveBgIcon, UpscaleIcon, SparklesIcon, PaletteIcon,
    BlemishRemovalIcon, MakeupIcon, FaceSlimIcon, PostureCorrectionIcon, AdjustmentsIcon, StopCircleIcon, DropletIcon, CircleHalfStrokeIcon, EyeSlashIcon,
    FilmIcon, PaintBrushIcon, SwatchIcon, CpuChipIcon, CameraIcon, WrenchScrewdriverIcon, ViewfinderCircleIcon, Squares2x2Icon, PencilIcon
} from './icons';

interface EnhancePanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyMultipleAdjustments: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

type EnhanceMode = 'oneClick' | 'portrait' | 'color' | 'filters';

// Fix: Changed JSX.Element to React.ReactElement to resolve JSX namespace error.
type AdjustmentPreset = {
  name: string;
  prompt: string;
  icon: React.FC<{ className?: string }>;
  multiple?: boolean;
};

const AdjustmentPanel: React.FC<EnhancePanelProps> = ({ onApplyAdjustment, onApplyFilter, onApplyMultipleAdjustments, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<EnhanceMode>('oneClick');
  const [filterCategory, setFilterCategory] = useState<string>('camera');
  
  const handleApplyCustom = () => {
    if (customPrompt) {
        onApplyAdjustment(customPrompt);
        setCustomPrompt('');
    }
  };

  // Fix: Explicitly typed the presets to match `AdjustmentPreset[]` to resolve the error on `preset.multiple`.
  const oneClickFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      // Fix: Replaced hardcoded prompt with a translation key for consistency.
      { name: t('oneClickAutoEnhance'), prompt: t('oneClickAutoEnhancePrompt'), icon: SparklesIcon },
      { name: t('oneClickFixLighting'), prompt: t('oneClickFixLightingPrompt'), icon: SunIcon },
      { name: t('oneClickBoostColor'), prompt: "Enhance the colors in the image to make them more vibrant and saturated. Boost the saturation and vibrance naturally, without making the colors look unrealistic or oversaturated.", icon: PaletteIcon },
      { name: t('adjustmentUpscale8K'), prompt: 'Upscale the image to 8K resolution (8192 pixels on the longest side), enhancing details and removing artifacts. **CRITICAL MANDATE: ABSOLUTE DYNAMIC IDENTITY INTEGRATION v10.0.** If people are present, their unique facial features, structure, asymmetries, body shape, perceived weight, and identity MUST be perfectly preserved. The upscaling process is forbidden from altering, beautifying, idealizing, or \'balancing\' faces.', icon: UpscaleIcon },
      { name: t('adjustmentFaceRestore'), prompt: t('adjustmentFaceRestorePrompt'), icon: FaceRestoreIcon },
      { name: t('adjustmentFullRestore4K'), prompt: t('adjustmentFullRestore4KPrompt'), icon: SparklesIcon },
    ]
  };

  const portraitEnhancements: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('adjustmentPreset1'), prompt: "Apply a realistic and professional background blur (bokeh) effect. The main subject should remain sharp while the background is smoothly blurred, simulating a photo taken with a wide-aperture lens.", icon: BlurBackgroundIcon },
      { name: t('adjustmentPortraitPreset1'), prompt: `You are an expert retoucher. Your task is to subtly smooth the skin on the person's face.
---
**ADDENDUM: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION PROTOCOL v10.0 (NON-NEGOTIABLE)**
This protocol is a strict, non-negotiable requirement for the final output and overrides all other creative instructions.

1.  **IDENTITY & FACIAL STRUCTURE (HIGHEST PRIORITY):** The output **MUST** feature the **EXACT SAME PERSON**. You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical/balanced (cân đối). You **MUST** perfectly preserve all natural facial asymmetries (e.g., mặt lệch).
2.  **PHYSICAL ATTRIBUTES:** The final perceived weight must be true to the original. Preserve the original body shape and face shape (mặt to/nhỏ).
3.  **CRITICAL FACIAL FEATURES:** You **MUST** meticulously preserve:
    -   **Eyes:** The exact, original eye shape, size, and angle (monolid/mắt một mí, double-lid/mắt hai mí, hooded/mắt híp).
    -   **Nose:** The original nose shape.
    -   **Mouth & Teeth:** Unique dental structures like overbites (răng hô) or snaggle teeth (răng khểnh).
4.  **CRITICAL DETAIL:** Preserve the natural skin texture, including pores and fine lines. The result should be realistic, not plastic or airbrushed.
---`, icon: BlemishRemovalIcon },
      { name: t('adjustmentPortraitPreset2'), prompt: `**AI TASK: CONTEXT-AWARE, HYPER-REALISTIC SMILE GENERATION v3.1**

You are a world-class portrait retoucher AI specializing in creating natural, believable smiles. Your task is to analyze the input photograph and add a contextually appropriate smile to the subject's face.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE DYNAMIC IDENTITY INTEGRATION v10.0:** The output **MUST** feature the **EXACT SAME PERSON**. You are forbidden from altering their fundamental facial structure, perceived weight, asymmetries, or unique features. This is your highest priority.
2.  **PRESERVE UNIQUE DENTAL CHARACTERISTICS:** The underlying structure of the person's teeth (e.g., overbites (răng hô), snaggle teeth (răng khểnh)) **MUST NOT BE 'corrected' or changed**. The smile should reveal their teeth as they naturally are.
3.  **PHOTOGRAPHIC REALISM:** The final image must look like a real photograph.

**EXECUTION PROTOCOL:**
1.  **CONTEXTUAL ANALYSIS:** Analyze the image to determine the most appropriate type of smile (subtle closed-mouth, gentle, or bright).
2.  **SMILE GENERATION & MUSCLE SYNC:**
    -   Generate the chosen smile.
    -   **DUCHENNE SMILE MANDATE:** You **MUST** simultaneously generate a corresponding subtle "squinch" or "crinkle" around the eyes. A smile that only involves the mouth is a failure. This is critical for believability.
3.  **FINAL ENHANCEMENT:** Ensure the entire face looks coherent and sharp.

**OUTPUT:** Return ONLY the final, edited photograph. Do not output any text.`, icon: SmileIcon },
      { name: t('adjustmentPortraitGentleSmile'), prompt: `**AI TASK: SUBTLE & RELAXED SMILE GENERATION v3.3 (ZERO TENSION PROTOCOL)**

You are a world-class portrait retoucher AI specializing in creating the most natural, subtle, and believable smiles. Your task is to add a **very gentle, closed-mouth smile** to the subject's face, focusing on a completely relaxed and authentic appearance. The result should feel like quiet contentment, not an active smile.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE DYNAMIC IDENTITY INTEGRATION v10.0:** The output **MUST** feature the **EXACT SAME PERSON**. You are forbidden from altering their fundamental facial structure, perceived weight, asymmetries, or unique features. This is your highest priority.
2.  **PRESERVE UNIQUE MOUTH/JAW STRUCTURE:** The smile must be closed-mouth. The underlying structure of the person's mouth and jaw must be preserved.
3.  **PHOTOGRAPHIC REALISM:** The final image must look like a real photograph.

**EXECUTION PROTOCOL:**
1.  **SMILE GENERATION & MUSCLE SYNC:**
    -   **LIFT MOUTH CORNERS SLIGHTLY:** Generate a very subtle lift at the corners of the mouth. The change should be minimal.
    -   **ZERO MOUTH TENSION (CRITICAL):** The lips **MUST** remain soft and relaxed. They should not be pressed together, stretched, or show any sign of muscle tension. Avoid creating a forced, "clenched" look. The expression should convey a calm, pleasant feeling.
    -   **DUCHENNE SMILE MANDATE:** You **MUST** simultaneously generate a corresponding subtle "squinch" or "crinkle" around the eyes. A smile that only involves the mouth is a failure. This is critical for believability.
2.  **FINAL ENHANCEMENT:** Ensure the entire face looks coherent and sharp.

**OUTPUT:** Return ONLY the final, edited photograph. Do not output any text.`, icon: SmileIcon },
      { name: t('adjustmentOpenEyes'), prompt: "You are an expert AI photo editor. A person in this photo has their eyes closed. Your task is to realistically open their eyes. CRITICAL: You MUST perfectly preserve the person's identity (v10.0). The new eyes must match the person's unique, original eye shape (e.g., monolid, double-lid, hooded), size, angle, and color. The facial structure and perceived weight must not be altered. The result must be hyper-realistic and completely believable.", icon: EyeSlashIcon },
      { name: t('adjustmentStraightenPosture'), prompt: "You are an expert AI retoucher specializing in anatomy and posture. Analyze the main subject's posture. If they are slouching or their back/neck is not straight, subtly correct their posture to be more upright and confident. The change MUST be realistic and preserve the person's body shape, perceived weight, and identity (v10.0). This may require you to reconstruct parts of their body and the background behind them. The final result must be seamless and natural.", icon: PostureCorrectionIcon },
      { name: t('adjustmentWhitenTeeth'), prompt: "You are an expert photo retoucher. If the person is smiling and showing their teeth, your task is to naturally and subtly whiten their teeth. CRITICAL: The whitening effect must be realistic. Avoid an unnaturally bright, pure white result. The teeth should have a natural, healthy off-white shade. If the person is not showing their teeth, make no changes to the image. This process must not alter the shape or structure of the teeth.", icon: SparklesIcon },
      { name: t('beautySlimFace'), prompt: "Subtly and realistically slim the person's face and jawline. The change should be very slight and natural, preserving their identity and fundamental facial structure (v10.0). The underlying bone structure must not be altered.", icon: FaceSlimIcon },
    ]
  };

  const colorAndTone: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('filterColorCinematic'), prompt: 'Apply a cinematic teal and orange color grade. The shadows should be pushed towards teal/blue, and skin tones should be shifted towards warm orange tones to create a popular, high-contrast cinematic look.', icon: StopCircleIcon },
      { name: t('filterColorMoody'), prompt: 'Apply a moody and atmospheric color grade with desaturated colors, deep shadows, and a slightly cool or green tint for a dramatic, emotional feel.', icon: CloudIcon },
      { name: t('filterColorGolden'), prompt: 'Recreate the warm, soft, and glowing light of the golden hour. Enhance yellows and oranges, soften the contrast, and add a gentle haze to simulate a photo taken just after sunrise or before sunset.', icon: SunIcon },
      { name: t('filterColorVibrant'), prompt: 'Apply a vibrant, high-dynamic-range (HDR) effect. Boost saturation, increase clarity and detail, and balance highlights and shadows to make the entire scene pop with color and texture.', icon: SparklesIcon },
      { name: t('filterColorCleanBright'), prompt: 'Create a clean, bright, and airy look. Slightly overexpose the image, lift the shadows, and maintain natural, light colors for a modern and fresh aesthetic.', icon: PhotoIcon },
      { name: t('filterColorSoftPortrait'), prompt: 'Apply a soft and dreamy color grade suitable for portraits. Desaturate the image slightly, add a touch of warmth to skin tones, and soften the highlights to create a flattering and ethereal look.', icon: UserCircleIcon },
    ]
  };

  const landscapeAndTravel: { presets: AdjustmentPreset[] } = {
    presets: [
        { name: t('filterColorLushGreens'), prompt: 'Enhance the greens and yellows in the landscape to make foliage look lush, vibrant, and healthy. Increase the saturation of green tones and add depth to the shadows in forests and fields.', icon: DropletIcon },
        { name: t('filterColorAzureBlues'), prompt: 'Boost the blues and cyans in the image to create a stunning azure sky and sea. Increase the saturation of blue tones and enhance the clarity of the water and sky.', icon: PaletteIcon },
        { name: t('filterColorAutumnGlow'), prompt: 'Apply a warm, golden autumn color grade. Enhance the reds, oranges, and yellows to make fall foliage glow, and add a touch of warmth to the overall image.', icon: TemperatureIcon },
    ]
  }

  const sections = [
    { id: 'oneClick', title: t('oneClickTitle'), icon: MagicWandIcon, presets: oneClickFixes.presets },
    { id: 'portrait', title: t('adjustmentPortraitTitle'), icon: UserCircleIcon, presets: portraitEnhancements.presets },
    { id: 'color', title: t('filterSectionColor'), icon: PaletteIcon, presets: colorAndTone.presets },
    { id: 'filters', title: t('filterSectionFilm'), icon: FilmIcon, presets: landscapeAndTravel.presets },
  ];
  
  const handlePresetClick = (prompt: string, hasMultiple: boolean) => {
    setCustomPrompt('');
    if (hasMultiple) {
      onApplyMultipleAdjustments(prompt);
    } else {
      onApplyAdjustment(prompt);
    }
  };

  const renderPresets = () => {
    const currentSection = sections.find(sec => sec.id === mode);
    if (!currentSection) return null;

    const presets = currentSection.presets;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
        {presets.map(preset => {
          const Icon = preset.icon;
          return (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt, !!preset.multiple)}
            disabled={isLoading || !isImageLoaded}
            className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={preset.name}
          >
            {/* Fix: Replaced React.cloneElement with direct component rendering to fix type error. */}
            <Icon className="w-7 h-7 text-gray-300" />
            <span className="leading-tight">{preset.name}</span>
          </button>
        )})}
      </div>
    );
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('adjustmentTitle')}</h3>
      
      <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
        {sections.map(btn => {
          const Icon = btn.icon;
          return (
          <button
            key={btn.id}
            onClick={() => setMode(btn.id as EnhanceMode)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === btn.id ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
            title={btn.title}
          >
            {/* Fix: Replaced React.cloneElement with direct component rendering to fix type error. */}
            <Icon className="w-5 h-5" />
          </button>
        )})}
      </div>
      
      <div className="w-full">
        {renderPresets()}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">{t('orSeparator')}</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApplyCustom(); }} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t('adjustmentPlaceholder')}
          className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
          disabled={isLoading || !customPrompt.trim() || !isImageLoaded}
        >
          {t('applyAdjustment')}
        </button>
      </form>
    </div>
  );
};

export default AdjustmentPanel;