/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Added 'React' to the import statement to resolve errors with event types.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateEditedImageWithMask, generateExtractedItem, dataURLtoFile } from '../services/geminiService';
import type { SelectionMode, BrushMode } from '../types';

export const useRetouch = ({
  currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
  handleApiError, onEditComplete, isMobile, resultsManager, t,
  activeTab, getRelativeCoords, maskCanvasRef, imgRef, imageViewerRef,
  setToolboxState, handleUseExtractedAsOutfit: handleUseExtractedAsOutfitProp,
  openFullScreenViewer
}) => {
  const [retouchState, setRetouchState] = useState({ 
    prompt: '', 
    selectionMode: 'point' as SelectionMode, 
    editHotspot: null as { x: number, y: number } | null, 
    brushMode: 'draw' as BrushMode, 
    brushSize: 30 
  });
  const [extractState, setExtractState] = useState({
    prompt: '',
    history: [] as File[][]
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [hotspotDisplayPosition, setHotspotDisplayPosition] = useState<{ left: number, top: number } | null>(null);
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);
  const retouchPromptInputRef = useRef<HTMLTextAreaElement>(null);
  const [mobileInputKey, setMobileInputKey] = useState(Date.now());

  const { prompt: retouchPrompt, selectionMode, editHotspot, brushMode, brushSize } = retouchState;
  const { prompt: extractPrompt, history: extractHistory } = extractState;

  const clearMask = useCallback(() => {
    const ctx = maskCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
  }, [maskCanvasRef]);

  const isMaskPresent = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) return true;
    }
    return false;
  }, [maskCanvasRef]);

  const handleSelectionModeChange = useCallback((newMode: SelectionMode) => {
    setRetouchState(s => ({ ...s, selectionMode: newMode, editHotspot: newMode === 'point' ? s.editHotspot : null }));
    if (newMode !== 'brush') clearMask();
  }, [clearMask]);
  
  const handleGenerate = async (promptOverride?: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    const finalPromptToUse = promptOverride || retouchPrompt;
    if (!finalPromptToUse.trim()) { setUiState(s => ({ ...s, error: t('errorEnterDescription') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingRetouch'), error: null });
    resultsManager.clearAllResults();
    try {
        const imageToProcess = await getCommittedImage();
        let finalMaskUrl: string | undefined;
        if (selectionMode === 'brush' && isMaskPresent()) finalMaskUrl = maskCanvasRef.current!.toDataURL('image/png');
        else if (selectionMode === 'point' && !!editHotspot) {
            const pointCanvas = document.createElement('canvas');
            const img = imgRef.current;
            if (!img || !img.naturalWidth) throw new Error("Image not loaded");
            pointCanvas.width = img.naturalWidth; pointCanvas.height = img.naturalHeight;
            const ctx = pointCanvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context for point mask");
            const pointRadius = Math.max(15, Math.min(pointCanvas.width, pointCanvas.height) * 0.025);
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(editHotspot.x, editHotspot.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
            finalMaskUrl = pointCanvas.toDataURL('image/png');
        }
        const imageUrl = await generateEditedImageWithMask(imageToProcess, finalPromptToUse, finalMaskUrl);
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

  const drawOnCanvas = useCallback((point: { x: number; y: number }) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushMode === 'draw' ? '#FF00FF' : 'black';
    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    
    if (lastDrawPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    } else {
        ctx.fillStyle = brushMode === 'draw' ? '#FF00FF' : 'black';
        ctx.beginPath();
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    lastDrawPointRef.current = point;
  }, [brushMode, brushSize, maskCanvasRef]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'start' | 'move' | 'end') => {
    if (activeTab !== 'retouch' || selectionMode !== 'brush') return;
    e.preventDefault();
    e.stopPropagation();
    
    const point = getRelativeCoords(e);
    
    if (!point) {
        setMousePosition(null);
        if (isDrawing) {
            setIsDrawing(false);
            lastDrawPointRef.current = null;
        }
        return;
    }

    const pointer = 'touches' in e ? e.touches[0] : e;
    if (pointer && imageViewerRef.current) {
        const viewerRect = imageViewerRef.current.getBoundingClientRect();
        setMousePosition({
            x: pointer.clientX - viewerRect.left,
            y: pointer.clientY - viewerRect.top,
        });
    }

    if (type === 'start') {
        setIsDrawing(true);
        lastDrawPointRef.current = null;
        drawOnCanvas(point);
    } else if (type === 'move') {
        if (!isDrawing) return;
        drawOnCanvas(point);
    } else if (type === 'end') {
        setIsDrawing(false);
        lastDrawPointRef.current = null;
    }
  };

  const handleViewerClick = (e: React.MouseEvent) => {
    if (activeTab === 'retouch' && selectionMode === 'point') {
        const coords = getRelativeCoords(e as any);
        if (coords) {
            setRetouchState(s => ({...s, editHotspot: coords }));
            setMobileInputKey(Date.now());
        }
    }
  };

  useEffect(() => {
    if (!currentImage) {
      setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
      setExtractState({ prompt: '', history: [] });
      clearMask();
    }
  }, [currentImage, clearMask]);

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
    retouchPrompt, selectionMode, editHotspot, brushMode, brushSize,
    extractPrompt, extractHistory, extractedHistoryItemUrls,
    isDrawing, mousePosition, hotspotDisplayPosition,
    retouchPromptInputRef, mobileInputKey,
    handleGenerate, handleGenerateExtract, handleSelectionModeChange,
    clearMask, isMaskPresent,
    setMousePosition,
    handleCanvasInteraction,
    handleViewerClick,
    handleClearExtractHistory, handleUseExtractedAsOutfit, handleViewExtractedItem,
  }
};