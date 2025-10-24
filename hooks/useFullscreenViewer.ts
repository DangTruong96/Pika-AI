/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import type { FullscreenViewerState, HistoryItem, TransformState } from '../types';
import { useResults } from './useResults';

interface FullscreenViewerDependencies {
  history: HistoryItem[];
  resultsState: ReturnType<typeof useResults>['resultsState'];
  historyIndex: number;
}

export const useFullscreenViewer = ({ history, resultsState, historyIndex }: FullscreenViewerDependencies) => {
  const [fullscreenViewerState, setFullscreenViewerState] = useState<FullscreenViewerState>({
    isOpen: false,
    items: [],
    initialIndex: 0,
    type: 'history',
    comparisonUrl: null,
    context: {},
  });

  const openFullScreenViewer = useCallback((items: Array<{ url: string; transform: TransformState; }>, index: number, type: FullscreenViewerState['type'], context: FullscreenViewerState['context'] = {}) => {
      const historyItemUrls = history.map(item => item.url);
      let compareUrl: string | null = null;

      if (type === 'history') {
          const originalUrl = historyItemUrls[0] ?? null;
          if (index > 0) {
              compareUrl = originalUrl;
          }
      } else if (type === 'result') {
          const baseIndex = resultsState.baseHistoryIndex ?? historyIndex;
          compareUrl = historyItemUrls[baseIndex] ?? null;
      }

      setFullscreenViewerState({
          isOpen: true,
          items,
          initialIndex: index,
          type,
          comparisonUrl: compareUrl,
          context
      });
  }, [history, historyIndex, resultsState.baseHistoryIndex]);

  const { isOpen: isViewerOpen, items: viewerItems, initialIndex: viewerInitialIndex, type: viewerType, comparisonUrl: viewerComparisonUrl } = fullscreenViewerState;

  return {
    fullscreenViewerState,
    setFullscreenViewerState,
    openFullScreenViewer,
    isViewerOpen, 
    viewerItems, 
    viewerInitialIndex, 
    viewerType, 
    viewerComparisonUrl,
  };
};
