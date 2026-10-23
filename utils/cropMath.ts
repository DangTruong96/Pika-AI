/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure crop-geometry helpers used by the Crop panel. All rectangles are in
 * relative image coordinates unless a function name says otherwise; keeping
 * the math here (instead of inside the component) makes it unit testable.
 */

export interface CropRect {
  /** Left edge, 0..1 relative to image width. */
  x: number;
  /** Top edge, 0..1 relative to image height. */
  y: number;
  /** Width, 0..1 relative to image width. */
  width: number;
  /** Height, 0..1 relative to image height. */
  height: number;
}

export interface PixelSize {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Ensures a rect stays fully inside the image with a minimum size. */
export const clampCropRect = (rect: CropRect, minSize = 0.05): CropRect => {
  const width = clamp(rect.width, minSize, 1);
  const height = clamp(rect.height, minSize, 1);
  return {
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
    width,
    height,
  };
};

/**
 * The largest centered rectangle with the given aspect ratio (width/height
 * in *pixel* space) that fits inside an image of `image` pixel size,
 * returned in relative coordinates.
 */
export const centeredRectForAspect = (image: PixelSize, aspect: number): CropRect => {
  if (image.width <= 0 || image.height <= 0 || aspect <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  const imageAspect = image.width / image.height;
  let width: number;
  let height: number;
  if (aspect >= imageAspect) {
    // Target is wider (relatively) than the image: full width, reduced height.
    width = 1;
    height = imageAspect / aspect;
  } else {
    width = aspect / imageAspect;
    height = 1;
  }
  return {
    x: (1 - width) / 2,
    y: (1 - height) / 2,
    width,
    height,
  };
};

/** Converts a relative rect to integer pixel coordinates for canvas use. */
export const rectToPixels = (rect: CropRect, image: PixelSize): { sx: number; sy: number; sw: number; sh: number } => {
  const clamped = clampCropRect(rect, 0);
  const sx = Math.round(clamped.x * image.width);
  const sy = Math.round(clamped.y * image.height);
  const sw = Math.max(1, Math.round(clamped.width * image.width));
  const sh = Math.max(1, Math.round(clamped.height * image.height));
  return {
    sx: Math.min(sx, image.width - 1),
    sy: Math.min(sy, image.height - 1),
    sw: Math.min(sw, image.width - sx),
    sh: Math.min(sh, image.height - sy),
  };
};

/** Output pixel size when the crop is exported at a target width (keeps aspect). */
export const outputSizeForWidth = (cropPixels: { sw: number; sh: number }, targetWidth: number): PixelSize => {
  if (cropPixels.sw <= 0 || cropPixels.sh <= 0 || targetWidth <= 0) {
    return { width: 0, height: 0 };
  }
  return {
    width: Math.round(targetWidth),
    height: Math.round((targetWidth * cropPixels.sh) / cropPixels.sw),
  };
};
