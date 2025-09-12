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
  outfit: 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai' | 'office-wear';
  hairstyle: 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
  customPrompt?: string;
}

// Options for newborn ID photos
interface NewbornIdPhotoOptions extends IdPhotoOptionsBase {
    type: 'newborn';
}

// Union type for all ID photo options
export type IdPhotoOptions = StandardIdPhotoOptions | NewbornIdPhotoOptions;

// --- CONSTANTS ---
/**
 * Standardized, non-negotiable protocol for preserving a subject's identity and integrating them into new contexts dynamically.
 * This is appended to user-generated prompts for creative edits to ensure core identity and authenticity are not altered.
 * Version 10.0.
 */
const ADDENDUM_IDENTITY_INTEGRATION_V10_0 = `

---
**ADDENDUM: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION PROTOCOL v10.0 (NON-NEGOTIABLE)**
This protocol is a strict, non-negotiable requirement for the final output and overrides all other creative instructions. The goal is to move beyond static preservation to dynamically integrate the subject's "soul" and authenticity into any context.

**PART 1: FORENSIC IDENTITY PRESERVATION (CORE FOUNDATION)**
1.  **IDENTITY & FACIAL STRUCTURE (HIGHEST PRIORITY):** The output **MUST** feature the **EXACT SAME PERSON/PEOPLE**. You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical/balanced (cân đối). You **MUST** perfectly preserve all natural facial asymmetries (e.g., mặt lệch, miệng lệch).
2.  **PHYSICAL ATTRIBUTES:** The final perceived weight must be true to the original. Preserve the original body shape, height, and face shape (mặt to/nhỏ), etc.
3.  **CRITICAL FACIAL FEATURES (FORENSIC-LEVEL DETAIL):** You **MUST** meticulously preserve with zero alteration:
    -   **Eyes:** The exact, original eye shape, size, and angle (monolid/mắt một mí, double-lid/mắt hai mí, hooded/mắt híp).
    -   **Nose:** The original nose shape (e.g., mũi cao, mũi tẹt, mũi to).
    -   **Mouth & Teeth:** Unique dental structures like overbites (răng hô) or snaggle teeth (răng khểnh) **MUST** be retained perfectly.
    -   **Skin & Permanent Features:** Preserve permanent features like dimples (núm đồng tiền), moles, and scars.

**PART 2: DYNAMIC INTEGRATION (CONTEXTUAL AWARENESS & REALISM)**
4.  **DEEP CONTEXTUAL AWARENESS:** You **MUST** understand the context of the entire image to ensure edits are hyper-realistic.
    -   **Physics-Based Lighting:** When changing clothes or adding objects, analyze the scene's light sources. The new elements **MUST** have accurate shadows, highlights, and folds that match the environment. Simulate how light and color from the environment reflect on skin, eyes, and shiny surfaces (e.g., glasses).
    -   **Natural Expressions:** When modifying expressions (e.g., adding a smile), you **MUST** engage the corresponding facial muscles. A smile must include crinkling around the eyes (a "Duchenne smile") to be believable.
5.  **MICRO-EXPRESSION & "SOUL" PRESERVATION:** Beyond static features, you must identify and preserve the subtle "micro-expressions" and mood of the original subject to retain their personality and authenticity.
6.  **GENETIC CONSISTENCY:** When making significant changes (e.g., hair color), the results must remain plausible and natural for the subject's inferred ethnicity and features (skin tone, eye color).
---
`;

// --- UTILITIES ---

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
    // Fix: Added a guard clause to prevent calling .split() on null or undefined.
    if (!dataUrl) {
        throw new Error('Invalid dataURL provided to dataURLtoFile.');
    }
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
    // Fix: Rewrote with FileReader.onload and added checks to prevent .split() on null.
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (result) {
                const parts = result.split(',');
                if (parts.length === 2) {
                    resolve(parts[1]);
                } else {
                    reject(new Error('Could not extract base64 data from file reader result.'));
                }
            } else {
                reject(new Error('File reader result was null.'));
            }
        };
        reader.onerror = (error) => reject(error);
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
            contents: { parts: [imagePart, { text: `Apply the following filter to the image: ${filterPrompt}${ADDENDUM_IDENTITY_INTEGRATION_V10_0}` }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate filtered image.');
    });
};

export const generateAdjustedImage = async (imageFile: File, adjustmentPrompt: string, variationSeed?: number): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        let finalPrompt = `Apply the following adjustment to the image: ${adjustmentPrompt}`;
        if (variationSeed) {
            finalPrompt += `\n\n**VARIATION DIRECTIVE:** This is attempt number ${variationSeed}. Generate a unique result that is creatively different from other attempts while adhering to the main adjustment prompt.`
        }

        // For adjustments, many prompts are pre-written. Only add the generic protocol if a specific one isn't already present.
        if (!adjustmentPrompt.includes("IDENTITY") && !adjustmentPrompt.includes("FORENSIC")) {
             finalPrompt += ADDENDUM_IDENTITY_INTEGRATION_V10_0;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
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
        
        const fullPrompt = `This is an image with empty padding around it. Your task is to fill in the padded areas to seamlessly expand the original image. The generated areas must be hyper-realistic and perfectly match the lighting, texture, color grading, and noise/grain of the original photo. If a user prompt is provided, use it as inspiration. User Prompt: "${prompt || 'no prompt'}"`;

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

export async function* generateEditedImageWithMaskStream(imageFile: File, prompt: string, maskDataUrl: string): AsyncGenerator<string> {
    const imagePart = await fileToGenerativePart(imageFile);
    const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
    const maskPart = await fileToGenerativePart(maskFile);

    // CRITICAL FIX: The identity preservation addendum conflicts with removal prompts.
    // We conditionally exclude it if the prompt is for a removal task.
    // The new removal prompts contain "XÓA" (Vietnamese) or "REMOVAL" to act as a flag.
    const isRemovalTask = prompt.includes("XÓA") || prompt.includes("REMOVAL");
    const finalPromptText = `Edit the image based on this mask and prompt. Prompt: "${prompt}"${isRemovalTask ? '' : ADDENDUM_IDENTITY_INTEGRATION_V10_0}`;
    
    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            imagePart, 
            { text: finalPromptText },
            maskPart
        ]},
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
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
    cameraAngle: string,
    variationSeed?: number
): Promise<string> => {
    return withRetries(async () => {
        const cameraAngleInstructions: { [key: string]: string } = {
            front: 'The subject should be facing the camera directly (frontal view).',
            threeQuartersLeft: 'This is a three-quarters view from the left. The subject\'s head and shoulders should be turned slightly away from the camera, towards their right, so more of the left side of their face is visible.',
            threeQuartersRight: 'This is a three-quarters view from the right. The subject\'s head and shoulders should be turned slightly away from the camera, towards their left, so more of the right side of their face is visible.',
            profileLeft: 'This is a profile view from the left. The subject should be looking directly to their right, with only the left side of their face visible to the camera.',
            profileRight: 'This is a profile view from the right. The subject should be looking directly to their left, with only the right side of their face visible to the camera.',
            slightlyAbove: 'This is a high-angle shot, with the camera positioned slightly above the subject\'s eye level, looking down at them. This will cause the subject to appear to be looking up towards the camera.',
            slightlyBelow: 'This is a low-angle shot, with the camera positioned slightly below the subject\'s eye level, looking up at them. This will cause the subject to appear to be looking down towards the camera.',
        };
        const selectedCameraAngleInstruction = cameraAngleInstructions[cameraAngle] || cameraAngleInstructions['front'];
        
        let finalPrompt: string;
        
        if (swapFaceFile) {
            // This is a Face Swap call
            finalPrompt = `${prompt}\n\n**BƯỚC 3.5: GÓC MÁY ẢNH (CHỈ THỊ QUAN TRỌNG)**\nToàn bộ cảnh cuối cùng, bao gồm cả người có khuôn mặt đã được hoán đổi, **PHẢI** được hiển thị từ góc máy ảnh này: **${selectedCameraAngleInstruction}**. Điều này có thể yêu cầu bạn tái tạo lại đầu và vai của đối tượng để phù hợp một cách tự nhiên với góc nhìn mới.`;
        } else {
            // This is a Composite call
            const identityPreservationInstruction = `**AI TASK: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION PROTOCOL v10.0 (NON-NEGOTIABLE)**
---
**PRIMARY DIRECTIVE:** Your highest priority is the absolute, forensic-level preservation of the subject's identity AND the dynamic, realistic integration of them into the scene. Any deviation that results in a person looking like a different individual, or an idealized version, or someone who doesn't belong in the scene, is a CRITICAL FAILURE.

**PART 1: FORENSIC IDENTITY PRESERVATION (CORE FOUNDATION)**
1.  **IDENTITY & FACIAL STRUCTURE:** The output **MUST** feature the **EXACT SAME PERSON/PEOPLE**. You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making faces more symmetrical/balanced. Preserve all natural facial asymmetries (e.g., mặt lệch, miệng lệch).
2.  **PHYSICAL ATTRIBUTES (BODY & FACE SHAPE):** Preserve the original perceived weight, body shape, and height. **DO NOT** make the person look heavier or their face look fuller. You **MUST** preserve their original body type (e.g., gầy, đầy đặn) and face shape (e.g., V-line, mặt tròn).
3.  **CRITICAL FACIAL FEATURES:** Meticulously preserve with zero alteration: eye shape (monolid/mắt một mí), nose shape (mũi tẹt), and dental structure (răng hô/khểnh).

**PART 2: DYNAMIC INTEGRATION (CONTEXTUAL AWARENESS & REALISM)**
4.  **PHYSICS-BASED LIGHTING & COLOR:** You **MUST** analyze the background and scene's light sources. The subjects **MUST** be lit by this environment. Their skin tones, clothing, and hair must have realistic shadows, highlights, and color reflections from the scene.
5.  **MICRO-EXPRESSION & "SOUL" PRESERVATION:** Preserve the subtle "micro-expressions" and mood of the subjects to retain their personality.

**PART 3: CAMERA & COMPOSITION**
6.  **CAMERA ANGLE (CRITICAL):** The final image **MUST** be rendered from this camera perspective: ${selectedCameraAngleInstruction}. This is a specific instruction about the camera's position relative to the subject, not just a pose. You must reconstruct the subjects' head and shoulders in 3D space to match this angle.
---
Now, follow the user's prompt below.
**USER PROMPT:** `;
            finalPrompt = identityPreservationInstruction + prompt;
        }
        
        if (variationSeed) {
            finalPrompt += `\n\n**VARIATION DIRECTIVE:** This is attempt number ${variationSeed}. Generate a unique composition. Ensure the result is creatively different from other attempts by altering the layout, subject poses, or background details while adhering to the main prompt.`;
        }
        
        const parts: any[] = [{ text: finalPrompt }];

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
        const prompt = 'Remove any people from this image and hyper-realistically fill in the background. The filled-in area must perfectly match the original image\'s lighting, texture, color grading, and noise/grain to be completely seamless.';
        
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
            const outfitDescriptionMap: { [key in typeof outfit]: string } = {
                'suit': 'a professional business suit and tie',
                'blouse': 'a professional blouse for women',
                'collared-shirt-m': "a man's collared dress shirt",
                'collared-shirt-f': "a woman's professional collared office shirt",
                'ao-dai': "a traditional Vietnamese Áo Dài (upper part only, suitable for a portrait)",
                'office-wear': 'a professional office wear outfit, such as a blouse or a shirt with a blazer'
            };
            const outfitDescription = outfitDescriptionMap[outfit];

            const outfitInstruction = `You **MUST** replace the subject's original clothing with **${outfitDescription}**.`;
            const hairstyleInstruction = `${hairstyleMap[hairstyle]}`;

            prompt = `**AI TASK: Professional ID Photo Generation v10.0**

You are a world-class AI photo editor specializing in identity-preserving modifications. Your task is to modify the provided image according to the specified options while adhering to the highest standard of realism and identity preservation.

**CORE MANDATE #1: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION (HIGHEST PRIORITY)**
-   **RULE #1:** The output **MUST** feature the **EXACT SAME PERSON**. Any alteration to identity is a complete failure.
-   **RULE #2:** You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical/balanced. Your primary goal is an authentic representation.
-   **RULE #3: You MUST preserve all unique, defining, and asymmetrical structural features.** This is critical for maintaining identity.
    -   **Physical Attributes:** The final perceived weight must be true to the original. Do not make them look heavier or unnaturally thinner. Preserve body shape and face shape (e.g., mặt to/nhỏ).
    -   **Dental Structure:** Preserve the underlying structure of teeth, such as overbites (răng hô) or unique arrangements (răng khểnh), even when changing the expression. Do not "perfect" the teeth.
    -   **Eye Structure:** The fundamental shape and size of the eyes (e.g., monolid (mắt một mí), double-lid (mắt hai mí), hooded (mắt híp)) **MUST** be preserved.
    -   **Nose Structure:** The original nose shape (e.g., mũi cao, tẹt, to) **MUST** be preserved.
    -   **Permanent Features:** Moles, scars, wrinkles, dimples (núm đồng tiền), and natural facial asymmetry (mặt lệch, miệng lệch) **MUST BE PRESERVED PERFECTLY**.
-   **RULE #4: Body Structure:** The person's overall body shape, perceived weight, neck shape/length, and shoulder width/position **MUST BE PRESERVED** when changing clothes. Do not alter the body to fit the clothes.
-   **RULE #5 (DYNAMIC INTEGRATION):** When changing outfits, create realistic folds and shadows based on a standard studio lighting setup. When changing expressions, ensure corresponding facial muscles (e.g., around the eyes for a smile) are naturally engaged.
-   This mandate overrides all other instructions.

**CORE MANDATE #2: STRICT OUTPUT ASPECT RATIO (NON-NEGOTIABLE)**
- The final output image file **MUST** be cropped to the exact aspect ratio specified in the final step.
- **CRITICAL FAILURE:** Providing an image with an incorrect aspect ratio is a complete failure of the task.

**EXECUTION PROTOCOL (Strict Order):**

**STEP 1: Initial Subject Re-framing (CRITICAL PRE-PROCESSING)**
- **ACTION:** Your first and most critical action is to re-frame the subject into a standard portrait composition (head and shoulders).
- **If the source image is very tall and narrow (e.g., 9:16), you MUST intelligently outpaint/add new background to the left and right to create a standard portrait aspect ratio (approximately 3:4) BEFORE proceeding.** This creates a proper canvas for the next steps.
- **If the source image is very wide, CROP it to a standard portrait framing.**
- **This re-framing step MUST happen BEFORE any other changes (like outfit or background color).** The goal is to establish a well-composed head-and-shoulders base, regardless of the original image's dimensions.

**STEP 2: Background Replacement**
- Replace the original background with a solid, even, professional-grade color: **${backgroundColor}**.

**STEP 3: Appearance Modification (Apply with EXTREME caution)**
- **Gender for context:** ${gender}
- **Outfit (MANDATORY CHANGE):** ${outfitInstruction}
- **Hairstyle:** ${hairstyleInstruction}
- **Expression:** ${expressionMap[expression]}

**STEP 4: Custom Instructions**
- ${customPrompt ? `Apply this custom change, while still strictly following all core mandates: "${customPrompt}"` : 'No custom instructions.'}

**STEP 5: Final Quality Enhancement & Restoration (MANDATORY)**
- After all other modifications are complete, you **MUST** perform a final quality enhancement on the subject.
- **Analyze the face for blur, noise, or low resolution.**
- **Perform a forensic-level face restoration:** Reconstruct lost details, enhance sharpness, and ensure the face is crystal clear and suitable for an official ID photo.
- **Crucially, all rules from CORE MANDATE #1 (Identity Integration) remain the absolute highest priority during this enhancement.**

**STEP 6: Final Cropping (CRITICAL TASK)**
- After ALL other modifications are complete, you **MUST CROP** the final image.
- **Aspect Ratio:** **${size}**. The output image file itself MUST strictly adhere to this aspect ratio.
- **Composition:** Center the head according to standard ID photo conventions.

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

export const generateOutfitDescription = async (imageFile: File, stylePrompt: string): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const fullPrompt = `Analyze the people in the provided image and the user's style prompt. Your task is to design a set of stylish, coordinated outfits for a professional photoshoot, one for each person present in the image.

**Instructions:**
1.  **Identify Subjects:** Identify all individuals in the source image, noting their approximate body types and relative heights to inform your clothing choices.
2.  **Analyze Style:** Interpret the user's style prompt: "${stylePrompt}".
3.  **Design Coordinated Outfits:** Create a detailed description for a complete outfit for EACH person. The outfits MUST be stylistically coordinated with each other, MUST match the user's style prompt, and should be appropriate for the individuals' builds. For example, if the prompt is 'vintage 90s fashion', all outfits should reflect that era and look good together.
4.  **Be Specific:** Describe tops, bottoms, shoes, and any accessories for each person.

**Output Format:**
- Output only the detailed text description of the outfits for everyone.
- Do not add any conversational text or preamble.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: fullPrompt }] },
        });

        const text = response.text;
        if (text && text.trim()) {
            return text.trim();
        }

        throw new Error('Could not generate an outfit description.');
    });
};

export const generatePhotoshootImage = async (imageFile: File, stylePrompt: string, poseStyle: string, cameraAngle: string, outfitDescription?: string): Promise<string> => {
    return withRetries(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        const poseInstructions: { [key: string]: string } = {
            automatic: 'a new, different, and dynamic pose suitable for a professional photoshoot. Do not use the pose from the original image.',
            dynamic: 'a new, different, and **dynamic and energetic** pose. Think action shots, movement, and powerful stances.',
            candid: 'a new, different, and **candid and natural** pose. The subject(s) should look relaxed, unposed, and as if caught in a natural moment.',
            formal: 'a new, different, and **formal and elegant** pose. Think classic portraiture, poised stances, and a sophisticated demeanor.'
        };

        const cameraAngleInstructions: { [key: string]: string } = {
            front: 'The subject should be facing the camera directly (frontal view).',
            threeQuartersLeft: 'This is a three-quarters view from the left. The subject\'s head and shoulders should be turned slightly away from the camera, towards their right, so more of the left side of their face is visible.',
            threeQuartersRight: 'This is a three-quarters view from the right. The subject\'s head and shoulders should be turned slightly away from the camera, towards their left, so more of the right side of their face is visible.',
            profileLeft: 'This is a profile view from the left. The subject should be looking directly to their right, with only the left side of their face visible to the camera.',
            profileRight: 'This is a profile view from the right. The subject should be looking directly to their left, with only the right side of their face visible to the camera.',
            slightlyAbove: 'This is a high-angle shot, with the camera positioned slightly above the subject\'s eye level, looking down at them. This will cause the subject to appear to be looking up towards the camera.',
            slightlyBelow: 'This is a low-angle shot, with the camera positioned slightly below the subject\'s eye level, looking up at them. This will cause the subject to appear to be looking down towards the camera.',
        };
        
        const selectedPoseInstruction = poseInstructions[poseStyle] || poseInstructions['automatic'];
        const selectedCameraAngleInstruction = cameraAngleInstructions[cameraAngle] || cameraAngleInstructions['front'];

        const outfitInstruction = outfitDescription
            ? `The people's outfits **MUST** be exactly as described here: "${outfitDescription}". The background MUST be changed to match the style prompt.`
            : `The people's outfits and the background **MUST** be changed to match the style prompt. The outfits should be consistent with a professional photoshoot in the described style.`;

        const fullPrompt = `**AI TASK: Professional Studio Photoshoot Generation v10.0**

**NON-NEGOTIABLE CORE MANDATE: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION OF ALL SUBJECTS**
-   The output **MUST** feature the **EXACT SAME PEOPLE** from the source image. All individuals must be present. This is the highest priority.

**CRITICAL PRESERVATION & INTEGRATION RULES (NON-NEGOTIABLE):**
1.  **FACIAL IDENTITY:** You are **STRICTLY FORBIDDEN** from altering a person's fundamental facial structure or identity. Do not beautify, idealize, or make faces more symmetrical/balanced.
    -   **MUST PRESERVE:** The exact eye shape (e.g., monolid, hooded), nose shape, lip shape, jawline, chin, and unique characteristics like moles, scars, asymmetries (mặt lệch), or dental features (răng hô/khểnh).
2.  **BODY & FACE SHAPE INTEGRITY:** You are **STRICTLY FORBIDDEN** from altering a person's body shape, height, or face shape. The person's perceived weight (béo/gầy) **MUST** be true to the original; **DO NOT** make them look heavier or their face look fuller.
    -   **MUST PRESERVE:** The original body type (e.g., gầy, đầy đặn), face shape (e.g., mặt V-line, mặt tròn, mặt vuông), and crucially, the **relative height differences** between individuals. A person who is taller in the original photo MUST remain taller in the output.
3.  **DYNAMIC INTEGRATION:**
    -   **CONTEXTUAL LIGHTING:** Analyze the lighting described by the style prompt ("${stylePrompt}"). The subjects **MUST** be lit realistically by this environment. Clothing must have accurate folds and shadows. Light should reflect naturally on skin, eyes, and accessories.
    -   **AUTHENTIC EXPRESSIONS:** Ensure poses and expressions feel natural and authentic, preserving the subjects' "micro-expressions" and personality. A smile must look genuine by engaging eye muscles.

**TASK:**
1.  **Analyze Style:** Interpret the user's style prompt: "${stylePrompt}".
2.  **Generate New Image:** Create a new, high-quality photograph of **ALL the people** from the source image, based on the style prompt, while strictly adhering to the core mandate above.
3.  **Change Outfits & Background:** ${outfitInstruction}
4.  **Generate a New, Unique Pose:** The people **MUST** be in ${selectedPoseInstruction}. The pose should be a natural group arrangement if there are multiple people.
5.  **Set Camera Angle (CRITICAL):** The camera perspective **MUST** be as described: **${selectedCameraAngleInstruction}**. This is a specific instruction about the camera's position relative to the subject, not just a pose. You must reconstruct the person's head and shoulders in 3D space to match this angle.
6.  **Photographic Realism:** The final image must be hyper-realistic and look like a professional photograph.

**OUTPUT:** Return only the final photograph. Do not output any text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageUrl = getFirstImageDataUrl(response);
        if (imageUrl) return imageUrl;
        
        throw new Error('Could not generate photoshoot image.');
    });
};
