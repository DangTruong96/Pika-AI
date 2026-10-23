/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modality } from '@google/genai';
import {
  getAIClient,
  MODELS,
  fileToGenerativePart,
  getImageUrlFromResponse,
  withErrorHandling,
  getPrompt,
  InvalidInputError,
} from './geminiService';

export type BeautyPreset = 'natural' | 'glamour' | 'skin' | 'face-shape' | 'custom';

const PRESET_INSTRUCTIONS: Record<Exclude<BeautyPreset, 'custom'>, string> = {
  natural:
    'Apply a gentle, natural cleanup: remove temporary blemishes and distractions, even out the skin tone lightly, reduce shine, and tidy stray hairs. Keep the person\'s identity, facial features and natural skin texture fully intact — the result should look like the same person on a good day, with no visible makeup added.',
  glamour:
    'Create a polished, magazine-quality look: flawless but realistic skin, refined and elegant makeup (even foundation, softly enhanced eyes and lips, subtle contouring and blush), and a clean, professional finish. The person must remain clearly recognizable as themselves.',
  skin:
    'Focus entirely on the skin: remove blemishes, spots and redness, even out the skin tone, soften dark circles and shine, while keeping natural pores and fine skin texture visible. Do not reshape the face and do not add makeup beyond what is needed for an even, healthy-looking complexion.',
  'face-shape':
    'Subtly slim and balance the face proportions: a slightly narrower jawline, gentle cheek definition and improved facial symmetry. Keep every change conservative and photorealistic so the person stays instantly recognizable as themselves.',
};

const CUSTOM_FALLBACK_INSTRUCTION =
  'Apply a gentle, natural cleanup: remove temporary blemishes, even out the skin tone lightly, and keep the person\'s identity and natural skin texture fully intact.';

const toIntensityWord = (intensity: number): string => {
  if (intensity < 34) return 'subtle';
  if (intensity < 67) return 'moderate';
  return 'strong';
};

/**
 * Applies a beauty retouch to `image` using the chosen preset. `intensity`
 * is 0–100 and is translated into a strength word for the master prompt in
 * prompts/beautyRetouch.txt. For the 'custom' preset, `customRequest`
 * carries the user's own description of the retouch. Resolves with the
 * resulting image as a data URL.
 */
export async function applyBeauty(
  image: File,
  preset: BeautyPreset,
  intensity: number,
  customRequest?: string,
): Promise<string> {
  return withErrorHandling(async () => {
    if (!image) {
      throw new InvalidInputError('Beauty retouch requires an image.');
    }

    const clampedIntensity = Math.min(100, Math.max(0, Math.round(intensity)));
    const intensityWord = toIntensityWord(clampedIntensity);

    const trimmedCustom = customRequest?.trim();
    const presetInstruction =
      preset === 'custom'
        ? trimmedCustom
          ? `Follow the user's own retouch request exactly: "${trimmedCustom}". Keep the result photorealistic and preserve the person's identity.`
          : CUSTOM_FALLBACK_INSTRUCTION
        : PRESET_INSTRUCTIONS[preset];

    const prompt = await getPrompt('beautyRetouch.txt', {
      presetInstruction,
      intensityWord,
    });

    const imagePart = await fileToGenerativePart(image);
    const response = await getAIClient().models.generateContent({
      model: MODELS.image,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    const { imageUrl } = await getImageUrlFromResponse(response);
    return imageUrl;
  });
}
