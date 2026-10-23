/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure prompt-template substitution. Templates in /prompts use {key}
 * placeholders; every occurrence is replaced with the stringified value.
 * Extracted from services/geminiService.ts so it can be unit tested.
 */
export const applyReplacements = (
  template: string,
  replacements: Record<string, unknown> = {},
): string => {
  let prompt = template;
  for (const key in replacements) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacements[key]));
  }
  return prompt;
};
