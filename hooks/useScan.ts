/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { dataURLtoFile } from '../services/geminiService';
import { processScan, type ScanMode } from '../services/scanService';

export const useScan = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t, setSources
}) => {
  const handleApplyScan = useCallback(async (mode: ScanMode) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingScan'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageUrl = await processScan(await getCommittedImage(), mode);
        await addImageToHistory(dataURLtoFile(imageUrl, `scan-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return { handleApplyScan };
};
