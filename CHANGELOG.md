# Changelog

All notable changes to Pika AI are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses
semantic versioning.

## [2.0.0] — 2026-10-23

### Added

- **Bring your own key (BYOK).** The app no longer needs a key baked into
  the build. A new **Khóa API** (API key) settings dialog in the header
  lets each user paste their own Gemini API key from Google AI Studio,
  validates it with a lightweight live API call, and stores it only in
  the browser's `localStorage`. Keys can be changed or removed at any
  time, and a missing key produces a clear in-app explanation instead of
  a failed request. A build-time key (`.env.local`) still works as a
  local-development fallback.
- **Face Swap** — transfer a face from a reference photo onto the person
  in the current photo, keeping pose, clothing and background.
- **Beauty** — deep portrait retouch with five presets (natural,
  glamour, skin, face-shape, custom) and an intensity scale.
- **Scan** — turn a photo of a document into a clean scan: perspective
  correction, white background, shadow removal, plus a text-enhance mode.
- **Product** — e-commerce photo tools: background removal, pure-white
  background, realistic contact shadow, professional retouch.
- **Crop** — client-side cropping with common aspect ratios
  (1:1, 4:3, 3:4, 16:9, 9:16) that works without any API key, plus an
  optional AI enhance pass on the cropped result.
- **Unit tests** — Vitest suite (35 tests) covering API-key storage and
  validation helpers, ID-photo size math, crop geometry and
  prompt-template substitution. Run with `npm test`.
- **Live demo** on GitHub Pages:
  https://dangtruong96.github.io/Pika-AI/

### Changed

- **Model migration** (IDs verified against Google's official Gemini API
  documentation, October 2026): image generation/editing moved from
  `gemini-2.5-flash-image` to **`gemini-3.1-flash-image`** ("Nano Banana
  2"); prompt drafting stays on `gemini-2.5-flash`. Text-to-image no
  longer uses Imagen 4 — Google shut the Imagen API down — and now runs
  through the same image model via `generateContent`.
- Prompt templates are fetched relative to the app's base path, and
  `npm run build` now copies `prompts/` into `dist/` automatically, so
  the deployed site works under a subpath such as `/Pika-AI/`.
- `@google/genai` updated to the newest 1.x release (^1.52.0).

### Removed

- 25 zero-byte stub files and dead duplicates (unused panel stubs, an
  empty `src/` tree, root-level duplicates of real components). Every
  removal was verified to have no importers.

### Notes

- The five new AI tools were verified by TypeScript type-checking, the
  unit-test suite, production builds, and code-level review against the
  documented `@google/genai` API shapes. They were **not** exercised
  against the live Gemini API by the maintainers — no API key exists in
  the development environment, by design (BYOK). Live behavior is for
  each user to verify with their own key.

## [1.0.0] — 2025

Initial public state of the project: the five original tools (Retouch,
Enhance, Studio, ID Photo, Expand), Vietnamese interface, prompt
templates in `prompts/`, Gemini 2.5 Flash / 2.5 Flash Image / Imagen 4
model usage, and a build-time `GEMINI_API_KEY`.
