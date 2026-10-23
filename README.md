# Pika AI — Creative Photo Studio

A browser-based AI photo studio powered by Google Gemini. Upload a photo and
retouch it with a brush and a sentence, generate standards-compliant ID
photos, extend a picture beyond its edges, or compose AI photoshoots from
your own subject, outfit and style photos — no desktop software required.
The interface is in Vietnamese.

## Status

**v2.0.0 (October 2026) — maintained.** This release adds five new tools
(ten in total), switches the app to a bring-your-own-key model, migrates
to the current Gemini image models, and adds a unit-test suite. See
[CHANGELOG.md](CHANGELOG.md) for details.

**Live demo:** https://dangtruong96.github.io/Pika-AI/ — the demo runs
entirely in your browser; paste your own Gemini API key (see below) to
use the AI tools. The Crop tool works without a key.

## Features

The editor has ten tools, plus the usual editor basics (rotate, flip,
undo/redo history, and a fullscreen viewer with before/after comparison):

- **Retouch** — Paint a mask over part of a photo, describe the change in
  words, and let the AI regenerate just that region. An **Extract** mode
  lifts a selected item out of a photo as a standalone result, which can be
  reused as an outfit/object reference in Studio.
- **Enhance** — One-click AI enhancements (auto enhance, brightening,
  ad-poster and composition presets), generative portrait adjustments
  (slimmer face, slimmer chin and neck, open eyes, natural smile), and a
  set of color/style filters (Vibrant, Golden Sun, Blue Sunset, Golden
  Autumn, …).
- **Studio** — AI photoshoot and composite generation: combine subject
  photos with outfit and style references (and extracted objects), have the
  app draft a creative prompt from your reference images, or infer an outfit
  description automatically.
- **ID Photo** — ID/passport photos in eight standard sizes (3×4, 4×6, 2×2,
  3.5×4.5, 5×5, 2×3, 2.4×3, 4×5) with white, blue, gray or green
  backgrounds, expression, outfit (including áo dài) and hairstyle options,
  plus a dedicated newborn mode.
- **Expand** — AI outpainting: drag the frame past any edge of the original
  photo and the AI fills in the new area.
- **Face Swap** — Put a face from a reference photo onto the person in the
  current photo, keeping pose, outfit, lighting and background.
- **Beauty** — Deep portrait retouch: five presets (natural, glamour,
  skin, face-shape, or your own written request) with an intensity scale.
- **Scan** — Turn a photo of a paper document into a clean scan:
  straightened, white background, shadows removed, text sharpened.
- **Product** — E-commerce photo tools: background removal, pure-white
  background, realistic contact shadow, professional retouch.
- **Crop** — Crop to common aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)
  entirely in the browser — no API key needed — with an optional AI
  enhance pass afterwards.

Behavior is driven by editable prompt templates in the `prompts/` folder
(loaded at runtime), so most tools can be re-tuned without touching code.

## Tech stack

- **React 19 + TypeScript 5.8**, bundled with **Vite 6**
- **Google Gemini API** via `@google/genai` — `gemini-3.1-flash-image`
  ("Nano Banana 2") for image generation/editing and `gemini-2.5-flash`
  for text/prompt drafting (model IDs verified against Google's official
  documentation, October 2026)
- **Tailwind CSS** (CDN) for styling, **Vitest** for unit tests
- All processing happens through the Gemini API from the browser; there is
  no backend in this repository.

## Run locally

**Prerequisites:** Node.js (developed against current LTS releases).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app, then add your Gemini API key **in the app itself**
   (bring-your-own-key): click **Khóa API** in the header, paste a key
   from [Google AI Studio](https://aistudio.google.com/apikey), and the
   app validates it with a lightweight API call before saving. The key
   is stored only in your browser's `localStorage` and is only ever sent
   to Google's API endpoints; you can change or remove it at any time in
   the same dialog.

   ```bash
   npm run dev        # dev server at http://localhost:3000
   npm run build      # production build into dist/
   npm test           # unit tests (Vitest)
   ```

3. *(Optional, local development only)* Instead of pasting a key, you can
   copy `.env.example` to `.env.local` (git-ignored) and set
   `GEMINI_API_KEY` there; a key pasted in the app takes precedence.

> **API key caution:** a key set via `.env.local` is inlined into the
> client bundle at build time (see `vite.config.ts`). Only build with an
> env key for your own local use — never publish a bundle that contains
> a personal key. The deployed demo is built **without** any env key;
> every visitor uses their own.

> **Prompt templates:** the app fetches its prompt templates from
> `prompts/` at runtime. `npm run build` copies them into `dist/`
> automatically; the dev server serves the repository folder directly.

## Project layout

- `App.tsx`, `components/` — the editor shell and the ten tool panels
- `hooks/` — editor state (history, results, per-tool logic)
- `services/` — Gemini API access (`geminiService.ts` plus one service
  per AI tool) and BYOK key storage (`apiKey.ts`)
- `prompts/` — the prompt templates that drive each tool
- `utils/` — pure helpers (crop geometry, ID-photo sizes, prompt
  templating), covered by the tests in `tests/`
- `translations/`, `contexts/` — Vietnamese UI strings and language context

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2025 Dang Truong.
