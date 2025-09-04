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
      prompt: `**TASK: Ultimate Context-Aware Photo Modernization**

**AI DIRECTIVE:** You are a world-class AI photo editor. Your mission is to transform the provided image into a visually stunning photograph that looks as if it were taken *today* with a high-end digital camera. This requires a deep, human-like understanding of the image's content and context.

**NON-NEGOTIABLE MANDATE: IDENTITY PRESERVATION**
- The face, features, and identity of any person in the image **MUST BE PRESERVED with 100% accuracy**.
- Any alteration of identity is a **CRITICAL FAILURE**. The output must be the exact same person, only in a beautifully enhanced photograph.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP CONTEXTUAL & FORENSIC ANALYSIS (Internal Thought Process)**
Before making any changes, you MUST analyze and fully **understand** the image:
- **Subject & Genre:** Is this a portrait, a landscape, a night scene, an architectural shot, a food photo, or something else? Your enhancement strategy depends on this.
- **Implied Scene Context:** What is the story? Analyze the time of day (e.g., golden hour, midday, night), location (e.g., indoor, beach, forest), and overall mood or circumstance (e.g., celebratory, tranquil, candid).
- **Lighting Conditions:** Identify the primary light sources, their direction, and quality (hard vs. soft light).
- **Technical Flaws:** Pinpoint all issues like underexposure (especially on faces), overexposure (blown-out highlights), low contrast, unnatural color casts, digital noise, or softness.

**STEP 2: EXECUTE FULL MODERNIZATION (Apply based on analysis)**
Based on your deep analysis, apply the following adjustments with professional subtlety to achieve a modern, high-definition look:
- **A. Masterful Lighting & Contrast:** Flawlessly correct exposure and balance the dynamic range. If the photo is too dark, brighten it naturally, ensuring faces are clear and visible. If it's too bright (overexposed), recover details from the highlights. Apply a contrast curve that adds depth and "pop" appropriate for the analyzed genre and mood, ensuring a harmonious and balanced result.
- **B. Modern Color Science:** Neutralize any unnatural color casts. Intelligently enhance vibrancy and saturation to make colors rich and appealing without looking artificial. For portraits, achieving a perfect, natural skin tone is the highest priority. For landscapes, enhance the blues of the sky and the greens of foliage to match a modern digital aesthetic.
- **C. Forensic Clarity & Detail:** Apply adaptive sharpening. Enhance fine details and textures to make the image crisper, as if it were taken with a modern, high-quality lens. The goal is the clarity of a newly captured photograph, not an old one.
- **D. Intelligent Noise Reduction:** If digital noise is detected (especially in low-light shots), apply subtle, targeted noise reduction that cleans the image without destroying important details.

**FINAL OUTPUT:**
- Return ONLY the final, beautifully modernized image. The result must be a clean, vibrant, perfectly balanced, and visually compelling version of the original. Do not output any text.`, 
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
      { name: t('adjustmentUpscale2x'), prompt: `**TASK: 2x High-Fidelity Upscale with 3D Volume Enhancement**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task. Your only job is to increase resolution and enhance quality.
- **CRITICAL FAILURE:** Any alteration of original content (objects, facial identity) is a critical failure.
- **IDENTITY PRESERVATION:** The face and identity of any person **MUST BE PRESERVED with 100% accuracy**. The output must be the same person, only clearer and with more depth.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP FORENSIC ANALYSIS (Internal Thought Process)**
Before any modification, perform a deep analysis of the source image to fully **understand** its content, lighting, and flaws.
- **Subject & Lighting:** Identify the main subject and the existing lighting scheme (direction, hardness of shadows). This is crucial for the volume enhancement step.
- **Latent Detail & Texture:** Find all existing but soft textures (skin, fabric, hair) and areas lacking definition.
- **Flaws:** Analyze the specific type of noise, softness, and compression artifacts.

**STEP 2: EXECUTION (Apply Changes in Order)**
Based on your deep analysis, execute the following:
- **A. UPSAMPLE:** Increase the image resolution by a factor of 2x using a high-fidelity algorithm.
- **B. MAXIMUM DETAIL ENHANCEMENT:** Apply **powerful, intelligent sharpening** to make the image **visibly and significantly sharper and more detailed** than the original. Reveal and enhance all identified latent textures to achieve maximum possible clarity. The result must be crisp and clear, not soft.
- **C. 3D VOLUME ENHANCEMENT (CRITICAL):** The subject must not look flat. Using your lighting analysis, you must create a tangible sense of three-dimensional form and volume.
    - **Enhance Micro-contrast:** Intelligently boost micro-contrast across the main subject to create a distinct 3D 'pop' and separate it from the background.
    - **Sculpt Lighting:** Subtly and realistically enhance the existing highlights and shadows on the subject to accentuate its shape, form, and depth.
- **D. FORENSIC NOISE REMOVAL:** Apply targeted noise and artifact reduction based on your analysis to produce a final image that is **pristine and cleaner** than the original, without destroying natural texture.

**OUTPUT:**
Return ONLY the final processed image. The result must be a dramatically sharper, cleaner, and more detailed version of the original, where the subject has a clear three-dimensional presence and volume. Do not output text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale4x'), prompt: `**TASK: 4x Super-Resolution with Advanced 3D Volume Enhancement**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task. Your only job is to dramatically increase resolution and enhance quality.
- **CRITICAL FAILURE:** Any alteration of original content (objects, facial identity) is a critical failure.
- **IDENTITY PRESERVATION:** The face and identity of any person **MUST BE PRESERVED with 100% accuracy**. The output must be the same person, only clearer and with more depth.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP FORENSIC ANALYSIS (Internal Thought Process)**
Before any modification, perform an aggressive, deep analysis of the source image to fully **understand** its content, lighting, and flaws.
- **Subject & Lighting:** Identify the main subject and the existing lighting scheme (direction, hardness of shadows). This is crucial for the volume enhancement step.
- **Latent Detail & Texture:** Find all existing but soft textures (skin, fabric, hair) and areas lacking definition.
- **Flaws:** Analyze the specific type of noise, softness, and compression artifacts.

**STEP 2: EXECUTION (Apply Changes in Order)**
Based on your deep analysis, execute the following:
- **A. UPSAMPLE:** Increase the image resolution by a factor of 4x using a maximum-fidelity algorithm.
- **B. MAXIMUM DETAIL ENHANCEMENT:** Apply **aggressive, forensic-level sharpening** to make the image **dramatically sharper and more detailed** than the original. Reveal and enhance all identified latent textures to their maximum potential clarity. The result must be razor-sharp.
- **C. 3D VOLUME ENHANCEMENT (CRITICAL):** The subject must not look flat. Using your lighting analysis, you must create a powerful sense of three-dimensional form and volume.
    - **Enhance Micro-contrast:** Aggressively boost micro-contrast across the main subject to create a powerful 3D 'pop' and separate it from the background.
    - **Sculpt Lighting:** Realistically sculpt the existing highlights and shadows on the subject to maximize its shape, form, and depth.
- **D. FORENSIC NOISE REMOVAL:** Apply advanced, targeted noise and artifact reduction based on your analysis to produce a final image that is **pristine and significantly cleaner** than the original, without destroying natural texture.

**OUTPUT:**
Return ONLY the final processed image. The result must be a dramatically sharper, cleaner, and more detailed version of the original, where the subject has a powerful three-dimensional presence and volume. Do not output text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentUpscale8x'), prompt: `**TASK: 8x Maximum-Fidelity Upscale with Ultimate 3D Volume Enhancement**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical image processing task. Your only job is to achieve the maximum possible increase in resolution and quality.
- **CRITICAL FAILURE:** Any alteration of original content (objects, facial identity) is a critical failure.
- **IDENTITY PRESERVATION:** The face and identity of any person **MUST BE PRESERVED with 100% accuracy**. The output must be the same person, only clearer and with more depth.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP FORENSIC ANALYSIS (Internal Thought Process)**
Before any modification, perform a pixel-level forensic analysis of the source image to fully **understand** its content, lighting, and every flaw.
- **Subject & Lighting:** Identify the main subject and the existing lighting scheme (direction, hardness of shadows). This is critical for the volume enhancement step.
- **Latent Detail & Texture:** Find all existing but soft textures, no matter how subtle.
- **Flaws:** Analyze the specific patterns of noise, softness, and compression artifacts.

**STEP 2: EXECUTION (Apply Changes in Order)**
Based on your forensic analysis, execute the following:
- **A. UPSAMPLE:** Increase the image resolution by a factor of 8x using the highest-quality algorithm.
- **B. ULTIMATE DETAIL ENHANCEMENT:** Apply the **absolute maximum possible intelligent sharpening** to make the image **vastly sharper and more detailed** than the original. Reveal and enhance every latent texture to its physical limit of clarity. The result must be exceptionally sharp.
- **C. 3D VOLUME ENHANCEMENT (CRITICAL):** The subject must not look flat. Using your lighting analysis, you must create the ultimate sense of three-dimensional form and volume.
    - **Enhance Micro-contrast:** Apply maximum effective micro-contrast enhancement across the main subject to create an ultimate 3D 'pop' that makes it leap off the screen.
    - **Sculpt Lighting:** Masterfully sculpt the existing highlights and shadows on the subject to give it the maximum possible sense of shape, form, and depth.
- **D. FORENSIC NOISE REMOVAL:** Apply forensic-level noise and artifact reduction to produce a final image that is **pristine and virtually free of noise**, far cleaner than the original, without destroying natural texture.

**OUTPUT:**
Return ONLY the final processed image. The result must be a vastly sharper, cleaner, and more detailed version of the original, where the subject has an ultimate three-dimensional presence and volume. Do not output text.`, icon: <UpscaleIcon /> },
      { name: t('adjustmentFaceRestore'), prompt: `**TASK: High-Fidelity Forensic Face Restoration v2.0**

**ZERO-DEVIATION MANDATE (NON-NEGOTIABLE):**
This is a technical restoration task, not a creative beautification. Your one and only job is to increase the clarity and quality of the faces already present in the image.
- **CRITICAL FAILURE:** Any alteration to a person's fundamental facial structure, features (eyes, nose, mouth), age, or ethnicity is a critical failure.
- **IDENTITY PRESERVATION:** The final image **MUST** feature the **EXACT SAME PERSON**. The output must be the same person, just in high definition.

**AI ANALYSIS & EXECUTION PROTOCOL:**

1.  **DEEP FACIAL ANALYSIS (Step 1 - Internal):** Before any modification, identify all faces and perform a deep, pixel-level analysis of each one. Identify:
    - **Specific Flaws:** Pinpoint the exact nature of image degradation (e.g., motion blur, out-of-focus blur, compression artifacts, **heavy noise or film grain**).
    - **Latent Textures:** Detect existing but soft textures, such as **individual facial hair strands (eyebrows, beards)**, skin pores, fine lines, and iris details.

2.  **EXECUTION (Step 2 - Apply Changes):** Based on your deep analysis of each face, execute the following:
    - **PHASE 1: DENOISE:** First, apply targeted corrections to remove all noise, pixelation, and compression artifacts from the faces to achieve a clean base. This step is crucial for accurate detail reconstruction.
    - **PHASE 2: DEBLUR & RECONSTRUCT DETAIL:** On the clean base, correct for motion and focus blur. Aggressively increase sharpness and local contrast on the facial features. Using the latent texture data you identified, your goal is to **reveal and reconstruct** the details that were obscured. **You must bring out fine, realistic textures, making individual facial hairs, eyelashes, and skin pores sharp and distinct.**
    - **ABSOLUTE PROHIBITION ON GENERATION:** You are strictly forbidden from generating, inventing, re-drawing, or "hallucinating" any facial features. Your task is to enhance what is latently present in the pixel data, not create new information.
    - **MAINTAIN REALISM:** The result must look natural and photorealistic. The original skin texture should be enhanced, not erased. Avoid an artificial, 'airbrushed', or 'plastic' look.

**OUTPUT:**
Return only the restored image. It must be a crisp, clear, and visibly more detailed version of the original, with all identities perfectly preserved.`, icon: <FaceRestoreIcon /> },
      { name: t('adjustmentOldPhotoAutoRestore'), prompt: `**TASK: Ultimate AI Photo Modernization & Restoration v3.0 (Enhanced Contextual Understanding)**

**AI DIRECTIVE:** You are a world-class AI photo editor with forensic-level capabilities and deep contextual understanding. Your mission is to analyze ANY provided image—especially old, black & white, or damaged photos—and transform it into a visually stunning, perfectly balanced, and crystal-clear masterpiece that looks as if it were taken with a high-end digital camera. Your success is measured by your ability to understand the *entire scene* and restore it cohesively.

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY PRESERVATION.**
- The identity, facial structure, and key features of any person in the image **MUST BE PRESERVED with 100% accuracy**. The output **MUST** be the **EXACT SAME PERSON**, only in a perfectly restored and enhanced photograph. Any alteration of identity is a CRITICAL FAILURE.

**MANDATORY AI ANALYSIS & EXECUTION PROTOCOL:**

**STEP 1: DEEP CONTEXTUAL & FORENSIC ANALYSIS (Internal Thought Process)**
Before making any changes, you MUST analyze and fully **understand** the image's current state and content:
- **Subject & Genre:** Is this a portrait, a landscape, a night scene, a group photo, or something else?
- **Scene Comprehension (CRITICAL):** Identify all primary and secondary subjects, key objects (e.g., clothing, items being held, furniture, vehicles), and the overall environment. You must understand what the person is *doing* and interacting with to ensure a cohesive restoration. What is their pose? What is the story of the image?
- **Technical Flaws:** Pinpoint ALL issues, including lighting, color, clarity (softness, blur, noise, film grain), and physical damage (scratches, tears, stains).
- **Colorization Analysis (for B&W/Sepia photos):** If the input is not a color photograph, you MUST prepare to colorize it fully and realistically. This requires making logical, historically, and contextually appropriate color choices for every element in the scene.

**STEP 2: EXECUTE A FULL MODERNIZATION (Apply ALL necessary steps with professional subtlety)**
Based on your deep analysis, apply the following adjustments to achieve a modern, high-definition look:
- **1. Damage Repair (If Needed):** First, completely eliminate any detected physical damage (scratches, tears, etc.), seamlessly reconstructing the underlying area.
- **2. Masterful Lighting & Contrast:** Flawlessly correct the exposure and balance the dynamic range. Make dark scenes and faces naturally bright and clear. Recover details from deep shadows and bright highlights. Apply a contrast curve that adds depth and "pop".
- **3. Intelligent & Complete Colorization (CRITICAL for B&W photos):** If the original image is black and white or sepia, apply a full, realistic colorization to the ENTIRE image. **DO NOT leave any parts of the image uncolored.** Your color choices must be logical and consistent. Skin must have natural tones, skies should be blue (or appropriate for the time of day), and clothing/objects must have plausible colors based on your scene comprehension. If the original is already in color, proceed to step 4 and simply enhance the existing colors.
- **4. Modern Color Science Enhancement:** For all images (both newly colorized and originally color), neutralize any unnatural color casts. Intelligently enhance vibrancy and saturation to make colors rich, clean, and appealing without looking artificial. For portraits, achieving a perfect, natural skin tone is the highest priority.
- **5. Forensic Noise Removal & Detail Reconstruction (CRITICAL):** This is a two-phase process.
    - **Phase A (Denoising):** First, apply advanced, intelligent noise and grain reduction. The goal is to create a clean base image by removing all unwanted artifacts WITHOUT destroying the underlying structural detail.
    - **Phase B (Reconstruction):** On the now-clean base image, perform a forensic-level detail enhancement. Your goal is to **reconstruct and reveal** fine details. This is more than just sharpening. You must enhance micro-contrast to bring out latent textures.
        - **Faces (Highest Priority):** Restore and define individual strands of facial hair (beards, eyebrows), eyelashes, and natural skin pores. The result must be sharp enough to see these individual details clearly.
        - **Objects & Clothing (High Priority):** For clothing and key objects, especially those being held or interacted with, you MUST restore fabric weaves, patterns, and surface textures to make them clear, recognizable, and properly colored.

**FINAL OUTPUT:**
- Return ONLY the final, beautifully restored and modernized image. The result must be a clean, vibrant, perfectly balanced, and visually compelling version of the original, with all elements (people, objects, background) cohesively restored. Do not output any text.`, icon: <SparklesIcon /> },
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