import { describe, it, expect } from 'vitest';
import {
  clampCropRect,
  centeredRectForAspect,
  rectToPixels,
  outputSizeForWidth,
} from '../utils/cropMath';

describe('clampCropRect', () => {
  it('keeps a valid rect unchanged', () => {
    expect(clampCropRect({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 })).toEqual({
      x: 0.1, y: 0.1, width: 0.5, height: 0.5,
    });
  });
  it('pulls an overflowing rect back inside the image', () => {
    const r = clampCropRect({ x: 0.8, y: 0.9, width: 0.5, height: 0.5 });
    expect(r.x + r.width).toBeLessThanOrEqual(1);
    expect(r.y + r.height).toBeLessThanOrEqual(1);
  });
  it('enforces a minimum size', () => {
    const r = clampCropRect({ x: 0, y: 0, width: 0.001, height: 0.001 });
    expect(r.width).toBeGreaterThanOrEqual(0.05);
    expect(r.height).toBeGreaterThanOrEqual(0.05);
  });
});

describe('centeredRectForAspect', () => {
  it('returns the full frame for a matching aspect', () => {
    const r = centeredRectForAspect({ width: 1600, height: 900 }, 16 / 9);
    expect(r).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
  it('letterboxes a square crop inside a landscape image', () => {
    const r = centeredRectForAspect({ width: 1600, height: 900 }, 1);
    expect(r.height).toBe(1);
    expect(r.width).toBeCloseTo(900 / 1600, 5);
    expect(r.x).toBeCloseTo((1 - 900 / 1600) / 2, 5);
  });
  it('pillarboxes a wide crop inside a portrait image', () => {
    const r = centeredRectForAspect({ width: 900, height: 1600 }, 16 / 9);
    expect(r.width).toBe(1);
    expect(r.height).toBeCloseTo((900 / 1600) / (16 / 9), 5);
  });
  it('falls back to the full frame for degenerate input', () => {
    expect(centeredRectForAspect({ width: 0, height: 0 }, 1)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});

describe('rectToPixels', () => {
  it('converts a centered square crop of a 1600x900 image', () => {
    const px = rectToPixels({ x: 0.21875, y: 0, width: 0.5625, height: 1 }, { width: 1600, height: 900 });
    expect(px).toEqual({ sx: 350, sy: 0, sw: 900, sh: 900 });
  });
  it('never exceeds the image bounds', () => {
    const px = rectToPixels({ x: 0.9, y: 0.9, width: 0.5, height: 0.5 }, { width: 100, height: 100 });
    expect(px.sx + px.sw).toBeLessThanOrEqual(100);
    expect(px.sy + px.sh).toBeLessThanOrEqual(100);
    expect(px.sw).toBeGreaterThanOrEqual(1);
  });
});

describe('outputSizeForWidth', () => {
  it('preserves the crop aspect ratio', () => {
    expect(outputSizeForWidth({ sw: 900, sh: 900 }, 600)).toEqual({ width: 600, height: 600 });
    expect(outputSizeForWidth({ sw: 1600, sh: 900 }, 800)).toEqual({ width: 800, height: 450 });
  });
  it('returns zeros for degenerate input', () => {
    expect(outputSizeForWidth({ sw: 0, sh: 0 }, 600)).toEqual({ width: 0, height: 0 });
  });
});
