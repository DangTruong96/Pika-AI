/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

// --- ERROR CLASSES ---
export class RateLimitError extends Error {
    constructor(message: string = 'Rate limit exceeded after retries.') {
        super(message);
        this.name = 'RateLimitError';
    }
}
export class APIError extends Error { constructor(message: string = 'An API error occurred.') { super(message); this.name = 'APIError'; } }
export class NetworkError extends APIError { constructor() { super('Could not connect to the API service.'); this.name = 'NetworkError'; } }
export class InvalidInputError extends APIError { constructor(message: string = 'The API received invalid input.') { super(message); this.name = 'InvalidInputError'; } }
export class ContentSafetyError extends APIError { constructor(message: string = 'The request was blocked due to content safety policies.') { super(message); this.name = 'ContentSafetyError'; } }
export class ModelExecutionError extends APIError { constructor(message: string = 'The AI model failed to execute.') { super(message); this.name = 'ModelExecutionError'; } }


// --- TYPE DEFINITIONS ---
interface IdPhotoOptionsBase {
  backgroundColor: 'white' | 'blue' | 'gray' | 'green';
  size: '3x4' | '4x6' | '2x2' | '3.5x4.5' | '5x5';
}
interface StandardIdPhotoOptions extends IdPhotoOptionsBase {
  type: 'standard';
  gender: 'male' | 'female';
  expression: 'neutral' | 'smile' | 'keep' | 'big-smile';
  outfit: 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai' | 'office-wear';
  hairstyle: 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
  customPrompt?: string;
}
interface NewbornIdPhotoOptions extends IdPhotoOptionsBase {
    type: 'newborn';
}
export type IdPhotoOptions = StandardIdPhotoOptions | NewbornIdPhotoOptions;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const promptCache = new Map<string, string>();

export async function getPrompt(path: string, replacements: Record<string, any> = {}): Promise<string> {
    let template = promptCache.get(path);
    if (!template) {
        const response = await fetch(`/prompts/${path}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch prompt: ${path}`);
        }
        template = await response.text();
        promptCache.set(path, template);
    }

    let prompt = template;
    for (const key in replacements) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacements[key]));
    }
    return prompt;
}


// --- UTILITY FUNCTIONS ---
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
    if (!dataUrl) {
        // Return a dummy file to prevent crashes downstream.
        console.error("dataURLtoFile received a null or undefined dataUrl.");
        return new File([], filename);
    }
    const arr = dataUrl.split(',');
    if (arr.length < 2 || !arr[0] || !arr[1]) {
        console.error("Invalid data URL format", dataUrl.substring(0, 30));
        return new File([], filename);
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Could not parse MIME type from data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const fileToGenerativePart = async (file: File) => {
    if (!file) {
        throw new Error("fileToGenerativePart received a null or undefined file.");
    }
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          if (typeof reader.result === 'string') {
              resolve(reader.result.split(',')[1]);
          } else {
              reject(new Error("Failed to read file as data URL."));
          }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
};

async function withErrorHandling<T>(apiCall: () => Promise<T>): Promise<T> {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // 1 second

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await apiCall();
        } catch (err: unknown) {
            console.error(`Gemini Service Error (Attempt ${i + 1}/${MAX_RETRIES}):`, err);
            
            let messageContent = '';
            if (err instanceof Error) {
                messageContent = err.message;
            } else {
                try {
                    // A lot of API errors are JSON objects stringified
                    messageContent = JSON.stringify(err);
                } catch {
                    messageContent = String(err);
                }
            }
            
            const lowerCaseMessage = messageContent.toLowerCase();

            const isRateLimitError = lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('quota');
            
            // Check if it's a rate limit error and if we can still retry
            if (isRateLimitError && i < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, i);
                console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // retry the loop
            }

            // If it's not a retriable error, or if we've exhausted retries, throw the final typed error.
            if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
                throw new NetworkError();
            }
            if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('permission denied')) {
                throw new InvalidInputError("Invalid API Key or permissions.");
            }
            if (lowerCaseMessage.includes('400') || lowerCaseMessage.includes('invalid argument') || lowerCaseMessage.includes('malformed') || lowerCaseMessage.includes('unsupported image format')) {
                throw new InvalidInputError("The request was malformed or contained unsupported content.");
            }
            if (lowerCaseMessage.includes('[safety]') || (lowerCaseMessage.includes('blocked') && lowerCaseMessage.includes('safety'))) {
                throw new ContentSafetyError();
            }
            if (lowerCaseMessage.includes('500') || lowerCaseMessage.includes('internal error') || lowerCaseMessage.includes('service unavailable')) {
                throw new ModelExecutionError("The AI service is currently unavailable.");
            }
            if (isRateLimitError) { // This will be hit on the last retry
                let detailedMessage = messageContent;
                try {
                    const errorObj = (typeof err === 'object' && err !== null) ? err : JSON.parse(messageContent);
                    if (errorObj?.error?.message) {
                        detailedMessage = errorObj.error.message;
                    } else if (errorObj?.message) {
                        detailedMessage = errorObj.message;
                    }
                } catch (e) {
                    // Parsing failed, use the stringified content
                }
                throw new RateLimitError(detailedMessage);
            }
            
            // Fallback for other errors from the SDK or network
            throw new APIError(messageContent || 'An unknown API error occurred.');
        }
    }
    // This part should not be reachable, but is required for TypeScript to be happy.
    throw new APIError('Exhausted all retries.');
}

// --- IMPLEMENTED API FUNCTIONS ---

async function getImageUrlFromResponse(response: GenerateContentResponse): Promise<string> {
    let textResponse = '';
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
            if (part.text) {
                textResponse += part.text + ' ';
            }
        }
    }

    // Fallback to the main text property if it exists and we found nothing in parts
    if (!textResponse.trim() && response.text) {
        textResponse = response.text;
    }

    textResponse = textResponse.trim();

    if (textResponse) {
        // If we found text but no image, the model probably explained why it failed.
        throw new ModelExecutionError(`The AI model returned a text response instead of an image: "${textResponse}"`);
    }

    // If there's no image and no text, check for other reasons like safety blocks.
    const candidate = response.candidates?.[0];
    if (candidate) {
        const finishReason = candidate.finishReason as string | undefined;
        if (finishReason && finishReason !== 'STOP' && finishReason !== 'FINISH_REASON_UNSPECIFIED') {
            const safetyRatings = (candidate.safetyRatings || []) as { category: string, probability: string, blocked?: boolean }[];
            if (safetyRatings.some(r => r.blocked)) {
                 const blockedCategories = safetyRatings
                    .filter(r => r.blocked)
                    .map(r => r.category.replace('HARM_CATEGORY_', ''))
                    .join(', ');
                throw new ContentSafetyError(`Request blocked for safety reasons: ${blockedCategories}. Finish reason: ${finishReason}.`);
            }
            throw new ModelExecutionError(`Image generation failed. Finish reason: ${finishReason}.`);
        }
    }
    
    throw new ModelExecutionError("No image found in the response from the AI model, and no explanation was provided.");
}

export const generateRefinedPrompt = async (imageFile: File, userPrompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const masterPrompt = await getPrompt('generateRefinedPrompt.txt', { userPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: masterPrompt }, imagePart] },
        });

        return (response.text || '').trim();
    });
};

export function generateEditedImageWithMaskStream(imageFile: File, prompt: string, maskDataUrl?: string): AsyncGenerator<string, void, undefined> {
    async function* generator() {
        try {
            const identityCore = await getPrompt('cores/retouch_identity.txt');
            const forensicReconstructionEngine = await getPrompt('cores/retouch_forensic.txt');
            const superResolutionEngine = await getPrompt('cores/retouch_superres.txt');
            const unificationEngine = await getPrompt('cores/retouch_unification.txt');
            const bodyformIntegrity = await getPrompt('cores/retouch_bodyform.txt');
            const masterPrompt = await getPrompt('generateEditedImageWithMaskStream.txt', {
                identityCore,
                forensicReconstructionEngine,
                superResolutionEngine,
                unificationEngine,
                bodyformAndSilhouetteIntegrity: bodyformIntegrity,
                prompt
            });

            const textPart = { text: masterPrompt };
            const imagePart = await fileToGenerativePart(imageFile);
            
            const parts: any[] = [textPart, imagePart];

            if (maskDataUrl) {
                const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
                const maskPart = await fileToGenerativePart(maskFile);
                parts.push(maskPart);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            
            yield await getImageUrlFromResponse(response);

        } catch (err) {
            await withErrorHandling(async () => { throw err; });
        }
    }
    return generator();
}

export const generateFilteredImage = async (imageFile: File, prompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const foundationalRestoration = await getPrompt('cores/filter_restoration.txt');
        const identityCore = await getPrompt('cores/filter_identity.txt');
        const finalPrompt = await getPrompt('generateFilteredImage.txt', {
            foundationalRestorationAddendum: foundationalRestoration,
            identityCore: identityCore,
            prompt
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateAdjustedImage = async (imageFile: File, prompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const identityCore = await getPrompt('cores/adjust_identity.txt');
        
        let finalPrompt: string;

        try {
            JSON.parse(prompt); // Check if it's a valid JSON string
            if (prompt.includes('"phiên_bản"') || prompt.includes('"phiên bản"') || prompt.includes('"version"')) {
                 const forensicReconstructionEngine = await getPrompt('cores/adjust_forensic.txt');
                 const superResolutionEngine = await getPrompt('cores/adjust_superres.txt');
                 finalPrompt = await getPrompt('generateAdjustedImageAdvanced.txt', {
                    identityCore: identityCore,
                    forensicReconstructionEngine: forensicReconstructionEngine,
                    superResolutionEngine: superResolutionEngine,
                    prompt
                 });
            } else {
                throw new Error("Not a known advanced JSON prompt.");
            }
        } catch (e) {
            const foundationalRestoration = await getPrompt('cores/adjust_restoration.txt');
            finalPrompt = await getPrompt('generateAdjustedImageSimple.txt', {
                foundationalRestorationAddendum: foundationalRestoration,
                identityCore: identityCore,
                prompt
            });
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { 
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateExpandedImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imageFile = dataURLtoFile(imageDataUrl, 'expand-base.png');
        const imagePart = await fileToGenerativePart(imageFile);
        const foundationalRestoration = await getPrompt('cores/expand_restoration.txt');
        const finalPrompt = await getPrompt('generateExpandedImage.txt', {
            foundationalRestorationAddendum: foundationalRestoration,
            prompt
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateExtractedItem = async (imageFile: File, prompt: string): Promise<string[]> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const fullPrompt = await getPrompt('generateExtractedItem.txt', { prompt });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const results: string[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }
        if (results.length === 0) {
          throw new ModelExecutionError("No item extracted from image.");
        }
        return results;
    });
};

export const generateIdPhoto = async (imageFile: File, options: IdPhotoOptions): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const identityCore = await getPrompt('cores/idphoto_identity.txt');
        const forensicReconstructionEngine = await getPrompt('cores/idphoto_forensic.txt');
        const superResolutionEngine = await getPrompt('cores/idphoto_superres.txt');
        const bodyformIntegrity = await getPrompt('cores/idphoto_bodyform.txt');
        const prompt = await getPrompt('generateIdPhoto.txt', {
            identityCore,
            forensicReconstructionEngine,
            superResolutionEngine,
            bodyformAndSilhouetteIntegrity: bodyformIntegrity,
            photoType: options.type,
            size: options.size,
            backgroundColor: options.backgroundColor,
            gender: options.type === 'standard' ? options.gender : '',
            outfit: options.type === 'standard' ? options.outfit : '',
            hairstyle: options.type === 'standard' ? options.hairstyle : '',
            expression: options.type === 'standard' ? options.expression : '',
            customInstructions: options.type === 'standard' ? options.customPrompt || 'None' : ''
        });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateCompositeImage = async (subjectImages: File[], prompt: string, outfitDescription: string, objectFiles: File[] = []): Promise<string> => {
    return withErrorHandling(async () => {
        if (subjectImages.length < 1) {
            throw new InvalidInputError("Composite generation requires at least one subject image.");
        }
        if (subjectImages.length > 7) {
            throw new InvalidInputError("Composite generation supports a maximum of 7 subjects.");
        }

        const identityCore = await getPrompt('cores/studio_identity.txt');
        const physicalInteractionEngine = await getPrompt('cores/studio_physicalInteraction.txt');
        const unificationEngine = await getPrompt('cores/studio_unification.txt');
        const forensicReconstructionEngine = await getPrompt('cores/studio_forensic.txt');
        const bodyformIntegrity = await getPrompt('cores/studio_bodyform.txt');
        const lightingEngine = await getPrompt('cores/studio_lighting.txt');
        
        const finalPrompt = await getPrompt('generateCompositeImage.txt', {
            identityCore,
            physicalInteractionEngine,
            unificationEngine,
            forensicReconstructionEngine,
            bodyformAndSilhouetteIntegrity: bodyformIntegrity,
            photorealisticLightingEngine: lightingEngine,
            prompt,
            outfitDescription,
        });
        
        const parts: any[] = [{ text: finalPrompt }];

        // Add labeled subjects
        for (let i = 0; i < subjectImages.length; i++) {
            const file = subjectImages[i];
            parts.push({ text: `--- SUBJECT ${i + 1} ---` });
            const imagePart = await fileToGenerativePart(file);
            parts.push(imagePart);
        }

        // Add labeled objects
        if (objectFiles.length > 0) {
            for (let i = 0; i < objectFiles.length; i++) {
                const file = objectFiles[i];
                parts.push({ text: `--- OBJECT ${i + 1} ---` });
                const objectPart = await fileToGenerativePart(file);
                parts.push(objectPart);
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generatePhotoshootImage = async (imageFile: File, prompt: string, outfitDescription: string, styleFile: File | null, styleInfluence?: number, objectFiles: File[] = []): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        let criticalDirective: string;
        if (styleFile) {
            let influenceWord = 'STANDARD';
            if (styleInfluence !== undefined) {
                if (styleInfluence < 0.4) influenceWord = 'LOW';
                else if (styleInfluence > 0.8) influenceWord = 'HIGH';
            }
            criticalDirective = await getPrompt('photoshootCriticalDirectiveStyleFile.txt', { influence: influenceWord });
        } else {
            criticalDirective = await getPrompt('photoshootCriticalDirectiveNoStyleFile.txt');
        }

        const restorationAddendum = await getPrompt('cores/studio_restoration.txt');
        const identityCore = await getPrompt('cores/studio_identity.txt');
        const physicalInteractionEngine = await getPrompt('cores/studio_physicalInteraction.txt');
        const unificationEngine = await getPrompt('cores/studio_unification.txt');
        const forensicReconstructionEngine = await getPrompt('cores/studio_forensic.txt');
        const bodyformIntegrity = await getPrompt('cores/studio_bodyform.txt');
        const lightingEngine = await getPrompt('cores/studio_lighting.txt');

        const fullPrompt = await getPrompt('photoshootFullPrompt.txt', {
            restorationAddendum,
            identityCore,
            physicalInteractionEngine,
            unificationEngine,
            forensicReconstructionEngine,
            bodyformAndSilhouetteIntegrity: bodyformIntegrity,
            photorealisticLightingEngine: lightingEngine,
            criticalDirective,
            prompt,
            outfitDescription
        });
        
        const parts: any[] = [{ text: fullPrompt }, imagePart];
        
        // Add labeled objects
        if (objectFiles.length > 0) {
            for (let i = 0; i < objectFiles.length; i++) {
                const file = objectFiles[i];
                parts.push({ text: `--- OBJECT ${i + 1} ---` });
                const objectPart = await fileToGenerativePart(file);
                parts.push(objectPart);
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateCreativePrompt = async (subjectFiles: File[], styleFile: File | null, outfitFiles: File[], keywords?: string): Promise<string> => {
    return withErrorHandling(async () => {
        if (subjectFiles.length === 0) {
            throw new InvalidInputError("Creative Assistant requires at least one subject image.");
        }

        const keywordsPhrase = keywords && keywords.trim() ? ` and the user's keywords: "${keywords.trim()}"` : "";
        const systemInstruction = await getPrompt('creativePromptStudio.txt', { keywords_phrase: keywordsPhrase });
        
        const allParts: any[] = [{ text: systemInstruction }];

        // Add subjects
        for (const [index, file] of subjectFiles.entries()) {
            allParts.push({ text: `--- SUBJECT IMAGE ${index + 1} ---` });
            allParts.push(await fileToGenerativePart(file));
        }
        
        // Add style image
        if (styleFile) {
            allParts.push({ text: '--- STYLE IMAGE ---' });
            allParts.push(await fileToGenerativePart(styleFile));
        }

        // Add outfit/object images
        for (const [index, file] of outfitFiles.entries()) {
            allParts.push({ text: `--- OBJECT/OUTFIT IMAGE ${index + 1} ---` });
            allParts.push(await fileToGenerativePart(file));
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: allParts },
        });

        return (response.text || '').trim();
    });
};

export const generateOutfitDescription = async (imageFile: File, photoshootPrompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `Analyze the clothing of the person in this image...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text || '';
    });
};

export const inferOutfitFromPrompt = async (photoshootPrompt: string, subjectImages: File[]): Promise<string> => {
    return withErrorHandling(async () => {
        const prompt = await getPrompt('inferOutfitFromPrompt.txt', { photoshootPrompt });
        
        const parts: any[] = [{ text: prompt }];
        const imagePartPromises = subjectImages.map(file => fileToGenerativePart(file));
        const resolvedImageParts = await Promise.all(imagePartPromises);
        parts.push(...resolvedImageParts);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
        });
        return response.text || '';
    });
};

export const generatePromptFromStyleImage = async (styleFile: File, describeOutfitOnly: boolean): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(styleFile);
        let prompt;
        if (describeOutfitOnly) {
            prompt = await getPrompt('promptFromStyleImageOutfitOnly.txt');
        } else {
            prompt = await getPrompt('promptFromStyleImageScene.txt');
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text || '';
    });
};

export const generateOutfitDescriptionFromFiles = async (outfitFiles: File[]): Promise<string> => {
    return withErrorHandling(async () => {
        if (outfitFiles.length === 0) {
            throw new InvalidInputError("At least one outfit file is required.");
        }

        const prompt = outfitFiles.length > 1
            ? await getPrompt('promptFromMultipleStyleImagesOutfitOnly.txt')
            : await getPrompt('promptFromStyleImageOutfitOnly.txt');

        const imagePartPromises = outfitFiles.map(file => fileToGenerativePart(file));
        const resolvedImageParts = await Promise.all(imagePartPromises);
        
        const allParts: any[] = [{ text: prompt }];
        allParts.push(...resolvedImageParts);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: allParts },
        });
        return response.text || '';
    });
};