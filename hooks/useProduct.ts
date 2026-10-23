/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { dataURLtoFile } from '../services/geminiService';
import { processProductImage, type ProductOperation } from '../services/productService';

export const useProduct = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t, setSources
}) => {
  const handleApplyProduct = useCallback(async (operation: ProductOperation) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingProduct'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageUrl = await processProductImage(await getCommittedImage(), operation);
        await addImageToHistory(dataURLtoFile(imageUrl, `product-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); }
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return { handleApplyProduct };
};
