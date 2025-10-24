/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { dataURLtoFile, RateLimitError, APIError, NetworkError, InvalidInputError, ContentSafetyError, ModelExecutionError } from '../services/geminiService';
import { useTranslation } from '../contexts/LanguageContext';
import type { TranslationKey } from '../translations';
import { TABS_CONFIG } from '../components/EditorSidebar';
import { useHistory } from './useHistory';
import { useViewer } from './useViewer';
import type { Tab, TransformType, HistoryItem, TransformState } from '../types';
import { initialTransformState } from '../types';

import { useResults } from './useResults';
import { useFullscreenViewer } from './useFullscreenViewer';
import { useRetouch } from './useRetouch';
import { useExpansion } from './useExpansion';
import { useStudio } from './useStudio';
import { useGenerate } from './useGenerate';
import { useIdPhoto } from './useIdPhoto';
import { useAdjustments } from './useAdjustments';


const createThumbnail = async (file: File): Promise<string> => {
    const MAX_SIZE = 128;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    URL.revokeObjectURL(url);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file.name;
    const aspect = img.naturalWidth / img.naturalHeight;
    let width, height;
    if (aspect > 1) { width = MAX_SIZE; height = MAX_SIZE / aspect; } 
    else { height = MAX_SIZE; width = MAX_SIZE * aspect; }
    canvas.width = width; canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.8);
};


export const usePika = () => {
  const { t } = useTranslation();
  
  // --- CORE HOOKS ---
  const historyManager = useHistory();
  const { history, historyIndex, currentHistoryItem, canUndo, canRedo, historyDispatch } = historyManager;
  const resultsManager = useResults();
  const { resultsState, setResultsState, clearAllResults, restoreResults } = resultsManager;
  
  // --- UI & APP STATE ---
  const [uiState, setUiState] = useState({ isLoading: false, loadingMessage: '', error: null as string | null });
  const [toolboxState, setToolboxState] = useState({ activeTab: 'retouch' as Tab, isOpen: true });
  // FIX: Define toggleToolbox to resolve its usage in the hook's return value and props.
  const toggleToolbox = useCallback(() => setToolboxState(s => ({ ...s, isOpen: !s.isOpen })), []);
  const [comparisonState, setComparisonState] = useState({ isComparing: false });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [pendingAction, setPendingAction] = useState<{ action: 'openViewerForNewItem' } | null>(null);
  const [isZoomControlsVisible, setIsZoomControlsVisible] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [downloadCounter, setDownloadCounter] = useState(1);

  // --- REFS ---
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const initialWindowHeightRef = useRef(window.innerHeight);
  const swipeStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);

  // --- DERIVED STATE & HELPERS ---
  const isMobile = useMemo(() => windowSize.width < 1024, [windowSize.width]);
  const isLandscape = useMemo(() => isMobile && windowSize.width > windowSize.height, [isMobile, windowSize.width, windowSize.height]);
  const isKeyboardOpen = isMobile && windowSize.height < initialWindowHeightRef.current * 0.9;
  const currentImage = useMemo(() => currentHistoryItem?.file ?? null, [currentHistoryItem]);
  const currentImageUrl = useMemo(() => currentHistoryItem?.url ?? null, [currentHistoryItem]);
  const currentThumbnailUrl = useMemo(() => currentHistoryItem?.thumbnailUrl ?? null, [currentHistoryItem]);
  const currentTransform = useMemo(() => currentHistoryItem?.transform ?? initialTransformState, [currentHistoryItem]);
  const transformString = useMemo(() => `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scaleX}, ${currentTransform.scaleY})`, [currentTransform]);
  const beforeImageUrl = useMemo(() => history[0]?.url ?? null, [history]);
  const beforeImageThumbnailUrl = useMemo(() => history[0]?.thumbnailUrl ?? null, [history]);

  // --- DEPENDENT HOOKS ---
  const showControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
    setIsZoomControlsVisible(true);
    hideControlsTimeoutRef.current = window.setTimeout(() => setIsZoomControlsVisible(false), 3000);
  }, []);

  const viewerManager = useViewer({ 
    isComparing: comparisonState.isComparing, isMobile, isImageLoaded: !!currentImage,
    isToolboxOpen: toolboxState.isOpen, toggleToolbox,
    windowHeight: windowSize.height, showControls,
  });
  
  const fullscreenViewerManager = useFullscreenViewer({ history, resultsState, historyIndex });
  
  // FIX: Moved `handleImageUpload` before its usage in `useGenerate` to fix a block-scoped variable error.
  const handleImageUpload = useCallback(async (file: File) => {
    setUiState(s => ({ ...s, error: null }));
    historyDispatch({ type: 'RESET_ALL' }); 
    clearAllResults();
    setComparisonState({ isComparing: false });
    const thumbnailUrl = await createThumbnail(file);
    const newItem: HistoryItem = { file, url: URL.createObjectURL(file), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });
  }, [clearAllResults, historyDispatch]);

  // --- SHARED HANDLERS & HELPERS (to be passed to feature hooks) ---

  const onEditComplete = useCallback(() => {
    if (isMobile) setToolboxState(s => ({ ...s, isOpen: false }));
  }, [isMobile]);

  const addImageToHistory = useCallback(async (newImageFile: File) => {
    const thumbnailUrl = await createThumbnail(newImageFile);
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem }});
    clearAllResults();
  }, [historyDispatch, clearAllResults]);

  const getCommittedImage = useCallback(async (): Promise<File> => {
    if (!currentHistoryItem) throw new Error("No image in history to process.");
    const { file, url, transform } = currentHistoryItem;
    if (transform.rotate === 0 && transform.scaleX === 1 && transform.scaleY === 1) return file;
    const img = new Image(); img.src = url; await img.decode();
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context for committing transform');
    const { naturalWidth: w, naturalHeight: h } = img;
    const rad = transform.rotate * Math.PI / 180;
    canvas.width = (transform.rotate === 90 || transform.rotate === 270) ? h : w;
    canvas.height = (transform.rotate === 90 || transform.rotate === 270) ? w : h;
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rad); ctx.scale(transform.scaleX, transform.scaleY);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type, 0.95));
    if (!blob) throw new Error('Failed to create blob from canvas');
    return new File([blob], `committed-${Date.now()}.png`, { type: blob.type });
  }, [currentHistoryItem]);

  const handleApiError = useCallback((err: unknown, contextKey: TranslationKey) => {
    let errorMessage: string;
    if (err instanceof NetworkError) errorMessage = t('errorNetwork');
    else if (err instanceof InvalidInputError) errorMessage = t('errorInvalidInput');
    else if (err instanceof ContentSafetyError) errorMessage = t('errorContentSafety');
    else if (err instanceof ModelExecutionError) errorMessage = t('errorModelExecution');
    else if (err instanceof RateLimitError) {
        errorMessage = (err.message && err.message !== 'Rate limit exceeded after retries.') 
            ? err.message : t('errorRateLimit');
    }
    else if (err instanceof APIError) errorMessage = `${t(contextKey)}. ${t('errorAPI')}`;
    else if (err instanceof Error) {
      if (err.message.includes("All composite image generations failed") || err.message.includes("All photoshoot image generations failed") || err.message.includes("All adjustment generations failed")) {
        errorMessage = t('errorAllGenerationsFailed');
      } else { errorMessage = `${t(contextKey)}: ${err.message}`; }
    } else errorMessage = `${t(contextKey)}: ${t('errorAnErrorOccurred')}.`;
    console.error("Error handled in usePika:", errorMessage, err);
    setUiState(s => ({ ...s, error: errorMessage }));
  }, [t]);

  const getRelativeCoords = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.complete) return null;
    const pointer = ('touches' in e && e.touches.length > 0) ? e.touches[0] : ('changedTouches' in e && e.changedTouches.length > 0) ? e.changedTouches[0] : ('clientX' in e ? e : null);
    if (!pointer) return null;
    const { rotate, scaleX, scaleY } = currentTransform;
    const isSideways = rotate === 90 || rotate === 270;
    const rotatedNaturalW = isSideways ? img.naturalHeight : img.naturalWidth;
    const rotatedNaturalH = isSideways ? img.naturalWidth : img.naturalHeight;
    if (rotatedNaturalW === 0 || rotatedNaturalH === 0) return null;
    const imgRect = img.getBoundingClientRect();
    const naturalRatio = rotatedNaturalW / rotatedNaturalH;
    const rectRatio = imgRect.width / imgRect.height;
    let renderedWidth, renderedHeight, renderedX, renderedY;
    if (naturalRatio > rectRatio) {
        renderedWidth = imgRect.width; renderedHeight = imgRect.width / naturalRatio;
        renderedX = imgRect.left; renderedY = imgRect.top + (imgRect.height - renderedHeight) / 2;
    } else {
        renderedHeight = imgRect.height; renderedWidth = imgRect.height * naturalRatio;
        renderedY = imgRect.top; renderedX = imgRect.left + (imgRect.width - renderedWidth) / 2;
    }

    const xOnImage = pointer.clientX - renderedX; const yOnImage = pointer.clientY - renderedY;
    let normX = xOnImage / renderedWidth; let normY = yOnImage / renderedHeight;
    if (scaleX === -1) normX = 1 - normX; if (scaleY === -1) normY = 1 - normY;
    const tempX = normX;
    switch (rotate) {
        case 90: normX = normY; normY = 1 - tempX; break;
        case 180: normX = 1 - normX; normY = 1 - normY; break;
        case 270: normX = 1 - normY; normY = tempX; break;
    }
    return { x: normX * img.naturalWidth, y: normY * img.naturalHeight };
  }, [currentTransform]);

  // --- INSTANTIATE FEATURE HOOKS ---
  const sharedDeps = {
    t, currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction, handleApiError, onEditComplete,
    isMobile, resultsManager, openFullScreenViewer: fullscreenViewerManager.openFullScreenViewer, historyIndex, 
    activeTab: toolboxState.activeTab, setToolboxState, setIsHistoryExpanded, getRelativeCoords, imgRef, imageViewerRef,
    maskCanvasRef,
    // FIX: Add `imageDimensions` to the shared dependencies object for `useExpansion`.
    imageDimensions,
  };

  const studioHook = useStudio(sharedDeps);
  const retouchHook = useRetouch({ ...sharedDeps, handleUseExtractedAsOutfit: (file) => studioHook.setStudioState(s => ({ ...s, outfitFiles: [file] })) });
  const expansionHook = useExpansion(sharedDeps);
  const generateHook = useGenerate({ ...sharedDeps, handleImageUpload });
  const idPhotoHook = useIdPhoto(sharedDeps);
  const adjustmentsHook = useAdjustments(sharedDeps);

  // --- TOP-LEVEL HANDLERS ---
  const handleTabChange = useCallback((newTab: Tab) => {
    if (toolboxState.activeTab === 'retouch' && newTab !== 'retouch') {
        retouchHook.clearMask();
        retouchHook.setRetouchState(s => ({...s, editHotspot: null}));
    }
    setToolboxState(s => ({ ...s, activeTab: newTab }));
    showControls();
  }, [toolboxState.activeTab, retouchHook, showControls]);

  const handleTabChangeAndOpen = useCallback((newTab: Tab) => setToolboxState(s => ({ ...s, activeTab: newTab, isOpen: true })), []);
  
  const handleFileSelect = (files: FileList | null) => { if (files && files[0]) handleImageUpload(files[0]); };

  const handleStartOver = useCallback(() => {
    historyDispatch({ type: 'RESET_ALL' });
    setUiState(s => ({ ...s, error: null }));
    clearAllResults();
    setComparisonState({ isComparing: false });
  }, [clearAllResults, historyDispatch]);

  const handleSelectFromResult = useCallback(async (imageUrl: string) => {
    const newImageFile = dataURLtoFile(imageUrl, `result-${Date.now()}.png`);
    if (history.length === 0 || historyIndex === -1) {
        await handleImageUpload(newImageFile);
        return;
    }
    const baseIndex = resultsState.baseHistoryIndex !== null ? resultsState.baseHistoryIndex : historyIndex;
    const thumbnailUrl = await createThumbnail(newImageFile);
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'SET_FROM_RESULT', payload: { baseIndex, item: newItem } });
    retouchHook.clearMask();
    retouchHook.setRetouchState(s => ({ ...s, editHotspot: null, prompt: '' }));
  }, [history.length, historyIndex, resultsState.baseHistoryIndex, handleImageUpload, historyDispatch, retouchHook]);

  const handleSelectFromViewer = useCallback((url: string, index: number) => {
    const { type, context } = fullscreenViewerManager.fullscreenViewerState;
    if (type === 'result' && context?.isNewSession) {
        const newFile = dataURLtoFile(url, `generated-${Date.now()}.png`);
        handleImageUpload(newFile);
    } else if (type === 'history') {
        historyDispatch({ type: 'SELECT', payload: { index }});
    } else if (type === 'extract') {
        const setIndex = context?.extractSetIndex;
        if (setIndex !== undefined) {
            const file = retouchHook.extractHistory[setIndex]?.[index];
            if (file) retouchHook.handleUseExtractedAsOutfit(file);
        }
    } else { // 'result'
        handleSelectFromResult(url);
    }
    fullscreenViewerManager.setFullscreenViewerState(s=>({...s, isOpen: false}));
  }, [fullscreenViewerManager.fullscreenViewerState, handleImageUpload, historyDispatch, retouchHook, handleSelectFromResult, fullscreenViewerManager.setFullscreenViewerState]);

  const handleHistoryPillClick = useCallback((index: number) => {
    if (isMobile) {
      fullscreenViewerManager.openFullScreenViewer(history.map(item => ({ url: item.url, transform: item.transform })), index, 'history');
    } else {
      historyDispatch({ type: 'SELECT', payload: { index }});
    }
  }, [isMobile, fullscreenViewerManager.openFullScreenViewer, history, historyDispatch]);
  
  const handleResultPillClick = useCallback((url: string, index: number) => {
    if (isMobile) {
      fullscreenViewerManager.openFullScreenViewer(resultsState.items.map(rUrl => ({ url: rUrl, transform: initialTransformState })), index, 'result');
    } else {
      handleSelectFromResult(url);
    }
  }, [isMobile, fullscreenViewerManager.openFullScreenViewer, resultsState.items, handleSelectFromResult]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    historyDispatch({ type: 'UNDO', payload: { resultsBaseIndex: resultsState.baseHistoryIndex } });
  }, [canUndo, historyDispatch, resultsState.baseHistoryIndex]);
  
  const handleRedo = useCallback(() => canRedo && historyDispatch({ type: 'REDO' }), [canRedo, historyDispatch]);
  const handleResetHistory = useCallback(() => history.length > 1 && historyDispatch({ type: 'RESET_TO_FIRST' }), [history.length, historyDispatch]);

  const handleApplyTransform = useCallback((type: TransformType) => {
    if (!currentHistoryItem) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    setUiState(s => ({...s, error: null}));
    const newTransform = { ...currentHistoryItem.transform };
    switch (type) {
        case 'rotate-cw': newTransform.rotate = (newTransform.rotate + 90) % 360; break;
        case 'rotate-ccw': newTransform.rotate = (newTransform.rotate - 90 + 360) % 360; break;
        case 'flip-h': newTransform.scaleX *= -1; break;
        case 'flip-v': newTransform.scaleY *= -1; break;
    }
    historyDispatch({ type: 'PUSH', payload: { item: { ...currentHistoryItem, transform: newTransform } } });
  }, [currentHistoryItem, t, historyDispatch]);

  const triggerDownload = useCallback((url: string, fileExtension: string = 'png') => {
    const a = document.createElement('a'); a.href = url;
    a.download = `pika edit ${downloadCounter}.${fileExtension}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setDownloadCounter(prev => prev + 1);
  }, [downloadCounter]);

  // FIX: Implement `handleDownloadExtractedItem` to resolve the error in `App.tsx`.
  const handleDownloadExtractedItem = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    triggerDownload(url, file.name.split('.').pop() || 'png');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [triggerDownload]);

  const handleDownload = useCallback(() => {
    if (!currentImage || !currentImageUrl) { setUiState(s => ({...s, error: t('errorCouldNotFindImage')})); return; }
    triggerDownload(currentImageUrl, currentImage.type.split('/')[1] || 'png');
  }, [currentImage, currentImageUrl, t, triggerDownload]);
  
  const handleRequestFileUpload = useCallback(() => document.getElementById('image-upload-main')?.click(), []);

  const handleToolsTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('input[type="range"]')) return;
    if (e.touches.length === 1 && toolsContainerRef.current) {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      gestureLockRef.current = null;
    }
  }, []);

  const handleToolsTouchMove = useCallback((e: React.TouchEvent) => {
      if (!swipeStartRef.current || e.touches.length !== 1 || !toolsContainerRef.current) return;
      const deltaX = e.touches[0].clientX - swipeStartRef.current.x; const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
      if (gestureLockRef.current === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) gestureLockRef.current = Math.abs(deltaY) > Math.abs(deltaX) ? 'vertical' : 'horizontal';
      const { scrollTop, scrollHeight, clientHeight } = toolsContainerRef.current;
      if (gestureLockRef.current === 'vertical' && (scrollTop > 0 || deltaY < 0) && (scrollTop < scrollHeight - clientHeight || deltaY > 0)) { /* Allow native scroll */ } 
      else e.preventDefault();
  }, []);

  const handleToolsTouchEnd = useCallback((e: React.TouchEvent) => {
      if (!swipeStartRef.current || e.changedTouches.length !== 1) { swipeStartRef.current = null; gestureLockRef.current = null; return; }
      const deltaY = e.changedTouches[0].clientY - swipeStartRef.current.y;
      const swipeTime = Date.now() - swipeStartRef.current.time;
      if (gestureLockRef.current === 'vertical' && swipeTime < 300 && Math.abs(deltaY) > 50) {
          if(toolsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = toolsContainerRef.current;
            if ((deltaY < 0 && scrollTop >= scrollHeight - clientHeight - 5) || (deltaY > 0 && scrollTop <= 5)) {
                setToolboxState(s => ({ ...s, isOpen: !s.isOpen }));
            }
          }
      }
      swipeStartRef.current = null; gestureLockRef.current = null;
  }, [setToolboxState]);

  // --- EFFECT HOOKS ---
  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => setWindowSize({ width: window.innerWidth, height: window.innerHeight }), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => { initialWindowHeightRef.current = window.innerHeight; }, []);

  useEffect(() => {
    if (!currentImage) {
        setImageDimensions(null);
        viewerManager.resetView();
        setToolboxState({ activeTab: TABS_CONFIG[0].id as Tab, isOpen: true });
    }
  }, [currentImage, viewerManager.resetView]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    const container = img?.parentElement;
    if (img && container && currentImageUrl) {
        const fullUpdate = () => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const mask = maskCanvasRef.current;
            if (mask) {
                const { naturalWidth, naturalHeight } = img; const { rotate } = currentTransform;
                const isSideways = rotate === 90 || rotate === 270;
                const w = isSideways ? naturalHeight : naturalWidth; const h = isSideways ? naturalWidth : naturalHeight;
                setImageDimensions({ width: w, height: h });
                mask.width = naturalWidth; mask.height = naturalHeight;
                if (retouchHook.isMaskPresent()) retouchHook.clearMask();
            }
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) { setOverlayStyle({ display: 'none' }); return; }
            const containerRatio = containerRect.width / containerRect.height; const { rotate } = currentTransform; const isSideways = rotate === 90 || rotate === 270;
            const contentNaturalRatio = isSideways ? img.naturalHeight / img.naturalWidth : img.naturalWidth / img.naturalHeight;
            let style: React.CSSProperties = { position: 'absolute' };
            if (contentNaturalRatio > containerRatio) {
                style.width = '100%'; style.height = `${containerRect.width / contentNaturalRatio}px`;
                style.top = '50%'; style.left = '0'; style.transform = 'translateY(-50%)';
            } else {
                style.height = '100%'; style.width = `${containerRect.height * contentNaturalRatio}px`;
                style.left = '50%'; style.top = '0'; style.transform = 'translateX(-50%)';
            }
            setOverlayStyle(style);
        };
        if (img.complete) fullUpdate(); else img.onload = fullUpdate;
        const resizeObserver = new ResizeObserver(fullUpdate); resizeObserver.observe(container);
        return () => { resizeObserver.disconnect(); if (img) img.onload = null; };
    } else { setOverlayStyle({ display: 'none' }); }
  }, [currentImageUrl, currentTransform, windowSize, retouchHook.isMaskPresent, retouchHook.clearMask]);
  
  useEffect(() => {
      if (pendingAction?.action === 'openViewerForNewItem' && historyIndex > -1 && isMobile) {
          fullscreenViewerManager.openFullScreenViewer(history.map(item => ({ url: item.url, transform: item.transform })), historyIndex, 'history');
          setPendingAction(null);
      }
  }, [pendingAction, history, historyIndex, fullscreenViewerManager.openFullScreenViewer, isMobile]);

  const { clearMask, setRetouchState, setExtractState } = retouchHook;
  const { setStudioState } = studioHook;
  const { setIdPhotoGender } = idPhotoHook;

  useEffect(() => {
    if (history.length === 1) { // After a start over or initial load
      clearMask();
      setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
      setExtractState({ prompt: '', history: [] });
      setStudioState(s => ({...s, prompt: '', styleFile: null, subjects: [], outfitFiles: []}));
      setIdPhotoGender('female');
    }
  }, [history.length, clearMask, setRetouchState, setExtractState, setStudioState, setIdPhotoGender]);

  useEffect(() => {
    const { baseHistoryIndex } = resultsState;
    if (baseHistoryIndex !== null && historyIndex === baseHistoryIndex) restoreResults();
    else if (baseHistoryIndex !== null && historyIndex !== baseHistoryIndex) resultsManager.clearResults();
    if (baseHistoryIndex !== null && historyIndex < baseHistoryIndex) clearAllResults();

    if (historyIndex > -1) {
      retouchHook.clearMask();
      retouchHook.setRetouchState(s => ({...s, editHotspot: null}));
    }
  }, [historyIndex, resultsState.baseHistoryIndex, restoreResults, resultsManager, retouchHook]);
  
  useEffect(() => { () => { if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current); }; }, []);
  useEffect(() => { if (currentImage) showControls(); }, [currentImage, showControls]);
  
  const isMobileToolbarVisible = isMobile && !toolboxState.isOpen && !!currentImage && !(isMobile && toolboxState.activeTab === 'retouch' && retouchHook.selectionMode === 'point' && !!retouchHook.editHotspot);
  const isMobileRetouchInputActive = isMobile && toolboxState.activeTab === 'retouch' && retouchHook.selectionMode === 'point' && !!retouchHook.editHotspot;

  return {
    t, beforeImageUrl, beforeImageThumbnailUrl,
    // State
    currentImage, currentImageUrl, currentThumbnailUrl, imageDimensions, history, historyIndex,
    isLoading: uiState.isLoading, loadingMessage: uiState.loadingMessage, error: uiState.error,
    activeTab: toolboxState.activeTab, isToolboxOpen: toolboxState.isOpen,
    isComparing: comparisonState.isComparing,
    isHistoryExpanded,
    scale: viewerManager.scale, position: viewerManager.position, transformString,
    isPanning: viewerManager.isPanning, isPinching: viewerManager.isPinching, isZoomControlsVisible, isInteracting: viewerManager.isInteracting,
    canUndo, canRedo, isMobile, isLandscape, windowSize, isKeyboardOpen, isMobileRetouchInputActive, isMobileToolbarVisible,
    overlayStyle,
    // Results
    results: resultsState.items, isGeneratingResults: resultsState.isGenerating, expectedResultsCount: resultsState.expectedCount, resultsBaseHistoryIndex: resultsState.baseHistoryIndex,
    // Refs
    imgRef, maskCanvasRef, imageViewerRef, toolsContainerRef,
    // Viewer Handlers
    handleViewerMouseDown: viewerManager.handleViewerMouseDown, handleViewerMouseMove: viewerManager.handleViewerMouseMove, handleViewerMouseUp: viewerManager.handleViewerMouseUp,
    handleViewerWheel: viewerManager.handleViewerWheel, handleViewerTouchStart: viewerManager.handleViewerTouchStart, handleViewerTouchMove: viewerManager.handleViewerTouchMove, handleViewerTouchEnd: viewerManager.handleViewerTouchEnd,
    // Setters & Actions
    handleFileSelect, handleDownload, handleUndo, handleRedo, handleResetHistory, handleStartOver,
    handleHistoryPillClick, handleResultPillClick,
    handleApplyTransform,
    setComparisonState,
    handleTabChange, handleTabChangeAndOpen,
    toggleToolbox,
    resetView: viewerManager.resetView, handleZoom: viewerManager.handleZoom,
    setIsHistoryExpanded,
    handleToolsTouchStart, handleToolsTouchMove, handleToolsTouchEnd,
    handleRequestFileUpload,
    triggerDownload, handleSelectFromViewer,
    showControls,
    handleDownloadExtractedItem,

    // Feature Hooks' returned values
    ...retouchHook,
    ...expansionHook,
    ...studioHook,
    ...generateHook,
    ...idPhotoHook,
    ...adjustmentsHook,

    // Fullscreen viewer state
    isViewerOpen: fullscreenViewerManager.isViewerOpen, viewerItems: fullscreenViewerManager.viewerItems,
    viewerInitialIndex: fullscreenViewerManager.viewerInitialIndex, viewerType: fullscreenViewerManager.viewerType,
    viewerComparisonUrl: fullscreenViewerManager.viewerComparisonUrl,
    setFullscreenViewerState: fullscreenViewerManager.setFullscreenViewerState,
  };
};