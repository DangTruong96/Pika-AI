/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// From useHistory
export type TransformState = {
  rotate: number;
  scaleX: 1 | -1;
  scaleY: 1 | -1;
};
export const initialTransformState: TransformState = { rotate: 0, scaleX: 1, scaleY: 1 };

export type HistoryItem = {
  file: File;
  url: string;
  thumbnailUrl: string;
  transform: TransformState;
};

// From usePika
export type Tab = 'retouch' | 'idphoto' | 'adjust' | 'expand' | 'studio' | 'generate';
export type TransformType = 'rotate-cw' | 'rotate-ccw' | 'flip-h' | 'flip-v';
export type ExpansionHandle = 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'br' | 'bl';
export type Gender = 'male' | 'female';

// From RetouchPanel
export type SelectionMode = 'point' | 'brush' | 'extract';
export type BrushMode = 'draw' | 'erase';

// From GeneratePanel
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// From FullScreenViewerModal / usePika
export type FullscreenViewerState = {
  isOpen: boolean;
  items: Array<{ url: string; transform: TransformState; }>;
  initialIndex: number;
  type: 'history' | 'result' | 'extract';
  comparisonUrl: string | null;
  context?: {
    extractSetIndex?: number;
    isNewSession?: boolean;
  }
};
