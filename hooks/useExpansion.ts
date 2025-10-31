/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Added 'React' to the import statement to resolve errors with event types.
import React, { useState, useCallback, useEffect } from 'react';
import { generateExpandedImage, dataURLtoFile } from '../services/geminiService';
import type { ExpansionHandle } from '../types';

export const useExpansion = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, 
  imageDimensions, getRelativeCoords, t, imgRef, setSources
}) => {
  const [expandState, setExpandState] = useState({
    prompt: '',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    activeAspect: null as number | null
  });
  const [expansionDrag, setExpansionDrag] = useState<{ handle: ExpansionHandle; startCoords: { x: number; y: number; }; initialPadding: typeof expandState.padding; } | null>(null);

  const { padding: expandPadding, prompt: expandPrompt, activeAspect: expandActiveAspect } = expandState;
  const hasExpansion = Object.values(expandPadding).some(p => (p as number) > 0);

  const setExpansionByAspect = useCallback((aspect: number | null) => {
    if (aspect === null) {
      setExpandState(s => ({ ...s, padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null }));
      return;
    }

    if (!imgRef.current || !imageDimensions) {
      console.warn("setExpansionByAspect called before imageDimensions were ready.");
      return; 
    }
    
    const { width: w, height: h } = imageDimensions;
    const currentAspect = w / h;
    let newWidth = w, newHeight = h;
    if (aspect > currentAspect) {
      newWidth = h * aspect;
    } else {
      newHeight = w / aspect;
    }
    const padX = Math.max(0, Math.round((newWidth - w) / 2));
    const padY = Math.max(0, Math.round((newHeight - h) / 2));

    setExpandState(s => ({
      ...s,
      padding: { top: padY, bottom: padY, left: padX, right: padX },
      activeAspect: aspect
    }));
  }, [imageDimensions, imgRef]);

  const handleGenerateExpandedImage = useCallback(async (prompt: string) => {
    if (!currentImage || !hasExpansion) return;
    setUiState({ isLoading: true, loadingMessage: t('loadingExpansion'), error: null });
    resultsManager.clearAllResults();
    setSources([]);
    try {
        const imageToProcess = await getCommittedImage();
        const imageToProcessUrl = URL.createObjectURL(imageToProcess);
        const tempImg = new Image(); tempImg.src = imageToProcessUrl; await tempImg.decode();
        URL.revokeObjectURL(imageToProcessUrl);
        const { naturalWidth, naturalHeight } = tempImg;
        const totalWidth = naturalWidth + expandPadding.left + expandPadding.right;
        const totalHeight = naturalHeight + expandPadding.top + expandPadding.bottom;
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth; canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context for expansion.");
        ctx.drawImage(tempImg, expandPadding.left, expandPadding.top, naturalWidth, naturalHeight);
        const finalPrompt = prompt;
        const { imageUrl, sources } = await generateExpandedImage(canvas.toDataURL('image/png'), finalPrompt);
        setSources(sources);
        await addImageToHistory(dataURLtoFile(imageUrl, `expanded-${Date.now()}.png`));
        setExpandState({ prompt: '', padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null });
        if (isMobile) {
            setPendingAction({ action: 'openViewerForNewItem' });
        } else {
            onEditComplete();
        }
    } catch (err) { handleApiError(err, 'errorFailedToExpandImage'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
    }
  }, [currentImage, addImageToHistory, expandPadding, hasExpansion, t, handleApiError, onEditComplete, getCommittedImage, isMobile, setUiState, resultsManager, setPendingAction, setSources]);

  const handleExpansionDragStart = (e: React.MouseEvent | React.TouchEvent, handle: ExpansionHandle) => {
    e.preventDefault();
    e.stopPropagation();
    const startCoords = getRelativeCoords(e as any);
    if (!startCoords) return;

    setExpansionDrag({ handle, startCoords, initialPadding: expandState.padding });
  };

  const handleExpansionDragMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!expansionDrag) return;
      const currentCoords = getRelativeCoords(e as any);
      if (!currentCoords) return;

      const { startCoords, initialPadding, handle } = expansionDrag;
      const deltaX = currentCoords.x - startCoords.x;
      const deltaY = currentCoords.y - startCoords.y;
      const newPadding = { ...initialPadding };

      if (handle.includes('top')) newPadding.top = Math.max(0, initialPadding.top - deltaY);
      if (handle.includes('bottom')) newPadding.bottom = Math.max(0, initialPadding.bottom + deltaY);
      if (handle.includes('left')) newPadding.left = Math.max(0, initialPadding.left - deltaX);
      if (handle.includes('right')) newPadding.right = Math.max(0, initialPadding.right + deltaX);

      setExpandState(s => ({ ...s, padding: newPadding, activeAspect: null }));
  }, [expansionDrag, getRelativeCoords]);
  
  const handleExpansionDragEnd = useCallback(() => {
      setExpansionDrag(null);
  }, []);

  useEffect(() => {
    if (!currentImage) {
      setExpandState({ prompt: '', padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null });
    }
  }, [currentImage]);

  // Global listeners for expansion drag
  useEffect(() => {
    const moveHandler = (e: MouseEvent | TouchEvent) => expansionDrag && handleExpansionDragMove(e);
    const endHandler = () => expansionDrag && handleExpansionDragEnd();

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchend', endHandler);

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('mouseup', endHandler);
      window.removeEventListener('touchend', endHandler);
    };
  }, [expansionDrag, handleExpansionDragMove, handleExpansionDragEnd]);

  return {
    expandState,
    setExpandState,
    expandPrompt,
    expandPadding,
    expandActiveAspect,
    hasExpansion,
    handleGenerateExpandedImage,
    setExpansionByAspect,
    handleExpansionDragStart,
  };
};