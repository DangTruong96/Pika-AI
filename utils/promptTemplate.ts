/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure prompt-template substitution. Templates in /prompts use {key}
 * placeholders; every occurrence is replaced with the stringified value.
 * Extracted from services/geminiService.ts so it can be unit tested.
 *
 * Single-pass substitution: the template is scanned once, each
 * placeholder is replaced via a replacer function, and inserted values
 * are never rescanned. That matters because replacement values are
 * user-controlled text (prompts, outfit descriptions, custom requests):
 *  - String.replace() with a string replacement interprets `$` patterns
 *    (`$&`, `$'`, `$$`, …), so a prompt mentioning a price like "$50"
 *    used to come out mangled in the prompt sent to the model.
 *  - The old sequential per-key loop re-substituted values that
 *    themselves contained a later placeholder, so a user prompt
 *    containing "{outfitDescription}" was silently rewritten to the
 *    actual outfit description in composite/photoshoot prompts.
 */
export const applyReplacements = (
  template: string,
  replacements: Record<string, unknown> = {},
): string => {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      return String(replacements[key]);
    }
    return match;
  });
};
