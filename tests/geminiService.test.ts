import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression tests for generateExtractedItem (services/geminiService.ts).
 *
 * The extract flow is the only image function that reads the model response
 * inline instead of going through getImageUrlFromResponse, so a response
 * with no image part used to crash on `response.candidates[0].content`
 * (TypeError) and surface as a generic APIError instead of the typed
 * ModelExecutionError / ContentSafetyError every other image function
 * produces. The Gemini client is mocked; no live API key is used.
 */

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
      get: vi.fn(),
    };
  },
  Modality: { IMAGE: 'IMAGE', TEXT: 'TEXT' },
}));

import {
  generateExtractedItem,
  generateImageFromText,
  generateCompositeImage,
  ModelExecutionError,
  ContentSafetyError,
  InvalidInputError,
} from '../services/geminiService';

const IMAGE_PART = {
  inlineData: { mimeType: 'image/png', data: 'AAAABBBB' },
};

const imageResponse = () => ({
  candidates: [{ content: { parts: [IMAGE_PART] } }],
  text: undefined as string | undefined,
});

class FakeFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  readAsDataURL(file: File) {
    file
      .arrayBuffer()
      .then((buf) => {
        this.result = `data:${file.type || 'image/png'};base64,${Buffer.from(buf).toString('base64')}`;
        this.onloadend?.();
      })
      .catch((e) => {
        this.onerror?.(e);
      });
  }
}

const testImage = () =>
  new File([new Uint8Array([1, 2, 3])], 'test.png', { type: 'image/png' });

beforeEach(() => {
  process.env.API_KEY = 'AIza-test-key-1234567890';
  vi.stubGlobal('FileReader', FakeFileReader as unknown as typeof FileReader);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, text: async () => 'Extract: {prompt}' })),
  );
  mockGenerateContent.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_KEY;
});

describe('generateExtractedItem — responses without an image', () => {
  it('empty candidates list throws ModelExecutionError, not a raw TypeError', async () => {
    mockGenerateContent.mockResolvedValue({ candidates: [] });
    const err = await generateExtractedItem(testImage(), 'extract the bag').catch((e) => e);
    expect(err).toBeInstanceOf(ModelExecutionError);
    // A plain APIError wrapping the raw JS TypeError would leak the
    // implementation detail to the user ("Cannot read properties ...").
    expect(err.message).not.toContain('Cannot read properties');
  });

  it('response without a candidates field throws ModelExecutionError', async () => {
    mockGenerateContent.mockResolvedValue({});
    await expect(generateExtractedItem(testImage(), 'extract the bag')).rejects.toBeInstanceOf(
      ModelExecutionError,
    );
  });

  it('safety-blocked candidate without content throws ContentSafetyError', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          finishReason: 'SAFETY',
          safetyRatings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'HIGH', blocked: true },
          ],
        },
      ],
    });
    const err = await generateExtractedItem(testImage(), 'extract the bag').catch((e) => e);
    expect(err).toBeInstanceOf(ContentSafetyError);
    // The blocked-category detail must survive withErrorHandling, not be
    // replaced by the generic "blocked due to content safety" message.
    expect(err.message).toContain('HATE_SPEECH');
  });

  it('text-only response throws ModelExecutionError quoting the model explanation', async () => {
    const explanation = 'I cannot extract an item from this photo.';
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: explanation }] } }],
      text: explanation,
    });
    await expect(generateExtractedItem(testImage(), 'extract the bag')).rejects.toThrow(
      expect.objectContaining({
        name: 'ModelExecutionError',
        message: expect.stringContaining(explanation),
      }),
    );
  });

  it('returns every inline image part on a normal response', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              IMAGE_PART,
              { inlineData: { mimeType: 'image/jpeg', data: 'CCCCDDDD' } },
            ],
          },
        },
      ],
      text: undefined,
    });
    await expect(generateExtractedItem(testImage(), 'extract the bag')).resolves.toEqual([
      'data:image/png;base64,AAAABBBB',
      'data:image/jpeg;base64,CCCCDDDD',
    ]);
  });

  it('returns the single image on the happy path', async () => {
    mockGenerateContent.mockResolvedValue(imageResponse());
    await expect(generateExtractedItem(testImage(), 'extract the bag')).resolves.toEqual([
      'data:image/png;base64,AAAABBBB',
    ]);
  });
});

describe('withErrorHandling — typed service errors survive unchanged', () => {
  it('text-only response from generateImageFromText stays a ModelExecutionError', async () => {
    const explanation = 'I cannot draw that.';
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: explanation }] } }],
      text: explanation,
    });
    const err = await generateImageFromText('a cat', 1, '1:1').catch((e) => e);
    expect(err).toBeInstanceOf(ModelExecutionError);
    expect(err.message).toContain(explanation);
  });

  it('InvalidInputError thrown by a service function is not downgraded to APIError', async () => {
    // generateCompositeImage validates its inputs before any fetch or API
    // call, so no mock setup is needed for this path.
    const err = await generateCompositeImage([], 'a scene', 'a dress').catch((e) => e);
    expect(err).toBeInstanceOf(InvalidInputError);
    expect(err.message).toContain('at least one subject image');
  });
});
