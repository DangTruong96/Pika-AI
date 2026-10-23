/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { dataURLtoFile } from '../services/geminiService';
import { swapFace } from '../services/faceSwapService';

export const useFaceSwap = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t, setSources
}) => {
  const handleApplyFaceSwap = useCallback(async (faceFile: File) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    if (!faceFile) { setUiState(s => ({ ...s, error: t('faceSwapNeedFace') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingFaceSwap'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageUrl = await swapFace(await getCommittedImage(), faceFile);
        await addImageToHistory(dataURLtoFile(imageUrl, `faceswap-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return { handleApplyFaceSwap };
};
