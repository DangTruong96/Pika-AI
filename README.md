# Pika AI — Creative Photo Studio

A browser-based AI photo studio powered by Google Gemini. Upload a photo and
retouch it with a brush and a sentence, generate standards-compliant ID
photos, extend a picture beyond its edges, or compose AI photoshoots from
your own subject, outfit and style photos — no desktop software required.
The interface is in Vietnamese.

## Status

Pika AI was developed during 2025 and is **not currently under active
development**. The repository is kept as a working reference implementation:
as of October 2026 it still installs, builds (`npm run build`) and runs
locally (`npm run dev`) with the steps below. The AI features call the live
Gemini API, so they need your own API key and may reflect whatever the
current Gemini models return.

## Features

The editor has five tools, plus the usual editor basics (rotate, flip,
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

Behavior is driven by editable prompt templates in the `prompts/` folder
(loaded at runtime), so most tools can be re-tuned without touching code.

## Tech stack

- **React 19 + TypeScript 5.8**, bundled with **Vite 6**
- **Google Gemini API** via `@google/genai` — Gemini 2.5 Flash,
  Gemini 2.5 Flash Image and Imagen 4 for text-to-image
- **Tailwind CSS** (CDN) for styling
- All processing happens through the Gemini API from the browser; there is
  no backend in this repository.

## Run locally

**Prerequisites:** Node.js (developed against current LTS releases).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Provide your Gemini API key. Copy the example file to `.env.local`
   (which is git-ignored) and fill in a key from
   [Google AI Studio](https://aistudio.google.com/apikey):

   ```bash
   cp .env.example .env.local
   # then edit .env.local:
   # GEMINI_API_KEY=your-key-here
   ```

3. Start the dev server (http://localhost:3000):

   ```bash
   npm run dev
   ```

4. Or build for production:

   ```bash
   npm run build
   ```

> **API key caution:** Vite inlines `GEMINI_API_KEY` into the client bundle
> at dev/build time (see `vite.config.ts`). Use a key you control, ideally
> with API restrictions, and do not publish a build that contains a personal
> key you intend to keep private.

> **Prompt templates:** the app fetches its prompt templates from
> `/prompts/` at runtime. The Vite dev server serves the repository's
> `prompts/` folder directly; if you deploy the contents of `dist/`
> somewhere else, serve the `prompts/` folder alongside it.

## Project layout

- `App.tsx`, `components/` — the editor shell and the five tool panels
- `hooks/` — editor state (history, results, per-tool logic)
- `services/geminiService.ts` — all Gemini API calls
- `prompts/` — the prompt templates that drive each tool
- `translations/`, `contexts/` — Vietnamese UI strings and language context

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2025 Dang Truong.
