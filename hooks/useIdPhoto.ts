/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import { generateIdPhoto, dataURLtoFile, type IdPhotoOptions } from '../services/geminiService';
import type { Gender } from '../types';

export const useIdPhoto = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t
}) => {
  const [idPhotoGender, setIdPhotoGender] = useState<Gender>('female');

  const handleGenerateIdPhoto = useCallback(async (options: IdPhotoOptions) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingIdPhoto'), error: null });
    resultsManager.clearAllResults();
    try {
        const imageUrl = await generateIdPhoto(await getCommittedImage(), options);
        await addImageToHistory(dataURLtoFile(imageUrl, `idphoto-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction]);

  return {
    idPhotoGender,
    setIdPhotoGender,
    handleGenerateIdPhoto,
  };
};
