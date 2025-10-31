/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Added 'React' to the import statement to resolve errors with event types.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateAdjustedImage, generateExtractedItem, dataURLtoFile } from '../services/geminiService';
import type { SelectionMode } from '../types';

export const useRetouch = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t,
  setToolboxState, handleUseExtractedAsOutfit: handleUseExtractedAsOutfitProp,
  openFullScreenViewer, setSources
}) => {
  const [retouchState, setRetouchState] = useState({ 
    prompt: '', 
    selectionMode: 'retouch' as SelectionMode,
  });
  const [extractState, setExtractState] = useState({
    prompt: '',
    history: [] as File[][]
  });
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);
  const retouchPromptInputRef = useRef<HTMLTextAreaElement>(null);

  const { prompt: retouchPrompt, selectionMode } = retouchState;
  const { prompt: extractPrompt, history: extractHistory } = extractState;

  const handleSelectionModeChange = useCallback((newMode: SelectionMode) => {
    setRetouchState(s => ({ ...s, selectionMode: newMode }));
  }, []);
  
  const handleGenerate = async (promptOverride?: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    const finalPromptToUse = promptOverride || retouchPrompt;
    if (!finalPromptToUse.trim()) { setUiState(s => ({ ...s, error: t('errorEnterDescription') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingRetouch'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageToProcess = await getCommittedImage();
        const { imageUrl, sources } = await generateAdjustedImage(imageToProcess, finalPromptToUse);
        setSources(sources);
        await addImageToHistory(dataURLtoFile(imageUrl, `edited-${Date.now()}.png`));
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  };

  const handleGenerateExtract = useCallback(async () => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    if (!extractPrompt.trim()) { setUiState(s => ({...s, error: t('errorEnterDescription')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingExtract'), error: null });
    try {
        const imageToProcess = await getCommittedImage();
        const refinedPrompt = extractPrompt;
        const extractedUrls = await generateExtractedItem(imageToProcess, refinedPrompt);
        const newFiles = extractedUrls.map((url, i) => dataURLtoFile(url, `extracted-${i}.png`));
        setExtractState({ prompt: '', history: [newFiles, ...extractHistory] });
        onEditComplete();
    } catch(err) { handleApiError(err, 'errorFailedToExtract'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, extractPrompt, t, handleApiError, onEditComplete, getCommittedImage, extractHistory, setUiState]);

  const handleClearExtractHistory = useCallback(() => {
    setExtractState(s => ({ ...s, history: [] }));
    setExtractedHistoryItemUrls([]);
  }, []);

  const handleUseExtractedAsOutfit = useCallback((file: File) => {
    setToolboxState(s => ({...s, activeTab: 'studio'}));
    handleUseExtractedAsOutfitProp(file);
  }, [setToolboxState, handleUseExtractedAsOutfitProp]);

  const handleViewExtractedItem = useCallback((setIndex: number, itemIndex: number) => {
    const itemSetUrls = extractedHistoryItemUrls[setIndex];
    if (!itemSetUrls) return;
    openFullScreenViewer(
        itemSetUrls.map(url => ({ url, transform: { rotate: 0, scaleX: 1, scaleY: 1 } })),
        itemIndex,
        'extract',
        { extractSetIndex: setIndex }
    );
  }, [extractedHistoryItemUrls, openFullScreenViewer]);


  useEffect(() => {
    if (!currentImage) {
      setRetouchState({ prompt: '', selectionMode: 'retouch' });
      setExtractState({ prompt: '', history: [] });
    }
  }, [currentImage]);

  useEffect(() => {
    const newUrls: string[][] = [];
    extractHistory.forEach((fileSet, setIndex) => {
      newUrls[setIndex] = fileSet.map(file => URL.createObjectURL(file));
    });
    setExtractedHistoryItemUrls(newUrls);
    return () => { newUrls.flat().forEach(url => URL.revokeObjectURL(url)); };
  }, [extractHistory]);

  return {
    retouchState, setRetouchState,
    extractState, setExtractState,
    retouchPrompt, selectionMode,
    extractPrompt, extractHistory, extractedHistoryItemUrls,
    retouchPromptInputRef,
    handleGenerate, handleGenerateExtract, handleSelectionModeChange,
    handleClearExtractHistory, handleUseExtractedAsOutfit, handleViewExtractedItem,
  }
};