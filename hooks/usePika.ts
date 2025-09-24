

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


// Fix: Added missing React import to resolve errors with event types.
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
    generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateEditedImageWithMaskStream,
    generateExtractedItem,
    generateIdPhoto, generatePhotoshootImage, generateCompositeImage, generatePromptFromStyleImage, type IdPhotoOptions, RateLimitError, dataURLtoFile,
    APIError, NetworkError, InvalidInputError, ContentSafetyError, ModelExecutionError,
    getPrompt,
    generateCreativePrompt,
    inferOutfitFromPrompt,
    generateOutfitDescriptionFromFiles
} from '../services/geminiService';
import { useTranslation } from '../contexts/LanguageContext';
import { SelectionMode, BrushMode } from '../components/RetouchPanel';
import type { TranslationKey } from '../translations';
import { TABS_CONFIG } from '../components/EditorSidebar';
import { useHistory, initialTransformState, type HistoryItem, type TransformState } from './useHistory';
import { useViewer } from './useViewer';


export type Tab = 'retouch' | 'idphoto' | 'adjust' | 'expand' | 'studio';
export type TransformType = 'rotate-cw' | 'rotate-ccw' | 'flip-h' | 'flip-v';
type ExpansionHandle = 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'br' | 'bl';
export type Gender = 'male' | 'female';

type FullscreenViewerState = {
  isOpen: boolean;
  items: Array<{ url: string; transform: TransformState; }>;
  initialIndex: number;
  type: 'history' | 'result' | 'extract';
  comparisonUrl: string | null;
  context?: {
    extractSetIndex?: number;
  }
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

  // --- VIEWER STATE (from hook) ---
  const isImageLoaded = !!currentHistoryItem;
  const isMobile = useMemo(() => windowSize.width < 1024, [windowSize.width]);
  const viewerManager = useViewer({ isComparing: comparisonState.isComparing, isMobile, isImageLoaded });
  const { scale, position, isPanning, isPinching, isViewingOriginalOnHold, isControlsVisible: isZoomControlsVisible, isInteracting, resetView, handleZoom, ...viewerHandlers } = viewerManager;

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
    styleInfluence: 0.7,
    subjects: [] as File[],
    outfitFiles: [] as File[],
  });

  const [extractState, setExtractState] = useState({
    prompt: '',
    history: [] as File[][]
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
  const [activeExpansionHandle, setActiveExpansionHandle] = useState<ExpansionHandle | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, initialPadding: typeof expandState.padding } | null>(null);
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [mobileInputKey, setMobileInputKey] = useState(Date.now());
  const [idPhotoGender, setIdPhotoGender] = useState<Gender>('female');

  // --- REFS ---
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const retouchPromptInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const initialWindowHeightRef = useRef(window.innerHeight);
  const prevStudioStyleFileRef = useRef<File | null>();
  
  // --- DECONSTRUCTED STATE ---
  const { isLoading, loadingMessage, error } = uiState;
  const { activeTab, isOpen: isToolboxOpen } = toolboxState;
  const { prompt: retouchPrompt, selectionMode, editHotspot, brushMode, brushSize } = retouchState;
  const { prompt: studioPrompt, styleFile: studioStyleFile, styleInfluence: studioStyleInfluence, subjects: studioSubjects, outfitFiles: studioOutfitFiles } = studioState;
  const { padding: expansionPadding, prompt: expandPrompt, activeAspect: expandActiveAspect } = expandState;
  const { prompt: extractPrompt, history: extractHistory } = extractState;
  const { items: results, isGenerating: isGeneratingResults, expectedCount: expectedResultsCount, baseHistoryIndex: resultsBaseHistoryIndex } = resultsState;
  const { isComparing } = comparisonState;
  const { isOpen: isViewerOpen, items: viewerItems, initialIndex: viewerInitialIndex, type: viewerType, comparisonUrl: viewerComparisonUrl } = fullscreenViewerState;

  // --- DERIVED STATE ---
  // FIX: Explicitly cast `p` to a number to resolve a type inference issue where `p` was being treated as `unknown`.
  const hasExpansion = Object.values(expansionPadding).some(p => (p as number) > 0);
  const isKeyboardOpen = isMobile && windowSize.height < initialWindowHeightRef.current * 0.9;
  const currentImage = useMemo(() => currentHistoryItem?.file ?? null, [currentHistoryItem]);
  const currentImageUrl = useMemo(() => currentHistoryItem?.url ?? null, [currentHistoryItem]);
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

  const handleImageUpload = useCallback((file: File) => {
    setUiState(s => ({ ...s, error: null }));
    historyDispatch({ type: 'RESET_ALL' }); 
    
    clearMask();
    setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
    setExtractState({ prompt: '', history: [] });
    setComparisonState({ isComparing: false });
    setStudioState(s => ({ ...s, prompt: '', styleFile: null, subjects: [], outfitFiles: [] }));
    setResultsState({ items: [], isGenerating: false, expectedCount: 1, sourceTab: null, persistentItems: [], baseHistoryIndex: null });
    setIdPhotoGender('female');
    
    const newItem: HistoryItem = { file, url: URL.createObjectURL(file), transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });
  }, [clearMask, historyDispatch]);

  const onEditComplete = useCallback(() => {
    if (isMobile) {
      setToolboxState(s => ({ ...s, isOpen: false }));
    }
  }, [isMobile]);

  const handleTabChange = useCallback((newTab: Tab) => {
    setToolboxState(s => ({ ...s, activeTab: newTab }));
  }, []);

  const toggleToolbox = useCallback(() => setToolboxState(s => ({ ...s, isOpen: !s.isOpen })), []);
  

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), transform: { ...initialTransformState } };
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
    // FIX: Although the reported error was not reproducible, a potential stale closure bug was identified.
    // Added `setUiState` to the dependency array to prevent `handleApiError` from using a stale state setter.
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

  const handleSelectFromResult = useCallback((imageUrl: string) => {
    const newImageFile = dataURLtoFile(imageUrl, `result-${Date.now()}.png`);
    if (history.length === 0 || historyIndex === -1) {
        handleImageUpload(newImageFile);
        return;
    }
    const baseIndex = resultsBaseHistoryIndex !== null ? resultsBaseHistoryIndex : historyIndex;
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), transform: { ...initialTransformState } };
    historyDispatch({ type: 'SET_FROM_RESULT', payload: { baseIndex, item: newItem } });
    clearMask();
    setRetouchState(s => ({ ...s, editHotspot: null, prompt: '' }));
  }, [history.length, historyIndex, resultsBaseHistoryIndex, handleImageUpload, clearMask, historyDispatch, handleUseExtractedAsOutfit]);

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
    if (type === 'history') {
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
  }, [fullscreenViewerState, handleHistorySelect, handleSelectFromResult, extractHistory, handleUseExtractedAsOutfit]);

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
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.arc(editHotspot.x, editHotspot.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
            finalMaskUrl = pointCanvas.toDataURL('image/png');
        }
        const stream = generateEditedImageWithMaskStream(imageToProcess, finalPromptToUse, finalMaskUrl);
        for await (const imageUrl of stream) {
            addImageToHistory(dataURLtoFile(imageUrl, `edited-${Date.now()}.png`));
            break; 
        }
        onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({ ...s, isLoading: false })); }
  };

  const handleApplyAdjustment = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToAdjust')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingAdjustment'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
      const imageUrl = await generateAdjustedImage(await getCommittedImage(), prompt);
      addImageToHistory(dataURLtoFile(imageUrl, `adjusted-${Date.now()}.png`));
      onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToApplyAdjustment'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage]);
  
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
    } catch (err) { handleApiError(err, 'errorFailedToApplyAdjustment'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [currentImage, t, handleApiError, historyIndex, activeTab, isMobile, getCommittedImage]);

  const handleApplyFilter = useCallback(async (prompt: string) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoadedToFilter')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingFilter'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
      const imageUrl = await generateFilteredImage(await getCommittedImage(), prompt);
      addImageToHistory(dataURLtoFile(imageUrl, `filtered-${Date.now()}.png`));
      onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToApplyFilter'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage]);

  const handleGenerateExpandedImage = useCallback(async (prompt: string) => {
    if (!currentImage || !hasExpansion) return;
    setUiState({ isLoading: true, loadingMessage: t('loadingExpansion'), error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
        const imageToProcess = await getCommittedImage();
        const imageToProcessUrl = URL.createObjectURL(imageToProcess);
        const tempImg = new Image(); tempImg.src = imageToProcessUrl; await tempImg.decode();
        URL.revokeObjectURL(imageToProcessUrl);
        const { width: naturalWidth, height: naturalHeight } = tempImg;
        const totalWidth = naturalWidth + expansionPadding.left + expansionPadding.right;
        const totalHeight = naturalHeight + expansionPadding.top + expansionPadding.bottom;
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth; canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context for expansion.");
        ctx.drawImage(tempImg, expansionPadding.left, expansionPadding.top, naturalWidth, naturalHeight);
        const finalPrompt = prompt;
        const imageUrl = await generateExpandedImage(canvas.toDataURL('image/png'), finalPrompt);
        addImageToHistory(dataURLtoFile(imageUrl, `expanded-${Date.now()}.png`));
        setExpandState({ prompt: '', padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null });
        onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToExpandImage'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setActiveExpansionHandle(null);
    }
  }, [currentImage, addImageToHistory, expansionPadding, hasExpansion, t, handleApiError, onEditComplete, getCommittedImage]);
  
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
        addImageToHistory(dataURLtoFile(imageUrl, `idphoto-${Date.now()}.png`));
        onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, addImageToHistory, t, handleApiError, onEditComplete, getCommittedImage]);

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
                generatePhotoshootImage(imageToProcess, finalPrompt, outfitDescription, studioStyleFile, studioStyleFile ? studioStyleInfluence : undefined, studioOutfitFiles)
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
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [currentImage, studioSubjects, studioPrompt, studioStyleFile, t, handleApiError, historyIndex, activeTab, isMobile, studioStyleInfluence, getCommittedImage, studioOutfitFiles]);
  
  const handleRequestFileUpload = useCallback(() => document.getElementById('image-upload-main')?.click(), []);
  
  const handleDownload = useCallback(() => {
    if (!currentImage || !currentImageUrl) { setUiState(s => ({...s, error: t('errorCouldNotFindImage')})); return; }
    triggerDownload(currentImageUrl, currentImage.type.split('/')[1] || 'png');
  }, [currentImage, currentImageUrl, t, triggerDownload]);

  const setExpansionByAspect = useCallback((aspect: number | null) => {
      setExpandState(s => ({...s, activeAspect: aspect}));
      if (!imgRef.current || !imageDimensions || aspect === null) {
          if(aspect === null) setExpandState(s => ({...s, padding: {top:0,right:0,bottom:0,left:0}}));
          return;
      }
      const { width: w, height: h } = imageDimensions;
      const currentAspect = w / h;
      let newWidth = w, newHeight = h;
      if (aspect > currentAspect) newWidth = h * aspect; else newHeight = w / aspect;
      const padX = Math.round((newWidth - w) / 2), padY = Math.round((newHeight - h) / 2);
      setExpandState(s => ({...s, padding: { top: padY, bottom: padY, left: padX, right: padX }}));
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

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imgRef.current || !imageViewerRef.current) return null;
    
    const pointer = ('touches' in e && e.touches.length > 0) 
        ? e.touches[0] 
        : ('changedTouches' in e && e.changedTouches.length > 0)
        ? e.changedTouches[0]
        : ('clientX' in e ? e : null);

    if (!pointer) return null;

    const { clientX, clientY } = pointer;
    const img = imgRef.current;
    
    const container = img.parentElement;
    if (!container) {
        return null;
    }
    const elementRect = container.getBoundingClientRect();
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const elementRatio = elementRect.width / elementRect.height;

    let renderedWidth, renderedHeight;
    if (naturalRatio > elementRatio) {
      // Image is wider than its container aspect ratio, so it's letterboxed vertically
      renderedWidth = elementRect.width;
      renderedHeight = elementRect.width / naturalRatio;
    } else {
      // Image is taller than its container aspect ratio, so it's letterboxed horizontally
      renderedHeight = elementRect.height;
      renderedWidth = elementRect.height * naturalRatio;
    }

    // This calculates the position of the visible image content within the container's box
    const renderedLeft = elementRect.left + (elementRect.width - renderedWidth) / 2;
    const renderedTop = elementRect.top + (elementRect.height - renderedHeight) / 2;

    const rect = {
        left: renderedLeft,
        top: renderedTop,
        width: renderedWidth,
        height: renderedHeight,
    };

    let normX = (clientX - rect.left) / rect.width;
    let normY = (clientY - rect.top) / rect.height;

    const { rotate, scaleX, scaleY } = currentTransform;

    if (scaleX === -1) {
      normX = 1 - normX;
    }
    if (scaleY === -1) {
      normY = 1 - normY;
    }

    const tempX = normX;
    if (rotate === 90) {
      normX = normY;
      normY = 1 - tempX;
    } else if (rotate === 180) {
      normX = 1 - normX;
      normY = 1 - normY;
    } else if (rotate === 270) {
      normX = 1 - normY;
      normY = tempX;
    }
    
    const x = normX * img.naturalWidth;
    const y = normY * img.naturalHeight;
    
    if (x < 0 || x > img.naturalWidth || y < 0 || y > img.naturalHeight) return null;
    return { x, y };
  };

  const handleViewerClick = (e: React.MouseEvent) => {
    if (activeTab === 'retouch' && selectionMode === 'point') {
        const coords = getRelativeCoords(e);
        if (coords) {
            setRetouchState(s => ({...s, editHotspot: coords }));
            setMobileInputKey(Date.now());
        }
    }
  };
  
  const drawOnCanvas = useCallback((point: { x: number; y: number }) => {
    const canvas = maskCanvasRef.current, ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize * (canvas.width / imageViewerRef.current!.clientWidth) / scale;
    ctx.globalCompositeOperation = brushMode === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushMode === 'erase' ? 'rgba(0,0,0,1)' : 'white';
    if (lastDrawPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
    lastDrawPointRef.current = point;
  }, [brushSize, brushMode, scale]);
  
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'start' | 'move' | 'end') => {
    if (activeTab !== 'retouch' || selectionMode !== 'brush' || ('touches' in e && e.touches.length > 1)) return;
    e.stopPropagation(); if ('preventDefault' in e) e.preventDefault();
    const coords = getRelativeCoords(e);
    if (type === 'start' && coords) {
        setIsDrawing(true); lastDrawPointRef.current = coords; drawOnCanvas(coords);
    } else if (type === 'move') {
        if ('clientX' in e && imageViewerRef.current) {
            const viewerRect = imageViewerRef.current.getBoundingClientRect();
            setMousePosition({ x: e.clientX - viewerRect.left, y: e.clientY - viewerRect.top });
        }
        if (isDrawing && coords) drawOnCanvas(coords);
    } else if (type === 'end') {
        if ('touches' in e && e.touches.length > 0) return;
        setIsDrawing(false); lastDrawPointRef.current = null;
    }
  };

  const handleExpansionDragStart = (e: React.MouseEvent | React.TouchEvent, handle: ExpansionHandle) => {
    e.stopPropagation(); setActiveExpansionHandle(handle);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY, initialPadding: expansionPadding });
  };

  const handleExpansionDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeExpansionHandle || !dragStart || !imgRef.current || !imageDimensions) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX, clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStart.x, deltaY = clientY - dragStart.y;
    const imgRect = imgRef.current.getBoundingClientRect();
    const pixelToImageRatioX = imageDimensions.width / imgRect.width, pixelToImageRatioY = imageDimensions.height / imgRect.height;
    let newPadding = { ...dragStart.initialPadding };
    if (activeExpansionHandle.includes('l')) newPadding.left = Math.max(0, dragStart.initialPadding.left - deltaX * pixelToImageRatioX);
    if (activeExpansionHandle.includes('r')) newPadding.right = Math.max(0, dragStart.initialPadding.right + deltaX * pixelToImageRatioX);
    if (activeExpansionHandle.includes('t')) newPadding.top = Math.max(0, dragStart.initialPadding.top - deltaY * pixelToImageRatioY);
    if (activeExpansionHandle.includes('b')) newPadding.bottom = Math.max(0, dragStart.initialPadding.bottom + deltaY * pixelToImageRatioY);
    setExpandState(s => ({...s, padding: newPadding, activeAspect: null}));
  }, [activeExpansionHandle, dragStart, imageDimensions]);

  const handleExpansionDragEnd = useCallback(() => { setActiveExpansionHandle(null); setDragStart(null); }, []);
  
  const handleToolsTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      // Prevent swipe gesture when interacting with inputs, textareas.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        swipeStartRef.current = null;
        return;
      }
      if (e.touches.length === 1) {
          swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
          gestureLockRef.current = null;
      } else {
          swipeStartRef.current = null;
      }
  }, []);

  const handleToolsTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeStartRef.current || e.touches.length !== 1) return;
      if (gestureLockRef.current === null) {
          const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
          const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
          if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
              gestureLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
          }
      }
      if (gestureLockRef.current === 'horizontal') e.preventDefault();
  }, []);

  const handleToolsTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (gestureLockRef.current !== 'horizontal' || !swipeStartRef.current || e.changedTouches.length !== 1) {
          swipeStartRef.current = null;
          gestureLockRef.current = null;
          return;
      }
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      const deltaY = touch.clientY - swipeStartRef.current.y;
      const deltaTime = Date.now() - swipeStartRef.current.time;
      if (deltaTime < 500 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 75) {
          const availableTabs = TABS_CONFIG.filter(tab => tab.id === 'studio' || !!currentImage);
          const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);
          if (currentIndex !== -1) {
              let nextIndex = deltaX < 0 ? (currentIndex + 1) % availableTabs.length : (currentIndex - 1 + availableTabs.length) % availableTabs.length;
              handleTabChange(availableTabs[nextIndex].id as Tab);
          }
      }
      swipeStartRef.current = null;
      gestureLockRef.current = null;
  }, [currentImage, handleTabChange, activeTab]);

  const handleGenerateCreativePrompt = useCallback(async () => {
    const subjectFiles = [currentImage, ...studioSubjects].filter((f): f is File => f !== null);

    if (subjectFiles.length === 0) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return;
    }

    const userKeywords = studioPrompt;

    setUiState({ isLoading: true, loadingMessage: t('loadingStudioAnalysis'), error: null });
    try {
      const newPrompt = await generateCreativePrompt(
        subjectFiles, 
        studioStyleFile,
        studioOutfitFiles,
        userKeywords,
      );
      setStudioState(s => ({...s, prompt: newPrompt}));
    } catch (err) {
      handleApiError(err, 'errorFailedToGenerate');
    } finally {
      setUiState(s => ({...s, isLoading: false}));
    }
  }, [currentImage, studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt, handleApiError, t]);

  // --- USE EFFECTS ---
  
  useEffect(() => {
    prevStudioStyleFileRef.current = studioStyleFile;
  }, [studioStyleFile]);
  const prevStudioStyleFile = prevStudioStyleFileRef.current;

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (studioStyleFile && studioStyleFile !== prevStudioStyleFile && currentImage) {
        const generate = async () => {
            setUiState(s => ({ ...s, isLoading: true, loadingMessage: t('loadingStyle') }));
            try {
                const newPrompt = await generatePromptFromStyleImage(studioStyleFile, false); // false for scene
                setStudioState(s => ({ ...s, prompt: newPrompt }));
            } catch (err) {
                handleApiError(err, 'errorFailedToGenerate');
            } finally {
                setUiState(s => ({ ...s, isLoading: false }));
            }
        };
        generate();
    }
  }, [studioStyleFile, prevStudioStyleFile, currentImage, handleApiError, t]);

  useEffect(() => {
    setRetouchState(s => ({ ...s, editHotspot: null }));
    clearMask();
    setExpandState(s => ({...s, padding: { top: 0, right: 0, bottom: 0, left: 0 }}));
    if (activeTab === 'idphoto') resetView();
  }, [activeTab, clearMask, resetView]);
  
  useEffect(() => {
    if (imgRef.current && maskCanvasRef.current) {
        const img = imgRef.current;
        const canvas = maskCanvasRef.current;
        const setCanvasSize = () => {
            if (img.naturalWidth > 0) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                clearMask();
            }
        };
        if (img.complete) setCanvasSize(); else img.addEventListener('load', setCanvasSize);
        return () => img.removeEventListener('load', setCanvasSize);
    } else {
        setImageDimensions(null);
    }
  }, [currentImageUrl, clearMask]);

  useLayoutEffect(() => {
    if (editHotspot && activeTab === 'retouch' && selectionMode === 'point' && imgRef.current && imageViewerRef.current) {
        const img = imgRef.current, viewer = imageViewerRef.current;
        const { naturalWidth, naturalHeight } = img;
        if (naturalWidth === 0) { setHotspotDisplayPosition(null); return; }
        const viewerRect = viewer.getBoundingClientRect(), imgRect = img.getBoundingClientRect();
        const finalX = (imgRect.left - viewerRect.left) + (editHotspot.x / naturalWidth * imgRect.width);
        const finalY = (imgRect.top - viewerRect.top) + (editHotspot.y / naturalHeight * imgRect.height);
        setHotspotDisplayPosition({ left: finalX, top: finalY });
    } else {
        setHotspotDisplayPosition(null);
    }
  }, [editHotspot, activeTab, selectionMode, scale, position, currentImageUrl, isToolboxOpen, windowSize, currentTransform]);

  useEffect(() => {
    if (activeTab === 'retouch' && selectionMode === 'point' && editHotspot) {
      const timer = setTimeout(() => {
        if (window.innerWidth >= 1024) retouchPromptInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editHotspot, activeTab, selectionMode]);

  useEffect(() => {
    const allUrls = extractHistory.map(set => set.map(item => URL.createObjectURL(item)));
    setExtractedHistoryItemUrls(allUrls);
    return () => { allUrls.forEach(urlSet => urlSet.forEach(url => URL.revokeObjectURL(url))); };
  }, [extractHistory]);

  useEffect(() => {
    if (activeExpansionHandle) {
      window.addEventListener('mousemove', handleExpansionDrag); window.addEventListener('mouseup', handleExpansionDragEnd);
      window.addEventListener('touchmove', handleExpansionDrag); window.addEventListener('touchend', handleExpansionDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleExpansionDrag); window.removeEventListener('mouseup', handleExpansionDragEnd);
      window.removeEventListener('touchmove', handleExpansionDrag); window.removeEventListener('touchend', handleExpansionDragEnd);
    };
  }, [activeExpansionHandle, handleExpansionDrag, handleExpansionDragEnd]);

  return {
    t,
    // State Values
    isLoading, loadingMessage, error, activeTab, isToolboxOpen, history, historyIndex, scale, position, isPanning, 
    retouchPrompt, selectionMode, editHotspot, brushMode, brushSize,
    studioPrompt, studioStyleFile, studioStyleInfluence, studioSubjects, studioOutfitFiles,
    expansionPadding, expandPrompt, expandActiveAspect, hasExpansion,
    extractPrompt, extractHistory, results, isGeneratingResults, expectedResultsCount,
    resultsBaseHistoryIndex,
    isComparing, isViewingOriginalOnHold, isViewerOpen, viewerItems, viewerInitialIndex, viewerType, viewerComparisonUrl,
    hotspotDisplayPosition, isDrawing, mousePosition, extractedHistoryItemUrls, isHistoryExpanded,
    isPinching, isZoomControlsVisible, imageDimensions, windowSize, isInteracting, mobileInputKey, idPhotoGender,
    
    // Derived State
    isMobile, isKeyboardOpen, currentHistoryItem, currentImage, currentImageUrl, transformString, beforeImageUrl,
    isMobileRetouchInputActive, isMobileToolbarVisible, canUndo, canRedo,
    
    // Refs for DOM elements
    imgRef, maskCanvasRef, imageViewerRef, toolsContainerRef, retouchPromptInputRef,

    // State Setters
    setUiState, setToolboxState, setRetouchState, setExpandState, setStudioState, setExtractState, setResultsState,
    setComparisonState: (update) => setComparisonState(typeof update === 'function' ? update(comparisonState) : update), setFullscreenViewerState, setDownloadCounter, setHotspotDisplayPosition, setIsDrawing,
    setMousePosition, setActiveExpansionHandle, setDragStart, setExtractedHistoryItemUrls, setIsHistoryExpanded,
    setImageDimensions, setMobileInputKey, setIdPhotoGender,
    
    // Core Handlers
    handleImageUpload, handleStartOver, handleHistorySelect, handleUndo, handleRedo, handleResetHistory, handleApplyTransform,
    handleFileSelect, toggleToolbox, onEditComplete, handleDownload, handleApiError,
    
    // Viewer Handlers
    ...viewerHandlers,
    resetView, handleZoom,

    // Feature-specific handlers
    handleTabChange, handleToolsTouchStart, handleToolsTouchMove, handleToolsTouchEnd,
    clearMask, isMaskPresent, handleSelectFromResult, openFullScreenViewer, handleHistoryPillClick, handleResultPillClick,
    handleSelectFromViewer, getCommittedImage, handleGenerate, handleApplyAdjustment, handleApplyMultipleAdjustments,
    handleApplyFilter, handleGenerateExpandedImage, handleGenerateExtract, triggerDownload,
    handleDownloadExtractedItem, handleGenerateIdPhoto, handleGeneratePhotoshoot, handleStudioAddSubject, handleStudioRemoveSubject,
    handleStudioAddOutfitFile, handleStudioRemoveOutfitFile,
    handleRequestFileUpload, setExpansionByAspect,
    getRelativeCoords, handleViewerClick, drawOnCanvas, handleCanvasInteraction, handleExpansionDragStart,
    dataURLtoFile, addImageToHistory, handleGenerateCreativePrompt, handleUseExtractedAsOutfit,
    handleClearExtractHistory, handleViewExtractedItem
  };
};