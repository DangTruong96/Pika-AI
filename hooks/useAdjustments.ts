/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback } from 'react';
import { generateAdjustedImage, generateFilteredImage, dataURLtoFile } from '../services/geminiService';
import { initialTransformState } from '../types';

export const useAdjustments = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, 
  openFullScreenViewer, t, historyIndex, activeTab, setToolboxState, setIsHistoryExpanded,
  setSources,
}) => {

  const handleApplyAdjustment = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToAdjust')})); return; }
    const loadingMessage = prompt.includes('Document Scanner Simulation') ? t('loadingScan') : t('loadingAdjustment');
    setUiState({ isLoading: true, loadingMessage, error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
      const { imageUrl, sources } = await generateAdjustedImage(await getCommittedImage(), prompt);
      setSources(sources);
      await addImageToHistory(dataURLtoFile(imageUrl, `adjusted-${Date.now()}.png`));
      if (isMobile) {
        setPendingAction({ action: 'openViewerForNewItem' });
      } else {
        onEditComplete();
      }
    } catch (err) { handleApiError(err, 'errorFailedToApplyAdjustment'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);
  
  const handleApplyMultipleAdjustments = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToAdjust')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingAdjustment'), error: null });
    resultsManager.startGeneratingResults(3, activeTab, historyIndex);
    setIsHistoryExpanded(true);
    setSources([]);
    if (isMobile) setToolboxState(s => ({...s, isOpen: false}));
    
    try {
        const imageToProcess = await getCommittedImage();
        const seeds = [1, 2, 3];
        let completedCount = 0;
        setUiState(s => ({ ...s, loadingMessage: `${t('loadingAdjustment')} (0/3)` }));

        const promises = seeds.map(() => 
            generateAdjustedImage(imageToProcess, prompt)
            .then(({imageUrl}) => {
                completedCount++;
                setUiState(s => ({ ...s, loadingMessage: `${t('loadingAdjustment')} (${completedCount}/3)` }));
                resultsManager.addResult(imageUrl);
                return imageUrl;
            }).catch(err => {
                console.warn(`Generation failed:`, err);
                completedCount++;
                setUiState(s => ({ ...s, loadingMessage: `${t('loadingAdjustment')} (${completedCount}/3)` }));
                return null;
            })
        );
        
        const results = await Promise.all(promises);
        const successfulUrls = results.filter((url): url is string => url !== null);

        if (successfulUrls.length === 0) throw new Error("All adjustment generations failed.");
        
        if (isMobile && successfulUrls.length > 0) {
            openFullScreenViewer(successfulUrls.map(url => ({ url, transform: initialTransformState })), 0, 'result');
        }
    } catch (err) { handleApiError(err, 'errorFailedToApplyAdjustment'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      resultsManager.finishGeneratingResults();
    }
  }, [currentImage, t, handleApiError, historyIndex, activeTab, isMobile, getCommittedImage, openFullScreenViewer, setUiState, resultsManager, setToolboxState, setIsHistoryExpanded, setSources]);

  const handleApplyFilter = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToFilter')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingFilter'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
      const { imageUrl, sources } = await generateFilteredImage(await getCommittedImage(), prompt);
      setSources(sources);
      await addImageToHistory(dataURLtoFile(imageUrl, `filtered-${Date.now()}.png`));
      if (isMobile) {
        setPendingAction({ action: 'openViewerForNewItem' });
      } else {
        onEditComplete();
      }
    } catch (err) { handleApiError(err, 'errorFailedToApplyFilter'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  return {
    handleApplyAdjustment,
    handleApplyMultipleAdjustments,
    handleApplyFilter,
  };
};