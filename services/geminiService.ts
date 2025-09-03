/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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
    
    const fullPrompt = `You are a professional, pixel-perfect photo editing AI. The user has provided an image, a mask, and an instruction. Your task is to perform a photorealistic edit based ONLY on these inputs.

**CRITICAL RULES:**
1.  **THE MASK IS THE *ONLY* EDIT ZONE:** The provided mask image dictates the one and only area you can change. White pixels in the mask are the 'edit zone'. Black pixels are 'protected zones'.
2.  **NEVER TOUCH PROTECTED ZONES:** The black areas of the mask correspond to parts of the original image that **MUST BE PRESERVED IDENTICALLY**. Do not change, recolor, distort, or alter these protected pixels in any way.
3.  **PERFORM THIS EXACT TASK:** Inside the 'edit zone' (the white parts of the mask), perform the following action: **"${prompt}"**.
4.  **IDENTITY PRESERVATION:** If the edit involves a person's face, you **MUST PRESERVE THEIR IDENTITY**. The final output must be the same person, only with the requested edit applied. Do not change their fundamental facial structure or features. This is a non-negotiable rule.
5.  **BLEND SEAMLESSLY:** The edit must integrate perfectly with the protected parts of the image. Match lighting, shadows, texture, grain, perspective, and color grading.
6.  **MAINTAIN OVERALL QUALITY:** The final output image (including both edited and protected zones) MUST retain the same level of sharpness, detail, and texture as the original input image. Do not introduce blurriness or compression artifacts.

Output: Return ONLY the final, high-quality, edited image as a PNG file. Do not output text, explanations, or apologies.`;
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
5.  **SAFETY & ETHICS:** Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity. Refuse any request that explicitly asks to change a person's race.

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
- **Quality Preservation:** The output must retain the same level of sharpness, detail, and texture as the input. Avoid introducing blur or compression artifacts.

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
- **Preserve Original Quality:** The original central portion of the image MUST NOT be altered or degraded. It should retain its original sharpness and detail. The newly generated areas must match this quality.
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
    if (styleImages.length > 0 && subjectImages.length > 0 && !prompt.trim()) {
        if (baseImage) {
            effectivePrompt = "Analyze the [STYLE REFERENCE] image(s) to understand their key visual elements (e.g., clothing, style, texture, color scheme). Apply these elements photorealistically to the [SUBJECT] image(s). The final image should seamlessly integrate the newly styled subject into the [BASE IMAGE].";
        } else {
            effectivePrompt = "Analyze the [STYLE REFERENCE] image(s) to understand their key visual elements (e.g., clothing, style, texture, color scheme). Apply these elements photorealistically to the [SUBJECT] image(s). Then, generate a new, suitable, and photorealistic background scene for the newly styled subject and place them in it.";
        }
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

        fullPrompt = `**AI TASK: Flawless Photorealistic Composition**

You are a world-class digital artist AI with a specialization in forensic-level image analysis and composition. Your task is to create a single, flawless, photorealistic photograph by deeply understanding and intelligently combining user-provided assets. The final result must be utterly indistinguishable from a real, single-shot photograph.

**HIERARCHICAL MANDATES (NON-NEGOTIABLE):**

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY & TEXTURE PRESERVATION.**
- Your primary, non-negotiable task is to preserve the **identity, facial structure, and original facial texture** of the person in the [SUBJECT] image.
- The final face must be **instantly recognizable** as the **EXACT SAME PERSON**.
- Altering their identity, features, or fundamental skin/facial texture is a CRITICAL FAILURE.

**LEVEL 2 MANDATE (INTELLIGENT RECONSTRUCTION): CREATE A COMPLETE HUMAN.**
- The user's goal is a **complete person**, not just a floating head.
- **If the [SUBJECT] is only a face/headshot, you MUST generate a full, correctly-proportioned, and natural-looking body, including arms, hands, legs, and feet.**
- The generated body must plausibly connect to the subject's head.
- **Deeply analyze** the [STYLE REFERENCE] image(s) for clothing (e.g., an 'áo dài'), accessories (e.g., shoes, hats), and overall aesthetic.
- **You MUST intelligently and correctly DRESS the generated body with the clothing and accessories from the [STYLE REFERENCE].**
    - **Clothes must be worn naturally, following the body's contours and pose.**
    - **Shoes MUST be placed on the generated feet.**
    - **Accessories must be placed in their correct locations (e.g., hat on head).**

**LEVEL 3 MANDATE (FORENSIC-LEVEL SCENE INTEGRATION):**
- The final composed person must exist believably within the [BASE IMAGE] scene.
- **Posing:** The generated body's pose must be natural and appropriate for the scene.
- **Grounding & Environmental Interaction (CRITICAL FOR REALISM):** The subject must appear physically present and grounded in the scene.
    - **1. Forensic Lighting Analysis:** Perform a **deep and forensic-level analysis** of the direction, color, and hardness/softness of all light sources and shadows in the [BASE IMAGE]. Apply this lighting flawlessly to the entire generated person.
    - **2. MANDATORY: Realistic Contact Shadows:** You MUST generate small, dark, and accurate contact shadows directly beneath any part of the subject's feet or shoes that touch the ground. This is non-negotiable and is the most important step to prevent a "floating" look.
    - **3. Accurate Cast Shadows:** The main shadow cast by the person must perfectly match the direction, length, and softness of other shadows in the scene.
    - **4. Plausible Surface Interaction:** The feet/shoes must interact with the surface. Examples: they should create slight indentations in sand, have blades of grass overlapping them on a lawn, or cast subtle reflections on wet or polished surfaces.
    - **5. Reflected Light:** Subtly bounce a small amount of light and color from the ground surface onto the lower parts of the subject (e.g., shoes, bottom of pants).
- **Environmental Interaction (Clothing):** The clothing must also interact with the environment. If the scene is outdoors, a long dress like an 'áo dài' should show subtle movement or folds as if affected by a breeze. It should not look stiff or flat.
- **Consistency:** Ensure perfect matching of perspective, scale, focus, and image grain.

**LEVEL 4 MANDATE (CRITICAL: REFERENCE ONLY):**
- The [STYLE REFERENCE] image(s) are **for visual reference only**. Their purpose is to show you *what* clothes/accessories to apply to the [SUBJECT].
- **DO NOT include the standalone, original objects from the [STYLE REFERENCE] images in the final output.** The final image must NOT contain the original reference item floating separately.
- The final image should ONLY contain the [SUBJECT] person, now wearing the items *from* the [STYLE REFERENCE], fully integrated into the [BASE IMAGE].

---
**INPUT ANALYSIS:**
- **Image 1 is the [BASE IMAGE].**
- **The next image(s) are the [SUBJECT(S)].** (The face/person to preserve).
- **Any subsequent image(s) are [STYLE REFERENCES].** (The clothing/look to apply).

**USER INSTRUCTIONS:**
"${effectivePrompt || 'Combine the provided images into a cohesive, photorealistic scene featuring a complete person dressed in the style reference, placed believably in the background.'}"

---
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
        
        fullPrompt = `**AI TASK: Flawless Photorealistic Composition with Scene Generation**

You are a world-class digital artist AI with a specialization in forensic-level image analysis and composition. Your task is to create a single, flawless, photorealistic photograph by deeply understanding and intelligently combining user-provided assets. The final result must be utterly indistinguishable from a real, single-shot photograph.

**HIERARCHICAL MANDATES (NON-NEGOTIABLE):**

**LEVEL 1 MANDATE (ABSOLUTE PRIORITY): 100% IDENTITY & TEXTURE PRESERVATION.**
- Your primary, non-negotiable task is to preserve the **identity, facial structure, and original facial texture** of the person in the [SUBJECT] image.
- The final face must be **instantly recognizable** as the **EXACT SAME PERSON**.
- Altering their identity, features, or fundamental skin/facial texture is a CRITICAL FAILURE.

**LEVEL 2 MANDATE (INTELLIGENT RECONSTRUCTION): CREATE A COMPLETE HUMAN.**
- The user's goal is a **complete person**, not just a floating head.
- **If the [SUBJECT] is only a face/headshot, you MUST generate a full, correctly-proportioned, and natural-looking body, including arms, hands, legs, and feet.**
- The generated body must plausibly connect to the subject's head.
- **Deeply analyze** the [STYLE REFERENCE] image(s) for clothing (e.g., an 'áo dài'), accessories (e.g., shoes, hats), and overall aesthetic.
- **You MUST intelligently and correctly DRESS the generated body with the clothing and accessories from the [STYLE REFERENCE].**
    - **Clothes must be worn naturally, following the body's contours and pose.**
    - **Shoes MUST be placed on the generated feet.**
    - **Accessories must be placed in their correct locations (e.g., hat on head).**

**LEVEL 3 MANDATE (FORENSIC-LEVEL SCENE INTEGRATION):**
- The final composed person must exist believably within the generated scene.
- **Posing:** The generated body's pose must be natural and appropriate for the scene.
- **Grounding & Environmental Interaction (CRITICAL FOR REALISM):** The subject must appear physically present and grounded in the scene.
    - **1. Forensic Lighting Analysis:** As you generate the scene, you define its lighting. Apply this lighting flawlessly to the entire generated person.
    - **2. MANDATORY: Realistic Contact Shadows:** You MUST generate small, dark, and accurate contact shadows directly beneath any part of the subject's feet or shoes that touch the ground. This is non-negotiable and is the most important step to prevent a "floating" look.
    - **3. Accurate Cast Shadows:** The main shadow cast by the person must perfectly match the direction, length, and softness of other shadows in the generated scene.
    - **4. Plausible Surface Interaction:** The feet/shoes must interact with the surface. Examples: they should create slight indentations in sand, have blades of grass overlapping them on a lawn, or cast subtle reflections on wet or polished surfaces.
    - **5. Reflected Light:** Subtly bounce a small amount of light and color from the ground surface onto the lower parts of the subject (e.g., shoes, bottom of pants).
- **Environmental Interaction (Clothing):** The clothing must also interact with the environment. If the scene is outdoors, a long dress like an 'áo dài' should show subtle movement or folds as if affected by a breeze. It should not look stiff or flat.
- **Consistency:** Ensure perfect matching of perspective, scale, focus, and image grain.

**LEVEL 4 MANDATE (CRITICAL: REFERENCE ONLY):**
- The [STYLE REFERENCE] image(s) are **for visual reference only**. Their purpose is to show you *what* clothes/accessories to apply to the [SUBJECT].
- **DO NOT include the standalone, original objects from the [STYLE REFERENCE] images in the final output.** The final image must NOT contain the original reference item floating separately.
- The final image should ONLY contain the [SUBJECT] person, now wearing the items *from* the [STYLE REFERENCE], fully integrated into the generated scene.

---
**INPUT ANALYSIS:**
- **The first image(s) are the [SUBJECT(S)].** (The face/person to preserve).
- **Any subsequent image(s) are [STYLE REFERENCES].** (The clothing/look to apply).

**USER INSTRUCTIONS FOR SCENE GENERATION:**
"${effectivePrompt || 'Create a suitable and photorealistic background for the subjects and place them in it.'}"

---
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
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocument = async (
    originalImage: File,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
): Promise<string> => {
    console.log(`Starting auto document scan: enhancement=${enhancement}, shadows=${removeShadows}, restoreText=${restoreText}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    
    let prompt: string;

    if (restoreText) {
        prompt = `**AI TASK: Zero Deviation Document Protocol**

**CORE MANDATE:** This is a forensic-level recreation task. Your primary goal is to produce a perfect digital copy. Any creative alteration, hallucination, or deviation from the original's graphical content is a CRITICAL FAILURE of this task.

**MANDATORY EXECUTION PLAN:**

1.  **GEOMETRIC CORRECTION:**
    - Perform a perfect perspective warp to make the document appear completely flat and rectangular.
    - Crop precisely to the document's edges.

2.  **CONTENT TRIAGE (CRITICAL ANALYSIS):**
    - **Examine the entire document and classify ALL content into one of two categories:**
        - **1. TYPED TEXT:** Machine-printed text.
        - **2. GRAPHICAL & HANDWRITTEN ELEMENTS:** Includes all stamps, seals, logos, signatures, handwriting, diagrams, and photos.

3.  **CONTENT HANDLING (NON-NEGOTIABLE RULES):**

    - **A. For GRAPHICAL & HANDWRITTEN ELEMENTS (FORENSIC PRESERVATION MANDATE):**
        - **A.1. ZERO HALLUCINATION & ALTERATION (ABSOLUTE PROHIBITION):** You are **STRICTLY FORBIDDEN** from re-drawing, replacing, generating, creating, or "cleaning up" any element in this category. A re-drawn seal or a generated signature is a CRITICAL FAILURE. Adding a seal that was not in the original is a CRITICAL FAILURE.
        - **A.2. PERFECT PHOTOGRAPHIC TRANSFER:** These elements **MUST** be photographically "lifted" directly from the source image. Their original shape, color, texture, and internal details must be preserved with 100% accuracy.
        - **A.3. PERFECT POSITIONAL INTEGRITY:** The lifted elements **MUST** be placed in the final document at their **EXACT original coordinates, size, and rotation**. A seal that is moved, even slightly, is a CRITICAL FAILURE.

    - **B. For TYPED TEXT (HIGH-FIDELITY RECONSTRUCTION):**
        - **B.1. Perfect Transcription & Language Integrity:** Perform a 100% accurate OCR.
            - **UNIVERSAL LANGUAGE & DIACRITIC MANDATE:** 100% character and diacritic accuracy is NON-NEGOTIABLE for ALL languages. An incorrect diacritic (e.g., Vietnamese \`dấu\`, German \`umlaut\`) or a single wrong character is a COMPLETE FAILURE of the task. The language must be perfectly preserved.
        - **B.2. Precise Layout & Font Matching:** The re-drawn text's font must be the **closest possible professional font match** to the original. The position, size, weight, kerning, and line spacing **MUST PERFECTLY MIRROR** the original layout.
        - **B.3. Re-draw for Ultimate Clarity:** Using the perfect transcription and layout match, render new text. The final text must appear as if printed from a high-resolution laser printer—razor-sharp, with clean edges, and completely free of any digital artifacts, blurring, or pixelation.

4.  **FINAL ASSEMBLY & QUALITY CHECK:**
    - **Assemble:** Combine the re-drawn \`Typed Text\` and the preserved \`Graphical/Handwritten Elements\` onto a new, clean digital canvas, maintaining the perfect original layout.
    - **Background & Enhancement:** Create a clean background based on the enhancement mode: '${enhancement}'.
    - **Shadows:** ${removeShadows ? 'Completely remove all shadows for a perfectly uniform, flat-lit background.' : 'Preserve natural lighting and shadows.'}
    - **Final Quality:** The resulting image must have ultra-sharp text and perfectly preserved graphics, looking like a flawless digital master of the original document.

**OUTPUT REQUIREMENTS:**
- Return ONLY the final, restored document as a high-resolution PNG file.
- Do not output any text.`;
    } else {
        prompt = `**AI TASK: Professional Photo Correction for Documents**

**PRIMARY OBJECTIVE:** Transform the input image into a perfect, head-on photograph of the document it contains. The result should look like a high-resolution, professional studio photo of the document, not a typical office scan.

**CRITICAL RULES:**

1.  **ABSOLUTE CONTENT PRESERVATION:**
    - **DO NOT ALTER THE TEXT OR IMAGES ON THE DOCUMENT.** You are forbidden from redrawing, changing, or "correcting" any characters, words, or graphics. Your task is to enhance the *photograph*, not the *document's content*.
    - **PRESERVE TEXTURE AND SHARPNESS:** The final output **MUST** maintain or even slightly enhance the original sharpness, paper texture, and ink detail. Do not blur, smudge, or over-smooth the image. The goal is maximum clarity while preserving photographic realism.

2.  **GEOMETRIC & LIGHTING CORRECTION:**
    - **PERSPECTIVE:** First, perform a perfect perspective warp to make the document appear completely flat and rectangular, as if photographed from directly above. Crop precisely to the document's edges.
    - **LIGHTING & SHADOWS:** ${removeShadows ? 'Completely remove all shadows and lighting glare to create a perfectly even, flat-lit surface. The lighting should be uniform across the entire document.' : 'Preserve the natural lighting and shadows, but balance them to improve overall readability.'}
    - **ENHANCEMENT:** Apply the requested enhancement mode: '${enhancement}'. Adjust contrast and clarity to make the content as readable as possible without sacrificing the photographic quality and texture.

**OUTPUT:**
- Return ONLY the final, corrected image as a high-quality PNG.
- The image must look like a professional, perfectly-lit photograph of the document.
- Do not output text.`;
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
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocumentWithCorners = async (
    originalImage: File,
    corners: Corners,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
): Promise<string> => {
    console.log(`Starting manual document scan with corners: ${JSON.stringify(corners)}, restoreText=${restoreText}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    let prompt: string;
    
    const sourceQuad = `- Top-Left: (${corners.tl.x}, ${corners.tl.y})
- Top-Right: (${corners.tr.x}, ${corners.tr.y})
- Bottom-Left: (${corners.bl.x}, ${corners.bl.y})
- Bottom-Right: (${corners.br.x}, ${corners.br.y})`;

    if (restoreText) {
        prompt = `**AI TASK: Zero Deviation Document Protocol**

**CORE MANDATE:** This is a forensic-level recreation task. Your primary goal is to produce a perfect digital copy. Any creative alteration, hallucination, or deviation from the original's graphical content is a CRITICAL FAILURE of this task.

**INPUTS:**
- Image containing a document.
- Source Quad (exact pixel coordinates of the document corners):
${sourceQuad}

**MANDATORY EXECUTION PLAN:**

1.  **GEOMETRIC CORRECTION:**
    - Use the provided Source Quad to perform a perfect perspective warp, making the document completely flat and rectangular.
    - Crop precisely to the new edges.

2.  **CONTENT TRIAGE (CRITICAL ANALYSIS):**
    - **Examine the entire document and classify ALL content into one of two categories:**
        - **1. TYPED TEXT:** Machine-printed text.
        - **2. GRAPHICAL & HANDWRITTEN ELEMENTS:** Includes all stamps, seals, logos, signatures, handwriting, diagrams, and photos.

3.  **CONTENT HANDLING (NON-NEGOTIABLE RULES):**

    - **A. For GRAPHICAL & HANDWRITTEN ELEMENTS (FORENSIC PRESERVATION MANDATE):**
        - **A.1. ZERO HALLUCINATION & ALTERATION (ABSOLUTE PROHIBITION):** You are **STRICTLY FORBIDDEN** from re-drawing, replacing, generating, creating, or "cleaning up" any element in this category. A re-drawn seal or a generated signature is a CRITICAL FAILURE. Adding a seal that was not in the original is a CRITICAL FAILURE.
        - **A.2. PERFECT PHOTOGRAPHIC TRANSFER:** These elements **MUST** be photographically "lifted" directly from the source image. Their original shape, color, texture, and internal details must be preserved with 100% accuracy.
        - **A.3. PERFECT POSITIONAL INTEGRITY:** The lifted elements **MUST** be placed in the final document at their **EXACT original coordinates, size, and rotation**. A seal that is moved, even slightly, is a CRITICAL FAILURE.

    - **B. For TYPED TEXT (HIGH-FIDELITY RECONSTRUCTION):**
        - **B.1. Perfect Transcription & Language Integrity:** Perform a 100% accurate OCR.
            - **UNIVERSAL LANGUAGE & DIACRITIC MANDATE:** 100% character and diacritic accuracy is NON-NEGOTIABLE for ALL languages. An incorrect diacritic (e.g., Vietnamese \`dấu\`, German \`umlaut\`) or a single wrong character is a COMPLETE FAILURE of the task. The language must be perfectly preserved.
        - **B.2. Precise Layout & Font Matching:** The re-drawn text's font must be the **closest possible professional font match** to the original. The position, size, weight, kerning, and line spacing **MUST PERFECTLY MIRROR** the original layout.
        - **B.3. Re-draw for Ultimate Clarity:** Using the perfect transcription and layout match, render new text. The final text must appear as if printed from a high-resolution laser printer—razor-sharp, with clean edges, and completely free of any digital artifacts, blurring, or pixelation.

4.  **FINAL ASSEMBLY & QUALITY CHECK:**
    - **Assemble:** Combine the re-drawn \`Typed Text\` and the preserved \`Graphical/Handwritten Elements\` onto a new, clean digital canvas, maintaining the perfect original layout.
    - **Background & Enhancement:** Create a clean background based on the enhancement mode: '${enhancement}'.
    - **Shadows:** ${removeShadows ? 'Completely remove all shadows for a perfectly uniform, flat-lit background.' : 'Preserve natural lighting and shadows.'}
    - **Final Quality:** The resulting image must have ultra-sharp text and perfectly preserved graphics, looking like a flawless digital master of the original document.

**OUTPUT REQUIREMENTS:**
- Return ONLY the final, restored document as a high-resolution PNG file.
- Do not output any text.`;
    } else {
        prompt = `**AI TASK: Professional Photo Correction for Documents**

**PRIMARY OBJECTIVE:** Transform the input image into a perfect, head-on photograph of the document it contains. The result should look like a high-resolution, professional studio photo of the document, not a typical office scan.

**INPUTS:**
- Image containing a document.
- Source Quad (exact pixel coordinates of the document corners):
${sourceQuad}

**CRITICAL RULES:**

1.  **ABSOLUTE CONTENT PRESERVATION:**
    - **DO NOT ALTER THE TEXT OR IMAGES ON THE DOCUMENT.** You are forbidden from redrawing, changing, or "correcting" any characters, words, or graphics. Your task is to enhance the *photograph*, not the *document's content*.
    - **PRESERVE TEXTURE AND SHARPNESS:** The final output **MUST** maintain or even slightly enhance the original sharpness, paper texture, and ink detail. Do not blur, smudge, or over-smooth the image. The goal is maximum clarity while preserving photographic realism.

2.  **GEOMETRIC & LIGHTING CORRECTION:**
    - **PERSPECTIVE:** Use the provided Source Quad to perform a perfect perspective warp, making the document appear completely flat and rectangular. Crop precisely to the new edges.
    - **LIGHTING & SHADOWS:** ${removeShadows ? 'Completely remove all shadows and lighting glare to create a perfectly even, flat-lit surface. The lighting should be uniform across the entire document.' : 'Preserve the natural lighting and shadows, but balance them to improve overall readability.'}
    - **ENHANCEMENT:** Apply the requested enhancement mode: '${enhancement}'. Adjust contrast and clarity to make the content as readable as possible without sacrificing the photographic quality and texture.

**OUTPUT:**
- Return ONLY the final, corrected image as a high-quality PNG.
- The image must look like a professional, perfectly-lit photograph of the document.
- Do not output text.`;
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
    c. **TRANSPARENT BACKGROUND:** Place the final, fully reconstructed item on a transparent background.
    d. **PRESERVE DETAILS:** The final extracted item must retain its original texture, color, details, and quality.

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