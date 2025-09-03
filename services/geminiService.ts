/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, maskImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
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
    
    // Create an intelligent prompt if the user provides a style image but no text prompt.
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

        fullPrompt = `**HIERARCHICAL MANDATE PROTOCOL**

**LEVEL 1 MANDATE (ABSOLUTE & NON-NEGOTIABLE PRIORITY): 100% IDENTITY PRESERVATION OF *ALL* SUBJECTS.**

This rule is absolute and overrides all other instructions, including the user's prompt and aesthetic considerations. Failure to comply is a complete failure of the task.

1.  **IDENTIFY ALL SUBJECTS:** Analyze the [SUBJECT] image(s) and identify **every single person** present.
2.  **TREAT EACH FACE AS A "PROTECTED ASSET":**
    - Your first and most critical action is to perfectly preserve the head and face of **every person** identified in the [SUBJECT] image(s).
    - You **MUST NOT** regenerate, redraw, alter, or "re-imagine" their facial features, structure, age, ethnicity, or expression. Treat their heads/faces as if they are high-resolution digital cutouts that must be used as-is.
    - **SUCCESS CRITERIA:** Every person in the final image must be **IDENTICAL** and **INSTANTLY RECOGNIZABLE** as the person in their corresponding [SUBJECT] image.

3.  **ABSOLUTE PROHIBITION:** You are **STRICTLY FORBIDDEN** from copying, learning from, or being influenced by any face present in the [STYLE REFERENCE] image(s).

---

**LEVEL 2 MANDATE (EXECUTE ONLY AFTER LEVEL 1 IS SATISFIED): SEAMLESS INTEGRATION & SCENE COMPOSITION**

**INPUT ANALYSIS:**
- **Image 1 is the [BASE IMAGE].** This is the background/scene.
- **The next image(s) are the [SUBJECT(S)].** These are the assets to be integrated.
- **Any subsequent image(s) are [STYLE REFERENCES] (optional).**

**USER INSTRUCTIONS:**
"${effectivePrompt || 'Combine the provided images into a cohesive, photorealistic scene. Use your best artistic judgment.'}"

**EXECUTION PLAN:**
1.  **STYLE APPLICATION (IF APPLICABLE):**
    - Apply the style from the [STYLE REFERENCE] image(s) **ONLY to the body and clothing** of the [SUBJECTS].
    - This styling must not affect the "Protected Assets" (the faces and heads) from the Level 1 Mandate.

2.  **COMPOSITION:**
    - Place the styled [SUBJECTS] (with their perfectly preserved heads/faces) into the [BASE IMAGE].

3.  **FORENSIC BLENDING:**
    - Perfectly blend the [SUBJECTS] into the scene by matching the lighting (direction, color, hardness), shadows, perspective, scale, grain, focus, and color grading of the background.
    - **PRIORITY:** This blending must **NOT** compromise the Level 1 Mandate of identity preservation. If perfect blending would alter a face, prioritize preserving the face over perfect blending.

**OUTPUT:**
- Return ONLY the final, high-quality, composited image as a PNG.
- Do not output any text.`;

    } else {
        // No base image provided, generate it.
        const subjectParts = await Promise.all(subjectImages.map(file => fileToPart(file)));
        parts.push(...subjectParts);
        
        if (styleImages.length > 0) {
            const styleParts = await Promise.all(styleImages.map(file => fileToPart(file)));
            parts.push(...styleParts);
        }
        
        fullPrompt = `**HIERARCHICAL MANDATE PROTOCOL**

**LEVEL 1 MANDATE (ABSOLUTE & NON-NEGOTIABLE PRIORITY): 100% IDENTITY PRESERVATION OF *ALL* SUBJECTS.**

This rule is absolute and overrides all other instructions, including the user's prompt and aesthetic considerations. Failure to comply is a complete failure of the task.

1.  **IDENTIFY ALL SUBJECTS:** Analyze the [SUBJECT] image(s) and identify **every single person** present.
2.  **TREAT EACH FACE AS A "PROTECTED ASSET":**
    - Your first and most critical action is to perfectly preserve the head and face of **every person** identified in the [SUBJECT] image(s).
    - You **MUST NOT** regenerate, redraw, alter, or "re-imagine" their facial features, structure, age, ethnicity, or expression. Treat their heads/faces as if they are high-resolution digital cutouts that must be used as-is.
    - **SUCCESS CRITERIA:** Every person in the final image must be **IDENTICAL** and **INSTANTLY RECOGNIZABLE** as the person in their corresponding [SUBJECT] image.

3.  **ABSOLUTE PROHIBITION:** You are **STRICTLY FORBIDDEN** from copying, learning from, or being influenced by any face present in the [STYLE REFERENCE] image(s).

---

**LEVEL 2 MANDATE (EXECUTE ONLY AFTER LEVEL 1 IS SATISFIED): SEAMLESS INTEGRATION & SCENE COMPOSITION**

**INPUT ANALYSIS:**
- **The first image(s) are the [SUBJECT(S)].** These are the assets to be integrated.
- **Any subsequent image(s) are [STYLE REFERENCES] (optional).**

**USER INSTRUCTIONS FOR SCENE GENERATION:**
"${effectivePrompt || 'Create a suitable and photorealistic background for the subjects and place them in it.'}"

**EXECUTION PLAN:**
1.  **STYLE APPLICATION (IF APPLICABLE):**
    - Apply the style from the [STYLE REFERENCE] image(s) **ONLY to the body and clothing** of the [SUBJECTS].
    - This styling must not affect the "Protected Assets" (the faces and heads) from the Level 1 Mandate.

2.  **COMPOSITION:**
    - Generate a new, high-quality, photorealistic background scene based on the user instructions.
    - Place the styled [SUBJECTS] (with their perfectly preserved heads/faces) into the newly generated scene.

3.  **FORENSIC BLENDING:**
    - Perfectly blend the [SUBJECTS] into the scene by creating realistic lighting (direction, color, hardness), shadows, perspective, scale, grain, focus, and color grading.
    - **PRIORITY:** This blending must **NOT** compromise the Level 1 Mandate of identity preservation. If perfect blending would alter a face, prioritize preserving the face over perfect blending.

**OUTPUT:**
- Return ONLY the final, high-quality, composited image as a PNG.
- Do not output any text.`;
    }
    
    const textPart = { text: fullPrompt };
    parts.push(textPart);

    console.log('Sending composite request to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for composite.', response);
    
    return handleApiResponse(response, 'composite');
};

/**
 * Extracts a fashion item from an image and places it on a white background.
 * @param originalImage The original image of the product being worn.
 * @param prompt A text prompt describing the item to extract.
 * @returns A promise that resolves to the data URL of the final product image.
 */
export const generateProductImage = async (
    originalImage: File,
    prompt: string
): Promise<string> => {
    console.log(`Starting fashion item extraction: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const fullPrompt = `You are an expert AI for e-commerce and fashion. Your task is to precisely isolate a specific fashion item from the person wearing it in the provided image. The goal is to create a clean product photo on a white background.

**CRITICAL INSTRUCTIONS:**
1.  **Identify the Item:** Analyze the image and the user's request to identify the target item. The user wants to extract: **"${prompt}"**.
2.  **Precise Segmentation:** Perfectly and cleanly segment this item from the person and the background. The cutout must be exact, with clean edges.
3.  **Reconstruct Occluded Parts:** This is crucial. If any part of the item is hidden (e.g., by an arm, hair, or another piece of clothing), you must realistically and logically reconstruct the hidden parts. The final item must look complete and whole, as if it were laid flat or on a mannequin.
4.  **Place on White Background:** Place the fully extracted and reconstructed item onto a clean, solid, perfectly white background (#FFFFFF).
5.  **Maintain Integrity:** The item's color, texture, shape, and details must be preserved perfectly. Do not change the item itself.
6.  **Final Output:** Return ONLY the final image of the isolated item on the white background. Do not output text, explanations, or any other content.`;
    const textPart = { text: fullPrompt };

    console.log('Sending fashion extraction request to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for fashion extraction.', response);
    
    return handleApiResponse(response, 'fashion extraction');
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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for manual scan.', response);
    
    return handleApiResponse(response, 'manual scan');
};