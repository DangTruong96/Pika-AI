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
    SmileIcon, EyeIcon, SunIcon, MoonIcon, RemoveBgIcon, UpscaleIcon, SparklesIcon, PaletteIcon,
    BlemishRemovalIcon, MakeupIcon, FaceSlimIcon
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
  const [openSection, setOpenSection] = useState<string | null>('restoration');

  // Fix: Removed explicit type annotations to allow TypeScript to correctly infer icon component props,
  // resolving the `React.cloneElement` type errors.
  const oneClickFixes = [
    { 
      name: t('oneClickAutoEnhance'), 
      prompt: "Perform a professional, automatic enhancement on this image. Your goal is to make it look as good as possible while maintaining photorealism. Adjust the following aspects as needed: \n- **Lighting & Contrast:** Balance brightness, contrast, shadows, and highlights to improve overall dynamic range. \n- **Color Correction:** Correct any color casts, enhance vibrancy and saturation naturally, and ensure accurate skin tones if people are present. \n- **Sharpness & Clarity:** Increase sharpness and local contrast to make details pop, but avoid over-sharpening or creating halos. \n- **Noise Reduction:** Subtly reduce any digital noise if present. \n **CRITICAL:** The identity and facial structure of any person in the image must be perfectly preserved. The final result should be a clean, vibrant, and well-balanced version of the original image.", 
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
  
  const portraitPresets = [
    { name: t('adjustmentPortraitPreset1'), prompt: "You are an expert retoucher. Your task is to realistically and subtly smooth the skin on all faces in the image. Remove minor, temporary blemishes, but it is CRITICAL to preserve the natural skin texture, including pores and fine lines. The result must not look artificial, airbrushed, or 'plastic'. The person's identity and key features must be perfectly preserved.", icon: <BlemishRemovalIcon /> },
    { name: t('adjustmentPortraitPreset2'), prompt: "You are a subtle digital artist. Your task is to realistically and very subtly adjust the person's mouth to create a gentle, natural-looking closed-mouth smile. The change must be minimal and believable, preserving the person's exact identity. Do not show teeth unless they are already slightly visible. The goal is a subtle shift in expression, not a dramatic change.", icon: <SmileIcon /> },
    { name: t('adjustmentPortraitPreset3'), prompt: "You are an expert photo editor. Your task is to subtly enhance and brighten the eyes of the person in the image. Make them appear more vivid, clear, and focused. Increase the brightness and contrast of the iris slightly. Do not change the eye color. The effect should be subtle and make the eyes 'pop' naturally.", icon: <EyeIcon /> },
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
      name: t('beautyRemoveFreckles'),
      prompt: "You are an expert retoucher. Your task is to completely remove all freckles from the person's skin. CRITICAL: You must preserve a completely natural skin texture and perfectly maintain the person's identity and facial structure. The result should be realistic and should not look airbrushed.",
      icon: <SparklesIcon />
    }
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
      { name: t('adjustmentUpscale2x'), prompt: `**TASK: 2x Forensic Upscale & Detail Enhancement**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task, not a creative one. Your one and only job is to increase the resolution and clarity of the original image.
- **CRITICAL FAILURE:** Any alteration, regeneration, addition, or removal of original content (objects, features, facial identity) is a critical failure of this task.
- **IDENTITY PRESERVATION:** The face, features, and identity of any person in the image **MUST BE PRESERVED with 100% accuracy**. The output must be the exact same person, only clearer.

**AI ANALYSIS & EXECUTION PROTOCOL:**
1.  **FORENSIC ANALYSIS (Step 1 - Internal):** Before any modification, perform a deep analysis of the entire source image. Identify:
    - **Latent Textures:** Existing but soft textures in skin, fabric, hair, and surfaces.
    - **Edge Profiles:** The characteristics of existing edges (hard, soft, aliased).
    - **Noise & Artifacts:** The specific type of digital noise or compression artifacts present.
    - **Lighting & Micro-contrast:** The original lighting scheme and local contrast variations.
    
2.  **EXECUTION (Step 2 - Apply Changes):** Based on your analysis, execute the following:
    - **UPSAMPLE:** Increase the image resolution by a factor of 2x.
    - **INTELLIGENT DETAIL ENHANCEMENT:** Using the data from your analysis, sharpen and clarify **only the details and textures that are already present** in the original image. Your goal is to *reveal* existing detail, not invent it. Refine existing edges, enhance the identified latent textures, and increase local micro-contrast to improve clarity.
    - **CLEANUP:** Based on your analysis of the noise, subtly remove digital noise and compression artifacts without blurring or losing original texture.

**OUTPUT:**
Return only the upscaled and sharpened image. It must be a visibly clearer version of the original, with all content perfectly preserved.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale4x'), prompt: `**TASK: 4x Forensic Super-Resolution**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task, not a creative one. Your one and only job is to increase the resolution and clarity of the original image.
- **CRITICAL FAILURE:** Any alteration, regeneration, addition, or removal of original content (objects, features, facial identity) is a critical failure of this task.
- **IDENTITY PRESERVATION:** The face, features, and identity of any person in the image **MUST BE PRESERVED with 100% accuracy**. The output must be the exact same person, only clearer.

**AI ANALYSIS & EXECUTION PROTOCOL:**
1.  **FORENSIC ANALYSIS (Step 1 - Internal):** Before any modification, perform an aggressive, deep analysis of the entire source image. Identify:
    - **Latent Textures:** Existing but soft textures in skin, fabric, hair, and surfaces.
    - **Edge Profiles:** The characteristics of existing edges (hard, soft, aliased).
    - **Noise & Artifacts:** The specific type of digital noise or compression artifacts present.
    - **Lighting & Micro-contrast:** The original lighting scheme and local contrast variations.
    
2.  **EXECUTION (Step 2 - Apply Changes):** Based on your analysis, execute the following:
    - **UPSAMPLE:** Increase the image resolution by a factor of 4x.
    - **AGGRESSIVE DETAIL ENHANCEMENT:** Using the data from your forensic analysis, perform a powerful sharpening and clarification of **only the details and textures that can be inferred from the original image**. Your goal is to *reveal* existing detail with maximum impact, not invent it. Aggressively refine existing edges, enhance the identified latent textures, and significantly increase local micro-contrast for maximum clarity.
    - **STRICT PROHIBITION ON INVENTION:** Do not "re-imagine" or "re-draw" any part of the image, especially faces.
    - **CLEANUP:** Based on your analysis, remove digital noise and compression artifacts without blurring or losing original texture.

**OUTPUT:**
Return only the upscaled and sharpened image. The result must be dramatically sharper than the original, with all content perfectly preserved.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale8x'), prompt: `**TASK: 8x Maximum-Fidelity Forensic Upscale**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task, not a creative one. Your one and only job is to increase the resolution and clarity of the original image.
- **CRITICAL FAILURE:** Any alteration, regeneration, addition, or removal of original content (objects, features, facial identity) is a critical failure of this task.
- **IDENTITY PRESERVATION:** The face, features, and identity of any person in the image **MUST BE PRESERVED with 100% accuracy**. The output must be the exact same person, only clearer.

**AI ANALYSIS & EXECUTION PROTOCOL:**
1.  **DEEP FORENSIC ANALYSIS (Step 1 - Internal):** Before any modification, perform a pixel-level forensic analysis of the entire source image. Identify:
    - **Latent Textures:** All existing but soft textures in skin, fabric, hair, and surfaces, no matter how subtle.
    - **Edge Profiles:** The precise characteristics of existing edges (hard, soft, aliased).
    - **Noise & Artifacts:** The specific patterns of digital noise or compression artifacts.
    - **Lighting & Micro-contrast:** The original lighting scheme and all local contrast variations.
    
2.  **EXECUTION (Step 2 - Apply Changes):** Based on your deep analysis, execute the following:
    - **UPSAMPLE:** Increase the image resolution by a factor of 8x.
    - **MAXIMUM-FIDELITY ENHANCEMENT:** Using the data from your deep forensic analysis, apply the **maximum possible sharpening and clarity enhancement** to **only the details and textures that can be inferred from the original image**. Your goal is to make the existing information as clear as physically possible. Your process must be equivalent to a high-end software upscaler, not a generative artist.
    - **ABSOLUTE PROHIBITION ON INVENTION:** You are strictly forbidden from generating, inventing, or hallucinating new details or textures. Do not "re-imagine" or "re-draw" any part of the image.
    - **CLEANUP:** Based on your analysis, aggressively remove all digital noise and compression artifacts, ensuring a pristine final image without losing original texture.

**OUTPUT:**
Return only the upscaled and sharpened image. The result must be vastly sharper than the original, with all content and identities perfectly preserved.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentFaceRestore'), prompt: `**TASK: High-Fidelity Forensic Face Restoration**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical restoration task, not a creative beautification. Your one and only job is to increase the clarity and quality of the faces already present in the image.
- **CRITICAL FAILURE:** Any alteration to a person's fundamental facial structure, features (eyes, nose, mouth), age, or ethnicity is a critical failure.
- **IDENTITY PRESERVATION:** The final image **MUST** feature the **EXACT SAME PERSON**. The output must be the same person, just in high definition.

**AI ANALYSIS & EXECUTION PROTOCOL:**

1.  **DEEP FACIAL ANALYSIS (Step 1 - Internal):** Before any modification, identify all faces and perform a deep, pixel-level analysis of each one. Identify:
    - **Specific Flaws:** Pinpoint the exact nature of image degradation (e.g., motion blur, out-of-focus blur, compression artifacts, noise).
    - **Latent Textures:** Detect existing but soft textures, such as skin pores, fine lines, hair strands, and iris details.
    - **Existing Features:** Map the precise location and shape of all facial features, even if blurry.
    - **Lighting:** Analyze the direction and quality of light on the face.

2.  **EXECUTION (Step 2 - Apply Changes):** Based on your deep analysis of each face, execute the following:
    - **DEBLUR & DENOISE:** Based on your flaw analysis, apply targeted corrections to remove all motion blur, focus issues, pixelation, and compression artifacts from the faces to achieve a crisp, clean result.
    - **ENHANCE EXISTING DETAIL ONLY:** Aggressively increase sharpness and local contrast on the facial features. Using the latent texture data you identified, your goal is to *reveal* the details that are **already there** in the pixel data. Bring out fine, realistic textures by enhancing the existing information.
    - **ABSOLUTE PROHIBITION ON GENERATION:** You are strictly forbidden from generating, inventing, re-drawing, or "hallucinating" any facial features. If a part of the face is too blurry or missing to be technically enhanced, you must **leave it as a clean but un-detailed area** rather than inventing what might have been there. A clean but blurry result is infinitely better than a deformed, generated one.
    - **MAINTAIN REALISM:** The result must look natural and photorealistic. The original skin texture should be enhanced, not erased. Avoid an artificial, 'airbrushed', or 'plastic' look.

**OUTPUT:**
Return only the restored image. It must be a crisp, clear, and visibly more detailed version of the original, with all identities perfectly preserved.`, icon: <FaceRestoreIcon /> },
      { name: t('adjustmentOldPhotoAutoRestore'), prompt: `**CORE DIRECTIVE: TRANSFORM THIS OLD PHOTOGRAPH INTO A MODERN, HIGH-DEFINITION DIGITAL IMAGE.**
- **Your one and only goal is to make this image look like it was taken *today* with a high-end digital camera.**
- **You must ELIMINATE ALL TRACES OF TIME.** This is a non-negotiable instruction. Any remaining sign of the photo's age (film grain, softness, faded color, physical damage) is a failure of the task.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY PRESERVATION.**
- The identity, facial structure, and key features of any person in the image **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON**, only restored to modern digital quality.
- **Any alteration of identity, however subtle, is a CRITICAL FAILURE.**

**LEVEL 2 MANDATE (FACIAL INTEGRITY PROTOCOL): ENHANCE, DO NOT RE-CREATE.**
- **This is a technical restoration task, NOT a creative one.**
- **Your function is to enhance the existing pixel data of the face, not to generate a new one.**
- **ABSOLUTE PROHIBITION:** You are strictly forbidden from re-drawing, re-creating, inventing, or "hallucinating" facial features (eyes, nose, mouth, skin texture).
- **If part of a face is extremely blurry or missing, you must enhance what is present and leave the damaged area clean but not "invented". A clean, blurry result is infinitely better than a deformed, generated result.**
- **PROCESS:** Your process for faces must be limited to:
    - **1. DEBLUR & SHARPEN:** Remove blur and increase sharpness to clarify the *existing* features.
    - **2. ENHANCE TEXTURE:** Bring out latent, real textures from the *existing* pixel data.
    - **3. DO NOT "BEAUTIFY":** Do not change the shape of features, smooth skin excessively into an artificial look, or alter the person's age or expression.
- **Failure to adhere to this protocol will result in a failed task.**

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**
You are a world-class photo restoration AI. Your task is to automatically analyze the provided photograph and apply ALL necessary enhancements to produce a perfect, modern digital image.

**Step 1: Analyze for All Defects (Traces of Time).**
- **Physical Damage:** Scratches, tears, creases, stains, corrosion, water damage, mold spots, and physical blemishes of any kind.
- **Color Aging:** Black and white, sepia, or severely faded and discolored colors.
- **Analog Softness & Noise:** Blurriness, low-resolution, film grain, poor focus, and general softness.

**Step 2: Execute a Full Modernization (Apply ALL necessary steps with MAXIMUM, AGGRESSIVE impact).**
- **1. COMPLETE Damage Repair (MANDATORY):** Your primary task is the **TOTAL AND COMPLETE ELIMINATION** of all detected physical damage. This is not optional. Repair every scratch, tear, crease, and point of corrosion until the image is pristine. The repair must be invisible, seamlessly reconstructing the underlying image.
- **2. ULTIMATE CLARITY & DETAIL ENHANCEMENT (MANDATORY):** Your primary image quality goal is to transform a soft, blurry, or low-detail old photograph into a **razor-sharp, high-detail modern image.**
    - **AGGRESSIVE DEBLUR & SHARPENING:** You must analyze the image for all forms of softness (motion blur, poor focus, analog softness) and apply **maximum-strength, intelligent deblurring and sharpening**. The difference in clarity between the input and output must be dramatic.
    - **For Faces:** You **MUST** strictly follow the **"LEVEL 2 MANDATE: FACIAL INTEGRITY PROTOCOL"** above. The goal is to make the face as clear and detailed as possible *without* altering identity.
    - **For Everything Else (Background, Clothing, Objects):** Apply **forensic-level detail enhancement**. **Remove ALL blur and film grain.** The result must be crystal-clear and rich in texture, as if shot on a modern high-resolution sensor.
- **3. MODERN Color Restoration (MANDATORY):**
    - **If Color is Faded:** Do not just restore colors, **make them VIBRANT AND CLEAN, as if processed with modern digital color science**. Boost saturation and contrast to make the colors pop, creating a rich, lively image that looks completely contemporary.
    - **If Colorization is needed (B&W/Sepia):** Apply **photorealistic, BEAUTIFUL, and VIVID color palettes.** The goal is a visually stunning result that looks like a color photograph, not a colorized one. Pay extreme attention to creating lifelike, vibrant, and accurate skin tones.

**FINAL OUTPUT:**
Return a single, high-quality image that has been completely modernized. The result must be a visually stunning, **exceptionally sharp**, and **richly colored** image that looks like a brand-new photograph. Do not output any text.`, icon: <SparklesIcon /> },
  ];

  const handlePresetClick = (prompt: string) => {
    onApplyAdjustment(prompt);
  }

  const handleToggleSection = (sectionId: string) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };
  
  const SECTIONS = [
    { id: 'restoration', title: t('adjustmentRestorationTitle'), icon: <ArrowPathIcon className="w-5 h-5 text-cyan-400" />, presets: restorationPresets, columns: 5 },
    { id: 'pro', title: t('adjustmentProTitle'), icon: <MagicWandIcon className="w-5 h-5 text-cyan-400" />, presets: adjustmentPresets, columns: 4 },
    { id: 'portrait', title: t('adjustmentPortraitTitle'), icon: <UserCircleIcon className="w-5 h-5 text-cyan-400" />, presets: portraitPresets, columns: 3 },
    { id: 'sky', title: t('adjustmentSkyTitle'), icon: <CloudIcon className="w-5 h-5 text-cyan-400" />, presets: skyPresets, columns: 3 },
    { id: 'background', title: t('adjustmentBackgroundTitle'), icon: <PhotoIcon className="w-5 h-5 text-cyan-400" />, presets: backgroundPresets, columns: 5 },
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