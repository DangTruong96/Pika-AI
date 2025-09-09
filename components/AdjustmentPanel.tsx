
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

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
  isLoading: boolean;
  isImageLoaded: boolean;
}

type EnhanceMode = 'oneClick' | 'portrait' | 'color' | 'filters';

const AdjustmentPanel: React.FC<EnhancePanelProps> = ({ onApplyAdjustment, onApplyFilter, isLoading, isImageLoaded }) => {
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

  const oneClickFixes = {
    presets: [
      { name: t('oneClickAutoEnhance'), prompt: "Perform a comprehensive auto-enhancement on the image. Adjust brightness, contrast, and color balance to create a vibrant and clear image. Subtly sharpen details without introducing artifacts. CRITICAL: Enhance the image's micro-contrast to improve texture and three-dimensional pop, ensuring the final result does not look flat. The goal is a natural, professional-looking improvement that respects the original's depth.", icon: <SparklesIcon /> },
      { name: t('oneClickFixLighting'), prompt: `**AI TASK: Professional Automatic Lighting Correction v2.0**

You are a professional photo editor AI specializing in lighting correction. Your task is to analyze the input image for any lighting problems—including underexposure (too dark), overexposure (too bright/blown-out), backlighting, or harsh shadows—and correct them to produce a perfectly lit, natural, and visually pleasing photograph.

**EXECUTION PROTOCOL:**
1.  **Analyze Exposure:** Determine the primary lighting issue.
2.  **Correct Exposure:** Adjust the overall brightness and contrast to achieve a balanced exposure.
3.  **Recover Details:**
    -   If the image is underexposed or has dark shadows, you MUST recover details from the shadows without introducing noise.
    -   If the image is overexposed, you MUST recover details from the highlights (e.g., bright skies, blown-out skin tones).
4.  **Balance Light:** Even out the lighting across the scene to reduce harshness and create a more natural look.
5.  **Preserve Color:** Maintain the original color balance and saturation. The result should look natural, not overly processed or like an artificial HDR image.

**NON-NEGOTIABLE FINAL QUALITY MANDATE:**
- **IDENTITY PRESERVATION:** If people are present, their identity and facial features MUST be 100% preserved.
- **CRITICAL FAILURE:** Any reduction in sharpness or detail from the original image is a critical failure. The output MUST be visibly sharper and clearer.
- **FORENSIC ENHANCEMENT:** After correcting the lighting, perform a final enhancement pass on the ENTIRE image (regenerate fine details, denoise, boost clarity).
- **RESOLUTION INTEGRITY:** The output must be high-resolution and maintain the original aspect ratio. DO NOT DOWNSAMPLE.

**OUTPUT:** Return ONLY the final, perfectly lit and enhanced image. Do not output any text.`, icon: <SunIcon /> },
      { name: t('oneClickBoostColor'), prompt: "Enhance the colors in the image to make them more vibrant and saturated. Boost the saturation and vibrance naturally, without making the colors look unrealistic or oversaturated.", icon: <PaletteIcon /> },
      { name: t('adjustmentUpscale8K'), prompt: 'Upscale the image to 8K resolution (8192 pixels on the longest side). While upscaling, enhance details, remove compression artifacts, and sharpen the result to create a high-quality, larger version of the original image.', icon: <UpscaleIcon /> },
      { name: t('adjustmentFullRestore4K'), prompt: `**AI TASK: FORENSIC PHOTO RESTORATION & COMPOSITIONAL ENHANCEMENT v5.0**

You are a world-class digital restoration artist and photo editor. Your mission is to perform a complete, hyper-realistic restoration of the provided old photograph, and then intelligently enhance its composition for a professional, aesthetically pleasing result.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE IDENTITY PRESERVATION:** The output **MUST** feature the **EXACT SAME PEOPLE**. Any alteration to a person's fundamental facial structure, unique features (scars, moles), or identity is a critical failure. This rule overrides all others. Do not beautify, idealize, or unnaturally smooth faces.
2.  **PHOTOGRAPHIC REALISM:** The final image must look like a pristine, high-resolution photograph from the original era, not a digital painting. Natural skin texture (including pores), realistic fabric weaves, hair strands, and environmental details are paramount.

**EXECUTION PROTOCOL (PERFORM IN STRICT ORDER):**

**STEP 1: INTELLIGENT AUTO-CROP & BORDER REMOVAL**
-   Analyze the input to identify the boundary between the actual photograph's content and its physical surroundings (e.g., torn edges, white borders, the table it's on).
-   You **MUST** intelligently crop the image to **REMOVE** these non-photographic elements. The output should contain **ONLY** the original photographic scene.

**STEP 2: CORE RESTORATION & RECONSTRUCTION (ON CROPPED IMAGE)**
-   **Damage Repair:** Meticulously repair ALL physical damage: scratches, tears, spots, fading, and discoloration. Ensure repairs are invisible.
-   **Hyper-Realistic Detail Generation:** Forensically analyze and reconstruct lost details. Where information is missing, you must **generate new, plausible, hyper-realistic details**. This includes:
    -   **Faces:** Reconstruct subtle facial contours, eye details (irises, pupils, reflections), and realistic skin texture. Avoid a "plastic" look.
    -   **Clothing & Hair:** Reconstruct the texture and patterns of fabrics and individual hair strands.
    -   **Background:** Reconstruct environmental details to match the restored subjects.
-   **Colorization & Lighting:**
    -   If the photo is not in color, apply natural and historically plausible colorization. The color palette must be subtle and authentic.
    -   Correct the lighting to create **soft, diffuse, professional portrait lighting**. Eliminate harsh shadows and recover blown-out highlights. Enhance micro-contrast for a three-dimensional "pop".

**STEP 3: COMPOSITIONAL ENHANCEMENT (OUTPAINTING)**
-   After restoration, analyze the composition of the image.
-   If the composition is cramped or unbalanced (e.g., subjects' heads are too close to the top edge), you **MUST intelligently expand the canvas** by generating a natural and realistic extension of the background (outpainting). For outdoor scenes, this often means adding more sky to improve headroom and balance. The extension must be seamless.

**STEP 4: FINAL FORENSIC ENHANCEMENT (ENTIRE IMAGE)**
-   **CRITICAL SHARPNESS MANDATE:** The final, fully composited image **MUST** be demonstrably sharper and clearer than even the undamaged portions of the original.
-   **PROTOCOL:**
    1.  **Upscale:** Intelligently upscale the image to at least 4K resolution (4096 pixels on the longest side), generating new detail during the process.
    2.  **Final Polish:** Perform a final pass to remove any remaining digital noise or artifacts, ensuring a clean, photographic finish.

**OUTPUT:** Return ONLY the final, compositionally enhanced, and forensically restored photograph. Do not output any text.`, icon: <SparklesIcon /> },
    ]
  };

  const portraitEnhancements = {
    presets: [
      { name: t('adjustmentFaceRestore'), prompt: `**AI TASK: FORENSIC FACE RESTORATION v3.0**

You are a world-class digital restoration AI specializing in faces. Your task is to analyze the input image, identify any blurry, out-of-focus, or low-resolution faces, and perform a hyper-realistic restoration *without changing the person's identity or expression*.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE IDENTITY & EXPRESSION PRESERVATION:**
    - The output **MUST** feature the **EXACT SAME PERSON**. This is the highest priority.
    - The person's facial **EXPRESSION MUST remain UNCHANGED**. If they are not smiling in the original, they must not be smiling in the output.
    - Any alteration to a person's fundamental facial structure, unique features (scars, moles, wrinkles, asymmetry), or identity is a critical failure.
    - You are **STRICTLY FORBIDDEN** from beautifying, idealizing, making the face more symmetrical, or making them look younger.
2.  **PHOTOGRAPHIC REALISM:** The final image must look like a real photograph. You **MUST** generate natural skin texture, including pores and fine lines. Avoid a "plastic" or digitally airbrushed look.

**EXECUTION PROTOCOL:**
1.  **Identify Faces:** Locate all faces in the image that suffer from poor quality (blur, low resolution, compression artifacts).
2.  **Forensic Reconstruction:** For each identified face, you must reconstruct lost details with extreme precision. Your goal is to add clarity and detail, **NOT** to create a new face.
    -   **Eyes:** Reconstruct sharp details in the irises, pupils, and catchlights, maintaining the original eye shape and gaze.
    -   **Skin:** Generate realistic skin texture, pores, and micro-details consistent with the original person.
    -   **Hair:** Reconstruct individual hair strands, eyebrows, and eyelashes with clarity.
3.  **Seamless Integration:** The restored face(s) must blend perfectly with the rest of the person's head and body, and the overall image's lighting and color balance.

**QUALITY MANDATE:** The restored face(s) MUST be demonstrably sharper, clearer, and more detailed than in the original image, while being recognizably the same person with the same expression.

**OUTPUT:** Return ONLY the final, edited photograph. Do not output any text.`, icon: <FaceRestoreIcon /> },
      { name: t('adjustmentPreset1'), prompt: "Apply a realistic and professional background blur (bokeh) effect. The main subject should remain sharp while the background is smoothly blurred, simulating a photo taken with a wide-aperture lens.", icon: <BlurBackgroundIcon /> },
      { name: t('adjustmentPortraitPreset1'), prompt: "You are an expert retoucher. Your task is to subtly smooth the skin on the person's face. CRITICAL: Preserve the natural skin texture, including pores and fine lines, and perfectly maintain the person's identity and facial structure. The result should be realistic, not plastic or airbrushed.", icon: <BlemishRemovalIcon /> },
      { name: t('adjustmentPortraitPreset2'), prompt: `**AI TASK: CONTEXT-AWARE, HYPER-REALISTIC SMILE GENERATION v3.0**

You are a world-class portrait retoucher AI specializing in creating natural, believable smiles. Your task is to analyze the input photograph and add a contextually appropriate smile to the subject's face.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE IDENTITY PRESERVATION:** The output **MUST** feature the **EXACT SAME PERSON**. Any alteration to a person's fundamental facial structure, unique features (scars, moles), or identity is a critical failure. This rule overrides all others.
2.  **PHOTOGRAPHIC REALISM:** The final image must look like a real photograph. Natural skin texture (including pores) and realistic muscle movement are paramount. Avoid a "plastic" or digitally manipulated look.

**EXECUTION PROTOCOL:**

**STEP 1: CONTEXTUAL ANALYSIS**
-   Analyze the overall context of the image: Is it a formal portrait? A casual snapshot? A group photo? What is the mood?
-   Based on this analysis, you **MUST** decide on the most appropriate type of smile to generate. The goal is a smile that fits the scene naturally.
-   **Possible Smile Types (you choose based on context):**
    -   **Subtle, Closed-Mouth Smile:** For formal or neutral contexts.
    -   **Gentle, Light Smile:** For pleasant, calm scenes.
    -   **Bright, Happy Smile (can show teeth):** For joyful, casual, or celebratory moments. The decision to show teeth must be based on what would look most natural for the person and the situation.

**STEP 2: SMILE GENERATION & FACIAL MUSCLE SYNC (CRITICAL FOR REALISM)**
-   Generate the chosen smile.
-   **DUCHENNE SMILE MANDATE:** You **MUST** simultaneously generate a corresponding subtle "squinch" or "crinkle" around the eyes (orbicularis oculi muscle activation). This is non-negotiable and essential for a genuine-looking smile. A smile that only involves the mouth is a failure.
-   Ensure the generated smile integrates perfectly with the person's existing facial features and lighting.

**STEP 3: FINAL ENHANCEMENT**
-   Perform a final pass to ensure the entire face looks coherent and sharp. The result must maintain or improve the original image's quality.

**OUTPUT:** Return ONLY the final, edited photograph. Do not output any text.`, icon: <SmileIcon /> },
      { name: t('adjustmentPortraitPreset3'), prompt: "You are a professional photo editor. Your task is to subtly enhance the eyes of the person in the image. Add a gentle 'sparkle' or catchlight, and slightly increase the clarity and vibrance of the irises. CRITICAL: The change must be extremely subtle and realistic. Do not change the eye color or shape. The person's identity must be perfectly preserved.", icon: <EyeIcon /> },
      { name: t('adjustmentOpenEyes'), prompt: "You are an expert AI photo editor. A person in this photo has their eyes closed. Your task is to realistically open their eyes. CRITICAL: You MUST perfectly preserve the person's identity. The new eyes must match the person's unique eye shape, color, and facial structure. The result must be hyper-realistic and completely believable.", icon: <EyeSlashIcon /> },
      { name: t('adjustmentStraightenPosture'), prompt: "You are an expert AI retoucher specializing in anatomy and posture. Analyze the main subject's posture. If they are slouching or their back/neck is not straight, subtly correct their posture to be more upright and confident. The change MUST be realistic and preserve the person's body shape and identity. This may require you to reconstruct parts of their body and the background behind them. The final result must be seamless and natural.", icon: <PostureCorrectionIcon />},
      { name: t('adjustmentWhitenTeeth'), prompt: "You are an expert photo retoucher. If the person is smiling and showing their teeth, your task is to naturally and subtly whiten their teeth. CRITICAL: The whitening effect must be realistic. Avoid an unnaturally bright, pure white result. The teeth should have a natural, healthy off-white shade. If the person is not showing their teeth, make no changes to the image.", icon: <SparklesIcon /> },
      { name: t('beautySlimFace'), prompt: "Subtly and realistically slim the person's face and jawline. The change should be very slight and natural, preserving their identity and fundamental facial structure. Do not make any other changes.", icon: <FaceSlimIcon /> },
    ]
  };

  const colorAndTone = {
    presets: [
      { name: t('filterColorCinematic'), prompt: 'Apply a cinematic teal and orange color grade. The shadows should be pushed towards teal/blue, and skin tones should be shifted towards warm orange tones to create a popular, high-contrast cinematic look.', icon: <StopCircleIcon /> },
      { name: t('filterColorMoody'), prompt: 'Apply a moody and atmospheric color grade. Desaturate the colors slightly, crush the blacks, and add a subtle green or brown tint to the shadows to create a dramatic and emotional feel.', icon: <CloudIcon /> },
      { name: t('filterColorGolden'), prompt: 'Simulate the warm, soft, and glowing light of the golden hour. Enhance the warm tones, add a subtle glow or haze effect, and ensure the lighting looks natural and flattering.', icon: <SunIcon /> },
      { name: t('filterColorVibrant'), prompt: 'Apply a vibrant HDR (High Dynamic Range) look. Increase the overall saturation and contrast, recover details from both the highlights and shadows, and make the colors pop for a bold, eye-catching result.', icon: <SparklesIcon /> },
      { name: t('filterColorCleanBright'), prompt: "Apply a clean and bright, high-key studio look. Increase the exposure and slightly reduce contrast to create a light, airy feel with soft shadows. Ensure skin tones remain natural and highlights are not blown out.", icon: <SunIcon /> },
      { name: t('filterColorSoftPortrait'), prompt: "Apply a soft and flattering portrait grade. Mute the colors slightly, add a touch of warmth, and soften the contrast. The goal is a dreamy, gentle look that is ideal for portraits, preserving natural skin tones.", icon: <UserCircleIcon /> },
      { name: t('filterColorDramaticPortrait'), prompt: "Apply a dramatic, low-key portrait style. Significantly increase the contrast, deepen the shadows to near-black, and slightly desaturate the colors. This should create a moody, intense look focusing on facial contours.", icon: <MoonIcon /> },
      { name: t('filterColorLushGreens'), prompt: "Enhance the green tones in the image to make them lush and vibrant. Boost the saturation and richness of greens and yellows, giving foliage and landscapes a healthy, verdant appearance without affecting other colors unnaturally.", icon: <PhotoIcon /> },
      { name: t('filterColorAzureBlues'), prompt: "Enhance the blue tones in the image. Deepen the blues in the sky and water, making them a rich azure color. Increase clarity and slightly cool down the overall temperature for a crisp, clean look.", icon: <DropletIcon /> },
      { name: t('filterColorAutumnGlow'), prompt: "Apply a warm, autumn-themed color grade. Enhance the oranges, reds, and yellows to create a cozy, glowing feel. Add a slight vignette and warm up the overall color temperature to simulate autumn light.", icon: <TemperatureIcon /> },
    ]
  };

  const filterSections = [
    {
      id: 'camera',
      title: t('filterSectionCamera'),
      icon: <CameraIcon />,
      presets: [
        { name: t('filterCameraFuji'), prompt: "Apply a color grade that emulates the look of a classic Fujifilm camera. Focus on producing rich, deep greens, cinematic blues, and pleasing, natural skin tones, reminiscent of Fujifilm's film simulations.", icon: <SwatchIcon /> },
        { name: t('filterCameraKodak'), prompt: "Apply a color grade that emulates the warm, vibrant, and slightly saturated look of Kodak film stocks like Portra or Kodachrome. Emphasize rich reds and yellows for a nostalgic, timeless feel.", icon: <SunIcon /> },
        { name: t('filterCameraLeica'), prompt: "Apply a color grade that emulates the signature Leica look. Focus on creating deep contrast, rich blacks, and natural, true-to-life colors with a subtle, three-dimensional pop.", icon: <CircleHalfStrokeIcon /> },
        { name: t('filterCameraCanon'), prompt: "Apply a color grade that emulates the look of a Canon DSLR. Produce bright, clean colors with a focus on accurate and flattering skin tones, characteristic of Canon's color science.", icon: <UserCircleIcon /> },
      ]
    },
    {
      id: 'film',
      title: t('filterSectionFilm'),
      icon: <FilmIcon />,
      presets: [
        { name: t('filterFilmVintage'), prompt: 'Apply a vintage film look, with slightly faded colors, soft contrast, and a subtle warm tone.', icon: <CameraIcon /> },
        { name: t('filterFilmBW'), prompt: 'Convert the image to a high-contrast, dramatic black and white.', icon: <CircleHalfStrokeIcon /> },
        { name: t('filterFilmSepia'), prompt: 'Apply a classic sepia tone for a nostalgic, old-fashioned look.', icon: <SwatchIcon /> },
        { name: t('filterFilmPolaroid'), prompt: 'Simulate a polaroid photo effect with washed-out colors, a slight vignette, and a characteristic color shift.', icon: <PhotoIcon /> },
      ]
    },
    {
      id: 'artistic',
      title: t('filterSectionArtistic'),
      icon: <PaintBrushIcon />,
      presets: [
        { name: t('filterArtisticOil'), prompt: 'Transform the image into a textured oil painting with visible brushstrokes.', icon: <PaintBrushIcon /> },
        { name:t('filterArtisticWatercolor'), prompt: 'Give the image a soft, blended watercolor effect with translucent colors.', icon: <DropletIcon /> },
        { name: t('filterArtisticSketch'), prompt: 'Convert the image into a detailed pencil sketch with cross-hatching and defined lines.', icon: <PencilIcon /> },
        { name: t('filterArtisticPopArt'), prompt: 'Apply a vibrant, high-contrast pop art style inspired by Andy Warhol, using bold, flat areas of color.', icon: <SparklesIcon /> },
      ]
    },
    {
      id: 'digital',
      title: t('filterSectionDigital'),
      icon: <CpuChipIcon />,
      presets: [
        { name: t('filterDigitalSynthwave'), prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.', icon: <ViewfinderCircleIcon /> },
        { name: t('filterDigitalGlitch'), prompt: 'Transform the image with digital glitch effects and chromatic aberration.', icon: <WrenchScrewdriverIcon /> },
        { name: t('filterDigitalDuotone'), prompt: 'Apply a stylish duotone effect using a bold color combination, like cyan and magenta.', icon: <CircleHalfStrokeIcon /> },
        { name: t('filterDigitalPixel'), prompt: 'Convert the image into a retro 8-bit pixel art style.', icon: <Squares2x2Icon /> },
      ]
    }
  ];

  const renderAdjustmentPresets = (presets: { name: string; prompt: string; icon: JSX.Element }[]) => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
        {presets.map(preset => (
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
  );

  const renderFilterPresets = () => {
    const currentSection = filterSections.find(sec => sec.id === filterCategory);
    if (!currentSection) return null;

    const presets = currentSection.presets;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => onApplyFilter(preset.prompt)}
            disabled={isLoading || !isImageLoaded}
            className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={preset.name}
          >
            {React.cloneElement(preset.icon, { className: 'w-7 h-7 text-gray-300' })}
            <span className="leading-tight">{preset.name}</span>
          </button>
        ))}
      </div>
    );
  };


  const getPanelContent = () => {
    switch(mode) {
        case 'oneClick': return renderAdjustmentPresets(oneClickFixes.presets);
        case 'portrait': return renderAdjustmentPresets(portraitEnhancements.presets);
        case 'color': return renderAdjustmentPresets(colorAndTone.presets);
        case 'filters': 
            return (
                <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
                        {filterSections.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilterCategory(btn.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${filterCategory === btn.id ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                            title={btn.title}
                        >
                            {React.cloneElement(btn.icon, { className: 'w-5 h-5' })}
                            <span className="hidden md:inline">{btn.title}</span>
                        </button>
                        ))}
                    </div>
                    {renderFilterPresets()}
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
        <h3 className="text-lg font-semibold text-center text-gray-200">{t('adjustmentTitle')}</h3>
        
        <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
            <button
                onClick={() => setMode('oneClick')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'oneClick' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                title={t('oneClickTitle')}
            >
                <SparklesIcon className="w-5 h-5" /> <span className="hidden md:inline">{t('oneClickTitle')}</span>
            </button>
             <button
                onClick={() => setMode('portrait')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'portrait' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                title={t('adjustmentPortraitTitle')}
            >
                <UserCircleIcon className="w-5 h-5" /> <span className="hidden md:inline">{t('adjustmentPortraitTitle')}</span>
            </button>
             <button
                onClick={() => setMode('color')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'color' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                title={t('filterSectionColor')}
            >
                <PaletteIcon className="w-5 h-5" /> <span className="hidden md:inline">{t('filterSectionColor')}</span>
            </button>
            <button
                onClick={() => setMode('filters')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'filters' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                title={t('tabFilters')}
            >
                <MagicWandIcon className="w-5 h-5" /> <span className="hidden md:inline">{t('tabFilters')}</span>
            </button>
        </div>
        
        <div className="w-full">
            {getPanelContent()}
        </div>
        
        {mode !== 'filters' && (
            <>
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
            </>
        )}
    </div>
  );
};

export default AdjustmentPanel;