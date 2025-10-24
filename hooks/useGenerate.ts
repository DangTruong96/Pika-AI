/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import { generateImageFromText, dataURLtoFile } from '../services/geminiService';
import type { AspectRatio } from '../types';
import { initialTransformState } from '../types';

export const useGenerate = ({
  setUiState, handleApiError, handleImageUpload, t, isMobile, openFullScreenViewer,
  resultsManager, setIsHistoryExpanded, historyIndex
}) => {
  const [generateState, setGenerateState] = useState({
    prompt: '',
    aspectRatio: '1:1' as AspectRatio,
    numImages: 1,
  });

  const { prompt: generatePrompt, aspectRatio: generateAspectRatio, numImages: generateNumImages } = generateState;
  
  const handleGenerateImageFromText = useCallback(async () => {
    if (!generatePrompt.trim()) {
      setUiState(s => ({ ...s, error: t('errorEnterDescription') }));
      return;
    }
    setUiState({ isLoading: true, loadingMessage: t('loadingGenerate'), error: null });
    try {
      const imageUrls = await generateImageFromText(generatePrompt, generateNumImages, generateAspectRatio);
      if (imageUrls.length > 0) {
        if (isMobile) {
            resultsManager.setResultsState({
                items: imageUrls,
                isGenerating: false,
                expectedCount: imageUrls.length,
                sourceTab: 'generate',
                persistentItems: imageUrls,
                baseHistoryIndex: historyIndex,
            });
            openFullScreenViewer(
                imageUrls.map(url => ({ url, transform: initialTransformState })),
                0,
                'result',
                { isNewSession: true }
            );
        } else {
            const newFile = dataURLtoFile(imageUrls[0], `generated-${Date.now()}.png`);
            await handleImageUpload(newFile);
            if (imageUrls.length > 1) {
              resultsManager.setResultsState({
                items: imageUrls,
                isGenerating: false,
                expectedCount: imageUrls.length,
                sourceTab: 'generate',
                persistentItems: imageUrls,
                baseHistoryIndex: 0,
              });
              setIsHistoryExpanded(true);
            }
        }
      } else {
        throw new Error(t('errorAllGenerationsFailed'));
      }
    } catch (err) {
      handleApiError(err, 'errorFailedToGenerateImage');
    } finally {
      setUiState(s => ({ ...s, isLoading: false }));
    }
  }, [generatePrompt, generateNumImages, generateAspectRatio, handleImageUpload, handleApiError, t, isMobile, openFullScreenViewer, historyIndex, setUiState, resultsManager, setIsHistoryExpanded]);

  return {
    generateState,
    setGenerateState,
    generatePrompt,
    generateAspectRatio,
    generateNumImages,
    handleGenerateImageFromText,
  };
};
