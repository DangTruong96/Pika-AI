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

// Types for Face Detection
export type BoundingBox = { x: number; y: number; width: number; height: number };
export type Face = { box: BoundingBox };

// Type for Subject Details Detection
export type SubjectDetails = {
  gender: 'male' | 'female';
  ageCategory: 'adult' | 'newborn';
};


// Base options common to all ID photo types
interface IdPhotoOptionsBase {
  backgroundColor: 'white' | 'blue' | 'gray' | 'green';
  size: '3x4' | '4x6' | '2x2' | '3.5x4.5' | '5x5';
}

// Options specific to standard ID photos
interface StandardIdPhotoOptions extends IdPhotoOptionsBase {
  type: 'standard';
  gender: 'male' | 'female';
  expression: 'neutral' | 'smile' | 'keep' | 'big-smile';
  outfit: 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai';
  hairstyle: 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
  customPrompt?: string;
}

// Options for newborn ID photos
interface NewbornIdPhotoOptions extends IdPhotoOptionsBase {
    type: 'newborn';
}

// Union type for all ID photo options
export type IdPhotoOptions = StandardIdPhotoOptions | NewbornIdPhotoOptions;

// --- UTILITIES ---

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) {
        throw new Error('Invalid data URL');
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) {
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
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData,
        },
    };
};

// --- API INITIALIZATION ---

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// --- API FUNCTIONS ---

// Function to handle retries for rate limit errors
async function withRetries<T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            // Check for rate limit error specifically
            if (error.status === 429 || (error.message && error.message.includes('429'))) {
                if (attempt === maxRetries - 1) {
                    throw new RateLimitError();
                }
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${attempt + 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            } else {
                throw error; // Re-throw other errors immediately
            }
        }
    }
    throw new Error('Max retries reached without success.'); // Should not be reached
}

// Generic function to extract the first image data URL from a response
const getFirstImageDataUrl = (response: GenerateContentResponse): string | null => {
    for (const candidate of response.candidates ?? []) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
}

export const generateFilteredImage = async (imageFile: File, filterPrompt: string): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: `Apply the following filter to the image: ${filterPrompt}` }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate filtered image.');
    });
};

export const generateAdjustedImage = async (imageFile: File, adjustmentPrompt: string): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: `Apply the following adjustment to the image: ${adjustmentPrompt}` }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate adjusted image.');
    });
};

export const generateExpandedImage = async (paddedImageDataUrl: string, prompt: string): Promise<string> => {
    return withRetries(async () => {
        const imageFile = dataURLtoFile(paddedImageDataUrl, 'padded.png');
        const imagePart = await fileToGenerativePart(imageFile);
        
        const fullPrompt = `This is an image with empty padding around it. Fill in the padded areas to expand the original image. If a prompt is provided, use it as inspiration for the expanded areas. Prompt: "${prompt || 'no prompt'}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate expanded image.');
    });
};

export async function* generateEditedImageWithMaskStream(imageFile: File, prompt: string, maskDataUrl: string, useSearch: boolean): AsyncGenerator<string> {
    const imagePart = await fileToGenerativePart(imageFile);
    const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
    const maskPart = await fileToGenerativePart(maskFile);
    
    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            imagePart, 
            { text: `Edit the image based on this mask and prompt. Prompt: "${prompt}"` },
            maskPart
        ]},
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            tools: useSearch ? [{googleSearch: {}}] : undefined,
        },
    });
    
    for await (const chunk of stream) {
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                yield `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
}

export const generateCompositeImage = async (
    backgroundFile: File | null,
    subjectFiles: File[],
    styleFiles: File[],
    swapFaceFile: File | null,
    prompt: string,
    maskFile: File | null,
    useSearchGrounding: boolean,
): Promise<string> => {
    return withRetries(async () => {
        const parts: any[] = [{ text: prompt }];

        if (backgroundFile) {
            parts.push(await fileToGenerativePart(backgroundFile));
        }
        for (const file of subjectFiles) {
            parts.push(await fileToGenerativePart(file));
        }
        for (const file of styleFiles) {
            parts.push(await fileToGenerativePart(file));
        }
        if (swapFaceFile) {
            parts.push(await fileToGenerativePart(swapFaceFile));
        }
        if (maskFile) {
            parts.push(await fileToGenerativePart(maskFile));
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate composite image.');
    });
};

export const generateScannedDocument = async (
    imageFile: File,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
    removeHandwriting: boolean
): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        let prompt = `Scan this document. Enhancement mode: ${enhancement}.`;
        if (removeShadows) prompt += ' Remove shadows.';
        if (restoreText) prompt += ' Restore text clarity.';
        if (removeHandwriting) prompt += ' Remove handwriting.';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        throw new Error('Failed to scan document.');
    });
};

export const generateScannedDocumentWithCorners = async (
    imageFile: File,
    corners: Corners,
    enhancement: Enhancement,
    removeShadows: boolean,
    restoreText: boolean,
    removeHandwriting: boolean
): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const cornersJson = JSON.stringify(corners);
        let prompt = `Scan this document using these corners: ${cornersJson}. Enhancement mode: ${enhancement}.`;
        if (removeShadows) prompt += ' Remove shadows.';
        if (restoreText) prompt += ' Restore text clarity.';
        if (removeHandwriting) prompt += ' Remove handwriting.';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        throw new Error('Failed to scan document with corners.');
    });
};

export const generateExtractedItem = async (imageFile: File, prompt: string): Promise<string[]> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const fullPrompt = `From the image, extract the item described as: "${prompt}". Return the extracted item with a transparent background.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const results: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }
        
        if (results.length > 0) {
            return results;
        }
        throw new Error('Could not extract item from image.');
    });
};

export const removePeopleFromImage = async (imageFile: File): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = 'Remove any people from this image and realistically fill in the background.';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Failed to remove people from image.');
    });
};

export const generateDocumentStructure = async (scannedImageUrl: string): Promise<any> => {
    return withRetries(async () => {
        const imageFile = dataURLtoFile(scannedImageUrl, 'scanned.png');
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `Analyze this document image and extract its structure as JSON. The JSON should have an "elements" array. Each element can be a 'heading', 'paragraph', or 'table'. Headings and paragraphs should have a "text" property. Tables should have a "table" property which is a 2D array of strings.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        try {
            const text = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON from document structure response:", response.text);
            throw new Error("Could not parse document structure from AI response.");
        }
    });
};

export const generateIdPhoto = async (imageFile: File, options: IdPhotoOptions): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        let prompt = '';
        if (options.type === 'newborn') {
            prompt = `**AI TASK: Newborn ID Photo Generation**
1. Replace the background with a solid, even color: ${options.backgroundColor}.
2. Critically, crop the final image to the specified size: ${options.size}. The output image dimensions MUST strictly adhere to this aspect ratio.
3. Ensure the baby's face is clear, centered, and meets standard requirements for a newborn ID photo.
Return ONLY the final, cropped photograph.`;
        } else {
            const { gender, expression, outfit, backgroundColor, size, hairstyle, customPrompt } = options;
            const expressionMap = {
                'keep': 'Keep the original expression.',
                'neutral': 'Modify the expression to be neutral (closed mouth, no smile).',
                'smile': 'Modify the expression to a gentle, closed-mouth smile.',
                'big-smile': 'Modify the expression to a natural, happy smile (can show teeth).'
            };
            const hairstyleMap = {
                'keep': 'Keep the original hairstyle.',
                'professional-short': 'Change the hairstyle to a professional, short, and neat style.',
                'professional-tied-back': 'Change the hairstyle to be professionally tied back.',
                'professional-neat-down': 'Change the hairstyle to be neat and worn down.',
                'male-neat': "Change the hairstyle to a man's neat, combed style.",
                'male-short': "Change the hairstyle to a man's short business style.",
                'male-medium': "Change the hairstyle to a man's medium-length, neat style."
            };

            prompt = `**AI TASK: Professional ID Photo Generation v6.1**

You are a world-class AI photo editor specializing in identity-preserving modifications. Your task is to modify the provided image according to the specified options while adhering to the highest standard of realism and identity preservation.

**CORE MANDATE #1: ABSOLUTE IDENTITY & BODY PRESERVATION (HIGHEST PRIORITY)**
- **RULE:** The output **MUST** feature the **EXACT SAME PERSON**.
- **RULE:** You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical. The goal is an authentic representation, not an idealized one.
- **CRITICAL FAILURE:** Any alteration to the person's fundamental identity is a critical failure. The following features **MUST NOT BE CHANGED**:
    - **Facial Structure:** Overall shape, Jawline, Chin, Cheeks, Nose, Eyebrows, Mouth, Lips.
    - **Eyes:** Shape, color, and size must remain identical.
    - **Permanent Features:** Moles, scars, freckles, and any facial asymmetry **MUST BE PRESERVED**.
    - **Body Structure:** Neck shape and length, shoulder width and position.
- This mandate overrides all other instructions.

**CORE MANDATE #2: STRICT OUTPUT ASPECT RATIO (NON-NEGOTIABLE)**
- The final output image file **MUST** be cropped to the exact aspect ratio specified in the final step.
- **CRITICAL FAILURE:** Providing an image with an incorrect aspect ratio is a complete failure of the task.

**EXECUTION PROTOCOL (Strict Order):**

**STEP 1: Background Replacement**
- Replace the original background with a solid, even, professional-grade color: **${backgroundColor}**.

**STEP 2: Appearance Modification (Apply with EXTREME caution)**
- **Gender for context:** ${gender}
- **Outfit:** Change the subject's clothing to a **${outfit}**.
    - **CONSTRAINT 1:** The result must be a standard **head-and-shoulders portrait**.
    - **CONSTRAINT 2:** The new clothes must drape realistically over the person's **existing** neck and shoulders. You are **FORBIDDEN** from altering their body shape to fit the clothes.
    - **CONSTRAINT 3:** DO NOT crop the outfit unnaturally. The shoulders must be fully visible and look natural.
- **Hairstyle:** ${hairstyleMap[hairstyle]}
    - **CONSTRAINT:** This must **NOT** alter the person's face, forehead shape, or hairline. The underlying facial structure must remain identical.
- **Expression:** ${expressionMap[expression]}
    - **NOTE:** This is the ONLY instruction that permits changing the muscles around the mouth and eyes. All other features must remain unchanged.

**STEP 3: Custom Instructions**
- ${customPrompt ? `Apply this custom change, while still strictly following all core mandates: "${customPrompt}"` : 'No custom instructions.'}

**STEP 4: Final Cropping (CRITICAL TASK)**
- After ALL other modifications are complete, you **MUST CROP** the final image.
- **Aspect Ratio:** **${size}**. The output image file itself MUST strictly adhere to this aspect ratio.
- **Composition:** Center the head according to standard ID photo conventions (e.g., top of the head near the top edge, chin in the lower half).

**OUTPUT:** Return ONLY the final, correctly cropped, and edited ID photograph. Do not output any text.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Failed to generate ID photo.');
    });
};

export const detectFaces = async (imageFile: File): Promise<Face[]> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = 'Detect all human faces in this image. For each face, return a JSON object with a "box" property. The "box" should contain x, y, width, and height as integers in pixels relative to the original image dimensions. Output as a JSON array of these objects. If no faces are found, return an empty array.';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            box: {
                                type: Type.OBJECT,
                                properties: {
                                    x: { type: Type.INTEGER },
                                    y: { type: Type.INTEGER },
                                    width: { type: Type.INTEGER },
                                    height: { type: Type.INTEGER },
                                }
                            }
                        }
                    }
                }
            }
        });

        try {
            const text = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
            const faces = JSON.parse(text);
            if (Array.isArray(faces)) {
                return faces;
            }
            throw new Error("Invalid face detection response format.");
        } catch (e) {
            console.error("Failed to parse JSON from face detection response:", response.text, e);
            return [];
        }
    });
};

export const detectSubjectDetails = async (imageFile: File): Promise<SubjectDetails> => {
    try {
        return await withRetries(async () => {
            const imagePart = await fileToGenerativePart(imageFile);
            const prompt = `Analyze the person in the image. Determine their likely gender ('male' or 'female') and age category ('newborn' for infants, 'adult' for all others). Provide your best assessment. Return the result as a JSON object.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            gender: { type: Type.STRING, enum: ['male', 'female'] },
                            ageCategory: { type: Type.STRING, enum: ['adult', 'newborn'] },
                        }
                    }
                }
            });

            try {
                const text = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
                const details = JSON.parse(text);
                if (details.gender && details.ageCategory) {
                    return details as SubjectDetails;
                }
                throw new Error("Invalid subject detection response format.");
            } catch (e) {
                console.error("Failed to parse JSON from subject detection response:", response.text, e);
                // Return a default value on parsing failure
                return { gender: 'female', ageCategory: 'adult' };
            }
        });
    } catch (error) {
        // Catch any error from withRetries (like RateLimitError) or other network errors
        console.error("Detecting subject details failed after retries:", error);
        // Return a default value on any failure to prevent crashing or showing a UI error.
        return { gender: 'female', ageCategory: 'adult' };
    }
};
