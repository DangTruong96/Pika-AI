/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modality } from '@google/genai';
import {
    fileToGenerativePart,
    getAIClient,
    getImageUrlFromResponse,
    getPrompt,
    MODELS,
    withErrorHandling,
} from './geminiService';

export type ProductOperation = 'remove-bg' | 'white-bg' | 'shadow' | 'enhance';

const OPERATION_INSTRUCTIONS: Record<ProductOperation, string> = {
    'remove-bg':
        'Isolate the product from its surroundings and present it alone on a clean, seamless, pure white studio background, as if professionally cut out. The product itself must remain completely unchanged — same shape, colors, materials, labels, and proportions.',
    'white-bg':
        'Replace the entire background with a clean, pure white (#FFFFFF) e-commerce background. Keep the product itself completely unchanged and keep its colors exact and true to the original.',
    shadow:
        'Keep the original scene and composition. Add a soft, realistic contact shadow directly under the product so it sits naturally in the scene, and even out the lighting so the product is clearly and evenly lit. Do not change the product or the background in any other way.',
    enhance:
        "Apply a professional product-photo retouch: accurate, true-to-life colors, crisp fine details, and a clean, tidy background. Do not change the product's shape, proportions, materials, labels, or design in any way.",
};

export async function processProductImage(image: File, operation: ProductOperation): Promise<string> {
    return withErrorHandling(async () => {
        const prompt = await getPrompt('productPhoto.txt', {
            operationInstruction: OPERATION_INSTRUCTIONS[operation],
        });

        const imagePart = await fileToGenerativePart(image);
        const response = await getAIClient().models.generateContent({
            model: MODELS.image,
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const { imageUrl } = await getImageUrlFromResponse(response);
        return imageUrl;
    });
}
