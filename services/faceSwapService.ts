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

export type FaceSwapOptions = {
  /**
   * When true (default), the result keeps the facial expression, gaze and
   * head pose of the person in the source image; only the identity comes
   * from the face reference. When false, the expression may subtly follow
   * the reference face while the pose still comes from the source.
   */
  preserveExpression?: boolean;
};

const EXPRESSION_INSTRUCTIONS: Record<'preserve' | 'follow', string> = {
  preserve:
    'Preserve the facial expression, gaze direction and head pose of the person in the FIRST image exactly as they are. Only the identity and facial features come from the SECOND image — do not copy its expression.',
  follow:
    'Let the facial expression subtly follow the expression of the person in the SECOND image, while keeping the head pose, head angle and gaze direction of the FIRST image.',
};

/**
 * Swaps the face of the person in `sourceImage` with the identity from
 * `faceImage`. Both images are sent to the model (source first, face
 * reference second) together with the master prompt in
 * prompts/faceSwap.txt. Resolves with the resulting image as a data URL.
 */
export async function swapFace(
  sourceImage: File,
  faceImage: File,
  options?: FaceSwapOptions,
): Promise<string> {
  return withErrorHandling(async () => {
    if (!sourceImage) {
      throw new InvalidInputError('Face swap requires a source image.');
    }
    if (!faceImage) {
      throw new InvalidInputError('Face swap requires a face reference image.');
    }

    const expressionInstruction =
      options?.preserveExpression === false
        ? EXPRESSION_INSTRUCTIONS.follow
        : EXPRESSION_INSTRUCTIONS.preserve;

    const prompt = await getPrompt('faceSwap.txt', { expressionInstruction });

    const sourcePart = await fileToGenerativePart(sourceImage);
    const facePart = await fileToGenerativePart(faceImage);

    const response = await getAIClient().models.generateContent({
      model: MODELS.image,
      contents: { parts: [sourcePart, facePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    const { imageUrl } = await getImageUrlFromResponse(response);
    return imageUrl;
  });
}
