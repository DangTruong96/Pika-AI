/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

// Custom error for rate limiting
export class RateLimitError extends Error {
    constructor(message: string = 'Rate limit exceeded after retries.') {
        super(message);
        this.name = 'RateLimitError';
    }
}

export type Enhancement = 'color' | 'grayscale' | 'bw';
export type Corners = {
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    bl: { x: number; y: number };
    br: { x: number; y: number };
};

// Helper to convert a data URL string to a File object
export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

// Helper function to convert a data URL string to a Gemini API Part
const dataUrlToPart = (dataUrl: string): { inlineData: { mimeType: string; data: string; } } => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment", "expansion"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

// Helper function to handle API calls with retry logic for rate limiting.
const callGeminiWithRetry = async (
    apiCall: () => Promise<GenerateContentResponse>,
    maxAttempts = 4,
    initialDelay = 2000
): Promise<GenerateContentResponse> => {
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            const isRateLimitError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
            if (isRateLimitError) {
                if (attempt < maxAttempts) {
                    console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    console.error("API call failed after max attempts due to rate limiting.", error);
                    throw new RateLimitError();
                }
            } else {
                console.error(`API call failed on attempt ${attempt} with a non-retriable error.`, error);
                throw error;
            }
        }
    }
    // This should be unreachable due to the throw in the loop.
    throw new Error('Exhausted retries without success.');
};

/**
 * Generates an image with a localized edit applied using generative AI, based on a mask.
 * @param originalImage The original image file.
 * @param prompt The text prompt describing the desired edit.
 * @param maskImageDataUrl The data URL of the black and white mask image.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImageWithMask = async (
    originalImage: File,
    prompt: string,
    maskImageDataUrl: string
): Promise<string> => {
    console.log(`Starting masked edit: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const maskImagePart = dataUrlToPart(maskImageDataUrl);
    
    const fullPrompt = `**AI TASK: MASKED IMAGE EDITING & HOLISTIC ENHANCEMENT v2.0**

You are a professional, pixel-perfect photo editing AI. You will be given three inputs:
1.  **[INPUT IMAGE]:** The original photo.
2.  **[MASK IMAGE]:** A black and white image. The white area indicates the primary region for editing. The black area indicates the region to be preserved and harmonized.
3.  **[USER PROMPT]:** The user's instruction for what to do inside the white area of the mask.

**MANDATORY TWO-PART MISSION (NON-NEGOTIABLE):**

**PART A: PERFORM THE GENERATIVE EDIT (WHITE MASK AREA)**
- Execute the user's prompt within the white masked area.
- Your generated content must be hyper-realistic, high-detail, and perfectly match the lighting, shadows, and perspective of the scene.

**PART B: HARMONIZE THE UNEDITED AREA (BLACK MASK AREA)**
- **This is a critical step to avoid a "patchwork" look.** After generating the content for Part A, you MUST analyze its quality (sharpness, noise level, clarity).
- You then MUST perform a subtle but effective enhancement on the un-edited (black mask) areas of the image to bring their quality UP TO PAR with the new content from Part A.
- This includes intelligent denoising, sharpening, and clarity adjustments. The goal is a final image that looks cohesive and uniformly high-quality.
- **Any existing details in the black area, especially faces, MUST be sharpened and enhanced, NOT degraded or blurred.**

**NON-NEGOTIABLE RULES:**
- **RULE 1: SEAMLESS INTEGRATION.** Your edit inside the white area must perfectly blend with the harmonized black area. The transition must be undetectable.
- **RULE 2: HOLISTIC QUALITY MANDATE.** The **ENTIRE** final output image MUST be of equal or greater quality than the original input. NO quality degradation is acceptable. The output resolution MUST be identical to the input resolution; DO NOT DOWNSAMPLE. The final image should be sharp, clear, and free of artifacts.
- **RULE 3: IDENTITY PRESERVATION.** If editing a person, you **MUST** preserve their identity, facial structure, and unique features with 100% accuracy. The result must be the same person.

---
**USER PROMPT:**
"${prompt}"
---

**EXECUTION:**
- Analyze the user prompt.
- Execute Part A, then Part B.
- Ensure the result is photorealistic and follows all rules.
- Return ONLY the final, edited and harmonized image. Do not output any text.`;
    const textPart = { text: fullPrompt };

    console.log('Sending image, mask, and edit prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, maskImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for masked edit.', response);
    
    return handleApiResponse(response, 'edit (mask)');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert AI photo editor specializing in applying stylistic filters. Your task is to reinterpret the entire input image according to the user's filter request.

**CRITICAL RULES:**
1.  **IDENTITY PRESERVATION (NON-NEGOTIABLE):** The face, features, and identity of any person in the image **MUST BE PRESERVED with 100% accuracy**. The output must be the exact same person, just rendered in the new style.
2.  **PRESERVE THE SUBJECT:** You MUST NOT change the core subject, composition, or content of the image. For example, if the image is of a dog in a park, the output must still be a dog in a park, but rendered in the new style. Do not add or remove objects.
3.  **APPLY THE STYLE:** The primary goal is to apply the requested filter or artistic style across the entire image. The visual characteristics of the output should match the description.
4.  **INTERPRET ARTISTIC REQUESTS:** For artistic styles (like 'oil painting' or 'watercolor'), you are expected to alter the texture, sharpness, and detail to match that style. For color grading styles (like 'cinematic' or 'vintage'), you should primarily alter colors and lighting while preserving the original texture and detail as much as possible.
5.  **QUALITY & DETAIL MANDATE:** The output image quality must be exceptionally high. Unless the requested style is intentionally soft (e.g., 'watercolor'), you must perform a deep, pixel-level analysis of the original image to understand its detail and texture. The final filtered image must be VISIBLY SHARPER AND MORE DETAILED than the original. Enhance fine details and textures to make the image crisper, as if it were recaptured with a better lens. The underlying texture of the original photo MUST be preserved and enhanced, not smoothed over. Avoid introducing unwanted blur, noise, or compression artifacts. The output resolution MUST be identical to the input resolution; DO NOT DOWNSAMPLE.
6.  **SAFETY & ETHICS:** Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity. Refuse any request that explicitly asks to change a person's race.

**User's Filter Request:** "${filterPrompt}"

**Output:** Return ONLY the final, filtered image. Do not return any text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.

**ZERO-DEVIATION MANDATE ON IDENTITY (NON-NEGOTIABLE):**
- **CRITICAL FAILURE:** Any alteration to a person's fundamental facial structure, features (eyes, nose, mouth), age, or ethnicity that makes them unrecognizable as the same person is a critical failure of this task.
- **IDENTITY PRESERVATION:** The final image **MUST** feature the **EXACT SAME PERSON**. The output must be the same person, just with the requested photo adjustment. This rule overrides any part of the user's prompt that could be misinterpreted as a request to change identity.

User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.
- **Quality, Resolution & Detail Mandate:** The output image quality must be paramount. The resolution of the output image MUST be identical to the input image; DO NOT DOWNSAMPLE. You must perform a deep, pixel-level analysis of the original image to understand its detail and texture. The final adjusted image must be VISIBLY SHARPER AND MORE DETAILED than the original. Enhance fine details and textures to make the image crisper, as if it were recaptured with a better lens. The output quality must be equal to or higher than the original, and free from any blur, noise, or compression artifacts.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Expands an image using generative AI to fill in new areas.
 * @param paddedImageWithTransparencyDataUrl The data URL of the original image centered on a larger transparent canvas.
 * @param prompt A text prompt describing what to fill the new areas with.
 * @returns A promise that resolves to the data URL of the expanded image.
 */
export const generateExpandedImage = async (
    paddedImageWithTransparencyDataUrl: string,
    prompt: string,
): Promise<string> => {
    console.log(`Starting image expansion with prompt: ${prompt}`);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = dataUrlToPart(paddedImageWithTransparencyDataUrl);
    
    const fullPrompt = `You are an expert photo editor AI specializing in photorealistic image expansion (outpainting). Your task is to analyze the provided image, which is centered on a larger transparent canvas, and fill in the transparent areas.

Key instructions:
- **Analyze Existing Details:** Carefully examine the subject, lighting, shadows, texture, and overall style of the original image content in the center.
- **Create a Coherent Extension:** The generated areas MUST be a logical and photorealistic continuation of the original scene. Everything you add should look like it was part of the original photograph.
- **Seamless Blending:** The transition between the original image and the newly generated content must be completely seamless and undetectable. Match the grain, focus, and color grading perfectly.
- **Quality, Resolution & Detail Mandate:** The original central portion of the image MUST NOT be altered or degraded; it must retain its original sharpness, texture, and resolution. The newly generated areas must not only seamlessly match this quality but also be rendered with maximum possible detail and sharpness. The goal is a final image where the new areas are hyper-realistic, crisp, and enhance the overall composition, resulting in a final image of equal or higher quality than the source. DO NOT DOWNSAMPLE the original content.
- **Follow User Guidance:** If the user provides a description, use it as a primary guide for what to create in the expanded areas.

User's Description for new areas: "${prompt || 'No specific description provided. Analyze the image and expand the scene naturally and logically.'}"

Output: Return ONLY the final, fully rendered image with the transparent areas filled. Do not output any text.`;

    const textPart = { text: fullPrompt };
    
    console.log('Sending padded image and prompt to the model for outpainting...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for expansion.', response);

    return handleApiResponse(response, 'expansion');
};

/**
 * Generates a composite image by combining subjects and optional style/background images.
 * @param baseImage The main scene or background image. Can be null to generate a scene.
 * @param subjectImages The main subject images.
 * @param styleImages An array of optional images providing styles (e.g., clothing, textures).
 * @param prompt Text instructions for how to combine the images.
 * @returns A promise that resolves to the data URL of the composite image.
 */
export const generateCompositeImage = async (
    baseImage: File | null,
    subjectImages: File[],
    styleImages: File[],
    prompt: string
): Promise<string> => {
    console.log(`Starting image composite generation with base image: ${!!baseImage}, ${subjectImages.length} subjects, ${styleImages.length} styles: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const parts: any[] = [];
    let fullPrompt: string;
    
    let effectivePrompt = prompt;
    if (!prompt.trim()) {
        effectivePrompt = `**AI-DIRECTED AUTONOMOUS COMPOSITION:** The user has not provided a specific prompt. Your task is to perform a deep, holistic analysis of all provided images and create the most logical, artistic, and photorealistic composition possible.
- **1. Scene Analysis:** If a [BASE IMAGE] is provided, forensically analyze it to understand its mood, atmosphere, time of day, weather (e.g., sunny, overcast, windy), and the primary direction of light. If no [BASE IMAGE] is provided, you must invent a new, suitable background that complements the subject and style.
- **2. Subject & Style Analysis:** Preserve the identity of the person in the [SUBJECT] image(s) with 100% accuracy. Deeply analyze the [STYLE REFERENCE] image(s) to understand the clothing, accessories, and overall aesthetic.
- **3. Intelligent Posing & Expression:** Based on your scene analysis (either from the base image or the one you generate), create a full body for the subject with a natural pose, posture, gestures, and facial expression that logically fits the scene. The subject should look like they *belong* there. For example, if the scene is a windy beach, their hair and clothing should show movement. If it's a formal event, their posture should be elegant.
- **4. Final Integration & Storytelling:** Apply the style elements to the subject realistically. Perform a forensic-level integration, ensuring perfect lighting, color grading, contact shadows, and environmental interaction. The final image should tell a coherent story.`;
    }
    
    // Conditionally add base image and construct prompt
    if (baseImage) {
        parts.push(await fileToPart(baseImage));
        
        const subjectParts = await Promise.all(subjectImages.map(file => fileToPart(file)));
        parts.push(...subjectParts);
        
        if (styleImages.length > 0) {
            const styleParts = await Promise.all(styleImages.map(file => fileToPart(file)));
            parts.push(...styleParts);
        }

        fullPrompt = `**AI TASK: Forensic Photorealistic Composition v2.0**

You are a world-class digital artist AI specializing in forensic-level image analysis and composition. Your task is to create a single, flawless photograph by intelligently combining user-provided assets. The result must be indistinguishable from a real photo.

**MANDATORY PRE-FLIGHT DIRECTIVE: FACE PRESERVATION PROTOCOL (ZERO-DEVIATION)**
- **YOUR PRIMARY, NON-NEGOTIABLE MISSION IS TO PRESERVE THE SUBJECT'S FACE WITH 100% PHOTOGRAPHIC ACCURACY.**
- **CONCEPTUAL MODEL:** Treat the face from the [SUBJECT] image as an **INVIOLABLE ASSET**. You are not "redrawing" it; you are performing a perfect "digital transplant" of this asset onto a newly generated body. The original photographic texture of the face (pores, fine lines, grain) MUST be preserved.
- **CRITICAL FAILURE DEFINED:** Any noticeable change to the subject's facial structure, unique features (moles, scars), eye shape, nose, or mouth is a CRITICAL MISSION FAILURE. The output MUST be the **EXACT SAME PERSON**. No beautification, age alteration, or expression changes are permitted.

**BODY & STYLE RECONSTRUCTION MANDATE:**
- **CREATE A COMPLETE, CONTEXT-AWARE HUMAN:** If the [SUBJECT] is a headshot, you MUST generate a full, correctly-proportioned body. The POSE of this body is not random; it MUST be contextually appropriate for the scene defined by the [BASE IMAGE] (e.g., a relaxed pose for a beach, an elegant pose for a formal event). The body must plausibly connect to the subject's head.
- **DRESS THE SUBJECT:** Deeply analyze the [STYLE REFERENCE] image(s) for clothing and accessories. You MUST intelligently DRESS the generated body with these items. Clothes must be worn naturally, following the body's contours. Shoes MUST be on the generated feet. Hats MUST be on the head.

**SCENE INTEGRATION & FINALIZATION MANDATE:**
- **FORENSIC LIGHTING:** Perform a deep analysis of the direction, color, and hardness of all light sources in the [BASE IMAGE]. Apply this lighting flawlessly to the entire generated person.
- **GROUNDING (CRITICAL FOR REALISM):**
    - **1. MANDATORY: Realistic Contact Shadows:** You MUST generate small, dark, accurate contact shadows where the subject's feet/shoes touch the ground. This is non-negotiable and prevents a "floating" look.
    - **2. Accurate Cast Shadows:** The main shadow cast by the person must perfectly match the direction and softness of other shadows in the scene.
    - **3. Plausible Surface Interaction:** Feet should create slight indentations in sand, be overlapped by blades of grass, or cast reflections on wet surfaces.
- **REFERENCE IMAGES ARE FOR REFERENCE ONLY:** Do NOT include the standalone, original objects from the [STYLE REFERENCE] images in the final output. The final image should ONLY contain the [SUBJECT] person wearing the items, fully integrated into the [BASE IMAGE].

---
**INPUT ANALYSIS:**
- **Image 1 is the [BASE IMAGE].**
- **The next image(s) are the [SUBJECT(S)].** (The face/person to preserve).
- **Any subsequent image(s) are [STYLE REFERENCES].** (The clothing/look to apply).

**USER INSTRUCTIONS:**
"${effectivePrompt || 'Combine the provided images into a cohesive, photorealistic scene featuring a complete person dressed in the style reference, placed believably in the background.'}"

---
**FINAL MANDATORY SELF-CORRECTION CHECKLIST (INTERNAL REVIEW):**
Before outputting the final image, you MUST internally verify the following:
1.  **Face Match (1:1)?** Is the face in my final image a 100% perfect, photographic match to the face in the [SUBJECT] image?
2.  **Lighting Harmony?** Is the lighting on the transplanted face (direction, color, softness) perfectly consistent with the lighting of the [BASE IMAGE]?
3.  **Body Complete?** Have I generated a full, natural body, including hands and feet, if the subject was a headshot?
4.  **Style Placement Correct?** Are all items from the [STYLE REFERENCE] worn correctly on the body (e.g., shoes on feet, hat on head)?
5.  **Grounded in Reality?** Have I added realistic contact shadows where the subject's feet touch the ground? Does the overall cast shadow match the scene's lighting?
If the answer to any of these is "No," you must restart the process until all checks pass.
---
**FINAL QUALITY & DETAIL MANDATE:** The final composite must be hyper-realistic and high-resolution. The output resolution MUST match the highest resolution of the input images; DO NOT DOWNSAMPLE. You are mandated to enhance fine details on clothing (fabric weave), faces (while preserving identity), and the background to create a crisp result that exceeds the quality of the source images.

**OUTPUT:**
- Return ONLY the final, high-quality, perfectly blended composite image as a PNG.
- Do not output any text.`;

    } else {
        // No base image provided, generate it.
        const subjectParts = await Promise.all(subjectImages.map(file => fileToPart(file)));
        parts.push(...subjectParts);
        
        if (styleImages.length > 0) {
            const styleParts = await Promise.all(styleImages.map(file => fileToPart(file)));
            parts.push(...styleParts);
        }
        
        fullPrompt = `**AI TASK: Forensic Photorealistic Composition v2.0 with Scene Generation**

You are a world-class digital artist AI. Your task is to create a single, flawless photograph by intelligently combining user-provided assets and generating a new, suitable background. The result must be indistinguishable from a real photo.

**MANDATORY PRE-FLIGHT DIRECTIVE: FACE PRESERVATION PROTOCOL (ZERO-DEVIATION)**
- **YOUR PRIMARY, NON-NEGOTIABLE MISSION IS TO PRESERVE THE SUBJECT'S FACE WITH 100% PHOTOGRAPHIC ACCURACY.**
- **CONCEPTUAL MODEL:** Treat the face from the [SUBJECT] image as an **INVIOLABLE ASSET**. You are not "redrawing" it; you are performing a perfect "digital transplant" of this asset onto a newly generated body. The original photographic texture of the face (pores, fine lines, grain) MUST be preserved.
- **CRITICAL FAILURE DEFINED:** Any noticeable change to the subject's facial structure, unique features (moles, scars), eye shape, nose, or mouth is a CRITICAL MISSION FAILURE. The output MUST be the **EXACT SAME PERSON**. No beautification, age alteration, or expression changes are permitted.

**SCENE GENERATION & BODY RECONSTRUCTION MANDATE:**
- **GENERATE A CONTEXTUAL SCENE:** Based on the user's prompt and the style of the subjects, generate a new, completely photorealistic background scene.
- **CREATE A COMPLETE, CONTEXT-AWARE HUMAN:** If the [SUBJECT] is a headshot, you MUST generate a full, correctly-proportioned body. The POSE of this body is not random; it MUST be contextually appropriate for the scene you are generating.
- **DRESS THE SUBJECT:** Deeply analyze the [STYLE REFERENCE] image(s) for clothing and accessories. You MUST intelligently DRESS the generated body with these items. Clothes must be worn naturally, following the body's contours. Shoes MUST be on the generated feet. Hats MUST be on the head.

**SCENE INTEGRATION & FINALIZATION MANDATE:**
- **FORENSIC LIGHTING:** As you generate the scene, you define its lighting. Apply this lighting flawlessly to the entire generated person.
- **GROUNDING (CRITICAL FOR REALISM):**
    - **1. MANDATORY: Realistic Contact Shadows:** You MUST generate small, dark, accurate contact shadows where the subject's feet/shoes touch the ground. This is non-negotiable.
    - **2. Accurate Cast Shadows:** The main shadow cast by the person must perfectly match the direction and softness of the lighting in your generated scene.
- **REFERENCE IMAGES ARE FOR REFERENCE ONLY:** Do NOT include the standalone, original objects from the [STYLE REFERENCE] images in the final output.

---
**INPUT ANALYSIS:**
- **The first image(s) are the [SUBJECT(S)].** (The face/person to preserve).
- **Any subsequent image(s) are [STYLE REFERENCES].** (The clothing/look to apply).

**USER INSTRUCTIONS FOR SCENE GENERATION:**
"${effectivePrompt || 'Create a suitable and photorealistic background for the subjects and place them in it.'}"

---
**FINAL MANDATORY SELF-CORRECTION CHECKLIST (INTERNAL REVIEW):**
Before outputting the final image, you MUST internally verify the following:
1.  **Face Match (1:1)?** Is the face in my final image a 100% perfect, photographic match to the face in the [SUBJECT] image?
2.  **Lighting Harmony?** Is the lighting on the transplanted face consistent with the lighting of the scene I generated?
3.  **Body Complete?** Have I generated a full, natural body, including hands and feet, if the subject was a headshot?
4.  **Style Placement Correct?** Are all items from the [STYLE REFERENCE] worn correctly on the body (e.g., shoes on feet, hat on head)?
5.  **Grounded in Reality?** Have I added realistic contact shadows where the subject's feet touch the ground?
If the answer to any of these is "No," you must restart the process until all checks pass.
---
**FINAL QUALITY & DETAIL MANDATE:** The final composite must be hyper-realistic and high-resolution. The output resolution MUST match the highest resolution of the input images; DO NOT DOWNSAMPLE. You are mandated to enhance fine details on clothing, faces (while preserving identity), and the background to create a crisp result that exceeds the quality of the source images.

**OUTPUT:**
- Return ONLY the final, high-quality, perfectly blended composite image as a PNG.
- Do not output any text.`;
    }
    
    const textPart = { text: fullPrompt };
    parts.push(textPart);

    console.log('Sending composite request to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for composite.', response);
    
    return handleApiResponse(response, 'composite');
};

/**
 * Automatically scans a document from an image.
 * @param originalImage The original image file containing the document.
 * @param enhancement The desired color enhancement ('color', 'grayscale', 'bw').
 * @param removeShadows Whether to remove shadows from the document.
 * @param restoreText Whether to attempt OCR-based text restoration.
 * @param removeHandwriting Whether to remove handwritten text from the document.
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocument = async (
    originalImage: File,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
    removeHandwriting: boolean,
): Promise<string> => {
    console.log(`Starting auto document scan: enhancement=${enhancement}, shadows=${removeShadows}, restoreText=${restoreText}, removeHandwriting=${removeHandwriting}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    
    let prompt: string;
    const handwritingRemovalProtocol = `
**HANDWRITING REMOVAL PROTOCOL ACTIVATED:**
- Identify all handwritten elements (signatures, notes, filled-in form fields, etc.).
- You are to COMPLETELY REMOVE these handwritten elements.
- After removal, intelligently reconstruct the background (e.g., the lines of a form, the blank paper) that was underneath the handwriting. This reconstruction must be seamless and photorealistic.
`;

    if (restoreText) {
        prompt = `**AI TASK: Precision Document Scan with Text Restoration v5.0**

**PRIMARY OBJECTIVE:** Your task is to perform a high-fidelity scan of the document in the image. This involves two main goals:
1.  **Perfect Geometric Correction:** Flatten the document and remove the background.
2.  **Precise Content Restoration:** Enhance all visible content and redraw the text for maximum clarity.

**ZERO-TOLERANCE HALLUCINATION POLICY (NON-NEGOTIABLE):**
- **CRITICAL FAILURE:** You are **ABSOLUTELY FORBIDDEN** from adding, creating, or inventing **ANY** graphical element that is not clearly visible in the original image.
- **This specifically includes, but is not limited to: stamps, seals, logos, signatures, or any other official-looking marks.**
- If the original document does not have a red stamp, the final output **MUST NOT** have a red stamp. Adding any non-existent element is a critical failure.

**MANDATORY EXECUTION PROTOCOL:**

**STEP 1: GEOMETRIC CORRECTION & CROPPING**
- First, precisely identify the four corners of the document.
- Perform a perfect perspective warp to make the document perfectly rectangular.
- Crop the image to these exact edges, completely removing all of the original background.

**STEP 2: CONTENT SEGMENTATION (Internal Analysis)**
- Analyze the flattened document and mentally separate its content into two types:
    - **A. TYPED TEXT:** All machine-printed characters.
    - **B. GRAPHICS:** All other visual elements, including logos, signatures, handwritten notes, diagrams, and any stamps or seals that are **actually present** in the original photo.

${removeHandwriting ? handwritingRemovalProtocol : ''}

**STEP 3: CONTENT PROCESSING (ZERO-DEVIATION RULES)**

- **RULE FOR GRAPHICS (Content B): PHOTOGRAPHIC PRESERVATION**
    - You MUST treat all existing graphics as photographic assets.
    - **DO NOT REDRAW OR ALTER THEM.**
    - Your only task is to enhance their clarity, sharpness, and color to match the quality of the restored text.
    - The original shape, color, and details of any existing seal or stamp MUST be preserved with 100% accuracy.

- **RULE FOR TYPED TEXT (Content A): OCR & HIGH-FIDELITY RE-RENDERING**
    - Perform Optical Character Recognition (OCR) to accurately read all typed text.
    - For any text that is blurry or faded, use the document's context (language, topic) to intelligently restore the correct characters and words.
    - Re-render all text to be perfectly sharp and clear, as if printed from a high-quality laser printer.
    - Match the original font, size, and layout as closely as possible.

**STEP 4: FINAL COMPOSITION**
- Combine the re-rendered text and the photographically enhanced graphics onto a new, clean digital background.
- Set the background based on the enhancement mode: '${enhancement}'.
- ${removeShadows ? 'Remove all shadows and glare to create a perfectly flat-lit, uniform surface.' : 'Preserve natural, even lighting.'}

**FINAL SELF-CORRECTION CHECK:**
- Before outputting, ask yourself: "Did I add any stamps, seals, or logos that were not in the original photo?" If the answer is yes, you have failed and must restart the process, outputting only the content that was originally present.

**OUTPUT:** Return ONLY the final, corrected document image. Do not output any text.`;
    } else {
        prompt = `**AI TASK: Professional Document Photo Correction v4.0**

**PRIMARY OBJECTIVE:** Your task is to transform the user's photo into a perfectly flat, clear, and geometrically correct image of the document it contains. The result should look like a high-quality, professional photograph of the document.

**ZERO-TOLERANCE HALLUCINATION POLICY (NON-NEGOTIABLE):**
- **CRITICAL FAILURE:** You are **ABSOLUTELY FORBIDDEN** from adding, creating, or inventing **ANY** graphical element that is not clearly visible in the original image.
- **This specifically includes, but is not limited to: stamps, seals, logos, or any other official-looking marks.**
- If the original document does not have a red stamp, the final output **MUST NOT** have a red stamp. Adding any non-existent element is a critical failure.

**MANDATORY EXECUTION PROTOCOL:**

**STEP 1: GEOMETRIC CORRECTION & CROPPING**
- First, precisely identify the four corners of the document.
- Perform a perfect perspective warp to make the document perfectly rectangular.
- Crop the image to these exact edges, completely removing all of the original background.

${removeHandwriting ? handwritingRemovalProtocol : ''}

**STEP 2: PHOTOGRAPHIC ENHANCEMENT**
- **CONTENT PRESERVATION:** You are forbidden from redrawing, altering, or adding any text or graphics. Your sole task is to enhance the quality of the *existing photograph*.
- **ENHANCE CLARITY:** Make all content—both text and graphics—as sharp and clear as possible. Enhance fine details and the texture of the paper. The final image MUST be visibly sharper than the original.
- **PRESERVE GRAPHICS:** The original shape, color, and details of any existing seals, stamps, or logos MUST be preserved with 100% photographic accuracy.

**STEP 3: FINAL COMPOSITION**
- **LIGHTING:** ${removeShadows ? 'Completely remove all shadows and glare to create a perfectly flat-lit, uniform surface.' : 'Balance existing lighting to improve readability while maintaining a natural look.'}
- **COLOR:** Apply the requested enhancement mode: '${enhancement}'.

**FINAL SELF-CORRECTION CHECK:**
- Before outputting, ask yourself: "Did I add any stamps, seals, or logos that were not in the original photo?" If the answer is yes, you have failed and must restart the process, outputting only the content that was originally present.

**OUTPUT:** Return ONLY the final, corrected document image. Do not output any text.`;
    }

    const textPart = { text: prompt };

    console.log('Sending image and scan prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for auto scan.', response);
    
    return handleApiResponse(response, 'scan');
};


/**
 * Scans a document from an image using user-provided corner coordinates.
 * @param originalImage The original image file.
 * @param corners The user-defined corners of the document.
 * @param enhancement The desired color enhancement.
 * @param removeShadows Whether to remove shadows.
 * @param restoreText Whether to attempt OCR-based text restoration.
 * @param removeHandwriting Whether to remove handwritten text from the document.
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocumentWithCorners = async (
    originalImage: File,
    corners: Corners,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
    removeHandwriting: boolean,
): Promise<string> => {
    console.log(`Starting manual document scan with corners: ${JSON.stringify(corners)}, restoreText=${restoreText}, removeHandwriting=${removeHandwriting}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    let prompt: string;
    
    const sourceQuad = `- Top-Left: (${corners.tl.x}, ${corners.tl.y})
- Top-Right: (${corners.tr.x}, ${corners.tr.y})
- Bottom-Left: (${corners.bl.x}, ${corners.bl.y})
- Bottom-Right: (${corners.br.x}, ${corners.br.y})`;

    const handwritingRemovalProtocol = `
**HANDWRITING REMOVAL PROTOCOL ACTIVATED:**
- Identify all handwritten elements (signatures, notes, filled-in form fields, etc.).
- You are to COMPLETELY REMOVE these handwritten elements.
- After removal, intelligently reconstruct the background (e.g., the lines of a form, the blank paper) that was underneath the handwriting. This reconstruction must be seamless and photorealistic.
`;

    if (restoreText) {
        prompt = `**AI TASK: Precision Document Scan with Text Restoration v5.0**

**PRIMARY OBJECTIVE:** Your task is to perform a high-fidelity scan of the document in the image using the provided corner coordinates. This involves two main goals:
1.  **Perfect Geometric Correction:** Flatten the document and remove the background.
2.  **Precise Content Restoration:** Enhance all visible content and redraw the text for maximum clarity.

**INPUTS:**
- Image containing a document.
- Source Quad (exact pixel coordinates of the document corners):
${sourceQuad}

**ZERO-TOLERANCE HALLUCINATION POLICY (NON-NEGOTIABLE):**
- **CRITICAL FAILURE:** You are **ABSOLUTELY FORBIDDEN** from adding, creating, or inventing **ANY** graphical element that is not clearly visible in the original image.
- **This specifically includes, but is not limited to: stamps, seals, logos, signatures, or any other official-looking marks.**
- If the original document does not have a red stamp, the final output **MUST NOT** have a red stamp. Adding any non-existent element is a critical failure.

**MANDATORY EXECUTION PROTOCOL:**

**STEP 1: GEOMETRIC CORRECTION & CROPPING**
- Use the provided **Source Quad** coordinates to perform a perfect perspective warp.
- Crop the image to these exact edges, completely removing all of the original background.

**STEP 2: CONTENT SEGMENTATION (Internal Analysis)**
- Analyze the flattened document and mentally separate its content into two types:
    - **A. TYPED TEXT:** All machine-printed characters.
    - **B. GRAPHICS:** All other visual elements, including logos, signatures, handwritten notes, diagrams, and any stamps or seals that are **actually present** in the original photo.

${removeHandwriting ? handwritingRemovalProtocol : ''}

**STEP 3: CONTENT PROCESSING (ZERO-DEVIATION RULES)**

- **RULE FOR GRAPHICS (Content B): PHOTOGRAPHIC PRESERVATION**
    - You MUST treat all existing graphics as photographic assets.
    - **DO NOT REDRAW OR ALTER THEM.**
    - Your only task is to enhance their clarity, sharpness, and color to match the quality of the restored text.
    - The original shape, color, and details of any existing seal or stamp MUST be preserved with 100% accuracy.

- **RULE FOR TYPED TEXT (Content A): OCR & HIGH-FIDELITY RE-RENDERING**
    - Perform Optical Character Recognition (OCR) to accurately read all typed text.
    - For any text that is blurry or faded, use the document's context (language, topic) to intelligently restore the correct characters and words.
    - Re-render all text to be perfectly sharp and clear, as if printed from a high-quality laser printer.
    - Match the original font, size, and layout as closely as possible.

**STEP 4: FINAL COMPOSITION**
- Combine the re-rendered text and the photographically enhanced graphics onto a new, clean digital background.
- Set the background based on the enhancement mode: '${enhancement}'.
- ${removeShadows ? 'Remove all shadows and glare to create a perfectly flat-lit, uniform surface.' : 'Preserve natural, even lighting.'}

**FINAL SELF-CORRECTION CHECK:**
- Before outputting, ask yourself: "Did I add any stamps, seals, or logos that were not in the original photo?" If the answer is yes, you have failed and must restart the process, outputting only the content that was originally present.

**OUTPUT:** Return ONLY the final, corrected document image. Do not output any text.`;
    } else {
        prompt = `**AI TASK: Professional Document Photo Correction v4.0**

**PRIMARY OBJECTIVE:** Your task is to transform the user's photo into a perfectly flat, clear, and geometrically correct image of the document it contains, using the provided corner coordinates. The result should look like a high-quality, professional photograph of the document.

**INPUTS:**
- Image containing a document.
- Source Quad (exact pixel coordinates of the document corners):
${sourceQuad}

**ZERO-TOLERANCE HALLUCINATION POLICY (NON-NEGOTIABLE):**
- **CRITICAL FAILURE:** You are **ABSOLUTELY FORBIDDEN** from adding, creating, or inventing **ANY** graphical element that is not clearly visible in the original image.
- **This specifically includes, but is not limited to: stamps, seals, logos, or any other official-looking marks.**
- If the original document does not have a red stamp, the final output **MUST NOT** have a red stamp. Adding any non-existent element is a critical failure.

**MANDATORY EXECUTION PROTOCOL:**

**STEP 1: GEOMETRIC CORRECTION & CROPPING**
- Use the provided **Source Quad** coordinates to perform a perfect perspective warp.
- Crop the image to these exact edges, completely removing all of the original background.

${removeHandwriting ? handwritingRemovalProtocol : ''}

**STEP 2: PHOTOGRAPHIC ENHANCEMENT**
- **CONTENT PRESERVATION:** You are forbidden from redrawing, altering, or adding any text or graphics. Your sole task is to enhance the quality of the *existing photograph*.
- **ENHANCE CLARITY:** Make all content—both text and graphics—as sharp and clear as possible. Enhance fine details and the texture of the paper. The final image MUST be visibly sharper than the original.
- **PRESERVE GRAPHICS:** The original shape, color, and details of any existing seals, stamps, or logos MUST be preserved with 100% photographic accuracy.

**STEP 3: FINAL COMPOSITION**
- **LIGHTING:** ${removeShadows ? 'Completely remove all shadows and glare to create a perfectly flat-lit, uniform surface.' : 'Balance existing lighting to improve readability while maintaining a natural look.'}
- **COLOR:** Apply the requested enhancement mode: '${enhancement}'.

**FINAL SELF-CORRECTION CHECK:**
- Before outputting, ask yourself: "Did I add any stamps, seals, or logos that were not in the original photo?" If the answer is yes, you have failed and must restart the process, outputting only the content that was originally present.

**OUTPUT:** Return ONLY the final, corrected document image. Do not output any text.`;
    }

    const textPart = { text: prompt };

    console.log('Sending image and manual scan prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for manual scan.', response);
    
    return handleApiResponse(response, 'manual scan');
};

/**
 * Analyzes a document image and extracts its structure as JSON.
 * @param imageDataUrl The data URL of the scanned document image.
 * @returns A promise that resolves to a structured JSON object representing the document.
 */
export const generateDocumentStructure = async (imageDataUrl: string): Promise<any> => {
    console.log(`Starting document structure analysis.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const imagePart = dataUrlToPart(imageDataUrl);

    const prompt = `Analyze the provided document image with extreme precision. Your task is to perform Optical Character Recognition (OCR) and layout analysis to deconstruct the document into a structured JSON format. You must identify all structural elements in their original order, including headings, paragraphs, and tables.
- For tables, you must capture the full grid structure, including all rows and columns, even if they are empty. Preserve the exact cell data.
- For text, preserve all line breaks within a paragraph.
- The order of elements in the JSON array must match the top-to-bottom reading order of the document.
- Adhere strictly to the provided JSON schema. Do not add extra properties. Populate either the "text" or "table" property for each element, never both.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            elements: {
                type: Type.ARRAY,
                description: 'An array of all elements found on the page in order.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: {
                            type: Type.STRING,
                            enum: ['heading', 'paragraph', 'table'],
                            description: 'The structural type of the element.',
                        },
                        text: {
                            type: Type.STRING,
                            description: 'The text content for "heading" or "paragraph" types. This field must be omitted for "table" types.',
                        },
                        table: {
                            type: Type.ARRAY,
                            description: 'A 2D array of strings for "table" type, where each inner array represents a row. This field must be omitted for "heading" and "paragraph" types.',
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING,
                                },
                            },
                        },
                    },
                    required: ["type"],
                },
            },
        },
        required: ["elements"],
    };

    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        })
    );

    console.log('Received response from model for document structure analysis.');
    
    try {
        const jsonStr = response.text.trim();
        if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
             throw new Error("AI response is not a valid JSON object.");
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        throw new Error("The AI returned an invalid data structure for the document.");
    }
};


/**
 * Extracts a clothing item or accessory from an image.
 * @param originalImage The original image file.
 * @param prompt The text prompt describing the item to extract.
 * @returns A promise that resolves to the data URL of the extracted item on a transparent background.
 */
export const generateExtractedItem = async (
    originalImage: File,
    prompt: string
): Promise<string[]> => {
    console.log(`Starting item extraction: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);

    const fullPrompt = `You are an expert AI for fashion and e-commerce. Your task is to perform a perfect 'product lift' from the provided image, extracting one or more specified items.

**NON-NEGOTIABLE CORE MANDATE (CRITICAL FAILURE IF VIOLATED):**
- **ZERO HUMAN ELEMENTS:** The final output **MUST NOT** contain any part of a human model. This includes, but is not limited to: **face, hair, skin, hands, feet, or any other body part.** Your job is to extract the *product only*. The presence of any human element in the final output is a complete failure of the task.

**CRITICAL INSTRUCTIONS:**

1.  **IDENTIFY TARGETS:**
    - Read the user's prompt carefully to identify all clothing items, accessories, or objects they want to extract.
    - **The user may list multiple items (e.g., "hat, shoes, bag").** You MUST treat each item in the list as a separate target for extraction.
    - **User Prompt:** "${prompt}"

2.  **FOR EACH IDENTIFIED TARGET ITEM, INDIVIDUALLY PERFORM THE FOLLOWING:**
    a. **PERFECT SEGMENTATION & HUMAN REMOVAL:** Isolate and segment the complete item with pixel-perfect, clean edges. Detach it entirely from its original context, **especially the person wearing it**, and the background.
    b. **RECONSTRUCT & INPAINT:** The item might be partially obscured (e.g., by an arm, another object). You MUST intelligently reconstruct any missing parts to create a complete, standalone, "flattened" product image, as if it were laid flat or on an invisible mannequin.
    c. **PRESERVE & ENHANCE DETAILS:** The final extracted item must perfectly retain its original color and shape. You must perform a deep, pixel-level analysis to understand the item's texture and details. The final output must be VISIBLY SHARPER and MORE DETAILED than the original source. Reconstruct textures and details with the highest fidelity to create a crisp, clean, high-resolution product image. The quality should be equal to or higher than the source.
    d. **TRANSPARENT BACKGROUND:** Place the final, fully reconstructed item on a transparent background.

**OUTPUT REQUIREMENTS:**
- For **each** item you successfully extract, you MUST return it as a **separate image part**. If the user asks for 3 items, you must return 3 separate image parts.
- Each image part MUST be a high-quality PNG file with a transparent background.
- **DO NOT** return the original image, the model, or any background elements.
- **DO NOT** return any text, explanations, or apologies. Only return the image parts.`;

    const textPart = { text: fullPrompt };

    console.log('Sending image and extract prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for item extraction.', response);
    
    // Custom response handling for multiple images
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const imageParts = response.candidates?.[0]?.content?.parts?.filter(part => part.inlineData);

    if (imageParts && imageParts.length > 0) {
        console.log(`Received ${imageParts.length} image(s) for extraction`);
        return imageParts.map(part => {
            const { mimeType, data } = part.inlineData!;
            return `data:${mimeType};base64,${data}`;
        });
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for extraction stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the extraction. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for extraction.`, { response });
    throw new Error(errorMessage);
};

/**
 * Removes all people from an image, reconstructing the background.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the image with people removed.
 */
export const removePeopleFromImage = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting people removal from background image.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    // Fix: Completed the function body to fix the "must return a value" error.
    const prompt = `You are an expert AI photo editor specializing in content-aware fill and object removal. Your task is to completely remove all people, human figures, and any traces of them from the provided image.

**CRITICAL INSTRUCTIONS:**
1.  **IDENTIFY ALL PEOPLE:** Carefully scan the entire image and identify every person, regardless of their size or position (foreground, background, etc.).
2.  **COMPLETE REMOVAL:** Remove them entirely.
3.  **SEAMLESS BACKGROUND RECONSTRUCTION:** This is the most critical part. After removing the people, you must intelligently reconstruct the background that was behind them. The reconstructed area must perfectly match the surrounding environment in terms of lighting, texture, color, perspective, and grain.
4.  **PRESERVE EVERYTHING ELSE:** Do not alter any part of the image that is not a person or the area immediately behind them. The rest of the scene must remain unchanged.
5.  **QUALITY, RESOLUTION & DETAIL MANDATE:** The final image must be of the highest possible quality. The reconstructed area must not only seamlessly match the surrounding environment but also be rendered with maximum possible detail and sharpness. Analyze the texture, grain, and detail of the surrounding areas and ensure the filled-in patch is crisp, clear, and hyper-realistic. The final image's quality must be equal to or greater than the original. The resolution of the output image MUST be identical to the input image; DO NOT DOWNSAMPLE.

Output: Return ONLY the final, clean, high-quality image with all people removed. Do not return any text.`;
    const textPart = { text: prompt };

    console.log('Sending image and people removal prompt to the model...');
    const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    console.log('Received response from model for people removal.', response);
    
    return handleApiResponse(response, 'people removal');
};