/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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
    
    const fullPrompt = `You are a world-class photo editing AI. The user has provided an image, a mask, and an instruction. Your task is to perform a photorealistic edit based on these inputs.

**CRITICAL INSTRUCTIONS:**
1.  **MASK IS KING:** The provided mask image dictates the **ONLY** area you are allowed to modify. The white (or non-black/transparent) areas of the mask are the edit zone.
2.  **PRESERVE THE REST:** The black (or transparent) areas of the mask correspond to parts of the original image that **MUST BE PRESERVED EXACTLY** as they are. Do not change, recolor, or alter these areas in any way.
3.  **SEAMLESS INTEGRATION:** The edit must blend perfectly with the untouched parts of the image. Match lighting, shadows, texture, grain, and perspective.
4.  **FOLLOW THE PROMPT:** Apply the user's text request within the masked area.

User's Edit Request: "${prompt}"

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