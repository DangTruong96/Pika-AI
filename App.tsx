/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


// Fix: Corrected syntax error in import statement to correctly import React hooks.
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo, useReducer } from 'react';
import jsPDF from 'jspdf';
// Lazy-loaded imports for docx and xlsx are handled via dynamic import() now.

// Fix: Corrected import to use generateEditedImageWithMaskStream as the original function was removed.
import {
    generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateEditedImageWithMaskStream,
    generateCompositeImage, generateScannedDocument, generateScannedDocumentWithCorners, generateExtractedItem,
    removePeopleFromImage, generateDocumentStructure, generateIdPhoto, generatePhotoshootImage, generateOutfitDescription,
    generatePromptFromStyleImage, type Corners, type Enhancement, type IdPhotoOptions, RateLimitError, dataURLtoFile,
    autoCropImage, APIError, NetworkError, InvalidInputError, ContentSafetyError, ModelExecutionError, inferOutfitFromPrompt,
    generateRefinedPrompt,
    generateCreativePrompt
} from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import EditorSidebar, { TABS_CONFIG, type PoseStyle } from './components/EditorSidebar';
import ScanViewerModal from './components/ScanViewerModal';
import { ArrowsPointingOutIcon, ZoomInIcon, ZoomOutIcon, UploadIcon, PaperAirplaneIcon, UndoIcon, RedoIcon, FlipHorizontalIcon, FlipVerticalIcon, ChevronsLeftRightIcon, EyeIcon, EyeSlashIcon, PlusCircleIcon, SparklesIcon, XMarkIcon, SunIcon, PaletteIcon, DocumentScannerIcon, TagIcon, UsersIcon, FaceRestoreIcon, DownloadIcon, ChevronDownIcon, ClockIcon, ChevronUpIcon } from './components/icons';
import { useTranslation } from './contexts/LanguageContext';
import { SelectionMode, BrushMode } from './components/RetouchPanel';
import HistoryPills from './components/HistoryPills';
import FullScreenViewerModal from './components/FullScreenViewerModal';
// Fix: Correctly import TranslationKey from translations/index.ts.
import type { TranslationKey } from './translations';


export type Tab = 'retouch' | 'idphoto' | 'adjust' | 'expand' | 'insert' | 'scan' | 'extract' | 'studio';
export type TransformType = 'rotate-cw' | 'rotate-ccw' | 'flip-h' | 'flip-v';
type ExpansionHandle = 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'br' | 'bl';
export type Gender = 'male' | 'female';

// --- NEW TYPES FOR INSTANT TRANSFORMS ---
type TransformState = {
  rotate: number; // 0, 90, 180, 270
  scaleX: 1 | -1; // for horizontal flip
  scaleY: 1 | -1; // for vertical flip
};
const initialTransformState: TransformState = { rotate: 0, scaleX: 1, scaleY: 1 };
type HistoryItem = {
  file: File;
  url: string;
  transform: TransformState;
};

// --- REFACTORED STATE MANAGEMENT ---

// 1. History State
type HistoryState = {
  items: HistoryItem[];
  currentIndex: number;
};
const initialHistoryState: HistoryState = { items: [], currentIndex: -1 };

type HistoryAction =
  | { type: 'PUSH'; payload: { item: HistoryItem } }
  | { type: 'UNDO'; payload: { resultsBaseIndex: number | null } }
  | { type: 'REDO' }
  | { type: 'SELECT'; payload: { index: number } }
  | { type: 'SET_FROM_RESULT'; payload: { baseIndex: number; item: HistoryItem } }
  | { type: 'RESET_TO_FIRST' }
  | { type: 'RESET_ALL' };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const newHistory = state.items.slice(0, state.currentIndex + 1);
      state.items.slice(state.currentIndex + 1).forEach(item => URL.revokeObjectURL(item.url));
      newHistory.push(action.payload.item);
      return {
        items: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }
    case 'UNDO': {
        if (state.currentIndex <= 0) return state;
        const { resultsBaseIndex } = action.payload;
        const isAfterResultGeneration = resultsBaseIndex !== null && state.currentIndex > resultsBaseIndex;
        const newIndex = isAfterResultGeneration ? resultsBaseIndex : state.currentIndex - 1;
        return { ...state, currentIndex: newIndex };
    }
    case 'REDO': {
        if (state.currentIndex >= state.items.length - 1) return state;
        return { ...state, currentIndex: state.currentIndex + 1 };
    }
    case 'SELECT': {
        return { ...state, currentIndex: action.payload.index };
    }
    case 'SET_FROM_RESULT': {
        const { baseIndex, item } = action.payload;
        const newHistory = state.items.slice(0, baseIndex + 1);
        state.items.slice(baseIndex + 1).forEach(i => URL.revokeObjectURL(i.url));
        newHistory.push(item);
        return {
            items: newHistory,
            currentIndex: newHistory.length - 1,
        };
    }
    case 'RESET_TO_FIRST': {
        return state.items.length > 1 ? { ...state, currentIndex: 0 } : state;
    }
    case 'RESET_ALL': {
        state.items.forEach(item => URL.revokeObjectURL(item.url));
        return initialHistoryState;
    }
    default:
      return state;
  }
}

// 2. Viewer State
type ViewerState = {
  scale: number;
  position: { x: number; y: number; };
  isPanning: boolean;
  panStart: { startX: number; startY: number; initialPosition: { x: number; y: number; }; } | null;
};
const initialViewerState: ViewerState = { scale: 1, position: { x: 0, y: 0 }, isPanning: false, panStart: null };

type ViewerAction =
  | { type: 'ZOOM'; payload: { direction: 'in' | 'out'; amount?: number; }; }
  // Fix: Add SET_SCALE action to allow direct manipulation of the zoom level.
  | { type: 'SET_SCALE'; payload: { scale: number; }; }
  | { type: 'START_PAN'; payload: { clientX: number; clientY: number; }; }
  | { type: 'PAN'; payload: { clientX: number; clientY: number; }; }
  | { type: 'END_PAN'; }
  | { type: 'RESET'; };

function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'ZOOM': {
      const amount = action.payload.amount || 0.2;
      const newScale = action.payload.direction === 'in'
        ? state.scale * (1 + amount)
        : state.scale / (1 + amount);
      return { ...state, scale: Math.max(0.2, Math.min(newScale, 10)) };
    }
    // Fix: Add SET_SCALE action case to the reducer to handle direct scale changes.
    case 'SET_SCALE': {
        return { ...state, scale: Math.max(0.2, Math.min(action.payload.scale, 10)) };
    }
    case 'START_PAN': {
      return {
        ...state,
        isPanning: true,
        panStart: {
          startX: action.payload.clientX,
          startY: action.payload.clientY,
          initialPosition: { ...state.position }
        }
      };
    }
    case 'PAN': {
      if (!state.isPanning || !state.panStart) return state;
      const dx = action.payload.clientX - state.panStart.startX;
      const dy = action.payload.clientY - state.panStart.startY;
      return {
        ...state,
        position: {
          x: state.panStart.initialPosition.x + dx,
          y: state.panStart.initialPosition.y + dy,
        }
      };
    }
    case 'END_PAN': {
      return { ...state, isPanning: false, panStart: null };
    }
    case 'RESET':
      return initialViewerState;
    default:
      return state;
  }
}

const ImagePlaceholder: React.FC<{ onFileSelect: (files: FileList | null) => void }> = ({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8 transition-all duration-300 rounded-2xl border-2 bg-black/30 backdrop-blur-xl shadow-2xl shadow-black/30 ${isDraggingOver ? 'border-dashed border-cyan-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <label htmlFor="image-upload-main" className="flex flex-col items-center gap-4 cursor-pointer group">
            <div className="p-4 bg-white/5 rounded-full border border-white/10 transition-colors duration-200 group-hover:bg-white/10 group-hover:border-cyan-400/50">
              <UploadIcon className="w-12 h-12 text-gray-300" />
            </div>
            <span className="font-semibold text-cyan-300 group-hover:underline text-lg">
              {t('uploadImage')}
            </span>
        </label>
        <p className="text-sm text-gray-500">{t('dragAndDrop')}</p>
      </div>
    </div>
  );
};

const CompactMobileToolbar: React.FC<{
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenEditor: () => void;
  isImageLoaded: boolean;
  onRequestFileUpload: () => void;
}> = ({ activeTab, setActiveTab, onOpenEditor, isImageLoaded, onRequestFileUpload }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 p-1.5 z-[60] flex items-center justify-center gap-2 animate-slide-up pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS_CONFIG.map(tab => {
          const isTabDisabled = !isImageLoaded && !['insert', 'studio'].includes(tab.id);
          const isActive = activeTab === tab.id && !isTabDisabled;
          
          const handleTabClick = () => {
              if (isTabDisabled) {
                  onRequestFileUpload();
              } else {
                  setActiveTab(tab.id as Tab);
                  onOpenEditor();
              }
          };

          return (
            <button
              key={tab.id}
              onClick={handleTabClick}
              className={`relative p-3 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 ${
                isActive ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
              title={isTabDisabled ? t('uploadImage') : t(tab.tooltip as any)}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MobileRetouchInputBar: React.FC<{
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ prompt, onPromptChange, onGenerate, onCancel, isLoading }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small timeout to allow the keyboard animation to start
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-xl border-t border-white/10 p-2 z-[70] flex items-center gap-2 animate-slide-up pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <button
        type="button"
        onClick={onCancel}
        className="p-3 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
        aria-label="Cancel edit"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={t('retouchPlaceholderGenerative')}
        className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="p-3 bg-cyan-500 rounded-lg text-white transition-colors disabled:bg-cyan-800 disabled:opacity-70"
        disabled={isLoading || !prompt.trim()}
        aria-label="Generate edit"
      >
        <PaperAirplaneIcon className="w-6 h-6" />
      </button>
    </form>
  );
};


const App: React.FC = () => {
  const { t } = useTranslation();
  
  // --- STATE REFACTOR ---
  // Use reducers for complex, related state logic
  const [historyState, historyDispatch] = useReducer(historyReducer, initialHistoryState);
  const { items: history, currentIndex: historyIndex } = historyState;
  
  const [viewerState, viewerDispatch] = useReducer(viewerReducer, initialViewerState);
  const { scale, position, isPanning } = viewerState;

  // Group related simple states into single state objects
  const [uiState, setUiState] = useState({ isLoading: false, loadingMessage: '', error: null as string | null });
  const [toolboxState, setToolboxState] = useState({ activeTab: 'retouch' as Tab, isOpen: true });

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

  const [insertState, setInsertState] = useState({
    subjectFiles: [] as File[],
    styleFiles: [] as File[],
    backgroundFile: null as File | null,
    prompt: ''
  });
  
  const [studioState, setStudioState] = useState({
    prompt: '',
    // Fix: Initialized the `studioPoseStyle` state with 'automatic' to prevent it from being undefined and causing potential runtime errors.
    poseStyle: 'automatic' as PoseStyle,
    styleFile: null as File | null,
    styleInfluence: 0.7,
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

  const [scanState, setScanState] = useState({
    isManualMode: false,
    isModalOpen: false,
    scannedImageUrl: null as string | null,
    history: [] as string[],
    corners: null as Corners | null,
    activeCorner: null as keyof Corners | null,
    params: null as { enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean } | null,
    isDownloadingPdf: false,
    exportingDocType: null as 'word' | 'excel' | null,
    enhancement: 'color' as Enhancement,
    removeShadows: true,
    restoreText: false,
    removeHandwriting: false,
  });
  
  const [comparisonState, setComparisonState] = useState({ isComparing: false, isViewingOriginalOnHold: false });
  const [fullscreenViewerState, setFullscreenViewerState] = useState({
    isOpen: false,
    items: [] as string[],
    initialIndex: 0,
    type: 'history' as 'history' | 'result',
    comparisonUrl: null as string | null,
  });
  
  // States that remain separate (transient interaction, simple toggles, derived values)
  const [downloadCounter, setDownloadCounter] = useState(1);
  const [hotspotDisplayPosition, setHotspotDisplayPosition] = useState<{ left: number, top: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [activeExpansionHandle, setActiveExpansionHandle] = useState<ExpansionHandle | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, initialPadding: typeof expandState.padding } | null>(null);
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [isZoomControlsVisible, setIsZoomControlsVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isInteracting, setIsInteracting] = useState(false);
  const [mobileInputKey, setMobileInputKey] = useState(Date.now());
  const [idPhotoGender, setIdPhotoGender] = useState<Gender>('female');

  const { isLoading, loadingMessage, error } = uiState;
  const { activeTab, isOpen: isToolboxOpen } = toolboxState;
  const { prompt: retouchPrompt, selectionMode, editHotspot, brushMode, brushSize } = retouchState;
  const { subjectFiles: insertSubjectFiles, styleFiles: insertStyleFiles, backgroundFile: insertBackgroundFile, prompt: insertPrompt } = insertState;
  const { prompt: studioPrompt, poseStyle: studioPoseStyle, styleFile: studioStyleFile, styleInfluence: studioStyleInfluence } = studioState;
  const { padding: expansionPadding, prompt: expandPrompt, activeAspect: expandActiveAspect } = expandState;
  const { prompt: extractPrompt, history: extractHistory } = extractState;
  const { items: results, isGenerating: isGeneratingResults, expectedCount: expectedResultsCount, sourceTab: resultsSourceTab, persistentItems: persistentResults, baseHistoryIndex: resultsBaseHistoryIndex } = resultsState;
  const { isManualMode: isManualScanMode, isModalOpen: isScanModalOpen, scannedImageUrl, history: scanHistory, corners, activeCorner, params: scanParams, isDownloadingPdf, exportingDocType, enhancement: scanEnhancement, removeShadows: scanRemoveShadows, restoreText: scanRestoreText, removeHandwriting: scanRemoveHandwriting } = scanState;
  const { isComparing, isViewingOriginalOnHold } = comparisonState;
  const { isOpen: isViewerOpen, items: viewerItems, initialIndex: viewerInitialIndex, type: viewerType, comparisonUrl: viewerComparisonUrl } = fullscreenViewerState;

  const hasExpansion = Object.values(expansionPadding).some(p => p > 0);
  
  // --- Refs ---
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const retouchPromptInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const initialWindowHeightRef = useRef(window.innerHeight);
  const touchStartTimeRef = useRef<number>(0);
  const interactionTimeoutRef = useRef<number | null>(null);
  const prevIsKeyboardOpenRef = useRef<boolean | undefined>(undefined);
  
  // --- Derived State ---
  const isMobile = windowSize.width < 1024;
  const isKeyboardOpen = isMobile && windowSize.height < initialWindowHeightRef.current * 0.9;
  
  const currentHistoryItem = history[historyIndex] ?? null;
  const currentImage = currentHistoryItem?.file ?? null;
  const currentImageUrl = currentHistoryItem?.url ?? null;
  const currentTransform = currentHistoryItem?.transform ?? initialTransformState;
  const transformString = `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scaleX}, ${currentTransform.scaleY})`;
  const beforeHistoryItem = history[historyIndex - 1] ?? null;
  const beforeImageUrl = beforeHistoryItem?.url ?? null;

  const isMobileRetouchInputActive = isMobile && activeTab === 'retouch' && selectionMode === 'point' && !!editHotspot;
  const isMobileToolbarVisible = isMobile && !isToolboxOpen && !!currentImage && !isMobileRetouchInputActive;
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // --- Callbacks & Effects ---
  const onEditComplete = useCallback(() => {
    if (isMobile) {
      setToolboxState(s => ({ ...s, isOpen: false }));
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && activeTab === 'retouch' && selectionMode === 'point' && editHotspot) {
      if (prevIsKeyboardOpenRef.current === true && !isKeyboardOpen) {
        setRetouchState(s => ({ ...s, editHotspot: null }));
      }
    }
    prevIsKeyboardOpenRef.current = isKeyboardOpen;
  }, [isKeyboardOpen, isMobile, activeTab, selectionMode, editHotspot]);

  const handleTabChange = useCallback((newTab: Tab) => {
    setToolboxState(s => ({ ...s, activeTab: newTab }));
  }, []);

  const handleToolsTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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
          const availableTabs = TABS_CONFIG.filter(tab => tab.id === 'insert' || tab.id === 'studio' || !!currentImage);
          const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);
          if (currentIndex !== -1) {
              let nextIndex = deltaX < 0 ? (currentIndex + 1) % availableTabs.length : (currentIndex - 1 + availableTabs.length) % availableTabs.length;
              handleTabChange(availableTabs[nextIndex].id as Tab);
          }
      }
      swipeStartRef.current = null;
      gestureLockRef.current = null;
  }, [currentImage, handleTabChange, activeTab]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const reportInteraction = useCallback(() => {
    if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current);
    setIsInteracting(true);
    interactionTimeoutRef.current = window.setTimeout(() => setIsInteracting(false), 300);
  }, []);
  
  const toggleToolbox = useCallback(() => setToolboxState(s => ({ ...s, isOpen: !s.isOpen })), []);
  
  const resetView = useCallback(() => viewerDispatch({ type: 'RESET' }), []);

  const handleZoom = useCallback((direction: 'in' | 'out', amount: number = 0.2) => {
    reportInteraction();
    viewerDispatch({ type: 'ZOOM', payload: { direction, amount } });
  }, [reportInteraction]);

  const clearMask = useCallback(() => {
    const ctx = maskCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
  }, []);

  useEffect(() => {
    setRetouchState(s => ({ ...s, editHotspot: null }));
    setScanState(s => ({ ...s, isManualMode: false }));
    clearMask();
    setExpandState(s => ({...s, padding: { top: 0, right: 0, bottom: 0, left: 0 }}));
    // setStudioQuickActionState('select_pose');
    if (activeTab === 'idphoto') resetView();
  }, [activeTab, clearMask, resetView]);

  useEffect(() => {
    if (isComparing) resetView();
  }, [isComparing, resetView]);

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

  const showZoomControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
    setIsZoomControlsVisible(true);
    hideControlsTimeoutRef.current = window.setTimeout(() => setIsZoomControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
      if (currentImage) showZoomControls();
  }, [currentImage, showZoomControls]);

  useEffect(() => () => {
      if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
      if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current);
      history.forEach(item => URL.revokeObjectURL(item.url));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newItem: HistoryItem = { file: newImageFile, url: URL.createObjectURL(newImageFile), transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem }});
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    clearMask();
    setRetouchState(s => ({ ...s, editHotspot: null, prompt: '' }));
  }, [clearMask]);

  const handleApiError = useCallback((err: unknown, contextKey: TranslationKey) => {
    let errorMessage: string;
    if (err instanceof NetworkError) errorMessage = t('errorNetwork');
    else if (err instanceof InvalidInputError) errorMessage = t('errorInvalidInput');
    else if (err instanceof ContentSafetyError) errorMessage = t('errorContentSafety');
    else if (err instanceof ModelExecutionError) errorMessage = t('errorModelExecution');
    else if (err instanceof RateLimitError) errorMessage = t('errorRateLimit');
    else if (err instanceof APIError) errorMessage = `${t(contextKey)}. ${t('errorAPI')}`;
    else if (err instanceof Error) errorMessage = `${t(contextKey)}: ${err.message.includes("invalid data structure") ? t('errorFailedToExport') : err.message}`;
    else errorMessage = `${t(contextKey)}: ${t('errorAnErrorOccurred')}.`;
    setUiState(s => ({ ...s, error: errorMessage }));
    console.error("Error handled in UI:", err);
  }, [t]);

  const handleImageUpload = useCallback((file: File) => {
    setUiState(s => ({ ...s, error: null }));
    historyDispatch({ type: 'RESET_ALL' }); // Resets history and revokes URLs
    
    // Reset all other states
    clearMask();
    setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
    setInsertState({ subjectFiles: [file], styleFiles: [], backgroundFile: null, prompt: '' });
    setScanState(s => ({ ...s, history: [] }));
    setExtractState({ prompt: '', history: [] });
    setComparisonState({ isComparing: false, isViewingOriginalOnHold: false });
    setStudioState(s => ({ ...s, prompt: '', poseStyle: 'automatic', styleFile: null }));
    setResultsState({ items: [], isGenerating: false, expectedCount: 1, sourceTab: null, persistentItems: [], baseHistoryIndex: null });
    setIdPhotoGender('female');
    
    const newItem: HistoryItem = { file, url: URL.createObjectURL(file), transform: { ...initialTransformState } };
    historyDispatch({ type: 'PUSH', payload: { item: newItem } });
  }, [clearMask]);
  
  const handleStartOver = useCallback(() => {
    historyDispatch({ type: 'RESET_ALL' });
    setUiState(s => ({ ...s, error: null }));
    clearMask();
    setRetouchState({ prompt: '', selectionMode: 'point', editHotspot: null, brushMode: 'draw', brushSize: 30 });
    setInsertState({ subjectFiles: [], styleFiles: [], backgroundFile: null, prompt: '' });
    setScanState(s => ({ ...s, history: [] }));
    setExtractState({ prompt: '', history: [] });
    setComparisonState({ isComparing: false, isViewingOriginalOnHold: false });
    setStudioState(s => ({ ...s, prompt: '', poseStyle: 'automatic', styleFile: null }));
    setResultsState({ items: [], isGenerating: false, expectedCount: 1, sourceTab: null, persistentItems: [], baseHistoryIndex: null });
    setIdPhotoGender('female');
  }, [clearMask]);

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
  }, [clearMask, resultsBaseHistoryIndex]);

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
  }, [history.length, historyIndex, resultsBaseHistoryIndex, handleImageUpload, clearMask]);

  const openFullScreenViewer = useCallback((items: string[], index: number, type: 'history' | 'result') => {
      const historyItemUrls = history.map(item => item.url);
      const comparisonIndex = type === 'result' ? (resultsBaseHistoryIndex ?? 0) : Math.max(0, index - 1);
      setFullscreenViewerState({
          isOpen: true,
          items,
          initialIndex: index,
          type,
          comparisonUrl: historyItemUrls[comparisonIndex] ?? null
      });
  }, [history, resultsBaseHistoryIndex]);

  const handleHistoryPillClick = useCallback((index: number) => {
    if (isMobile) openFullScreenViewer(history.map(item => item.url), index, 'history');
    else handleHistorySelect(index);
  }, [isMobile, openFullScreenViewer, history, handleHistorySelect]);

  const handleResultPillClick = useCallback((url: string, index: number) => {
    if (isMobile) openFullScreenViewer(results, index, 'result');
    else handleSelectFromResult(url);
  }, [isMobile, openFullScreenViewer, results, handleSelectFromResult]);

  const handleSelectFromViewer = useCallback((url: string, index: number) => {
    if (viewerType === 'history') handleHistorySelect(index);
    else handleSelectFromResult(url);
    setFullscreenViewerState(s => ({...s, isOpen: false}));
  }, [viewerType, handleHistorySelect, handleSelectFromResult]);

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
    setUiState({ isLoading: true, loadingMessage: '', error: null });
    setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
    try {
        setUiState(s => ({ ...s, loadingMessage: t('loadingTranslate') }));
        const refinedPrompt = await generateRefinedPrompt(currentImage, finalPromptToUse);
        setUiState(s => ({ ...s, loadingMessage: t('loadingRetouch') }));
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
        const stream = generateEditedImageWithMaskStream(imageToProcess, refinedPrompt, finalMaskUrl);
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
    const successfulUrls: string[] = [];
    try {
        const imageToProcess = await getCommittedImage();
        const seeds = [1, 2, 3];
        for (const seed of seeds) {
            try {
                const imageUrl = await generateAdjustedImage(imageToProcess, prompt, seed);
                successfulUrls.push(imageUrl);
                setResultsState(s => ({ ...s, items: [...successfulUrls], persistentItems: [...successfulUrls] }));
            } catch (err) {
                console.warn(`Generation failed for seed ${seed}:`, err);
            }
        }
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
        let finalPrompt = prompt.trim() ? await generateRefinedPrompt(imageToProcess, prompt) : prompt;
        setUiState(s => ({...s, loadingMessage: t('loadingExpansion')}));
        const imageUrl = await generateExpandedImage(canvas.toDataURL('image/png'), finalPrompt);
        addImageToHistory(dataURLtoFile(imageUrl, `expanded-${Date.now()}.png`));
        setExpandState({ prompt: '', padding: { top: 0, right: 0, bottom: 0, left: 0 }, activeAspect: null });
        onEditComplete();
    } catch (err) { handleApiError(err, 'errorFailedToExpandImage'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setActiveExpansionHandle(null);
    }
  }, [currentImage, addImageToHistory, expansionPadding, hasExpansion, t, handleApiError, onEditComplete, getCommittedImage, expandPrompt]);
  
  const handleGenerateCompositeImage = useCallback(async () => {
    if (insertSubjectFiles.length === 0) { setUiState(s => ({...s, error: t('insertErrorNoSubjects')})); return; }
    if (!insertPrompt.trim()) { setUiState(s => ({...s, error: t('errorEnterDescription')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('generate'), error: null });
    setResultsState({ items: [], persistentItems: [], baseHistoryIndex: historyIndex, expectedCount: 3, isGenerating: true, sourceTab: activeTab });
    setIsHistoryExpanded(true);
    if(isMobile) setToolboxState(s => ({...s, isOpen: false}));
    const successfulUrls: string[] = [];
    try {
        const seeds = [1, 2, 3];
        for (const seed of seeds) {
            try {
                const imageUrl = await generateCompositeImage(insertBackgroundFile, insertSubjectFiles, insertStyleFiles, insertPrompt, seed);
                successfulUrls.push(imageUrl);
                setResultsState(s => ({...s, items: [...successfulUrls], persistentItems: [...successfulUrls]}));
            } catch (err) {
                 console.warn(`Composite generation failed for seed ${seed}:`, err);
            }
        }
        if (successfulUrls.length === 0) throw new Error("All composite image generations failed.");
    } catch(err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [insertSubjectFiles, insertStyleFiles, insertBackgroundFile, insertPrompt, historyIndex, t, handleApiError, activeTab, isMobile]);

  const handleGenerateScan = useCallback(async (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean) => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingScan'), error: null });
    try {
      const scannedUrl = await generateScannedDocument(await getCommittedImage(), enhancement, removeShadows, restoreText, removeHandwriting);
      setScanState(s => ({
          ...s,
          scannedImageUrl: scannedUrl,
          isModalOpen: true,
          history: !s.history.includes(scannedUrl) ? [...s.history, scannedUrl] : s.history,
          params: { enhancement, removeShadows, restoreText, removeHandwriting }
      }));
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, t, handleApiError, getCommittedImage]);

  const handleEnterManualMode = useCallback((): boolean => {
    if (!currentImage || !imgRef.current) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return false;
    }
    const { naturalWidth: w, naturalHeight: h } = imgRef.current;
    const paddingX = w * 0.05, paddingY = h * 0.05;
    setScanState(s => ({ ...s,
        corners: { tl: { x: paddingX, y: paddingY }, tr: { x: w - paddingX, y: paddingY }, bl: { x: paddingX, y: h - paddingY }, br: { x: w - paddingX, y: h - paddingY } },
        isManualMode: true
    }));
    return true;
  }, [currentImage, t]);
  
  const handleCancelManualMode = useCallback(() => {
    setScanState(s => ({...s, corners: null, activeCorner: null, isManualMode: false }));
  }, []);

  const handleGenerateManualScan = useCallback(async () => {
    if (!currentImage || !corners) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    if (!scanParams) { setUiState(s => ({...s, error: "Scan parameters not set."})); return; }
    setUiState({ isLoading: true, loadingMessage: t('loadingScan'), error: null });
    setScanState(s => ({...s, isManualMode: false}));
    try {
      const scannedUrl = await generateScannedDocumentWithCorners(await getCommittedImage(), corners, scanParams.enhancement, scanParams.removeShadows, scanParams.restoreText, scanParams.removeHandwriting);
      setScanState(s => ({
          ...s,
          scannedImageUrl: scannedUrl,
          isModalOpen: true,
          history: !s.history.includes(scannedUrl) ? [...s.history, scannedUrl] : s.history
      }));
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setScanState(s => ({...s, corners: null, activeCorner: null}));
    }
  }, [currentImage, corners, scanParams, t, handleApiError, getCommittedImage]);
  
  const handleGenerateExtract = useCallback(async () => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    if (!extractPrompt.trim()) { setUiState(s => ({...s, error: t('errorEnterDescription')})); return; }
    setUiState({ isLoading: true, loadingMessage: '', error: null });
    try {
        const imageToProcess = await getCommittedImage();
        setUiState(s => ({...s, loadingMessage: t('loadingTranslate')}));
        const refinedPrompt = await generateRefinedPrompt(imageToProcess, extractPrompt);
        setUiState(s => ({...s, loadingMessage: t('loadingExtract')}));
        const extractedUrls = await generateExtractedItem(imageToProcess, refinedPrompt);
        const newFiles = extractedUrls.map((url, i) => dataURLtoFile(url, `extracted-${i}.png`));
        setExtractState({ prompt: '', history: [newFiles, ...extractHistory] });
        onEditComplete();
    } catch(err) { handleApiError(err, 'errorFailedToExtract'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, extractPrompt, t, handleApiError, onEditComplete, getCommittedImage, extractHistory]);
  
  const handleUseExtractedAsStyle = useCallback((file: File) => {
    setInsertState(s => {
        if (s.styleFiles.find(f => f.name === file.name && f.lastModified === file.lastModified)) return s;
        return { ...s, styleFiles: [...s.styleFiles, file].slice(-3) };
    });
    setToolboxState(s => ({...s, activeTab: 'insert'}));
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

  const handleGeneratePhotoshoot = useCallback(async () => {
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    if (!studioPrompt.trim() && !studioStyleFile) { setUiState(s => ({...s, error: t('errorEnterDescription')})); return; }
    setUiState({ isLoading: true, loadingMessage: t('generate'), error: null });
    setResultsState({ items: [], persistentItems: [], baseHistoryIndex: historyIndex, expectedCount: 3, isGenerating: true, sourceTab: activeTab });
    setIsHistoryExpanded(true);
    if(isMobile) setToolboxState(s => ({...s, isOpen: false}));
    const successfulUrls: string[] = [];
    try {
        const imageToProcess = await getCommittedImage();
        let finalPrompt = studioPrompt, outfitDescription: string;
        if (studioStyleFile) {
            setUiState(s => ({...s, loadingMessage: t('loadingStyle')}));
            if (!studioPrompt.trim()) {
                finalPrompt = await generatePromptFromStyleImage(studioStyleFile, false);
                setStudioState(s => ({...s, prompt: finalPrompt}));
            }
            outfitDescription = await generatePromptFromStyleImage(studioStyleFile, true);
        } else {
            outfitDescription = await inferOutfitFromPrompt(finalPrompt);
        }
        setUiState(s => ({...s, loadingMessage: t('generate')}));
        
        const seeds = [1, 2, 3];
        for (const seed of seeds) {
            try {
                const imageUrl = await generatePhotoshootImage(imageToProcess, finalPrompt, studioPoseStyle, outfitDescription, studioStyleFile, seed, studioStyleFile ? studioStyleInfluence : undefined);
                successfulUrls.push(imageUrl);
                setResultsState(s => ({ ...s, items: [...successfulUrls], persistentItems: [...successfulUrls] }));
            } catch (err) {
                console.warn(`Photoshoot generation failed for seed ${seed}:`, err);
            }
        }
        
        if (successfulUrls.length === 0) throw new Error("All photoshoot image generations failed.");
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      setResultsState(s => ({...s, isGenerating: false}));
    }
  }, [currentImage, studioPrompt, studioPoseStyle, studioStyleFile, t, handleApiError, historyIndex, activeTab, isMobile, studioStyleInfluence, getCommittedImage]);
  
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
    // Fix: Pass the correct variable 'resultsBaseHistoryIndex' to the dispatch payload.
    historyDispatch({ type: 'UNDO', payload: { resultsBaseIndex: resultsBaseHistoryIndex } });
    const newHistoryIndex = (resultsBaseHistoryIndex !== null && historyIndex > resultsBaseHistoryIndex) ? resultsBaseHistoryIndex : historyIndex - 1;
    if (resultsBaseHistoryIndex !== null && newHistoryIndex === resultsBaseHistoryIndex) setResultsState(s => ({...s, items: persistentResults}));
    else setResultsState(s => ({...s, items: []}));
    if (resultsBaseHistoryIndex !== null && newHistoryIndex < resultsBaseHistoryIndex) setResultsState(s => ({...s, persistentItems: [], baseHistoryIndex: null}));
    clearMask();
    setRetouchState(s => ({...s, editHotspot: null}));
  }, [canUndo, historyIndex, resultsBaseHistoryIndex, persistentResults, clearMask]);
  
  const handleRedo = useCallback(() => {
      if (canRedo) {
          historyDispatch({ type: 'REDO' });
          if (resultsBaseHistoryIndex === null || historyIndex + 1 !== resultsBaseHistoryIndex) setResultsState(s => ({...s, items: []}));
          clearMask();
          setRetouchState(s => ({...s, editHotspot: null}));
      }
  }, [canRedo, historyIndex, resultsBaseHistoryIndex, clearMask]);

  const handleResetHistory = useCallback(() => {
      if (history.length > 1) {
          historyDispatch({ type: 'RESET_TO_FIRST' });
          clearMask();
          setRetouchState(s => ({ ...s, editHotspot: null }));
          setResultsState(s => ({ ...s, items: [], persistentItems: [], baseHistoryIndex: null }));
      }
  }, [history.length, clearMask]);

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
  }, [currentHistoryItem, t]);
  
  const handleFileSelect = (files: FileList | null) => { if (files && files[0]) handleImageUpload(files[0]); };

  const handleViewerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      viewerDispatch({ type: 'START_PAN', payload: { clientX: e.clientX, clientY: e.clientY } });
      showZoomControls();
  };
  
  const handleViewerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      viewerDispatch({ type: 'PAN', payload: { clientX: e.clientX, clientY: e.clientY } });
  };

  const handleViewerMouseUp = () => viewerDispatch({ type: 'END_PAN' });
  const handleViewerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      viewerDispatch({ type: 'ZOOM', payload: { direction: e.deltaY < 0 ? 'in' : 'out', amount: 0.1 } });
      showZoomControls();
  };
  
  const handleViewerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      showZoomControls();
      
      if (isComparing && isMobile && e.touches.length === 1) {
          e.preventDefault();
          setComparisonState(s => ({ ...s, isViewingOriginalOnHold: true }));
          return;
      }

      if (e.touches.length === 2) {
          e.preventDefault();
          pinchStartDistRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          pinchStartScaleRef.current = scale;
          viewerDispatch({ type: 'END_PAN' });
          setIsPinching(true);
      } else if (e.touches.length === 1) {
          const now = Date.now();
          if (now - touchStartTimeRef.current < 300) {
              e.preventDefault();
              // Fix: Use viewerDispatch to update scale state via the reducer instead of a non-existent 'setScale' function.
              if (scale > 1) resetView(); else viewerDispatch({ type: 'SET_SCALE', payload: { scale: 2.5 } });
              touchStartTimeRef.current = 0;
          } else {
              touchStartTimeRef.current = now;
              viewerDispatch({ type: 'START_PAN', payload: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }});
          }
      }
  };
  
  const handleViewerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
          e.preventDefault();
          const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const newScale = pinchStartScaleRef.current * (newDist / pinchStartDistRef.current);
          // Fix: Use viewerDispatch to update scale state via the reducer instead of a non-existent 'setScale' function.
          viewerDispatch({ type: 'SET_SCALE', payload: { scale: newScale } });
      } else if (isPanning && e.touches.length === 1) {
          e.preventDefault();
          viewerDispatch({ type: 'PAN', payload: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }});
      }
  };

  const handleViewerTouchEnd = () => {
      if (comparisonState.isViewingOriginalOnHold) {
          setComparisonState(s => ({ ...s, isViewingOriginalOnHold: false }));
      }

      viewerDispatch({ type: 'END_PAN' });
      pinchStartDistRef.current = null;
      setIsPinching(false);
  };

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imgRef.current || !imageViewerRef.current) return null;
    const img = imgRef.current;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX, clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = img.getBoundingClientRect();
    let normX = (clientX - rect.left) / rect.width, normY = (clientY - rect.top) / rect.height;
    const { rotate, scaleX, scaleY } = currentTransform;
    let tempX = normX;
    if (rotate === 90) { normX = normY; normY = 1 - tempX; } 
    else if (rotate === 180) { normX = 1 - normX; normY = 1 - normY; } 
    else if (rotate === 270) { normX = 1 - normY; normY = tempX; }
    if (scaleX === -1) normX = 1 - normX;
    if (scaleY === -1) normY = 1 - normY;
    const x = normX * img.naturalWidth, y = normY * img.naturalHeight;
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
  
  const handleGenerateCreativePrompt = useCallback(async (context: 'studio' | 'insert') => {
    setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingAnalyzingScene'), error: null}));
    try {
        let promptText = '', imageFiles: (File | null)[] = [];
        if (context === 'studio') {
            if (!currentImage) throw new Error("No image loaded.");
            imageFiles = [currentImage]; promptText = studioPrompt;
            const newPrompt = await generateCreativePrompt('studio', imageFiles, promptText);
            setStudioState(s => ({...s, prompt: newPrompt}));
        } else {
            if (insertSubjectFiles.length === 0) throw new Error("No subject images.");
            imageFiles = [...insertSubjectFiles, insertBackgroundFile]; promptText = insertPrompt;
            const newPrompt = await generateCreativePrompt('insert', imageFiles, promptText);
            setInsertState(s => ({...s, prompt: newPrompt}));
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { setUiState(s => ({...s, isLoading: false})); }
  }, [currentImage, studioPrompt, insertPrompt, insertSubjectFiles, insertBackgroundFile, t, handleApiError]);

  return (
    <div
      className={`w-screen bg-black text-gray-100 flex flex-col overflow-hidden antialiased`}
      style={{ height: isMobile ? `${windowSize.height}px` : '100vh' }}
    >
       <input id="image-upload-main" type="file" className="hidden" accept="image/*" onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ''; }} />
      <Header isImageLoaded={!!currentImage} imageFile={currentImage} imageDimensions={imageDimensions} canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo} onReset={handleResetHistory} onDownload={handleDownload} isLoading={isLoading} onToggleToolbox={toggleToolbox} onStartOver={handleStartOver} isToolboxOpen={isToolboxOpen} onUploadNew={() => document.getElementById('image-upload-main')?.click()} />
      <main className="flex-grow w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
        <div 
          className={`touch-none w-full bg-black/30 relative flex items-center justify-center p-2 lg:p-4 overflow-hidden transition-all duration-300 ease-in-out ${ isMobile ? (isToolboxOpen ? 'h-1/2' : 'h-full') : (isToolboxOpen ? 'lg:w-[70%]' : 'lg:w-full') }`}
          onMouseDown={handleViewerMouseDown} onMouseMove={handleViewerMouseMove} onMouseUp={handleViewerMouseUp} onMouseLeave={handleViewerMouseUp} onWheel={handleViewerWheel} onTouchStart={handleViewerTouchStart} onTouchMove={handleViewerTouchMove} onTouchEnd={handleViewerTouchEnd}
        >
            {isLoading && (<div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex flex-col items-center justify-center gap-4 text-white p-4"><Spinner /><p className="text-lg font-semibold animate-pulse">{loadingMessage}</p></div>)}
            {error && (<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800/80 backdrop-blur-md border border-red-500 text-white font-semibold py-3 px-6 rounded-lg z-50 flex items-center gap-4 shadow-2xl shadow-red-500/30"><span>{error}</span><button onClick={() => setUiState(s=>({...s, error: null}))} className="p-1 bg-red-500/50 rounded-full hover:bg-red-500/80 transition-colors"><XMarkIcon className="w-5 h-5"/></button></div>)}
            {!currentImage ? <ImagePlaceholder onFileSelect={handleFileSelect} /> : (
                <div ref={imageViewerRef} className="w-full h-full relative" onMouseLeave={() => setMousePosition(null)}>
                    {isComparing && isMobile && isViewingOriginalOnHold && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-bold py-1 px-3 rounded-md pointer-events-none z-30 animate-fade-in">
                            {t('historyOriginal')}
                        </div>
                    )}
                    <div className={`relative w-full h-full flex items-center justify-center ${(isPanning || isPinching) ? '' : (isInteracting ? 'transition-transform duration-200 ease-in-out' : 'transition-transform duration-300 ease-out')}`} style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}>
                        {isComparing && beforeImageUrl && !isMobile ? (
                            <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center p-0 gap-0">
                                <div className="relative w-1/2 h-full flex flex-col items-center justify-center"><img src={beforeImageUrl} alt={t('historyOriginal')} className="max-w-full max-h-full object-contain" /><div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none">{t('historyOriginal')}</div></div>
                                <div className="w-px h-full bg-cyan-400/50 shadow-lg shrink-0"></div>
                                <div className="relative w-1/2 h-full flex flex-col items-center justify-center"><img src={currentImageUrl ?? undefined} alt={t('viewEdited')} className="max-w-full max-h-full object-contain" style={{ transform: transformString }} /><div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none">{t('viewEdited')}</div></div>
                            </div>
                        ) : null}
                        
                        <div className="relative w-full h-full flex items-center justify-center" style={{ transform: (isComparing && !isMobile) ? 'scale(0)' : transformString, transition: 'transform 0.2s ease-in-out' }}>
                            <img ref={imgRef} src={(isComparing && isMobile && isViewingOriginalOnHold && beforeImageUrl) ? beforeImageUrl : currentImageUrl ?? undefined} alt="Main content" className={`max-w-full max-h-full object-contain`} />
                            <canvas ref={maskCanvasRef} className={`absolute pointer-events-none top-0 left-0 w-full h-full opacity-50`} style={{ mixBlendMode: 'screen' }}/>
                            {activeTab === 'retouch' && (
                                <canvas className={`absolute top-0 left-0 w-full h-full ${selectionMode === 'brush' ? 'cursor-none' : 'cursor-crosshair'}`}
                                    onMouseDown={e => handleCanvasInteraction(e, 'start')} onMouseMove={e => handleCanvasInteraction(e, 'move')} onMouseUp={e => handleCanvasInteraction(e, 'end')} onMouseLeave={e => handleCanvasInteraction(e, 'end')}
                                    onTouchStart={e => handleCanvasInteraction(e, 'start')} onTouchMove={e => handleCanvasInteraction(e, 'move')} onTouchEnd={e => handleCanvasInteraction(e, 'end')}
                                    onClick={selectionMode === 'point' ? handleViewerClick : undefined}
                                />
                            )}
                        </div>
                        {hotspotDisplayPosition && <div className="absolute w-4 h-4 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-2 ring-black/50 animate-pulse z-20" style={hotspotDisplayPosition} />}
                    </div>
                    
                    {selectionMode === 'brush' && mousePosition && (<div className={`absolute rounded-full border-2 pointer-events-none z-50 ${brushMode === 'draw' ? 'bg-white/30 border-white' : 'bg-red-500/30 border-red-500'} ${isDrawing ? 'opacity-0' : 'opacity-70'} transition-opacity duration-100`} style={{ left: mousePosition.x, top: mousePosition.y, width: brushSize, height: brushSize, transform: 'translate(-50%, -50%)' }} />)}
                </div>
            )}
            {currentImage && (isZoomControlsVisible || isInteracting) && (
                <>
                    <div className={`absolute left-4 flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10 z-40 animate-fade-in transition-all duration-300 ease-in-out top-16 ${isHistoryExpanded ? 'lg:top-16 lg:translate-y-0' : 'lg:top-1/2 lg:-translate-y-1/2'}`}>
                        <button onClick={() => handleZoom('in')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('zoomIn')}><ZoomInIcon className="w-6 h-6"/></button>
                        <button onClick={resetView} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('resetZoom')}><ArrowsPointingOutIcon className="w-6 h-6"/></button>
                        <button onClick={() => handleZoom('out')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('zoomOut')}><ZoomOutIcon className="w-6 h-6"/></button>
                        {canUndo && <div className="h-px w-6 bg-white/20 my-1"></div>}
                        {canUndo && <button onClick={() => setComparisonState(s => ({...s, isComparing: !s.isComparing}))} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" aria-label={isComparing ? t('viewEdited') : t('viewOriginal')} title={isComparing ? t('viewEdited') : t('viewOriginal')}>{isComparing ? <EyeSlashIcon className="w-6 h-6 text-cyan-400"/> : <EyeIcon className="w-6 h-6"/>}</button>}
                    </div>
                    <div className="absolute top-16 lg:top-1/2 lg:-translate-y-1/2 right-4 flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10 z-40 animate-fade-in">
                        <button onClick={() => handleApplyTransform('rotate-ccw')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('transformRotateCCW')}><UndoIcon className="w-6 h-6"/></button>
                        <button onClick={() => handleApplyTransform('rotate-cw')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('transformRotateCW')}><RedoIcon className="w-6 h-6"/></button>
                        <button onClick={() => handleApplyTransform('flip-h')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('transformFlipH')}><FlipHorizontalIcon className="w-6 h-6"/></button>
                        <button onClick={() => handleApplyTransform('flip-v')} disabled={isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={t('transformFlipV')}><FlipVerticalIcon className="w-6 h-6"/></button>
                    </div>
                </>
            )}
            {currentImage && !isMobileRetouchInputActive && !isKeyboardOpen && (
                <HistoryPills historyItemUrls={history.map(item => item.url)} results={results} isGeneratingResults={isGeneratingResults} expectedResultsCount={expectedResultsCount} currentIndex={historyIndex} resultsBaseHistoryIndex={resultsBaseHistoryIndex} onHistorySelect={handleHistoryPillClick} onResultSelect={handleResultPillClick} isExpanded={isHistoryExpanded} onToggle={() => setIsHistoryExpanded(p => !p)} isMobileToolbarVisible={isMobileToolbarVisible} />
            )}
        </div>
        
        <div ref={toolsContainerRef} className={`flex-shrink-0 bg-black/30 transition-all duration-300 ease-in-out ${ isMobile ? 'w-full' : (isToolboxOpen ? 'lg:w-[30%]' : 'lg:w-0') } ${ isMobile ? (isToolboxOpen ? 'h-1/2' : 'h-0') : 'h-full' } ${ isToolboxOpen ? 'overflow-y-auto will-change-scroll' : 'overflow-hidden' } ${isMobile ? (isToolboxOpen ? 'pb-4' : 'p-0') : 'lg:pb-4'}`} onTouchStart={handleToolsTouchStart} onTouchMove={handleToolsTouchMove} onTouchEnd={handleToolsTouchEnd}>
            <EditorSidebar className="w-full" isImageLoaded={!!currentImage} isLoading={isLoading} activeTab={activeTab} setActiveTab={handleTabChange} currentImage={currentImage}
              onApplyRetouch={handleGenerate} retouchPrompt={retouchPrompt} onRetouchPromptChange={v => setRetouchState(s=>({...s, prompt: v}))} retouchPromptInputRef={retouchPromptInputRef} isHotspotSelected={!!editHotspot} onClearHotspot={() => setRetouchState(s=>({...s, editHotspot: null}))} selectionMode={selectionMode} setSelectionMode={v => setRetouchState(s=>({...s, selectionMode: v}))} brushMode={brushMode} setBrushMode={v => setRetouchState(s=>({...s, brushMode: v}))} brushSize={brushSize} setBrushSize={v => setRetouchState(s=>({...s, brushSize: v}))} clearMask={clearMask} isMaskPresent={isMaskPresent()}
              onApplyIdPhoto={handleGenerateIdPhoto} idPhotoGender={idPhotoGender} onIdPhotoGenderChange={setIdPhotoGender}
              onApplyAdjustment={handleApplyAdjustment} onApplyMultipleAdjustments={handleApplyMultipleAdjustments} onApplyFilter={handleApplyFilter}
              onApplyExpansion={handleGenerateExpandedImage} expandPrompt={expandPrompt} onExpandPromptChange={v => setExpandState(s=>({...s, prompt: v}))} hasExpansion={hasExpansion} onSetAspectExpansion={setExpansionByAspect} imageDimensions={imageDimensions} expandActiveAspect={expandActiveAspect}
              onApplyComposite={handleGenerateCompositeImage} insertSubjectFiles={insertSubjectFiles} onInsertSubjectFilesChange={v => setInsertState(s => ({ ...s, subjectFiles: typeof v === 'function' ? v(s.subjectFiles) : v }))} insertStyleFiles={insertStyleFiles} onInsertStyleFilesChange={v => setInsertState(s=>({...s, styleFiles: v}))} insertBackgroundFile={insertBackgroundFile} onInsertBackgroundFileChange={v => setInsertState(s=>({...s, backgroundFile: v}))} insertPrompt={insertPrompt} onInsertPromptChange={v => setInsertState(s=>({...s, prompt: v}))}
              onApplyScan={handleGenerateScan} onApplyManualScan={handleGenerateManualScan} onEnterManualMode={handleEnterManualMode} onCancelManualMode={handleCancelManualMode} scanHistory={scanHistory} onReviewScan={(url) => setScanState(s=>({...s, scannedImageUrl: url, isModalOpen: true}))} isManualScanMode={isManualScanMode} setIsManualScanMode={v => setScanState(s=>({...s, isManualMode: v}))} scanEnhancement={scanEnhancement} onScanEnhancementChange={v => setScanState(s=>({...s, enhancement: v}))} scanRemoveShadows={scanRemoveShadows} onScanRemoveShadowsChange={v => setScanState(s=>({...s, removeShadows: v}))} scanRestoreText={scanRestoreText} onScanRestoreTextChange={v => setScanState(s=>({...s, restoreText: v}))} scanRemoveHandwriting={scanRemoveHandwriting} onScanRemoveHandwritingChange={v => setScanState(s=>({...s, removeHandwriting: v}))}
              onApplyExtract={handleGenerateExtract} extractPrompt={extractPrompt} onExtractPromptChange={v => setExtractState(s=>({...s, prompt: v}))} extractHistoryFiles={extractHistory} extractedHistoryItemUrls={extractedHistoryItemUrls} onUseExtractedAsStyle={handleUseExtractedAsStyle} onDownloadExtractedItem={handleDownloadExtractedItem}
              studioPrompt={studioPrompt} onStudioPromptChange={v => setStudioState(s=>({...s, prompt: v}))} studioPoseStyle={studioPoseStyle} onStudioPoseStyleChange={v => setStudioState(s=>({...s, poseStyle: v}))} onApplyStudio={handleGeneratePhotoshoot} studioStyleFile={studioStyleFile} onStudioStyleFileChange={v => setStudioState(s=>({...s, styleFile: v}))} studioStyleInfluence={studioStyleInfluence} onStudioStyleInfluenceChange={v => setStudioState(s=>({...s, styleInfluence: v}))}
              onRequestFileUpload={handleRequestFileUpload} onGenerateCreativePrompt={handleGenerateCreativePrompt}
            />
          </div>
          
          {isMobileRetouchInputActive && <MobileRetouchInputBar key={mobileInputKey} prompt={retouchPrompt} onPromptChange={v => setRetouchState(s=>({...s, prompt: v}))} onGenerate={() => handleGenerate()} onCancel={() => setRetouchState(s=>({...s, editHotspot: null}))} isLoading={isLoading}/>}
          {isScanModalOpen && (
            <ScanViewerModal
              imageUrl={scannedImageUrl} originalImageUrl={currentImageUrl} onClose={() => setScanState(s=>({...s, isModalOpen: false}))}
              onSave={() => { if(scannedImageUrl) addImageToHistory(dataURLtoFile(scannedImageUrl, `scan-${Date.now()}.png`)); setScanState(s=>({...s, isModalOpen: false})); }}
              onAdjust={() => { setScanState(s=>({...s, isModalOpen: false})); handleEnterManualMode(); }}
              isLoading={isLoading} onDownloadPdf={() => {
                if (scannedImageUrl) {
                    setScanState(s=>({...s, isDownloadingPdf: true})); const img = new Image();
                    img.onload = () => { const pdf = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'px', format: [img.width, img.height] }); pdf.addImage(img, 'PNG', 0, 0, img.width, img.height); pdf.save("scanned-document.pdf"); setScanState(s=>({...s, isDownloadingPdf: false})); };
                    img.onerror = () => { handleApiError(new Error("Image failed to load."), 'errorFailedToExport'); setScanState(s=>({...s, isDownloadingPdf: false})); };
                    img.src = scannedImageUrl;
                }
              }} isDownloadingPdf={isDownloadingPdf}
              onExportToWord={async () => {
                if (scannedImageUrl) {
                    setScanState(s=>({...s, exportingDocType: 'word'}));
                    try { const { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx'); const structure = await generateDocumentStructure(scannedImageUrl); const docChildren: any[] = []; structure.elements.forEach((el: any) => { if (el.type === 'heading') docChildren.push(new Paragraph({ text: el.text, heading: HeadingLevel.HEADING_1 })); else if (el.type === 'paragraph') docChildren.push(new Paragraph(el.text)); else if (el.type === 'table' && el.table) docChildren.push(new Table({ rows: el.table.map((row: string[]) => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph(cell)], width: { size: 100 / row.length, type: WidthType.PERCENTAGE } })) })), width: { size: 100, type: WidthType.PERCENTAGE } })); }); const doc = new Document({ sections: [{ children: docChildren }] }); const blob = await Packer.toBlob(doc); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'exported-document.docx'; a.click(); URL.revokeObjectURL(url);
                    } catch(err) { handleApiError(err, 'errorFailedToExport'); } finally { setScanState(s=>({...s, exportingDocType: null})); }
                }
              }}
              onExportToExcel={async () => {
                  if (scannedImageUrl) {
                      setScanState(s=>({...s, exportingDocType: 'excel'}));
                      try { const XLSX = await import('xlsx'); const structure = await generateDocumentStructure(scannedImageUrl); const wb = XLSX.utils.book_new(); const tableData: string[][] = []; structure.elements.forEach((el: any) => { if (el.type === 'table' && el.table) el.table.forEach((row: string[]) => tableData.push(row)); }); if(tableData.length === 0) throw new Error("No table found."); const ws = XLSX.utils.aoa_to_sheet(tableData); XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); XLSX.writeFile(wb, "exported-data.xlsx");
                      } catch(err) { handleApiError(err, 'errorFailedToExport'); } finally { setScanState(s=>({...s, exportingDocType: null})); }
                  }
              }}
              exportingDocType={exportingDocType}
            />
          )}

          {isViewerOpen && <FullScreenViewerModal items={viewerItems} initialIndex={viewerInitialIndex} type={viewerType} comparisonUrl={viewerComparisonUrl} onClose={() => setFullscreenViewerState(s=>({...s, isOpen: false}))} onDownload={triggerDownload} onSelect={handleSelectFromViewer} />}
          {isMobileToolbarVisible && <CompactMobileToolbar activeTab={activeTab} setActiveTab={handleTabChange} onOpenEditor={toggleToolbox} isImageLoaded={!!currentImage} onRequestFileUpload={handleRequestFileUpload} />}
      </main>
    </div>
  );
};

export default App;