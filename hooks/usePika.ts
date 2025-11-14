/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { dataURLtoFile, RateLimitError, APIError, NetworkError, InvalidInputError, ContentSafetyError, ModelExecutionError, generateCreativePrompt, type GroundingChunk } from '../services/geminiService';
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
  const { resultsState, setResultsState, clearAllResults, restoreResults, clearResults } = resultsManager;
  
  // --- UI & APP STATE ---
  const [uiState, setUiState] = useState({ isLoading: false, loadingMessage: '', error: null as string | null });
  const [toolboxState, setToolboxState] = useState({ activeTab: 'retouch' as Tab, isOpen: true });
  const toggleToolbox = useCallback(() => setToolboxState(s => ({ ...s, isOpen: !s.isOpen })), []);
  const [comparisonState, setComparisonState] = useState({ isComparing: false });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [pendingAction, setPendingAction] = useState<{ action: 'openViewerForNewItem' } | null>(null);
  const [isZoomControlsVisible, setIsZoomControlsVisible] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [downloadCounter, setDownloadCounter] = useState(1);
  const [sources, setSources] = useState<GroundingChunk[]>([]);

  // --- REFS ---
  const imgRef = useRef<HTMLImageElement>(null);
  const imageViewerRef = useRef<HTMLImageElement>(null);
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
  const isMobileToolbarVisible = isMobile && !toolboxState.isOpen && !!currentImage && !isKeyboardOpen;

  // --- DEPENDENT HOOKS ---
  const showControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
    setIsZoomControlsVisible(true);
    hideControlsTimeoutRef.current = window.setTimeout(() => setIsZoomControlsVisible(false), 3000);
  }, []);

  const viewerManager = useViewer({ 
    isComparing: comparisonState.isComparing, isMobile,
    isToolboxOpen: toolboxState.isOpen, toggleToolbox,
    windowHeight: windowSize.height, showControls,
  });
  
  const fullscreenViewerManager = useFullscreenViewer({ history, resultsState, historyIndex });
  const { fullscreenViewerState, isViewerOpen, viewerItems, viewerInitialIndex, viewerType, viewerComparisonUrl, openFullScreenViewer, setFullscreenViewerState } = fullscreenViewerManager;
  
  const handleStartOver = useCallback(() => {
    historyDispatch({ type: 'RESET_ALL' });
    clearAllResults();
    setComparisonState({ isComparing: false });
    setSources([]);
  }, [historyDispatch, clearAllResults]);

  const handleImageUpload = useCallback(async (file: File) => {
    setUiState(s => ({ ...s, error: null }));
    historyDispatch({ type: 'RESET_ALL' }); 
    clearAllResults();
    setComparisonState({ isComparing: false });
    setSources([]);
    const thumbnailUrl = await createThumbnail(file);
    const newItem: HistoryItem = { 
        file, 
        url: URL.createObjectURL(file), 
        thumbnailUrl, 
        transform: { ...initialTransformState },
        studioSubjects: [file]
    };
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
    if (!img || !img.naturalWidth) return null;
    const rect = img.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const naturalX = (x / img.offsetWidth) * img.naturalWidth;
    const naturalY = (y / img.offsetHeight) * img.naturalHeight;

    return { x: naturalX, y: naturalY };
  }, []);

  const handleSelectFromViewer = useCallback(async (url: string, index: number) => {
    setFullscreenViewerState(s => ({ ...s, isOpen: false }));
    const file = dataURLtoFile(url, `selected-${Date.now()}.png`);
    
    if (fullscreenViewerState.type === 'extract') {
      // Logic to use extracted item will be handled here, possibly via another hook
      // For now, let's assume it adds to studio outfits
      setToolboxState(s => ({ ...s, activeTab: 'studio' }));
      // This will be passed to studioManager later
      // studioManager.handleStudioAddOutfitFile(file);
      return;
    }

    if (fullscreenViewerState.context?.isNewSession) {
      await handleImageUpload(file);
      if (viewerItems.length > 1) {
          resultsManager.setResultsState(s => ({
              ...s,
              items: viewerItems.map(i => i.url),
              persistentItems: viewerItems.map(i => i.url),
              baseHistoryIndex: 0,
          }));
          setIsHistoryExpanded(true);
      }
    } else {
      const baseIndex = resultsState.baseHistoryIndex ?? historyIndex;
      const thumbnailUrl = await createThumbnail(file);
      const newItem: HistoryItem = { file, url, thumbnailUrl, transform: { ...initialTransformState } };
      historyDispatch({ type: 'SET_FROM_RESULT', payload: { baseIndex, item: newItem } });
      clearAllResults();
    }
  }, [handleImageUpload, historyDispatch, historyIndex, resultsState.baseHistoryIndex, fullscreenViewerState, viewerItems, resultsManager, clearAllResults, setFullscreenViewerState, setIsHistoryExpanded, setToolboxState]);

  const studioSubjects = useMemo(() => {
    if (!currentHistoryItem) return [];
    return currentHistoryItem.studioSubjects ?? [currentHistoryItem.file];
  }, [currentHistoryItem]);

  const updateStudioSubjectsInHistory = useCallback(async (newSubjects: File[]) => {
    if (newSubjects.length === 0) {
        handleStartOver();
        return;
    }

    const oldSubjects = currentHistoryItem?.studioSubjects ?? (currentHistoryItem ? [currentHistoryItem.file] : []);
    if (newSubjects.length === oldSubjects.length && newSubjects.every((s, i) => s === oldSubjects[i])) {
      return;
    }

    const newMainImage = newSubjects[0];
    const thumbnailUrl = await createThumbnail(newMainImage);
    const newItem: HistoryItem = {
        file: newMainImage,
        url: URL.createObjectURL(newMainImage),
        thumbnailUrl,
        transform: initialTransformState,
        studioSubjects: newSubjects,
    };
    
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });

  }, [currentHistoryItem, historyDispatch, handleStartOver]);

  const sharedHookProps = {
    currentImage, getCommittedImage, addImageToHistory, setUiState, setPendingAction,
    handleApiError, onEditComplete, isMobile, resultsManager, openFullScreenViewer, t,
    historyIndex, activeTab: toolboxState.activeTab, setToolboxState, setIsHistoryExpanded,
    setSources,
    studioSubjects,
    updateStudioSubjectsInHistory,
  };
  
  const studioManager = useStudio(sharedHookProps);
  const handleUseExtractedAsOutfit = useCallback((file: File) => {
      setToolboxState(s => ({...s, activeTab: 'studio'}));
      studioManager.handleStudioAddOutfitFile(file);
  }, [studioManager, setToolboxState]);
  
  const adjustmentsManager = useAdjustments(sharedHookProps);
  const idPhotoManager = useIdPhoto(sharedHookProps);
  const retouchManager = useRetouch({ ...sharedHookProps, handleUseExtractedAsOutfit, openFullScreenViewer });
  const expansionManager = useExpansion({ ...sharedHookProps, imageDimensions, getRelativeCoords, imgRef });

  const { studioPrompt, studioStyleFile, studioOutfitFiles, setStudioState } = studioManager;

  const handleGenerateCreativePrompt = useCallback(async () => {
    if (!studioSubjects || studioSubjects.length === 0) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return;
    }
    setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStudioAnalysis')}));
    setSources([]); // Clear sources on new request
    try {
        const { prompt: newPrompt, sources: newSources } = await generateCreativePrompt(studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt);
        setStudioState(s => ({...s, prompt: newPrompt}));
        if (newSources && newSources.length > 0) {
          setSources(newSources);
        }
    } catch (err) {
        handleApiError(err, 'errorFailedToProcessImage');
    } finally {
        setUiState(s => ({...s, isLoading: false}));
    }
  }, [studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt, handleApiError, t, setUiState, setStudioState, setSources]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  const handleResetHistory = useCallback(() => {
    historyDispatch({ type: 'RESET_TO_FIRST' });
    clearAllResults();
  }, [historyDispatch, clearAllResults]);

  const triggerDownload = useCallback(async (url: string, filename: string) => {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Download failed:", err);
        setUiState(s => ({ ...s, error: t('errorCouldNotProcessDownload') }));
    }
}, [t]);

  const handleDownload = useCallback(async () => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorCouldNotFindImage') })); return; }
    const file = await getCommittedImage();
    const url = URL.createObjectURL(file);
    triggerDownload(url, `pika_ai_${downloadCounter}.png`);
    URL.revokeObjectURL(url);
    setDownloadCounter(c => c+1);
  }, [currentImage, getCommittedImage, downloadCounter, triggerDownload, t]);

  const handleDownloadExtractedItem = useCallback((file: File) => {
      const url = URL.createObjectURL(file);
      triggerDownload(url, `extracted_${Date.now()}.png`);
      URL.revokeObjectURL(url);
  }, [triggerDownload]);

  const handleHistoryPillClick = useCallback((index: number) => {
    historyDispatch({ type: 'SELECT', payload: { index }});
    // If we select a history item before the result generation, clear results
    if (resultsState.baseHistoryIndex !== null && index < resultsState.baseHistoryIndex) {
      clearAllResults();
    } else if (resultsState.baseHistoryIndex !== null && index === resultsState.baseHistoryIndex) {
      restoreResults();
    } else {
      clearResults();
    }

    if (isMobile) {
      openFullScreenViewer(
        history.map(item => ({ url: item.url, transform: item.transform })),
        index,
        'history'
      );
    }
  }, [historyDispatch, resultsState.baseHistoryIndex, clearAllResults, clearResults, restoreResults, isMobile, history, openFullScreenViewer]);

  const handleResultPillClick = useCallback((url: string, index: number) => {
    openFullScreenViewer(
      resultsState.items.map(u => ({ url: u, transform: initialTransformState })),
      index,
      'result'
    );
  }, [resultsState.items, openFullScreenViewer]);

  const handleTabChange = useCallback((tab: Tab) => {
    setToolboxState(s => ({ ...s, activeTab: tab }));
  }, []);

  const handleTabChangeAndOpen = useCallback((tab: Tab) => {
    setToolboxState({ activeTab: tab, isOpen: true });
  }, []);

  const handleRequestFileUpload = useCallback(() => {
    document.getElementById('image-upload-main')?.click();
  }, []);

  const handleApplyTransform = useCallback((transformType: TransformType) => {
    if (!currentHistoryItem) return;
    
    // Show brief loading state for feedback
    setUiState(s => ({ ...s, isLoading: true, loadingMessage: t('loadingTransform'), error: null }));

    const currentTransform = currentHistoryItem.transform;
    let newTransform: TransformState = { ...currentTransform };

    switch (transformType) {
      case 'rotate-cw':
        newTransform.rotate = (currentTransform.rotate + 90) % 360;
        break;
      case 'rotate-ccw':
        newTransform.rotate = (currentTransform.rotate - 90 + 360) % 360;
        break;
      case 'flip-h':
        // A user's intent for "horizontal flip" is based on what they see on screen.
        // When an image is rotated by 90/270 degrees, its local axes are swapped relative to the screen.
        // A screen-horizontal flip corresponds to flipping the image's local Y-axis.
        if (newTransform.rotate === 90 || newTransform.rotate === 270) {
            newTransform.scaleY = newTransform.scaleY === 1 ? -1 : 1;
        } else {
            newTransform.scaleX = newTransform.scaleX === 1 ? -1 : 1;
        }
        break;
      case 'flip-v':
        // A screen-vertical flip on a 90/270 rotated image corresponds to flipping the image's local X-axis.
        if (newTransform.rotate === 90 || newTransform.rotate === 270) {
            newTransform.scaleX = newTransform.scaleX === 1 ? -1 : 1;
        } else {
            newTransform.scaleY = newTransform.scaleY === 1 ? -1 : 1;
        }
        break;
    }

    const newItem: HistoryItem = {
      ...currentHistoryItem,
      transform: newTransform,
    };
    
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });

    // Hide loading state after a short delay
    setTimeout(() => {
        setUiState(s => ({ ...s, isLoading: false }));
    }, 100);
    
  }, [currentHistoryItem, historyDispatch, setUiState, t]);

  const handleToolsTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      gestureLockRef.current = null;
    }
  }, []);

  const handleToolsTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current || e.touches.length !== 1) return;
    if (gestureLockRef.current === null) {
      const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
      const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        gestureLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
    }
  }, []);

  const handleToolsTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartRef.current && e.changedTouches.length === 1 && gestureLockRef.current === 'vertical') {
      const deltaY = e.changedTouches[0].clientY - swipeStartRef.current.y;
      if (deltaY > 50) { // Swipe down
        toggleToolbox();
      }
    }
    swipeStartRef.current = null;
    gestureLockRef.current = null;
  }, [toggleToolbox]);

  const handleUndo = useCallback(() => {
    historyDispatch({ type: 'UNDO', payload: { resultsBaseIndex: resultsState.baseHistoryIndex } });
  }, [historyDispatch, resultsState.baseHistoryIndex]);

  const handleRedo = useCallback(() => historyDispatch({ type: 'REDO' }), [historyDispatch]);
  
  useLayoutEffect(() => {
    if (imgRef.current) {
        const updateDimensions = () => {
            if (imgRef.current?.naturalWidth && imgRef.current?.naturalHeight) {
                setImageDimensions({
                    width: imgRef.current.naturalWidth,
                    height: imgRef.current.naturalHeight,
                });
            }
        };
        const img = imgRef.current;
        if (img.complete) {
            updateDimensions();
        } else {
            img.addEventListener('load', updateDimensions);
        }
        return () => img.removeEventListener('load', updateDimensions);
    }
  }, [currentImageUrl]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (pendingAction?.action === 'openViewerForNewItem' && currentImageUrl) {
      const beforeItem = history[historyIndex - 1];

      if (beforeItem) {
        openFullScreenViewer(
          [
            { url: beforeItem.url, transform: beforeItem.transform }, // "Before" image
            { url: currentImageUrl, transform: currentTransform }      // "After" image (current)
          ],
          1, // Start showing the "After" image
          'history'
        );
      } else {
        // Fallback for the very first image where there's no "before"
        openFullScreenViewer([{ url: currentImageUrl, transform: currentTransform }], 0, 'history');
      }
      setPendingAction(null);
    }
  }, [pendingAction, currentImageUrl, currentTransform, openFullScreenViewer, history, historyIndex]);

  return {
    // State & Props
    t,
    ...uiState,
    activeTab: toolboxState.activeTab,
    isToolboxOpen: toolboxState.isOpen,
    ...comparisonState,
    windowSize,
    isZoomControlsVisible,
    isHistoryExpanded,
    imageDimensions,
    imgRef,
    imageViewerRef,
    toolsContainerRef,
    isMobile,
    isLandscape,
    isKeyboardOpen,
    currentImage,
    currentImageUrl,
    currentThumbnailUrl,
    currentTransform,
    transformString,
    beforeImageUrl,
    beforeImageThumbnailUrl,
    isMobileToolbarVisible,
    sources,
    
    // History
    history,
    historyIndex,
    canUndo,
    canRedo,
    
    // Results
    results: resultsState.items,
    isGeneratingResults: resultsState.isGenerating,
    expectedResultsCount: resultsState.expectedCount,
    resultsBaseHistoryIndex: resultsState.baseHistoryIndex,
    
    // Viewer
    ...viewerManager,

    // Fullscreen Viewer
    isViewerOpen,
    viewerItems,
    viewerInitialIndex,
    viewerType,
    viewerComparisonUrl,
    setFullscreenViewerState,

    // Handlers
    handleFileSelect,
    handleStartOver,
    handleResetHistory,
    handleDownload,
    handleHistoryPillClick,
    handleResultPillClick,
    handleSelectFromViewer,
    handleTabChange,
    handleTabChangeAndOpen,
    handleRequestFileUpload,
    handleApplyTransform,
    toggleToolbox,
    showControls,
    setComparisonState,
    setIsHistoryExpanded,
    triggerDownload,
    handleToolsTouchStart,
    handleToolsTouchMove,
    handleToolsTouchEnd,
    handleUndo,
    handleRedo,

    // Feature Modules
    ...adjustmentsManager,
    ...idPhotoManager,
    ...retouchManager,
    ...studioManager,
    studioSubjects,
    ...expansionManager,
    handleDownloadExtractedItem,
    handleGenerateCreativePrompt,
  };
};