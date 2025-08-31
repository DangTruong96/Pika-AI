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
4.  **BLEND SEAMLESSLY:** The edit must integrate perfectly with the protected parts of the image. Match lighting, shadows, texture, grain, perspective, and color grading.

Output: Return ONLY the final, edited image as a PNG file. Do not output text, explanations, or apologies.`;
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
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- YOU MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
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
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

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
 * @param originalImage The original image file.
 * @param aspectRatio The target aspect ratio for the expanded image.
 * @param prompt A text prompt describing what to fill the new areas with.
 * @returns A promise that resolves to the data URL of the expanded image.
 */
export const generateExpandedImage = async (
    originalImage: File,
    aspectRatio: number,
    prompt: string,
): Promise<string> => {
    console.log(`Starting image expansion: aspect=${aspectRatio}, prompt=${prompt}`);
    
    // 1. Load the original image to get its dimensions
    const originalImageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(originalImage);
    });
    const { naturalWidth: origW, naturalHeight: origH } = originalImageElement;
    URL.revokeObjectURL(originalImageElement.src); // Clean up

    // 2. Calculate new dimensions
    let newW = origW;
    let newH = origH;
    const originalAspectRatio = origW / origH;

    if (aspectRatio > originalAspectRatio) {
        // New aspect is wider, so increase width
        newW = Math.round(origH * aspectRatio);
    } else {
        // New aspect is taller, so increase height
        newH = Math.round(origW / aspectRatio);
    }
    
    newW = Math.max(newW, origW);
    newH = Math.max(newH, origH);
    
    // 3. Create the padded image canvas with transparent background
    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context for image");
    
    const offsetX = (newW - origW) / 2;
    const offsetY = (newH - origH) / 2;
    ctx.drawImage(originalImageElement, offsetX, offsetY);
    const paddedImageDataUrl = canvas.toDataURL('image/png');

    // 4. Prepare parts for Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = dataUrlToPart(paddedImageDataUrl);
    
    const fullPrompt = `You are an expert photo editor AI specializing in photorealistic image expansion (outpainting). Your task is to analyze the provided image, which is centered on a larger transparent canvas, and fill in the transparent areas.

Key instructions:
- **Analyze Existing Details:** Carefully examine the subject, lighting, shadows, texture, and overall style of the original image content in the center.
- **Create a Coherent Extension:** The generated areas MUST be a logical and photorealistic continuation of the original scene. Everything you add should look like it was part of the original photograph.
- **Seamless Blending:** The transition between the original image and the newly generated content must be completely seamless and undetectable. Match the grain, focus, and color grading perfectly.
- **Follow User Guidance:** If the user provides a description, use it as a primary guide for what to create in the expanded areas.

User's Description for new areas: "${prompt || 'No specific description provided. Analyze the image and expand the scene naturally and logically.'}"

Output: Return ONLY the final, fully rendered image with the transparent areas filled. Do not output any text.`;

    const textPart = { text: fullPrompt };
    
    console.log('Sending padded image and prompt to the model...');
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
 * @param subjectImages The main subject images.
 * @param styleImages An array of optional images providing styles (e.g., clothing, textures).
 * @param backgroundImage An optional new background image.
 * @param prompt Text instructions for how to combine the images.
 * @returns A promise that resolves to the data URL of the composite image.
 */
export const generateCompositeImage = async (
    subjectImages: File[],
    styleImages: File[],
    backgroundImage: File | null,
    prompt: string
): Promise<string> => {
    console.log(`Starting image composite generation with ${subjectImages.length} subjects and ${styleImages.length} styles: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const parts: any[] = [];
    
    // Add all image parts in a specific order: Subjects -> Styles -> Background
    const subjectParts = await Promise.all(subjectImages.map(file => fileToPart(file)));
    parts.push(...subjectParts);
    
    if (styleImages.length > 0) {
        const styleParts = await Promise.all(styleImages.map(file => fileToPart(file)));
        parts.push(...styleParts);
    }
    if (backgroundImage) {
        parts.push(await fileToPart(backgroundImage));
    }

    // Dynamically build the prompt to explain the provided images to the AI
    let imageInputsDescription = `**Input Images Provided (in order):**
- The first ${subjectImages.length} image(s) are the **[Subject Images]**. Preserve their identities and key features.`;
    
    if (styleImages.length > 0) {
        imageInputsDescription += `\n- The next ${styleImages.length} image(s) are the **[Style Reference Images]**. Their purpose is to provide a visual reference for an *item, texture, or clothing style*. **CRITICAL: The people, faces, and backgrounds in these style images MUST be IGNORED.** Only the *style element itself* (e.g., the jacket, the dress, the pattern) should be extracted and applied to the subjects from the **[Subject Images]**.`;
    }
    if (backgroundImage) {
        imageInputsDescription += `\n- The final image is the **[Background Image]**. This is the new background scene.`;
    }

    let taskDescription = `**Your Task:**
1.  **Analyze and Complete Subjects:** Intelligently isolate the main subjects from their original backgrounds in the [Subject Images].
    - **CRITICAL IDENTITY PRESERVATION RULE:** **YOU MUST PRESERVE THE EXACT FACE AND IDENTITY of any person from the [Subject Images].** Do not change their facial features, ethnicity, or identity. The final output **MUST** feature the **EXACT SAME PERSON** from the subject image.
    - If a subject appears cropped (e.g., a portrait missing legs) and the user's instructions or style images imply a full-body outcome (e.g., adding shoes), you MUST realistically generate the missing body parts to create a complete, coherent subject.`;

    let stepCounter = 1;
    if (styleImages.length > 0) {
        stepCounter++;
        taskDescription += `\n${stepCounter}. **Extract and Apply Styles:** EXTRACT the key style elements (like clothing, objects, or textures) from the [Style Reference Images]. **DO NOT copy the people or faces from the style images.** Apply these extracted styles onto the subjects (including any newly generated parts) from the [Subject Images]. For example, if a subject image shows a person and a style image shows a different person wearing a leather jacket, your task is to put the *leather jacket* on the *person from the subject image*. You MUST NOT add the second person to the final image.`;
    }
    
    stepCounter++;
    if (backgroundImage) {
        taskDescription += `\n${stepCounter}. **Composite Scene:** Place the modified subjects into the [Background Image] scene.`;
    } else {
        taskDescription += `\n${stepCounter}. **Create Scene:** Generate a suitable and photorealistic background scene that complements the subjects and the user's instructions, then place the subjects within it.`;
    }
    
    stepCounter++;
    taskDescription += `\n${stepCounter}. **Harmonize:** Make the final image look real. Match lighting, shadows, perspective, scale, and color grading perfectly.`;

    const fullPrompt = `You are a master digital artist specializing in photorealistic image compositing. Your task is to combine the provided inputs into a single, cohesive, and believable image.

${imageInputsDescription}

**User's Instructions:**
"${prompt || 'Combine the provided images into a cohesive, photorealistic scene. Analyze the inputs and make the best artistic choice.'}"

${taskDescription}

**Output:**
Return ONLY the final, composited image. Do not output any text or explanations.`;
    
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
 * Automatically scans a document from an image.
 * @param originalImage The original image file containing the document.
 * @param enhancement The desired color enhancement ('color', 'grayscale', 'bw').
 * @param removeShadows Whether to remove shadows from the document.
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocument = async (
    originalImage: File,
    enhancement: Enhancement,
    removeShadows: boolean,
): Promise<string> => {
    console.log(`Starting auto document scan: enhancement=${enhancement}, shadows=${removeShadows}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `**AI TASK: DOCUMENT SCAN**

**INPUT:**
- Image containing a document.

**INSTRUCTIONS:**
1.  **IDENTIFY DOCUMENT:** Analyze the image to find the primary document's four corners.
2.  **EXECUTE PERSPECTIVE TRANSFORM:**
    -   Input: The original image.
    -   Source Quad: The four corners you identified.
    -   Destination Quad: A perfect rectangle with the same aspect ratio as the detected document.
    -   Action: Warp the source quad to fit the destination quad. This corrects any perspective distortion.
3.  **CROP:** Crop the image to the bounds of the new rectangular document.
4.  **ENHANCE:**
    -   Mode: '${enhancement}'
    -   Apply a filter to maximize contrast and readability.
5.  **CLEANUP:**
    -   Shadows: ${removeShadows ? 'REMOVE all shadows for even lighting.' : 'Preserve natural shadows.'}

**OUTPUT:**
-   **FORMAT:** Image file (PNG).
-   **CONTENT:** ONLY the transformed, cropped, and enhanced document.
-   **DO NOT** return the original image.
-   **DO NOT** return any text.`;
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
 * @returns A promise that resolves to the data URL of the scanned document.
 */
export const generateScannedDocumentWithCorners = async (
    originalImage: File,
    corners: Corners,
    enhancement: Enhancement,
    removeShadows: boolean,
): Promise<string> => {
    console.log(`Starting manual document scan with corners: ${JSON.stringify(corners)}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `**AI TASK: DOCUMENT PERSPECTIVE CROP**

**INPUT:**
-   Image containing a document.
-   Source Quad (corners of the document in pixels):
    -   Top-Left: (${corners.tl.x}, ${corners.tl.y})
    -   Top-Right: (${corners.tr.x}, ${corners.tr.y})
    -   Bottom-Left: (${corners.bl.x}, ${corners.bl.y})
    -   Bottom-Right: (${corners.br.x}, ${corners.br.y})

**INSTRUCTIONS:**
1.  **EXECUTE PERSPECTIVE TRANSFORM:**
    -   Input: The original image.
    -   Source Quad: The exact pixel coordinates provided above.
    -   Destination Quad: A perfect rectangle with an aspect ratio derived from the source quad.
    -   Action: Warp the source quad to fit the destination quad. This corrects any perspective distortion.
2.  **CROP:** Crop the image to the bounds of the new rectangular document.
3.  **ENHANCE:**
    -   Mode: '${enhancement}'
    -   Apply a filter to maximize contrast and readability.
4.  **CLEANUP:**
    -   Shadows: ${removeShadows ? 'REMOVE all shadows for even lighting.' : 'Preserve natural shadows.'}

**OUTPUT:**
-   **FORMAT:** Image file (PNG).
-   **CONTENT:** ONLY the transformed, cropped, and enhanced document.
-   **DO NOT** return the original image.
-   **DO NOT** return any text.`;
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