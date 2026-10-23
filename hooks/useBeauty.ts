/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { dataURLtoFile } from '../services/geminiService';
import { applyBeauty, type BeautyPreset } from '../services/beautyService';

export const useBeauty = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t, setSources
}) => {
  const handleApplyBeauty = useCallback(async (preset: BeautyPreset, intensity: number, customRequest?: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    if (preset === 'custom' && !customRequest?.trim()) { setUiState(s => ({ ...s, error: t('errorEnterDescription') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingBeauty'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageUrl = await applyBeauty(await getCommittedImage(), preset, intensity, customRequest);
        await addImageToHistory(dataURLtoFile(imageUrl, `beauty-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return { handleApplyBeauty };
};
