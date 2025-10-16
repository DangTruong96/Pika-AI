/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
    generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateEditedImageWithMask,
    generateExtractedItem,
    generateIdPhoto, generatePhotoshootImage, generateCompositeImage, generatePromptFromStyleImage, type IdPhotoOptions, RateLimitError, dataURLtoFile,
    APIError, NetworkError, InvalidInputError, ContentSafetyError, ModelExecutionError,
    getPrompt,
    generateCreativePrompt,
    inferOutfitFromPrompt,
    generateOutfitDescriptionFromFiles,
    generateImageFromText
} from '../services/geminiService';
import { useTranslation } from '../contexts/LanguageContext';
import type { TranslationKey } from '../translations';
import { TABS_CONFIG } from '../components/EditorSidebar';
import { useHistory } from './useHistory';
import { useViewer } from './useViewer';
import type { Tab, TransformType, ExpansionHandle, Gender, FullscreenViewerState, SelectionMode, BrushMode, AspectRatio, HistoryItem, TransformState } from '../types';
import { initialTransformState } from '../types';


const createThumbnail = async (file: File): Promise<string> => {
    const MAX_SIZE = 128;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });
    URL.revokeObjectURL(url);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file.name; // Fallback

    const aspect = img.naturalWidth / img.naturalHeight;
    let width, height;
    if (aspect > 1) {
        width = MAX_SIZE;
        height = MAX_SIZE / aspect;
    } else {
        height = MAX_SIZE;
        width = MAX_SIZE * aspect;
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.8);
};


export const usePika = () => {
  const { t } = useTranslation();
  
  // --- CHILD HOOKS ---
  const historyManager = useHistory();
  const { history, historyIndex, currentHistoryItem, beforeHistoryItem, canUndo, canRedo, historyDispatch } = historyManager;
  
  // --- UI & APP STATE ---
  const [uiState, setUiState] = useState({ isLoading: false, loadingMessage: '', error: null as string | null });
  const [toolboxState, setToolboxState] = useState({ activeTab: 'retouch' as Tab, isOpen: true });
  const [comparisonState, setComparisonState] = useState({ isComparing: false });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [pendingAction, setPendingAction] = useState<{ action: 'openViewerForNewItem' } | null>(null);
  const [isZoomControlsVisible, setIsZoomControlsVisible] = useState(false);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  // --- VIEWER STATE (from hook) ---
  const isImageLoaded = !!currentHistoryItem;
  const isMobile = useMemo(() => windowSize.width < 1024, [windowSize.width]);
  const isLandscape = useMemo(() => isMobile && windowSize.width > windowSize.height, [isMobile, windowSize.width, windowSize.height]);
  
  const onEditComplete = useCallback(() => {
    if (isMobile) {
      setToolboxState(s => ({ ...s, isOpen: false }));
    }
  }, [isMobile]);

  const showControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current);
    }
    setIsZoomControlsVisible(true);
    hideControlsTimeoutRef.current = window.setTimeout(() => {
        setIsZoomControlsVisible(false);
    }, 3000);
  }, []);

  const viewerManager = useViewer({ 
    isComparing: comparisonState.isComparing, 
    isMobile, 
    isImageLoaded,
    isToolboxOpen: toolboxState.isOpen,
    toggleToolbox: () => setToolboxState(s => ({ ...s, isOpen: !s.isOpen })),
    windowHeight: windowSize.height,
    showControls,
  });
  const { scale, position, isPanning, isPinching, isInteracting, resetView, handleZoom, handleViewerMouseDown, handleViewerMouseMove, handleViewerMouseUp, handleViewerWheel, handleViewerTouchStart, handleViewerTouchMove, handleViewerTouchEnd } = viewerManager;

  const toggleToolbox = useCallback(() => {
    setToolboxState(s => ({ ...s, isOpen: !s.isOpen }));
    showControls();
  }, [showControls]);

  // --- PANEL-SPECIFIC STATES ---
  const [retouchState, setRetouchState] = useState({ 
    prompt: '', 
    selectionMode: 'point' as SelectionMode, 
    editHotspot: null as { x: number, y: number } | null, 
    brushMode: 'draw' as BrushMode, 
    brushSize: 30 
  });

  const [expandState, setExpandState] = useState({
    prompt: '',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    activeAspect: null as number | null
  });
  
  const [studioState, setStudioState] = useState({
    prompt: '',
    styleFile: null as File | null,
    subjects: [] as File[],
    outfitFiles: [] as File[],
  });

  const [extractState, setExtractState] = useState({
    prompt: '',
    history: [] as File[][]
  });

  const [generateState, setGenerateState] = useState({
    prompt: '',
    aspectRatio: '1:1' as AspectRatio,
    numImages: 1,
  });

  const [resultsState, setResultsState] = useState({
    items: [] as string[],
    isGenerating: false,
    expectedCount: 1,
    sourceTab: null as Tab | null,
    persistentItems: [] as string[],
    baseHistoryIndex: null as number | null,
  });
  
  const [fullscreenViewerState, setFullscreenViewerState] = useState<FullscreenViewerState>({
    isOpen: false,
    items: [],
    initialIndex: 0,
    type: 'history',
    comparisonUrl: null,
    context: {},
  });
  
  const [downloadCounter, setDownloadCounter] = useState(1);
  const [hotspotDisplayPosition, setHotspotDisplayPosition] = useState<{ left: number, top: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [mobileInputKey, setMobileInputKey] = useState(Date.now());
  const [idPhotoGender, setIdPhotoGender] = useState<Gender>('female');
  const [expansionDrag, setExpansionDrag] = useState<{ handle: ExpansionHandle; startCoords: { x: number; y: number; }; initialPadding: typeof expandState.padding; } | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  // --- REFS ---
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const retouchPromptInputRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const initialWindowHeightRef = useRef(window.innerHeight);
  const prevStudioStyleFileRef = useRef<File | null>(null);
  
  // --- DECONSTRUCTED STATE ---
  const { isLoading, loadingMessage, error } = uiState;
  const { activeTab, isOpen: isToolboxOpen } = toolboxState;
  const { prompt: retouchPrompt, selectionMode, editHotspot, brushMode, brushSize } = retouchState;
  const { prompt: studioPrompt, styleFile: studioStyleFile, subjects: studioSubjects, outfitFiles: studioOutfitFiles } = studioState;
  const { padding: expandPadding, prompt: expandPrompt, activeAspect: expandActiveAspect } = expandState;
  const { prompt: extractPrompt, history: extractHistory } = extractState;
  const { prompt: generatePrompt, aspectRatio: generateAspectRatio, numImages: generateNumImages } = generateState;
  const { items: results, isGenerating: isGeneratingResults, expectedCount: expectedResultsCount, baseHistoryIndex: resultsBaseHistoryIndex } = resultsState;
  const { isOpen: isViewerOpen, items: viewerItems, initialIndex: viewerInitialIndex, type: viewerType, comparisonUrl: viewerComparisonUrl } = fullscreenViewerState;
  const { isComparing } = comparisonState;

  // --- DERIVED STATE ---
  const hasExpansion = Object.values(expandPadding).some(p => (p as number) > 0);
  const isKeyboardOpen = isMobile && windowSize.height < initialWindowHeightRef.current * 0.9;
  const currentImage = useMemo(() => currentHistoryItem?.file ?? null, [currentHistoryItem]);
  const currentImageUrl = useMemo(() => currentHistoryItem?.url ?? null, [currentHistoryItem]);
  const currentThumbnailUrl = useMemo(() => currentHistoryItem?.thumbnailUrl ?? null, [currentHistoryItem]);
  const currentTransform = useMemo(() => currentHistoryItem?.transform ?? initialTransformState, [currentHistoryItem]);
  const transformString = useMemo(() => `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scaleX}, ${currentTransform.scaleY})`, [currentTransform]);
  const beforeImageUrl = useMemo(() => history[0]?.url ?? null, [history]);
  const isMobileRetouchInputActive = isMobile && activeTab === 'retouch' && selectionMode === 'point' && !!editHotspot;
  const isMobileToolbarVisible = isMobile && !isToolboxOpen && !!currentImage && !isMobileRetouchInputActive;
  
  // --- CALLBACKS & HANDLERS ---
  const clearMask = useCallback(() => {
    const ctx = maskCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
  }, []);

  const handleTabChange = useCallback((newTab: Tab) => {
    if (activeTab === 'retouch' && newTab !== 'retouch') {
        clearMask();
        setRetouchState(s => ({...s, editHotspot: null}));
    }
    setToolboxState(s => ({ ...s, activeTab: newTab }));
    showControls();
  }, [activeTab, clearMask, showControls]);

  const handleTabChangeAndOpen = useCallback((newTab: Tab) => {
    setToolboxState(s => ({ ...s, activeTab: newTab, isOpen: true }));
  }, []);

  const handleSelectionModeChange = useCallback((newMode: SelectionMode) => {
    setRetouchState(s => ({
      ...s,
      selectionMode: newMode,
      // Clear hotspot unless we are changing TO point mode
      editHotspot: newMode === 'point' ? s.editHotspot : null,
    }));
    
    // Clear mask if we are leaving brush mode
    if (newMode !== 'brush') {
      clearMask();
    }
  }, [clearMask]);

  const handleImageUpload = useCallback(async (file: File) => {
    setUiState(s => ({ ...s, error: null }));
    historyDispatch({ type: 'RESET_ALL' }); 
    
    clearMask();
    setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
    setExtractState({ prompt: '', history: [] });
    setComparisonState({ isComparing: false });
    setStudioState(s => ({ ...s, prompt: '', styleFile: null, subjects: [], outfitFiles: [] }));
    setResultsState({ items: [], isGenerating: false, expectedCount: 1, sourceTab: null, persistentItems: [], baseHistoryIndex: null });
    setIdPhotoGender('female');
    
    const thumbnailUrl = await createThumbnail(file);
    const newItem: HistoryItem = { file, url: URL.createObjectURL(file), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });
  }, [clearMask, historyDispatch]);

  const addImageToHistory = useCallback(async (newImageFile: File) => {
    const thumbnailUrl = await createThumbnail(newImageFile);
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem }});
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    clearMask();
    setRetouchState(s => ({ ...s, editHotspot: null, prompt: '' }));
  }, [clearMask, historyDispatch]);

  const handleApiError = useCallback((err: unknown, contextKey: TranslationKey) => {
    let errorMessage: string;
    if (err instanceof NetworkError) errorMessage = t('errorNetwork');
    else if (err instanceof InvalidInputError) errorMessage = t('errorInvalidInput');
    else if (err instanceof ContentSafetyError) errorMessage = t('errorContentSafety');
    else if (err instanceof ModelExecutionError) errorMessage = t('errorModelExecution');
    else if (err instanceof RateLimitError) {
        errorMessage = (err.message && err.message !== 'Rate limit exceeded after retries.') 
            ? err.message 
            : t('errorRateLimit');
    }
    else if (err instanceof APIError) errorMessage = `${t(contextKey)}. ${t('errorAPI')}`;
    else if (err instanceof Error) {
      if (err.message.includes("All composite image generations failed") || err.message.includes("All photoshoot image generations failed") || err.message.includes("All adjustment generations failed")) {
        errorMessage = t('errorAllGenerationsFailed');
      } else {
        errorMessage = `${t(contextKey)}: ${err.message}`;
      }
    }
    else errorMessage = `${t(contextKey)}: ${t('errorAnErrorOccurred')}.`;
    console.error("Error handled in usePika:", errorMessage, err);
    setUiState(s => ({ ...s, error: errorMessage }));
  }, [t, setUiState]);

  
  const handleStartOver = useCallback(() => {
    historyDispatch({ type: 'RESET_ALL' });
    setUiState(s => ({ ...s, error: null }));
    clearMask();
    setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
    setExtractState({ prompt: '', history: [] });
    setComparisonState({ isComparing: false });
    setStudioState(s => ({ ...s, prompt: '', styleFile: null, subjects: [], outfitFiles: [] }));
    setResultsState(s => ({ ...s, items: [], isGenerating: false, expectedCount: 1, sourceTab: null, persistentItems: [], baseHistoryIndex: null }));
    setIdPhotoGender('female');
  }, [clearMask, historyDispatch]);

  const handleHistorySelect = useCallback((index: number) => {
      historyDispatch({ type: 'SELECT', payload: { index }});
      clearMask();
      setRetouchState(s => ({ ...s, editHotspot: null }));
      if (resultsBaseHistoryIndex === null || index !== resultsBaseHistoryIndex) {
          setResultsState(s => ({ ...s, items: [] }));
      }
      if (resultsBaseHistoryIndex !== null && index < resultsBaseHistoryIndex) {
           setResultsState(s => ({ ...s, persistentItems: [], baseHistoryIndex: null }));
      }
  }, [clearMask, historyDispatch, resultsBaseHistoryIndex]);

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
  }, []);
  
  const handleUseExtractedAsOutfit = useCallback((file: File) => {
    setToolboxState(s => ({...s, activeTab: 'studio'}));
    setStudioState(s => ({...s, outfitFiles: [file]}));
  }, []);

  const handleSelectFromResult = useCallback(async (imageUrl: string) => {
    const newImageFile = dataURLtoFile(imageUrl, `result-${Date.now()}.png`);
    if (history.length === 0 || historyIndex === -1) {
        await handleImageUpload(newImageFile);
        return;
    }
    const baseIndex = resultsBaseHistoryIndex !== null ? resultsBaseHistoryIndex : historyIndex;
    const thumbnailUrl = await createThumbnail(newImageFile);
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), thumbnailUrl, transform: { ...initialTransformState } };
    historyDispatch({ type: 'SET_FROM_RESULT', payload: { baseIndex, item: newItem } });
    clearMask();
    setRetouchState(s => ({ ...s, editHotspot: null, prompt: '' }));
  }, [history.length, historyIndex, resultsBaseHistoryIndex, handleImageUpload, clearMask, historyDispatch]);

  const openFullScreenViewer = useCallback((items: Array<{ url: string; transform: TransformState; }>, index: number, type: 'history' | 'result' | 'extract', context: FullscreenViewerState['context'] = {}) => {
      const historyItemUrls = history.map(item => item.url);
      let compareUrl: string | null = null;

      if (type === 'history') {
          // The "original" is the first item in the history stack.
          const originalUrl = historyItemUrls[0] ?? null;
          // Don't set a comparison URL if we are viewing the original itself.
          if (index > 0) {
              compareUrl = originalUrl;
          }
      } else if (type === 'result') { // type === 'result'
          // Results are compared against the history item they were generated from.
          const baseIndex = resultsBaseHistoryIndex ?? historyIndex;
          compareUrl = historyItemUrls[baseIndex] ?? null;
      }

      setFullscreenViewerState({
          isOpen: true,
          items,
          initialIndex: index,
          type,
          comparisonUrl: compareUrl,
          context
      });
  }, [history, historyIndex, resultsBaseHistoryIndex]);

  const handleHistoryPillClick = useCallback((index: number) => {
    if (isMobile) {
      openFullScreenViewer(history.map(item => ({ url: item.url, transform: item.transform })), index, 'history');
    } else {
      handleHistorySelect(index);
    }
  }, [isMobile, openFullScreenViewer, history, handleHistorySelect]);

  const handleResultPillClick = useCallback((url: string, index: number) => {
    if (isMobile) {
      openFullScreenViewer(results.map(rUrl => ({ url: rUrl, transform: initialTransformState })), index, 'result');
    } else {
      handleSelectFromResult(url);
    }
  }, [isMobile, openFullScreenViewer, results, handleSelectFromResult]);
  
  const handleSelectFromViewer = useCallback((url: string, index: number) => {
    const { type, context } = fullscreenViewerState;
    if (type === 'result' && context?.isNewSession) {
        const newFile = dataURLtoFile(url, `generated-${Date.now()}.png`);
        handleImageUpload(newFile);
    } else if (type === 'history') {
        handleHistorySelect(index);
    } else if (type === 'extract') {
        const setIndex = context?.extractSetIndex;
        if (setIndex !== undefined) {
            const file = extractHistory[setIndex]?.[index];
            if (file) {
                handleUseExtractedAsOutfit(file);
            }
        }
    } else { // 'result'
        handleSelectFromResult(url);
    }
    setFullscreenViewerState(s => ({...s, isOpen: false}));
  }, [fullscreenViewerState, handleImageUpload, handleHistorySelect, handleSelectFromResult, extractHistory, handleUseExtractedAsOutfit]);

  const handleViewExtractedItem = useCallback((setIndex: number, itemIndex: number) => {
    const itemSetUrls = extractedHistoryItemUrls[setIndex];
    if (!itemSetUrls) return;
    
    openFullScreenViewer(
        itemSetUrls.map(url => ({ url, transform: initialTransformState })),
        itemIndex,
        'extract',
        { extractSetIndex: setIndex }
    );
  }, [extractedHistoryItemUrls, openFullScreenViewer]);

  const getCommittedImage = useCallback(async (): Promise<File> => {
    if (!currentHistoryItem) throw new Error("No image in history to process.");
    const { file, url, transform } = currentHistoryItem;
    if (transform.rotate === 0 && transform.scaleX === 1 && transform.scaleY === 1) return file;
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context for committing transform');
    const { naturalWidth: w, naturalHeight: h } = img;
    const rad = transform.rotate * Math.PI / 180;
    canvas.width = (transform.rotate === 90 || transform.rotate === 270) ? h : w;
    canvas.height = (transform.rotate === 90 || transform.rotate === 270) ? w : h;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(transform.scaleX, transform.scaleY);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type, 0.95));
    if (!blob) throw new Error('Failed to create blob from canvas');
    return new File([blob], `committed-${Date.now()}.png`, { type: blob.type });
  }, [currentHistoryItem]);

  const getRelativeCoords = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.complete) return null;

    const pointer = ('touches' in e && e.touches.length > 0)
        ? e.touches[0]
        : ('changedTouches' in e && e.changedTouches.length > 0)
        ? e.changedTouches[0]
        : ('clientX' in e ? e : null);
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

    if (naturalRatio > rectRatio) { // Image is wider, letterboxed top/bottom
        renderedWidth = imgRect.width;
        renderedHeight = imgRect.width / naturalRatio;
        renderedX = imgRect.left;
        renderedY = imgRect.top + (imgRect.height - renderedHeight) / 2;
    } else { // Image is taller, letterboxed left/right
        renderedHeight = imgRect.height;
        renderedWidth = imgRect.height * naturalRatio;
        renderedY = imgRect.top;
        renderedX = imgRect.left + (imgRect.width - renderedWidth) / 2;
    }

    // Boundary check: is the pointer inside the rendered image?
    if (
        pointer.clientX < renderedX ||
        pointer.clientX > renderedX + renderedWidth ||
        pointer.clientY < renderedY ||
        pointer.clientY > renderedY + renderedHeight
    ) {
        return null; // Click is outside the actual image
    }

    const xOnImage = pointer.clientX - renderedX;
    const yOnImage = pointer.clientY - renderedY;
    let normX = xOnImage / renderedWidth;
    let normY = yOnImage / renderedHeight;
    
    // To reverse transforms, we must apply the inverse of each transform in the reverse order.
    // The CSS transform is effectively: rotate() then scale().
    // So, the reversal must be: un-scale() then un-rotate().

    // 1. Un-flip (un-scale)
    if (scaleX === -1) normX = 1 - normX;
    if (scaleY === -1) normY = 1 - normY;
    
    // 2. Un-rotate
    const tempX = normX;
    switch (rotate) {
        case 90: normX = normY; normY = 1 - tempX; break;
        case 180: normX = 1 - normX; normY = 1 - normY; break;
        case 270: normX = 1 - normY; normY = tempX; break;
    }
    
    return { x: normX * img.naturalWidth, y: normY * img.naturalHeight };
  }, [currentTransform]);

  const handleGenerate = async (promptOverride?: string) => {
    if (!currentImage) { setUiState(s => ({ ...s, error: t('errorNoImageLoaded') })); return; }
    const finalPromptToUse = promptOverride || retouchPrompt;
    if (!finalPromptToUse.trim()) { setUiState(s => ({ ...s, error: t('errorEnterDescription') })); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingRetouch'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
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

  const handleApplyAdjustment = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToAdjust')})); return; }
    const loadingMessage = prompt.includes('Document Scanner Simulation') ? t('loadingScan') : t('loadingAdjustment');
    setUiState({ isLoading: true, loadingMessage, error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
      const imageUrl = await generateAdjustedImage(await getCommittedImage(), prompt);
      await addImageToHistory(dataURLtoFile(imageUrl, `adjusted-${Date.now()}.png`));
      if (isMobile) {
        setPendingAction({ action: 'openViewerForNewItem' });
      } else {
        onEditComplete();
      }
    } catch (err) { handleApiError(err, 'errorFailedToApplyAdjustment'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile]);
  
  const handleApplyMultipleAdjustments = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToAdjust')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingAdjustment'), error: null });
    setResultsState({ items: [], persistentItems: [], baseHistoryIndex: historyIndex, expectedCount: 3, isGenerating: true, sourceTab: activeTab });
    setIsHistoryExpanded(true);
    if (isMobile) setToolboxState(s => ({...s, isOpen: false}));
    
    try {
        const imageToProcess = await getCommittedImage();
        const seeds = [1, 2, 3];
        let completedCount = 0;
        setUiState(s => ({ ...s, loadingMessage: `${t('loadingAdjustment')} (0/3)` }));

        const promises = seeds.map(() => 
            generateAdjustedImage(imageToProcess, prompt)
            .then(imageUrl => {
                completedCount++;
                setUiState(s => ({ ...s, loadingMessage: `${t('loadingAdjustment')} (${completedCount}/3)` }));
                setResultsState(s => {
                    const newItems = [...s.items, imageUrl].sort();
                    return { ...s, items: newItems, persistentItems: newItems };
                });
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
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [currentImage, t, handleApiError, historyIndex, activeTab, isMobile, getCommittedImage, openFullScreenViewer]);

  const handleApplyFilter = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToFilter')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingFilter'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
      const imageUrl = await generateFilteredImage(await getCommittedImage(), prompt);
      await addImageToHistory(dataURLtoFile(imageUrl, `filtered-${Date.now()}.png`));
      if (isMobile) {
        setPendingAction({ action: 'openViewerForNewItem' });
      } else {
        onEditComplete();
      }
    } catch (err) { handleApiError(err, 'errorFailedToApplyFilter'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile]);

  const handleGenerateExpandedImage = useCallback(async (prompt: string) => {
    if (!currentImage || !hasExpansion) return;
    setUiState({ isLoading: true, loadingMessage: t('loadingExpansion'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
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
        const imageUrl = await generateExpandedImage(canvas.toDataURL('image/png'), finalPrompt);
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
  }, [currentImage, addImageToHistory, expandPadding, hasExpansion, t, handleApiError, onEditComplete, getCommittedImage, isMobile]);
  
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
  }, [currentImage, extractPrompt, t, handleApiError, onEditComplete, getCommittedImage, extractHistory]);

  const handleClearExtractHistory = useCallback(() => {
    setExtractState(s => ({ ...s, history: [] }));
    setExtractedHistoryItemUrls([]);
  }, []);

  const triggerDownload = useCallback((url: string, fileExtension: string = 'png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `pika edit ${downloadCounter}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadCounter(prev => prev + 1);
  }, [downloadCounter]);

  const handleDownloadExtractedItem = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    triggerDownload(url, file.type.split('/')[1] || 'png');
    URL.revokeObjectURL(url);
  }, [triggerDownload]);
  
  const handleGenerateIdPhoto = useCallback(async (options: IdPhotoOptions) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingIdPhoto'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
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
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage, isMobile]);

  const handleStudioAddSubject = useCallback((file: File) => {
    setStudioState(s => {
      if ((s.subjects.length + 1) >= 7) return s; // Max 6 additional subjects (total 7 with main image)
      return { ...s, subjects: [...s.subjects, file] };
    });
  }, []);

  const handleStudioRemoveSubject = useCallback((index: number) => {
    setStudioState(s => ({
      ...s,
      subjects: s.subjects.filter((_, i) => i !== index),
    }));
  }, []);
  
  const handleStudioAddOutfitFile = useCallback((file: File) => {
    setStudioState(s => {
      if (s.outfitFiles.length >= 3) {
        return s;
      }
      return { ...s, outfitFiles: [...s.outfitFiles, file] };
    });
  }, []);

  const handleStudioRemoveOutfitFile = useCallback((index: number) => {
    setStudioState(s => ({
      ...s,
      outfitFiles: s.outfitFiles.filter((_, i) => i !== index),
    }));
  }, []);

  const handleGeneratePhotoshoot = useCallback(async () => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }

    const allSubjects = [currentImage, ...studioSubjects];
    
    setUiState({ isLoading: true, loadingMessage: t('generatePhotoshoot'), error: null });
    setResultsState({ items: [], persistentItems: [], baseHistoryIndex: historyIndex, expectedCount: 2, isGenerating: true, sourceTab: activeTab });
    setIsHistoryExpanded(true);
    if(isMobile) setToolboxState(s => ({...s, isOpen: false}));

    try {
        let finalPrompt = studioPrompt.trim();
        
        if (!finalPrompt && studioStyleFile) {
            setUiState(s => ({...s, loadingMessage: t('loadingStyle')}));
            finalPrompt = await generatePromptFromStyleImage(studioStyleFile, false);
            setStudioState(s => ({...s, prompt: finalPrompt}));
        } else if (!finalPrompt) {
            setUiState(s => ({...s, loadingMessage: t('loadingAnalyzingScene')}));
            finalPrompt = await generateCreativePrompt(allSubjects, null, [], '');
            setStudioState(s => ({...s, prompt: finalPrompt}));
        }

        let outfitDescription: string;
        if (studioOutfitFiles.length > 0) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingOutfitStyle') }));
            outfitDescription = await generateOutfitDescriptionFromFiles(studioOutfitFiles);
        } else if (studioStyleFile) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingOutfitStyle') }));
            outfitDescription = await generatePromptFromStyleImage(studioStyleFile, true);
        } else if (finalPrompt) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingInferOutfit') }));
            outfitDescription = await inferOutfitFromPrompt(finalPrompt, allSubjects);
        } else {
            outfitDescription = "Phù hợp với bối cảnh và phong cách của cảnh được mô tả";
        }
        
        const seeds = [1, 2];
        let completedCount = 0;
        setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (0/${seeds.length})` }));
        
        let generationPromises;

        if (allSubjects.length > 1) {
            const committedSubjects = await Promise.all(allSubjects.map(async (subj, index) => {
                if (index === 0) return await getCommittedImage();
                return subj;
            }));
            generationPromises = seeds.map(() => generateCompositeImage(committedSubjects, finalPrompt, outfitDescription, studioOutfitFiles));
        } else {
            const imageToProcess = await getCommittedImage();
            generationPromises = seeds.map(() => 
                generatePhotoshootImage(imageToProcess, finalPrompt, outfitDescription, studioStyleFile, studioOutfitFiles)
            );
        }

        const promises = generationPromises.map(p => p.then(imageUrl => {
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            setResultsState(s => {
                const newItems = [...s.items, imageUrl].sort(); // Keep results sorted for consistent display
                return { ...s, items: newItems, persistentItems: newItems };
            });
            return imageUrl;
        }).catch(err => {
            console.warn(`Generation failed:`, err);
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            return null;
        }));
        
        const results = await Promise.all(promises);
        const successfulUrls = results.filter((url): url is string => url !== null);
        
        if (successfulUrls.length === 0) throw new Error("All photoshoot image generations failed.");

        if (isMobile && successfulUrls.length > 0) {
            openFullScreenViewer(successfulUrls.map(url => ({ url, transform: initialTransformState })), 0, 'result');
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [currentImage, studioSubjects, studioPrompt, studioStyleFile, t, handleApiError, historyIndex, activeTab, isMobile, getCommittedImage, studioOutfitFiles, openFullScreenViewer]);
  
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
            setResultsState({
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
              setResultsState({
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
  }, [generatePrompt, generateNumImages, generateAspectRatio, handleImageUpload, handleApiError, t, isMobile, openFullScreenViewer, historyIndex]);
  
  const handleRequestFileUpload = useCallback(() => document.getElementById('image-upload-main')?.click(), []);
  
  const handleDownload = useCallback(() => {
    if (!currentImage || !currentImageUrl) { setUiState(s => ({...s, error: t('errorCouldNotFindImage')})); return; }
    triggerDownload(currentImageUrl, currentImage.type.split('/')[1] || 'png');
  }, [currentImage, currentImageUrl, t, triggerDownload]);

  const setExpansionByAspect = useCallback((aspect: number | null) => {
    // If user wants to reset, always allow it.
    if (aspect === null) {
      setExpandState(s => ({ ...s, padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null }));
      return;
    }

    // For any other aspect, if we don't have dimensions, do nothing to prevent a partial state update.
    if (!imgRef.current || !imageDimensions) {
      console.warn("setExpansionByAspect called before imageDimensions were ready.");
      return; 
    }
    
    // Now we know we have dimensions and a valid aspect.
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
  }, [imageDimensions]);
  
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const { persistentItems } = resultsState;
    historyDispatch({ type: 'UNDO', payload: { resultsBaseIndex: resultsBaseHistoryIndex } });
    const newHistoryIndex = (resultsBaseHistoryIndex !== null && historyIndex > resultsBaseHistoryIndex) ? resultsBaseHistoryIndex : historyIndex - 1;
    if (resultsBaseHistoryIndex !== null && newHistoryIndex === resultsBaseHistoryIndex) setResultsState(s => ({...s, items: persistentItems}));
    else setResultsState(s => ({...s, items: []}));
    if (resultsBaseHistoryIndex !== null && newHistoryIndex < resultsBaseHistoryIndex) setResultsState(s => ({...s, persistentItems: [], baseHistoryIndex: null}));
    clearMask();
    setRetouchState(s => ({...s, editHotspot: null}));
  }, [canUndo, historyIndex, resultsBaseHistoryIndex, resultsState, clearMask, historyDispatch]);
  
  const handleRedo = useCallback(() => {
      if (canRedo) {
          historyDispatch({ type: 'REDO' });
          if (resultsBaseHistoryIndex === null || historyIndex + 1 !== resultsBaseHistoryIndex) setResultsState(s => ({...s, items: []}));
          clearMask();
          setRetouchState(s => ({...s, editHotspot: null}));
      }
  }, [canRedo, historyIndex, resultsBaseHistoryIndex, clearMask, historyDispatch]);

  const handleResetHistory = useCallback(() => {
      if (history.length > 1) {
          historyDispatch({ type: 'RESET_TO_FIRST' });
          clearMask();
          setRetouchState(s => ({ ...s, editHotspot: null }));
          setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
      }
  }, [history.length, clearMask, historyDispatch]);

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
  
  const handleFileSelect = (files: FileList | null) => { if (files && files[0]) handleImageUpload(files[0]); };

  const handleViewerClick = (e: React.MouseEvent) => {
    if (activeTab === 'retouch' && selectionMode === 'point') {
        const coords = getRelativeCoords(e as any); // Cast to any to satisfy TS, logic is sound for mouseevent
        if (coords) {
            setRetouchState(s => ({...s, editHotspot: coords }));
            setMobileInputKey(Date.now());
        }
    }
  };
  
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
        // Draw a dot for the first point
        ctx.fillStyle = brushMode === 'draw' ? '#FF00FF' : 'black';
        ctx.beginPath();
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    lastDrawPointRef.current = point;
  }, [brushMode, brushSize]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'start' | 'move' | 'end') => {
    if (activeTab !== 'retouch' || selectionMode !== 'brush') return;

    e.preventDefault();
    e.stopPropagation();
    
    const point = getRelativeCoords(e);
    
    if (!point) {
        // Cursor is outside the image bounds
        setMousePosition(null);
        if (isDrawing) {
            setIsDrawing(false);
            lastDrawPointRef.current = null;
        }
        return;
    }

    // Update mouse position for the custom brush cursor
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
        lastDrawPointRef.current = null; // Reset for a new line
        drawOnCanvas(point);
    } else if (type === 'move') {
        if (!isDrawing) return; // Only draw if mouse/touch is down
        drawOnCanvas(point);
    } else if (type === 'end') {
        setIsDrawing(false);
        lastDrawPointRef.current = null;
    }
  };

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

  // --- EFFECT HOOKS ---
  
  // Window resize handler (debounced)
  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set initial window height for keyboard detection
  useEffect(() => {
    initialWindowHeightRef.current = window.innerHeight;
  }, []);

  // Reset certain states when image is removed
  useEffect(() => {
    if (!currentImage) {
        setExpandState({ prompt: '', padding: {top:0,right:0,bottom:0,left:0}, activeAspect: null });
        setImageDimensions(null);
        resetView();
        setToolboxState({ activeTab: TABS_CONFIG[0].id as Tab, isOpen: true });
    }
  }, [currentImage, resetView]);

  // Update image dimensions, mask canvas resolution, and overlay styles
  useLayoutEffect(() => {
    const img = imgRef.current;
    const container = img?.parentElement;

    if (img && container && currentImageUrl) {
        const fullUpdate = () => {
            if (!img.naturalWidth || !img.naturalHeight) return;

            // 1. Set canvas resolution and image dimensions state
            const mask = maskCanvasRef.current;
            if (mask) {
                const { naturalWidth, naturalHeight } = img;
                const { rotate } = currentTransform;
                const isSideways = rotate === 90 || rotate === 270;
                const w = isSideways ? naturalHeight : naturalWidth;
                const h = isSideways ? naturalWidth : naturalHeight;
                setImageDimensions({ width: w, height: h });

                mask.width = naturalWidth;
                mask.height = naturalHeight;
                if (isMaskPresent()) clearMask();
            }

            // 2. Calculate and set the style for overlay canvases to match `object-contain`
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) {
                setOverlayStyle({ display: 'none' });
                return;
            }

            const containerRatio = containerRect.width / containerRect.height;
            const { rotate } = currentTransform;
            const isSideways = rotate === 90 || rotate === 270;
            const contentNaturalRatio = isSideways
                ? img.naturalHeight / img.naturalWidth
                : img.naturalWidth / img.naturalHeight;

            let style: React.CSSProperties = { position: 'absolute' };

            if (contentNaturalRatio > containerRatio) { // Letterboxed top/bottom
                style.width = '100%';
                style.height = `${containerRect.width / contentNaturalRatio}px`;
                style.top = '50%';
                style.left = '0';
                style.transform = 'translateY(-50%)';
            } else { // Letterboxed left/right
                style.height = '100%';
                style.width = `${containerRect.height * contentNaturalRatio}px`;
                style.left = '50%';
                style.top = '0';
                style.transform = 'translateX(-50%)';
            }
            setOverlayStyle(style);
        };

        if (img.complete) {
            fullUpdate();
        } else {
            img.onload = fullUpdate;
        }

        const resizeObserver = new ResizeObserver(fullUpdate);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (img) img.onload = null;
        };
    } else {
        setOverlayStyle({ display: 'none' });
    }
}, [currentImageUrl, currentTransform, windowSize, clearMask, isMaskPresent]);

  // Handle auto-generation of prompt from style file
  useEffect(() => {
    if (studioStyleFile && studioStyleFile !== prevStudioStyleFileRef.current) {
        setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStyle')}));
        generatePromptFromStyleImage(studioStyleFile, false)
            .then(prompt => setStudioState(s => ({...s, prompt})))
            .catch(err => handleApiError(err, 'errorFailedToProcessImage'))
            .finally(() => setUiState(s => ({...s, isLoading: false})));
    } else if (!studioStyleFile && prevStudioStyleFileRef.current) {
        setStudioState(s => ({...s, prompt: ''}));
    }
    prevStudioStyleFileRef.current = studioStyleFile;
  }, [studioStyleFile, handleApiError, t]);
  
  // Create object URLs for extracted items
  useEffect(() => {
    const newUrls: string[][] = [];
    extractHistory.forEach((fileSet, setIndex) => {
      newUrls[setIndex] = fileSet.map(file => URL.createObjectURL(file));
    });
    setExtractedHistoryItemUrls(newUrls);
    
    return () => { // Cleanup
      newUrls.flat().forEach(url => URL.revokeObjectURL(url));
    };
  }, [extractHistory]);

  // Update hotspot display position when it changes
  useEffect(() => {
    const img = imgRef.current;
    // The positioning context for the hotspot is the pan/zoom div, which is the image viewer.
    const viewer = imageViewerRef.current; 

    if (editHotspot && img && viewer && img.complete && img.naturalWidth > 0) {
      // 1. Normalize hotspot coords from natural image space [0, naturalWidth] -> [0, 1]
      let { x: normX, y: normY } = { x: editHotspot.x / img.naturalWidth, y: editHotspot.y / img.naturalHeight };

      // 2. Apply CSS transforms (flip, rotate) to get the point's logical position on the transformed image plane
      const { rotate, scaleX, scaleY } = currentTransform;
      const tempX = normX;
      if (rotate === 90) { normX = 1 - normY; normY = tempX; }
      else if (rotate === 180) { normX = 1 - normX; normY = 1 - normY; }
      else if (rotate === 270) { normX = normY; normY = 1 - tempX; }
      if (scaleX === -1) normX = 1 - normX;
      if (scaleY === -1) normY = 1 - normY;

      // 3. Calculate the actual displayed size of the image within its container, respecting 'object-contain'
      const containerWidth = viewer.clientWidth;
      const containerHeight = viewer.clientHeight;

      let imgNaturalWidth = img.naturalWidth;
      let imgNaturalHeight = img.naturalHeight;

      if (rotate === 90 || rotate === 270) {
        [imgNaturalWidth, imgNaturalHeight] = [imgNaturalHeight, imgNaturalWidth];
      }

      const naturalRatio = imgNaturalWidth / imgNaturalHeight;
      const containerRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight;
      if (naturalRatio > containerRatio) { // Image is wider than container, so it's letterboxed top/bottom
        displayWidth = containerWidth;
        displayHeight = displayWidth / naturalRatio;
      } else { // Image is taller, letterboxed left/right
        displayHeight = containerHeight;
        displayWidth = displayHeight * naturalRatio;
      }

      // 4. The image is centered in the viewer. Calculate its top-left corner's offset.
      const offsetX = (containerWidth - displayWidth) / 2;
      const offsetY = (containerHeight - displayHeight) / 2;

      // 5. Calculate the hotspot's position in pixels relative to the viewer's top-left.
      // Since the hotspot is a child of the panned/zoomed container, these pixel values
      // will be correctly transformed by the browser.
      const finalLeft = offsetX + normX * displayWidth;
      const finalTop = offsetY + normY * displayHeight;

      setHotspotDisplayPosition({
        left: finalLeft,
        top: finalTop,
      });
    } else {
      setHotspotDisplayPosition(null);
    }
  }, [editHotspot, currentTransform, windowSize, scale, position]);
  
  // Effect to handle opening viewer after history has been updated for single-result generations
  useEffect(() => {
      if (pendingAction?.action === 'openViewerForNewItem' && historyIndex > -1 && isMobile) {
          openFullScreenViewer(
              history.map(item => ({ url: item.url, transform: item.transform })),
              historyIndex,
              'history'
          );
          setPendingAction(null); // Clear the action
      }
  }, [pendingAction, history, historyIndex, openFullScreenViewer, isMobile]);


  // --- Mobile-specific touch handlers for tool panel ---
  const handleToolsTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('input[type="range"]')) {
        return;
    }
    if (e.touches.length === 1 && toolsContainerRef.current) {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      gestureLockRef.current = null;
    }
  }, []);

  const handleToolsTouchMove = useCallback((e: React.TouchEvent) => {
      if (!swipeStartRef.current || e.touches.length !== 1 || !toolsContainerRef.current) return;

      const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
      const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
      
      if (gestureLockRef.current === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          gestureLockRef.current = Math.abs(deltaY) > Math.abs(deltaX) ? 'vertical' : 'horizontal';
      }

      const { scrollTop, scrollHeight, clientHeight } = toolsContainerRef.current;
      if (gestureLockRef.current === 'vertical' && (scrollTop > 0 || deltaY < 0) && (scrollTop < scrollHeight - clientHeight || deltaY > 0)) {
          // Allow native vertical scroll
      } else {
          e.preventDefault();
      }
  }, []);

  const handleToolsTouchEnd = useCallback((e: React.TouchEvent) => {
      if (!swipeStartRef.current || e.changedTouches.length !== 1) {
          swipeStartRef.current = null;
          gestureLockRef.current = null;
          return;
      }
      
      const deltaX = e.changedTouches[0].clientX - swipeStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - swipeStartRef.current.y;
      const swipeTime = Date.now() - swipeStartRef.current.time;

      if (gestureLockRef.current === 'vertical' && swipeTime < 300 && Math.abs(deltaY) > 50) {
          if(toolsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = toolsContainerRef.current;
            if ((deltaY < 0 && scrollTop >= scrollHeight - clientHeight - 5) || (deltaY > 0 && scrollTop <= 5)) {
                toggleToolbox();
            }
          }
      } else if (gestureLockRef.current === 'horizontal' && swipeTime < 400 && Math.abs(deltaX) > 60) {
          const availableTabs = TABS_CONFIG.filter(tab => isImageLoaded || ['studio'].includes(tab.id));
          const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);
          if (currentIndex === -1) {
              swipeStartRef.current = null;
              gestureLockRef.current = null;
              return;
          };

          let nextIndex;
          if (deltaX < 0) { // Swipe Left -> Next Tab
              nextIndex = (currentIndex + 1) % availableTabs.length;
          } else { // Swipe Right -> Previous Tab
              nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
          }
          const nextTab = availableTabs[nextIndex];
          if (nextTab) {
              handleTabChange(nextTab.id as Tab);
          }
      }
      
      swipeStartRef.current = null;
      gestureLockRef.current = null;
  }, [isImageLoaded, activeTab, toggleToolbox, handleTabChange]);

  const handleGenerateCreativePrompt = useCallback(async () => {
    if (!currentImage) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return;
    }
    setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStudioAnalysis')}));
    try {
        const subjectFiles = [currentImage, ...studioSubjects];
        const newPrompt = await generateCreativePrompt(subjectFiles, studioStyleFile, studioOutfitFiles, studioPrompt);
        setStudioState(s => ({...s, prompt: newPrompt}));
    } catch (err) {
        handleApiError(err, 'errorFailedToProcessImage');
    } finally {
        setUiState(s => ({...s, isLoading: false}));
    }
}, [currentImage, studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt, handleApiError, t]);

    // Global listeners for expansion drag
    useEffect(() => {
        const moveHandler = (e: MouseEvent | TouchEvent) => {
            if (expansionDrag) {
                handleExpansionDragMove(e);
            }
        };
        const endHandler = () => {
            if (expansionDrag) {
                handleExpansionDragEnd();
            }
        };

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
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hideControlsTimeoutRef.current) {
                window.clearTimeout(hideControlsTimeoutRef.current);
            }
        };
    }, []);

    // Show controls when image is loaded
    useEffect(() => {
        if (isImageLoaded) {
            showControls();
        }
    }, [isImageLoaded, showControls]);

  return {
    t,
    beforeImageUrl,
    // State
    currentImage, currentImageUrl, currentThumbnailUrl, imageDimensions, history, historyIndex, results, isGeneratingResults, expectedResultsCount, resultsBaseHistoryIndex,
    isLoading, loadingMessage, error, activeTab, isToolboxOpen, isComparing,
    retouchPrompt, selectionMode, editHotspot, brushMode, brushSize,
    studioPrompt, studioStyleFile, studioSubjects, studioOutfitFiles,
    expandPrompt, hasExpansion, expandActiveAspect, expandPadding,
    extractPrompt, extractHistory, extractedHistoryItemUrls,
    isHistoryExpanded,
    scale, position, transformString,
    isPanning, isPinching, isZoomControlsVisible, isInteracting, isDrawing, mousePosition, hotspotDisplayPosition,
    canUndo, canRedo, isMobile, isLandscape, windowSize, isKeyboardOpen, isMobileRetouchInputActive, isMobileToolbarVisible,
    idPhotoGender,
    generatePrompt, generateAspectRatio, generateNumImages,
    overlayStyle,
    // Refs
    imgRef, maskCanvasRef, retouchPromptInputRef, imageViewerRef, toolsContainerRef,
    // Viewer Handlers
    handleViewerMouseDown, handleViewerMouseMove, handleViewerMouseUp, handleViewerWheel, handleViewerTouchStart, handleViewerTouchMove, handleViewerTouchEnd, handleViewerClick,
    // Setters & Actions
    handleFileSelect, handleDownload, handleUndo, handleRedo, handleResetHistory, handleStartOver,
    handleGenerate, handleApplyAdjustment, handleApplyMultipleAdjustments, handleApplyFilter, handleGenerateIdPhoto, handleGenerateExpandedImage, handleGenerateExtract, handleGeneratePhotoshoot, handleGenerateCreativePrompt, handleGenerateImageFromText,
    handleHistoryPillClick, handleResultPillClick,
    handleApplyTransform,
    setRetouchState, setExpandState, setStudioState, setExtractState, setComparisonState, setIdPhotoGender, setGenerateState,
    handleTabChange,
    handleTabChangeAndOpen,
    handleSelectionModeChange,
    toggleToolbox,
    clearMask, isMaskPresent,
    resetView, handleZoom,
    setMousePosition,
    handleCanvasInteraction,
    handleExpansionDragStart,
    handleClearExtractHistory, handleUseExtractedAsOutfit, handleDownloadExtractedItem, handleViewExtractedItem,
    handleStudioAddSubject, handleStudioRemoveSubject, handleStudioAddOutfitFile, handleStudioRemoveOutfitFile,
    setExpansionByAspect,
    setIsHistoryExpanded,
    handleToolsTouchStart, handleToolsTouchMove, handleToolsTouchEnd,
    handleRequestFileUpload,
    mobileInputKey, // For re-triggering mobile input focus
    // Fullscreen viewer
    isViewerOpen, viewerItems, viewerInitialIndex, viewerType, viewerComparisonUrl,
    setFullscreenViewerState, triggerDownload, handleSelectFromViewer,
    showControls,
  };
};