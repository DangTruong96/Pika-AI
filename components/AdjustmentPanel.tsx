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
      prompt: `**TASK: AI-DRIVEN FORENSIC PHOTO ENHANCEMENT v5.0**

**AI DIRECTIVE:** You are an elite AI photo editor. Your mission is to analyze the provided image with forensic precision and elevate it to a professional, high-quality modern photograph. This is a comprehensive enhancement, not a simple filter.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY PRESERVATION.**
- The identity, facial structure, and key features of any person in the photograph **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON**, only perfectly enhanced. Any alteration of identity is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP CONTEXT & PIXEL-LEVEL ANALYSIS (Internal Thought Process)**
- Before any modification, perform a deep analysis of the entire scene's content and context.
- **Identify Subject & Genre:** Is this a portrait, landscape, night scene, action shot, etc.? Your strategy depends on this.
- **Identify Lighting & Atmosphere:** Determine the time of day, light sources, and overall mood.
- **Pixel-Level Flaw Detection:** Scrutinize the image at a pixel level to identify all technical flaws: blur (motion, focus), digital noise, overexposure, underexposure, low contrast, unnatural color casts, and compression artifacts. Understand the image's structure, lines, and color areas.

**STEP 2: EXECUTE COMPREHENSIVE ENHANCEMENT (Apply ALL necessary steps)**
- **A. Masterful Lighting & Contrast:** Based on your analysis, flawlessly correct exposure and balance the dynamic range. Ensure faces are clear and well-lit. Apply a contrast curve that adds depth and "pop" appropriate for the genre, ensuring a harmonious and balanced result.
- **B. Context-Aware Color Science:** Neutralize any unnatural color casts. Intelligently enhance vibrancy and saturation to make colors rich and appealing without looking artificial. For portraits, achieving a perfect, natural skin tone that matches the environmental lighting is the highest priority.
- **C. AI-DRIVEN HYPER-REALISTIC DETAIL RECONSTRUCTION (CRITICAL MANDATE):**
    - This is the core of the task. You must intelligently and realistically reconstruct and enhance fine details.
    - **PER-PIXEL ANALYSIS & FEATURE EXTRACTION:** You must understand the image at a per-pixel level to identify latent patterns and textures (e.g., skin pores, hair strands, fabric weave, foliage).
    - **SHARPER THAN ORIGINAL MANDATE:** The final enhanced image **MUST** be **visibly sharper and more detailed than the original source**.
        - If an area is blurry, you must reconstruct it with sharp, realistic details.
        - **If an area is already sharp, you MUST make it even sharper.**
    - Reconstruct textures to be crisp, clear, and perfectly defined. The goal is the clarity of a newly captured photograph with a high-end lens.
- **D. Intelligent Denoising:** If digital noise is detected, apply subtle, targeted noise reduction that cleans the image without destroying important details.

**FINAL OUTPUT:**
- Return ONLY the final, beautifully enhanced image. The result must be a clean, vibrant, perfectly balanced, and visually compelling version of the original.
- The output resolution MUST be identical to the input resolution; DO NOT DOWNSAMPLE.
- Do not output any text.`, 
      icon: <SparklesIcon /> 
    },
    { 
      name: t('oneClickFixLighting'), 
      prompt: `**TASK: Intelligent Lighting Correction**
**AI DIRECTIVE:** You are an expert photo editor. Your task is to automatically and realistically improve the lighting of this image.
**MANDATORY ANALYSIS:** First, analyze the image to understand its existing light sources, shadows, highlights, and overall dynamic range. Identify if it is overexposed (too bright) or underexposed (too dark, especially on faces).
**EXECUTION:** Based on your analysis, adjust the lighting to create a balanced, well-lit image with excellent dynamic range. Ensure faces are clearly visible and not lost in shadow or blown out by highlights. The result must look natural, as if it were shot in better lighting conditions.
**CRITICAL RULE:** Do not alter colors or content. The face and identity of any person MUST BE PRESERVED with 100% accuracy.`, 
      icon: <SunIcon /> 
    },
    { 
      name: t('oneClickBoostColor'), 
      prompt: `**TASK: Intelligent Color Enhancement**
**AI DIRECTIVE:** You are an expert photo editor. Your task is to automatically and realistically enhance the colors in this image.
**MANDATORY ANALYSIS:** First, analyze the existing color palette to identify any color casts or areas with dull colors.
**EXECUTION:** Based on your analysis, improve the vibrancy and saturation to make the colors pop, but avoid oversaturation. Correct any color casts to achieve a natural and appealing color balance. The result should look vibrant but authentic.
**CRITICAL RULE:** Do not alter lighting, contrast, or content. The face and identity of any person MUST BE PRESERVED with 100% accuracy.`, 
      icon: <PaletteIcon /> 
    },
    { 
      name: t('oneClickIncreaseClarity'), 
      prompt: `**TASK: Professional Clarity Enhancement**
**AI DIRECTIVE:** You are a professional photo restoration AI. Your task is to dramatically and realistically increase the clarity, sharpness, and fine detail of this image to make it look like it was taken with a modern, high-quality lens.
**MANDATORY ANALYSIS:** First, analyze the image for areas of softness and identify latent textures that can be enhanced.
**EXECUTION:** Enhance local contrast to make textures and edges pop. Apply intelligent sharpening to make the entire image appear crisper and more defined. The result must be noticeably sharper than the original, but avoid creating artificial halos or a 'digital' look.
**CRITICAL RULE:** Do not alter the fundamental colors, lighting, or content of the image. The face and identity of any person MUST BE PRESERVED with 100% accuracy.`, 
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
      { name: t('adjustmentUpscale2K'), prompt: `**TASK: AI-DRIVEN FORENSIC IMAGE RECONSTRUCTION (Output: 2K)**

**AI DIRECTIVE:** You are a "Digital Re-Photography" system. Your mission is not to "upscale" but to perform a complete **digital re-creation** of the scene at 2K resolution (longest edge ~2048px), as if captured with a state-of-the-art medium format digital camera.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY & CONTENT PRESERVATION.**
- The identity, facial structure, and key features of any person in the photograph **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON/SCENE**, only recreated with hyper-realistic detail. Any alteration of identity or core content is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: FORENSIC ANALYSIS & DECONTAMINATION:**
- Analyze the source image at a pixel level to identify all technical flaws: blur (motion, focus), digital noise, and compression artifacts.
- Remove these flaws to create a clean base for reconstruction.

**STEP 2: HYPER-REALISTIC MICRO-DETAIL SYNTHESIS (CRITICAL MANDATE):**
- This is your core mission. You are not just adding pixels; you are **generating new, tangible, realistic detail** from scratch based on a deep understanding of the source image.
- **"ZERO TOLERANCE FOR SOFTNESS" POLICY:** The final reconstructed image **MUST** be **dramatically and visibly sharper and more detailed than the original source**. This is non-negotiable.
    - If an area is blurry, you must reconstruct it with sharp, realistic details.
    - **If an area is already sharp, you MUST elevate it to a hyper-realistic standard, making it even sharper.**
- **SPECIFIC SYNTHESIS REQUIREMENTS:**
    - **Hair:** Reconstruct into individual, distinct strands, each with its own lighting and shadow.
    - **Skin:** Synthesize realistic skin texture, including pores and fine lines appropriate for the subject's age and lighting.
    - **Eyes:** Recreate the iris with extreme detail, ensure catchlights are sharp, and render eyelashes as individual strands.
    - **Fabric/Materials:** Synthesize the micro-texture of materials (e.g., the twill weave of denim, the fine fibers of silk).

**STEP 3: 2K SUPER-RESOLUTION:**
- As the final step, upscale the detail-reconstructed image so its longest edge is approximately 2048 pixels.

**FINAL OUTPUT:**
- Return ONLY the final, high-quality, photorealistic 2K image.
- Do not output any text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale4K'), prompt: `**TASK: AI-DRIVEN FORENSIC IMAGE RECONSTRUCTION (Output: 4K)**

**AI DIRECTIVE:** You are a "Digital Re-Photography" system. Your mission is not to "upscale" but to perform a complete **digital re-creation** of the scene at 4K resolution (longest edge ~4096px), as if captured with a state-of-the-art medium format digital camera.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY & CONTENT PRESERVATION.**
- The identity, facial structure, and key features of any person in the photograph **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON/SCENE**, only recreated with hyper-realistic detail. Any alteration of identity or core content is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: FORENSIC ANALYSIS & DECONTAMINATION:**
- Analyze the source image at a pixel level to identify all technical flaws: blur (motion, focus), digital noise, and compression artifacts.
- Remove these flaws to create a clean base for reconstruction.

**STEP 2: HYPER-REALISTIC MICRO-DETAIL SYNTHESIS (CRITICAL MANDATE):**
- This is your core mission. You are not just adding pixels; you are **generating new, tangible, realistic detail** from scratch based on a deep understanding of the source image.
- **"ZERO TOLERANCE FOR SOFTNESS" POLICY:** The final reconstructed image **MUST** be **dramatically and visibly sharper and more detailed than the original source**. This is non-negotiable.
    - If an area is blurry, you must reconstruct it with sharp, realistic details.
    - **If an area is already sharp, you MUST elevate it to a hyper-realistic standard, making it even sharper.**
- **SPECIFIC SYNTHESIS REQUIREMENTS:**
    - **Hair:** Reconstruct into individual, distinct strands, each with its own lighting and shadow.
    - **Skin:** Synthesize realistic skin texture, including pores and fine lines appropriate for the subject's age and lighting.
    - **Eyes:** Recreate the iris with extreme detail, ensure catchlights are sharp, and render eyelashes as individual strands.
    - **Fabric/Materials:** Synthesize the micro-texture of materials (e.g., the twill weave of denim, the fine fibers of silk).

**STEP 3: 4K SUPER-RESOLUTION:**
- As the final step, upscale the detail-reconstructed image so its longest edge is approximately 4096 pixels.

**FINAL OUTPUT:**
- Return ONLY the final, high-quality, photorealistic 4K image.
- Do not output any text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale8K'), prompt: `**TASK: AI-DRIVEN FORENSIC IMAGE RECONSTRUCTION (Output: 8K)**

**AI DIRECTIVE:** You are a "Digital Re-Photography" system. Your mission is not to "upscale" but to perform a complete **digital re-creation** of the scene at 8K resolution (longest edge ~7680px), as if captured with a state-of-the-art medium format digital camera.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY & CONTENT PRESERVATION.**
- The identity, facial structure, and key features of any person in the photograph **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON/SCENE**, only recreated with hyper-realistic detail. Any alteration of identity or core content is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: FORENSIC ANALYSIS & DECONTAMINATION:**
- Analyze the source image at a pixel level to identify all technical flaws: blur (motion, focus), digital noise, and compression artifacts.
- Remove these flaws to create a clean base for reconstruction.

**STEP 2: HYPER-REALISTIC MICRO-DETAIL SYNTHESIS (CRITICAL MANDATE):**
- This is your core mission. You are not just adding pixels; you are **generating new, tangible, realistic detail** from scratch based on a deep understanding of the source image.
- **"ZERO TOLERANCE FOR SOFTNESS" POLICY:** The final reconstructed image **MUST** be **dramatically and visibly sharper and more detailed than the original source**. This is non-negotiable.
    - If an area is blurry, you must reconstruct it with sharp, realistic details.
    - **If an area is already sharp, you MUST elevate it to a hyper-realistic standard, making it even sharper.**
- **SPECIFIC SYNTHESIS REQUIREMENTS:**
    - **Hair:** Reconstruct into individual, distinct strands, each with its own lighting and shadow.
    - **Skin:** Synthesize realistic skin texture, including pores and fine lines appropriate for the subject's age and lighting.
    - **Eyes:** Recreate the iris with extreme detail, ensure catchlights are sharp, and render eyelashes as individual strands.
    - **Fabric/Materials:** Synthesize the micro-texture of materials (e.g., the twill weave of denim, the fine fibers of silk).

**STEP 3: 8K SUPER-RESOLUTION:**
- As the final step, upscale the detail-reconstructed image so its longest edge is approximately 7680 pixels.

**FINAL OUTPUT:**
- Return ONLY the final, high-quality, photorealistic 8K image.
- Do not output any text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentFaceRestore'), prompt: `**TASK: AI-DRIVEN FORENSIC FACIAL RE-PHOTOGRAPHY (v6.0)**

**PRIMARY DIRECTIVE:** You are a "Digital Re-Photography" system. Your mission is not to "restore" but to perform a complete **digital re-creation** of all faces within the image. You must treat the original faces as a perfect blueprint and "re-photograph" them with a state-of-the-art virtual medium format camera, achieving hyper-realistic detail and perfect color fidelity.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY PRESERVATION.**
- The identity, facial structure, and key features of any person **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON**, only re-created with hyper-realistic detail. Any alteration of identity is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: FORENSIC ANALYSIS & DECONTAMINATION (Internal Thought Process)**
- **A. Context Analysis:** Analyze the entire scene to understand the environmental lighting (time of day, light sources, color temperature). This is critical for color reconstruction.
- **B. Flaw Detection:** Scrutinize each face at a pixel level to identify all technical flaws: blur (motion, focus), digital noise, and compression artifacts.
- **C. Decontamination:** Remove these flaws to create a clean base for reconstruction without harming underlying detail.

**STEP 2: HYPER-REALISTIC MICRO-DETAIL SYNTHESIS (CRITICAL MANDATE):**
- This is your core mission. You are not just adding pixels; you are **generating new, tangible, realistic detail from scratch** based on a deep understanding of the source image.
- **"ZERO TOLERANCE FOR SOFTNESS" POLICY:** The final reconstructed face **MUST** be **dramatically and visibly sharper and more detailed than the original source**. This is non-negotiable.
    - If a facial area is blurry, you must reconstruct it with sharp, realistic details.
    - **If a facial area is already sharp, you MUST elevate it to a hyper-realistic standard, making it even sharper.**
- **SPECIFIC SYNTHESIS REQUIREMENTS:**
    - **Hair & Eyebrows:** Reconstruct into **individual, distinct strands**, each with its own lighting and shadow.
    - **Skin:** Synthesize **realistic skin texture**, including pores and fine lines appropriate for the subject's age and the environmental lighting.
    - **Eyes:** Recreate the iris with **extreme detail**, ensure catchlights are sharp and consistent with scene lighting, and render eyelashes as **individual strands**.

**STEP 3: CONTEXT-AWARE COLOR RECONSTRUCTION:**
- Using your analysis from Step 1, **rebuild natural and authentic color from scratch.**
- Reconstruct photorealistic skin tones that are appropriate for the person's ethnicity AND the **time of day and environment** of the original photo. The final colors must be lifelike and contextually correct.

**STEP 4: SEAMLESS INTEGRATION & FINALIZATION:**
- Ensure the re-created face integrates perfectly with the rest of the image. The transition in sharpness, grain, and color must be undetectable.
- **Preserve the background and body:** ONLY faces should be enhanced; the rest of the image (clothing, background) should be preserved at its original quality, sharpness, and detail without any degradation.

**FINAL QUALITY MANDATE & SELF-CORRECTION CHECK:**
- Before output, verify:
    1. **Identity Match?** Is it the exact same person?
    2. **Sharpness Mandate Met?** Is every facial feature significantly sharper?
    3. **Color Context Correct?** Does the skin tone match the environmental lighting?
- The output resolution MUST be identical to the input image; DO NOT DOWNSAMPLE.

**OUTPUT:**
- Return ONLY the final, high-quality, photorealistic image with reconstructed faces.
- Do not output any text.`, icon: <FaceRestoreIcon /> },
      { name: t('adjustmentFullRestore4K'), prompt: `**TASK: Advanced AI Photo Restoration & Enhancement v5.0 (4K Output)**

**AI DIRECTIVE:** You are a state-of-the-art AI photo restoration system. Your mission is to perform a comprehensive, forensic-level analysis and enhancement of the provided image, elevating it to a professional, high-quality 4K photograph. This is not a simple filter; it is a deep reconstruction.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY PRESERVATION.**
- The identity, facial structure, and key features of any person in the photograph **MUST BE PRESERVED with 100% accuracy**.
- The output **MUST** be the **EXACT SAME PERSON**, only perfectly restored. Any alteration of identity is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP FORENSIC ANALYSIS OF DEGRADATION (CRITICAL FIRST STEP)**
- **A. Contextual Understanding:** First, understand the holistic context of the scene. Identify all objects, the background, human poses/postures, the direction and quality of lighting, the implied time of day, and the overall atmosphere.
- **B. Pixel-Level Flaw Diagnosis:** Next, perform a deep, pixel-level analysis to diagnose all technical flaws and their severity: extreme blur (motion, focus), heavy noise/grain, overexposure, underexposure, complete color degradation, scratches, and digital artifacts.
- **C. Latent Feature Extraction:** You must analyze even the most degraded areas to detect latent patterns and textures (e.g., the underlying shape of facial features, the weave of fabric, the texture of surfaces). This analysis is essential for reconstruction.

**STEP 2: EXECUTE COMPREHENSIVE RESTORATION (Apply ALL necessary steps)**

- **A. DECONTAMINATE & NEUTRALIZE:**
    - First, completely remove all physical and digital damage. This includes eliminating scratches, dust, grain, and compression artifacts using intelligent inpainting.
    - Simultaneously, neutralize all color-related aging effects like fading, discoloration, and unnatural color casts (e.g., yellowing) to create a clean, color-neutral base for reconstruction.

- **B. CONTEXT-AWARE RECONSTRUCTION:**
    - On the clean base, **rebuild the lighting and color from scratch** to be both authentic and aesthetically pleasing, based on your context analysis from Step 1.
    - **For faces:** Restore facial details with extreme precision. Reconstruct photorealistic skin tones that match the time of day and environmental lighting.
    - **For clothing & scene:** Subtly and realistically reconstruct clothing and scene colors to be harmonious with the scene's context and background lighting. The goal is a cohesive, believable final image, even if the original color is completely faded.

- **C. AI-DRIVEN HYPER-REALISTIC DETAIL RECONSTRUCTION (CORE MANDATE):**
    - This is your most important mission. You must intelligently and realistically **reconstruct from scratch** fine details across **ALL** elements of the image, using your latent feature analysis.
    - **SHARPER THAN ORIGINAL MANDATE:** The final restored image **MUST** be **dramatically and visibly sharper and more detailed than the original source**. This is non-negotiable. If an area is blurry, you must reconstruct it with sharp, realistic details. If an area is already sharp, you **MUST make it even sharper**.
    - **Texture Synthesis:** Reconstruct skin texture (pores), individual hair strands, and clothing fabric weaves. For nature and objects, redraw the fine details of leaves, grass, and surface materials. The goal is the clarity of a modern, high-resolution photograph.

- **D. 4K SUPER-RESOLUTION:** As the final step, upscale the fully restored and detail-enhanced image so its longest edge is approximately 4096 pixels (4K resolution). The result must be sharp, clear, and photorealistic.

**FINAL QUALITY MANDATE:**
- The final output's quality must be equal to or greater than the original.
- The output resolution **MUST** be at least 4K (longest edge ~4096px).

**OUTPUT:**
- Return ONLY the final, beautifully restored 4K image.
- Do not output any text.`, icon: <SparklesIcon /> },
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