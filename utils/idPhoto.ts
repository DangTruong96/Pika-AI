/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure ID-photo size specifications, shared by the Gemini service (prompt
 * building) and the UI. Extracted from services/geminiService.ts so the
 * size math can be unit tested.
 */

export type IdPhotoSizeId = '3x4' | '4x6' | '2x2' | '3.5x4.5' | '5x5' | '2x3' | '2.4x3' | '4x5';

export interface IdPhotoSizeSpec {
  id: IdPhotoSizeId;
  /** Physical width in millimetres. */
  widthMm: number;
  /** Physical height in millimetres. */
  heightMm: number;
  /** Width / height as a reduced ratio, e.g. "3:4". */
  ratio: string;
  /** Vietnamese description sent to the model, matching the legacy sizeMap. */
  descriptionVi: string;
}

const MM_PER_INCH = 25.4;

const spec = (
  id: IdPhotoSizeId,
  widthMm: number,
  heightMm: number,
  ratio: string,
  descriptionVi: string,
): IdPhotoSizeSpec => ({ id, widthMm, heightMm, ratio, descriptionVi });

export const ID_PHOTO_SIZES: Record<IdPhotoSizeId, IdPhotoSizeSpec> = {
  '3x4': spec('3x4', 30, 40, '3:4', '3x4 cm (tỷ lệ 3:4, chiều dọc)'),
  '4x6': spec('4x6', 40, 60, '2:3', '4x6 cm (tỷ lệ 2:3, chiều dọc)'),
  '2x2': spec('2x2', 2 * MM_PER_INCH, 2 * MM_PER_INCH, '1:1', '2x2 inch (tỷ lệ 1:1, hình vuông)'),
  '3.5x4.5': spec('3.5x4.5', 35, 45, '7:9', '3.5x4.5 cm (tỷ lệ 7:9, chiều dọc, cỡ hộ chiếu tiêu chuẩn)'),
  '5x5': spec('5x5', 50, 50, '1:1', '5x5 cm (tỷ lệ 1:1, hình vuông)'),
  '2x3': spec('2x3', 20, 30, '2:3', '2x3 cm (tỷ lệ 2:3, chiều dọc)'),
  '2.4x3': spec('2.4x3', 24, 30, '4:5', '2.4x3 cm (tỷ lệ 4:5, chiều dọc)'),
  '4x5': spec('4x5', 40, 50, '4:5', '4x5 cm (tỷ lệ 4:5, chiều dọc)'),
};

export const getIdPhotoSizeSpec = (size: IdPhotoSizeId): IdPhotoSizeSpec => ID_PHOTO_SIZES[size];

/** Aspect ratio (width / height) as a number, derived from the physical size. */
export const idPhotoAspectRatio = (size: IdPhotoSizeId): number => {
  const s = ID_PHOTO_SIZES[size];
  return s.widthMm / s.heightMm;
};

/** Pixel dimensions for printing a size at the given DPI (rounded). */
export const idPhotoPixels = (size: IdPhotoSizeId, dpi = 300): { width: number; height: number } => {
  const s = ID_PHOTO_SIZES[size];
  return {
    width: Math.round((s.widthMm / MM_PER_INCH) * dpi),
    height: Math.round((s.heightMm / MM_PER_INCH) * dpi),
  };
};
