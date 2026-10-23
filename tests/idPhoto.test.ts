import { describe, it, expect } from 'vitest';
import {
  ID_PHOTO_SIZES,
  getIdPhotoSizeSpec,
  idPhotoAspectRatio,
  idPhotoPixels,
  type IdPhotoSizeId,
} from '../utils/idPhoto';

const ALL_SIZES = Object.keys(ID_PHOTO_SIZES) as IdPhotoSizeId[];

describe('ID photo size specs', () => {
  it('covers exactly the eight sizes the UI offers', () => {
    expect(ALL_SIZES.sort()).toEqual(
      ['2x2', '2x3', '2.4x3', '3.5x4.5', '3x4', '4x5', '4x6', '5x5'].sort(),
    );
  });

  it('every declared ratio string matches the physical dimensions', () => {
    for (const size of ALL_SIZES) {
      const s = getIdPhotoSizeSpec(size);
      const [rw, rh] = s.ratio.split(':').map(Number);
      expect(Math.abs(s.widthMm / s.heightMm - rw / rh)).toBeLessThan(0.01);
      expect(idPhotoAspectRatio(size)).toBeCloseTo(rw / rh, 2);
    }
  });

  it('keeps the legacy prompt descriptions for known sizes', () => {
    expect(getIdPhotoSizeSpec('3x4').descriptionVi).toContain('3x4 cm');
    expect(getIdPhotoSizeSpec('2x2').descriptionVi).toContain('2x2 inch');
    expect(getIdPhotoSizeSpec('3.5x4.5').descriptionVi).toContain('hộ chiếu');
  });

  it('computes print pixels at 300 DPI', () => {
    // 30mm x 40mm at 300dpi -> 354 x 472 px
    expect(idPhotoPixels('3x4', 300)).toEqual({ width: 354, height: 472 });
    // 2in x 2in at 300dpi -> 600 x 600 px
    expect(idPhotoPixels('2x2', 300)).toEqual({ width: 600, height: 600 });
  });

  it('portrait sizes are taller than they are wide', () => {
    for (const size of ['3x4', '4x6', '3.5x4.5', '2x3', '2.4x3', '4x5'] as IdPhotoSizeId[]) {
      const s = getIdPhotoSizeSpec(size);
      expect(s.heightMm).toBeGreaterThan(s.widthMm);
    }
  });
});
