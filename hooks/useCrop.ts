/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { dataURLtoFile, generateAdjustedImage } from '../services/geminiService';

const CROP_ENHANCE_PROMPT =
  'Enhance this cropped photo to professional quality: remove noise and blur, ' +
  'restore fine detail, correct exposure and color balance, keep the framing ' +
  'and content exactly as they are. Photorealistic result.';

export const useCrop = ({
  currentImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t, setSources
}) => {
  const handleApplyCrop = useCallback(async (dataUrl: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    // Cropping itself happened client-side in the panel (canvas); this just
    // commits the result to history like any other edit.
    resultsManager.clearAllResults();
    setSources([]);
    try {
        await addImageToHistory(dataURLtoFile(dataUrl, `crop-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, isMobile, resultsManager, setPendingAction, setSources]);

  const handleApplyCropAndEnhance = useCallback(async (dataUrl: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingCrop'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const croppedFile = dataURLtoFile(dataUrl, `crop-${Date.now()}.png`);
        const { imageUrl } = await generateAdjustedImage(croppedFile, CROP_ENHANCE_PROMPT);
        await addImageToHistory(dataURLtoFile(imageUrl, `crop-enhanced-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return { handleApplyCrop, handleApplyCropAndEnhance };
};
