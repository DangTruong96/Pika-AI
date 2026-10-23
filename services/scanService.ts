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

export type ScanMode = 'cleanup' | 'enhance';

const MODE_INSTRUCTIONS: Record<ScanMode, string> = {
    cleanup:
        'Straighten and perspective-correct the document so it appears as a flat, front-on scan. Place it on a pure white background and remove all shadows, fingers, hands, desk clutter, and glare. Keep every word, number, and line of the original text perfectly sharp, legible, and completely unchanged.',
    enhance:
        'Perform the full cleanup first: straighten and perspective-correct the document, pure white background, remove all shadows, fingers, hands, desk clutter, and glare. Then go further: boost text contrast and legibility, flatten uneven lighting across the page, and keep all printed colors faithful to the original. Keep every word, number, and line sharp and completely unchanged.',
};

export async function processScan(image: File, mode: ScanMode): Promise<string> {
    return withErrorHandling(async () => {
        const prompt = await getPrompt('documentScan.txt', {
            modeInstruction: MODE_INSTRUCTIONS[mode],
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
