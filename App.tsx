/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


// Fix: Corrected syntax error in import statement to correctly import React hooks.
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import * as XLSX from 'xlsx';
// Fix: Corrected import to use generateEditedImageWithMaskStream as the original function was removed.
import { generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateEditedImageWithMaskStream, generateCompositeImage, generateScannedDocument, generateScannedDocumentWithCorners, generateExtractedItem, removePeopleFromImage, generateDocumentStructure, generateIdPhoto, detectFaces, detectSubjectDetails, type Corners, type Enhancement, type IdPhotoOptions, RateLimitError, dataURLtoFile, type Face } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import EditorSidebar, { TABS_CONFIG } from './components/EditorSidebar';
import ScanViewerModal from './components/ScanViewerModal';
import { ArrowsPointingOutIcon, ZoomInIcon, ZoomOutIcon, UploadIcon, PaperAirplaneIcon, ClockIcon, UndoIcon, RedoIcon, FlipHorizontalIcon, FlipVerticalIcon, ChevronsLeftRightIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from './components/icons';
import { useTranslation } from './contexts/LanguageContext';
import { SelectionMode, BrushMode } from './components/RetouchPanel';
import HistoryPanel from './components/HistoryPanel';
import type { TranslationKey } from './translations';


// Mobile-specific input bar for a better UX with on-screen keyboards
const MobileInputBar: React.FC<{
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    hotspot: { x: number, y: number } | null;
}> = ({ prompt, onPromptChange, onSubmit, isLoading, hotspot }) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, [hotspot]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoading && prompt.trim()) {
            onSubmit();
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] animate-slide-up z-40">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={t('retouchPlaceholderGenerative')}
                    className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                    disabled={isLoading}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold p-3 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none h-[50px] w-[50px] flex items-center justify-center ring-1 ring-white/10"
                    disabled={isLoading || !prompt.trim()}
                    aria-label={t('generate')}
                >
                    {isLoading ? <Spinner className="h-6 w-6"/> : <PaperAirplaneIcon className="w-6 h-6" />}
                </button>
            </form>
        </div>
    );
};


export type Tab = 'retouch' | 'idphoto' | 'adjust' | 'expand' | 'insert' | 'scan' | 'extract' | 'faceswap';
export type TransformType = 'rotate-cw' | 'rotate-ccw' | 'flip-h' | 'flip-v';
type ExpansionHandle = 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'br' | 'bl';

const ImagePlaceholder: React.FC<{ onFileSelect: (files: FileList | null) => void }> = ({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 transition-all duration-300 rounded-2xl border-2 bg-black/30 backdrop-blur-xl shadow-2xl shadow-black/30 ${isDraggingOver ? 'border-dashed border-cyan-400' : 'border-transparent'}`}
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
            <input id="image-upload-main" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <p className="text-sm text-gray-500">{t('dragAndDrop')}</p>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editor State
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  // Retouch state
  const [retouchPrompt, setRetouchPrompt] = useState('');
  const [retouchUseSearch, setRetouchUseSearch] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('point');
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [hotspotDisplayPosition, setHotspotDisplayPosition] = useState<{ left: number, top: number } | null>(null);
  const [brushMode, setBrushMode] = useState<BrushMode>('draw');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMouseOverViewer, setIsMouseOverViewer] = useState(false);
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const retouchPromptInputRef = useRef<HTMLInputElement>(null);

  // Insert state
  const [insertSubjectFiles, setInsertSubjectFiles] = useState<File[]>([]);
  const [insertStyleFiles, setInsertStyleFiles] = useState<File[]>([]);
  const [insertBackgroundFile, setInsertBackgroundFile] = useState<File | null>(null);
  const [insertPrompt, setInsertPrompt] = useState('');
  const [insertUseSearch, setInsertUseSearch] = useState(false);

  // Face Swap state
  const [swapFaceFile, setSwapFaceFile] = useState<File | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Record<string, Face[]>>({});
  const [selectedTargetFace, setSelectedTargetFace] = useState<{ fileKey: string; faceIndex: number } | null>(null);
  const [selectedSourceFace, setSelectedSourceFace] = useState<{ fileKey: string; faceIndex: number } | null>(null);
  
  // Expand state
  const [expandPrompt, setExpandPrompt] = useState('');
  const [expansionPadding, setExpansionPadding] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [activeExpansionHandle, setActiveExpansionHandle] = useState<ExpansionHandle | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, initialPadding: typeof expansionPadding } | null>(null);
  const hasExpansion = Object.values(expansionPadding).some(p => p > 0);

  // Extract state
  const [extractPrompt, setExtractPrompt] = useState('');
  const [extractedItems, setExtractedItems] = useState<File[]>([]);
  const [extractedItemUrls, setExtractedItemUrls] = useState<string[]>([]);
  const [extractHistory, setExtractHistory] = useState<File[][]>([]);
  const [extractedHistoryItemUrls, setExtractedHistoryItemUrls] = useState<string[][]>([]);


  // Scan state
  const [isManualScanMode, setIsManualScanMode] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [corners, setCorners] = useState<Corners | null>(null);
  const [activeCorner, setActiveCorner] = useState<keyof Corners | null>(null);
  const [scanParams, setScanParams] = useState<{ enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [exportingDocType, setExportingDocType] = useState<'word' | 'excel' | null>(null);

  // Comparison Slider State
  const [isComparing, setIsComparing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);


  // Main image viewer refs
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initialPosition: { x: number; y: number; } } | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const [isZoomControlsVisible, setIsZoomControlsVisible] = useState(false);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  
  // Swipe gesture state (for tools panel)
  const swipeStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  
  // Image Info State
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);

  // Scroll-based UI state
  const [imageScale, setImageScale] = useState(1);
  
  // Window size state to react to resizes (e.g., mobile keyboard)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Interaction State for visual feedback on zoom
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutRef = useRef<number | null>(null);

  const currentImage = history[historyIndex] ?? null;

  const [currentImageUrl, setImageUrl] = useState<string | null>(null);

  // Effect to track window resizing
  useEffect(() => {
    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Helper to provide temporary visual feedback on interactions like zoom
  const reportInteraction = useCallback(() => {
    if (interactionTimeoutRef.current) {
        window.clearTimeout(interactionTimeoutRef.current);
    }
    setIsInteracting(true);
    interactionTimeoutRef.current = window.setTimeout(() => {
        setIsInteracting(false);
    }, 300); // Feedback visible for 300ms
  }, []);
  
  const toggleToolbox = useCallback(() => setIsToolboxOpen(prev => !prev), []);
  
  const resetView = useCallback(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  }, []);

  // Effect to handle shrinking the image viewer when the tool panel is scrolled
  useEffect(() => {
    const toolsEl = toolsContainerRef.current;
    if (!toolsEl) return;

    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = toolsEl;
        const totalScrollableDist = scrollHeight - clientHeight;
        
        if (totalScrollableDist <= 0) {
            setImageScale(1);
            return;
        }

        const scrollProgress = scrollTop / totalScrollableDist;
        
        // Scale from 1 down to 0.7 as user scrolls
        const newScale = 1 - (scrollProgress * 0.3);
        setImageScale(Math.max(0.7, newScale));
    };
    
    toolsEl.addEventListener('scroll', handleScroll);
    
    // Run once on setup to set initial scale
    handleScroll();

    return () => {
        toolsEl.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, isLoading, currentImage]); // Re-run when sidebar content might change height

  const handleZoom = useCallback((direction: 'in' | 'out', amount: number = 0.2) => {
    reportInteraction(); // Provide visual feedback for zoom
    setScale(prevScale => {
        const newScale = direction === 'in' ? prevScale * (1 + amount) : prevScale / (1 + amount);
        return Math.max(0.2, Math.min(newScale, 10)); // Clamp scale
    });
  }, [reportInteraction]);

  const clearMask = useCallback(() => {
    if (maskCanvasRef.current) {
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // When tab changes, reset transient states
  useEffect(() => {
    setEditHotspot(null);
    setIsManualScanMode(false);
    clearMask();
    setExpansionPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    // When switching to a mode that needs a clean view, reset zoom/pan.
    if (activeTab === 'idphoto' || isComparing) {
        resetView();
    }
  }, [activeTab, clearMask, resetView, isComparing]);


  // Effect to sync mask canvas size with image and clear it
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

        if (img.complete) {
            setCanvasSize();
        } else {
            img.addEventListener('load', setCanvasSize);
        }
        return () => img.removeEventListener('load', setCanvasSize);
    } else {
        setImageDimensions(null);
    }
  }, [currentImageUrl, clearMask]);

  // Effect to calculate and set the display position of the hotspot.
  // This runs after layout has been updated, fixing issues with mobile keyboards resizing the view.
  useLayoutEffect(() => {
    if (editHotspot && activeTab === 'retouch' && selectionMode === 'point' && imgRef.current && imageViewerRef.current) {
        const img = imgRef.current;
        const viewer = imageViewerRef.current;
        const { naturalWidth, naturalHeight } = img;

        if (naturalWidth === 0 || naturalHeight === 0) {
            setHotspotDisplayPosition(null);
            return;
        }

        const viewerRect = viewer.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        const percentX = editHotspot.x / naturalWidth;
        const percentY = editHotspot.y / naturalHeight;

        const hotspotOnImgX = percentX * imgRect.width;
        const hotspotOnImgY = percentY * imgRect.height;
        
        const finalX = (imgRect.left - viewerRect.left) + hotspotOnImgX;
        const finalY = (imgRect.top - viewerRect.top) + hotspotOnImgY;

        setHotspotDisplayPosition({ left: finalX, top: finalY });
    } else {
        setHotspotDisplayPosition(null);
    }
  }, [editHotspot, activeTab, selectionMode, scale, position, imageScale, currentImageUrl, isToolboxOpen, windowSize]);


  // Effect to focus the desktop input when a point is selected
  useEffect(() => {
    if (activeTab === 'retouch' && selectionMode === 'point' && editHotspot) {
      // Small timeout to allow the UI to update and the input to become visible/focusable
      const timer = setTimeout(() => {
        // Only focus the desktop input; the mobile bar handles its own focus.
        if (window.innerWidth >= 768) { // md breakpoint
            retouchPromptInputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editHotspot, activeTab, selectionMode]);


  // Effect to create and revoke object URLs safely for main images
  useEffect(() => {
    let currentUrl: string | null = null;
    
    if (currentImage) {
      currentUrl = URL.createObjectURL(currentImage);
      setImageUrl(currentUrl);
    } else {
      setImageUrl(null);
    }
  
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [currentImage]);
  
  const canUndo = historyIndex > 0;
  
  // Effect for comparison slider's "before" image
  useEffect(() => {
    let beforeUrl: string | null = null;
    if (canUndo) {
        const beforeImageFile = history[historyIndex - 1];
        if (beforeImageFile) {
            beforeUrl = URL.createObjectURL(beforeImageFile);
            setBeforeImageUrl(beforeUrl);
        }
    } else {
        setBeforeImageUrl(null);
    }
    return () => {
        if (beforeUrl) {
            URL.revokeObjectURL(beforeUrl);
        }
    };
  }, [history, historyIndex, canUndo]);


  // Effect to create/revoke object URLs for the extracted items
  useEffect(() => {
    const urls = extractedItems.map(item => URL.createObjectURL(item));
    setExtractedItemUrls(urls);
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [extractedItems]);
  
  // Effect to create/revoke object URLs for the extraction history
  useEffect(() => {
    const allUrls = extractHistory.map(set => 
        set.map(item => URL.createObjectURL(item))
    );
    setExtractedHistoryItemUrls(allUrls);
    
    return () => { 
        allUrls.forEach(urlSet => 
            urlSet.forEach(url => URL.revokeObjectURL(url))
        ); 
    };
  }, [extractHistory]);

  // Function to show controls and set a timeout to hide them
  const showZoomControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current);
    }
    setIsZoomControlsVisible(true);
    hideControlsTimeoutRef.current = window.setTimeout(() => {
        setIsZoomControlsVisible(false);
    }, 3000); // Hide after 3 seconds
  }, []);

  // Show controls when the image first appears
  useEffect(() => {
      if (currentImage) {
          showZoomControls();
      }
  }, [currentImage, showZoomControls]);

  // Cleanup timers on unmount
  useEffect(() => {
      return () => {
          if (hideControlsTimeoutRef.current) {
              window.clearTimeout(hideControlsTimeoutRef.current);
          }
          if (interactionTimeoutRef.current) {
              window.clearTimeout(interactionTimeoutRef.current);
          }
      };
  }, []);


  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action, but keep Insert panel state
    clearMask();
    setEditHotspot(null);
    setRetouchPrompt('');
  }, [history, historyIndex, clearMask]);

  const handleApiError = useCallback((err: unknown, contextKey: TranslationKey) => {
    let errorMessage: string;
    if (err instanceof RateLimitError) {
        errorMessage = t('errorRateLimit');
    } else if (err instanceof Error) {
        if (err.message.includes("invalid data structure for the document")) {
          contextKey = 'errorFailedToExport';
        }
        const context = t(contextKey);
        errorMessage = `${context} ${err.message}`;
    } else {
        const context = t(contextKey);
        errorMessage = `${context} An unknown error occurred.`;
    }
    setError(errorMessage);
    console.error(err);
  }, [t]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    // Reset all states first
    setHistory([]);
    setHistoryIndex(-1);
    clearMask();
    setRetouchPrompt('');
    setEditHotspot(null);
    setInsertSubjectFiles([file]);
    setInsertStyleFiles([]);
    setSwapFaceFile(null);
    setInsertBackgroundFile(null);
    setInsertPrompt('');
    setScanHistory([]);
    setExtractPrompt('');
    setExtractedItems([]);
    setExtractHistory([]);
    setIsComparing(false);
    setDetectedFaces({});
    setSelectedSourceFace(null);
    setSelectedTargetFace(null);

    // Set history and stop loading AFTER detection is done
    setHistory([file]);
    setHistoryIndex(0);

  }, [clearMask]);
  
  const handleStartOver = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    clearMask();
    setRetouchPrompt('');
    setEditHotspot(null);
    // Reset Insert panel state
    setInsertSubjectFiles([]);
    setInsertStyleFiles([]);
    setSwapFaceFile(null);
    setInsertBackgroundFile(null);
    setInsertPrompt('');
    setScanHistory([]);
    setExtractPrompt('');
    setExtractedItems([]);
    setExtractHistory([]);
    setIsComparing(false);
    // Reset face detection state
    setDetectedFaces({});
    setSelectedSourceFace(null);
    setSelectedTargetFace(null);
  }, [clearMask]);

  const handleHistorySelect = (index: number) => {
      setHistoryIndex(index);
      clearMask();
      setEditHotspot(null);
      setIsHistoryPanelOpen(false); // Close panel on mobile after selection
  };


  const isMaskPresent = useCallback((): boolean => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Check if any pixel has an alpha value greater than 0
    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) return true;
    }
    return false;
  }, []);

  const handleGenerate = useCallback(async (promptOverride?: string) => {
    if (!currentImage) {
      setError(t('errorNoImageLoaded'));
      return;
    }
    
    const finalPromptToUse = promptOverride || retouchPrompt;

    if (!finalPromptToUse.trim()) {
        setError(t('errorEnterDescription'));
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        let finalMaskUrl = '';

        if (selectionMode === 'brush') {
            if (!maskCanvasRef.current || !isMaskPresent()) {
                setError(t('errorNoMask'));
                setIsLoading(false);
                return;
            }
            finalMaskUrl = maskCanvasRef.current.toDataURL('image/png');
        } else { // 'point' mode
            if (!editHotspot) {
                setError(t('errorSelectArea'));
                setIsLoading(false);
                return;
            }
            // Create a temporary canvas for the point mask
            const pointCanvas = document.createElement('canvas');
            const img = imgRef.current;
            if (!img || !img.naturalWidth) throw new Error("Image not loaded");
            pointCanvas.width = img.naturalWidth;
            pointCanvas.height = img.naturalHeight;
            const ctx = pointCanvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context for point mask");
            
            const pointRadius = Math.max(15, Math.min(pointCanvas.width, pointCanvas.height) * 0.025);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.arc(editHotspot.x, editHotspot.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
            finalMaskUrl = pointCanvas.toDataURL('image/png');
        }

        let finalPrompt = finalPromptToUse;
        const lowerCasePrompt = finalPromptToUse.toLowerCase().trim();

        const commandMap: Record<string, TranslationKey> = {
            'remove person': 'retouchRemovePersonPrompt',
            'delete person': 'retouchRemovePersonPrompt',
            'erase person': 'retouchRemovePersonPrompt',
            'xoá người': 'retouchRemovePersonPrompt',
            'xóa người': 'retouchRemovePersonPrompt',

            'remove object': 'retouchRemoveObjectPrompt',
            'delete object': 'retouchRemoveObjectPrompt',
            'erase object': 'retouchRemoveObjectPrompt',
            'xoá vật thể': 'retouchRemoveObjectPrompt',
            'xóa vật thể': 'retouchRemoveObjectPrompt',
            'remove it': 'retouchRemoveObjectPrompt',
            'delete it': 'retouchRemoveObjectPrompt',
            'erase it': 'retouchRemoveObjectPrompt',

            'remove reflection': 'retouchRemoveReflectionPrompt',
            'delete reflection': 'retouchRemoveReflectionPrompt',
            'erase reflection': 'retouchRemoveReflectionPrompt',
            'xoá phản chiếu': 'retouchRemoveReflectionPrompt',
            'xóa phản chiếu': 'retouchRemoveReflectionPrompt',
            'remove glare': 'retouchRemoveReflectionPrompt',
            'delete glare': 'retouchRemoveReflectionPrompt',
        };
        
        // New logic: Check if the prompt *includes* a command, making it more flexible.
        for (const command in commandMap) {
            if (lowerCasePrompt.includes(command)) {
                const translationKey = commandMap[command];
                finalPrompt = t(translationKey);
                break; // Use the first command that matches
            }
        }

        // Fix: Use the streaming function and take the last result for the non-streaming UI.
        const stream = generateEditedImageWithMaskStream(currentImage, finalPrompt, finalMaskUrl, retouchUseSearch);
        let editedImageUrl: string | null = null;
        for await (const chunk of stream) {
            // In a streaming UI, we would render each chunk. Here, we just want the final image.
            editedImageUrl = chunk;
        }

        if (!editedImageUrl) {
            throw new Error("Image generation failed to produce an image.");
        }
        
        const newImageFile = dataURLtoFile(editedImageUrl, `retouched-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, isMaskPresent, t, selectionMode, editHotspot, retouchPrompt, handleApiError, addImageToHistory, retouchUseSearch]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError(t('errorNoImageLoadedToFilter'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        handleApiError(err, 'errorFailedToApplyFilter');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, t, handleApiError, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError(t('errorNoImageLoadedToAdjust'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        handleApiError(err, 'errorFailedToApplyAdjustment');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, t, handleApiError, addImageToHistory]);

  const handleApplyTransform = useCallback((transform: TransformType) => {
    if (!currentImage) {
        setError(t('errorNoImageLoadedToAdjust'));
        return;
    }
    setError(null);
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const imageUrl = URL.createObjectURL(currentImage);
    
    image.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            const { naturalWidth: w, naturalHeight: h } = image;

            if (transform === 'rotate-cw' || transform === 'rotate-ccw') {
                canvas.width = h;
                canvas.height = w;
                ctx.translate(h / 2, w / 2);
                ctx.rotate(transform === 'rotate-cw' ? 90 * Math.PI / 180 : -90 * Math.PI / 180);
                ctx.drawImage(image, -w / 2, -h / 2);
            } else if (transform === 'flip-h') {
                canvas.width = w;
                canvas.height = h;
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, 0);
            } else if (transform === 'flip-v') {
                canvas.width = w;
                canvas.height = h;
                ctx.translate(0, h);
                ctx.scale(1, -1);
                ctx.drawImage(image, 0, 0);
            }

            const transformedDataUrl = canvas.toDataURL('image/png');
            const newImageFile = dataURLtoFile(transformedDataUrl, `transformed-${Date.now()}.png`);
            addImageToHistory(newImageFile);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`${t('errorFailedToApplyAdjustment')} ${errorMessage}`);
            console.error(err);
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
    };
    
    image.onerror = (err) => {
        URL.revokeObjectURL(imageUrl);
        setError(`${t('errorFailedToApplyAdjustment')} Could not load image for transform.`);
        console.error("Image transform load error:", err);
    };

    image.src = imageUrl;
  }, [currentImage, addImageToHistory, t]);

  const handleApplyIdPhoto = useCallback(async (options: IdPhotoOptions) => {
    if (!currentImage) {
        setError(t('errorNoImageLoadedToAdjust'));
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const idPhotoUrl = await generateIdPhoto(currentImage, options);
        const newImageFile = dataURLtoFile(idPhotoUrl, `idphoto-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, t, handleApiError, addImageToHistory]);

  const handleApplyExpansion = useCallback(async (prompt: string) => {
    if (!currentImage || !imgRef.current) {
        setError(t('errorNoImageLoadedToExpand'));
        return;
    }
    
    if (!hasExpansion) {
        // Optionally show a message to the user
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const img = imgRef.current;
        const { naturalWidth, naturalHeight } = img;
        const imgRect = img.getBoundingClientRect(); // This gives the current on-screen size, including zoom

        // This is the ratio of original image pixels to displayed pixels.
        const scaleX = naturalWidth / imgRect.width;
        const scaleY = naturalHeight / imgRect.height;
        
        // Convert padding from screen pixels to natural image pixels
        const naturalPadding = {
            top: Math.round(expansionPadding.top * scaleY),
            right: Math.round(expansionPadding.right * scaleX),
            bottom: Math.round(expansionPadding.bottom * scaleY),
            left: Math.round(expansionPadding.left * scaleX),
        };

        const newW = naturalWidth + naturalPadding.left + naturalPadding.right;
        const newH = naturalHeight + naturalPadding.top + naturalPadding.bottom;
        
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.drawImage(img, naturalPadding.left, naturalPadding.top);
        
        const paddedImageDataUrl = canvas.toDataURL('image/png');
        
        const expandedImageUrl = await generateExpandedImage(paddedImageDataUrl, prompt);
        const newImageFile = dataURLtoFile(expandedImageUrl, `expanded-${Date.now()}.png`);
        
        addImageToHistory(newImageFile);
        
        setExpansionPadding({ top: 0, right: 0, bottom: 0, left: 0 });
        setExpandPrompt('');
        
    } catch (err) {
        handleApiError(err, 'errorFailedToExpandImage');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t, expansionPadding, hasExpansion, handleApiError]);

  const handleApplyComposite = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        if (insertSubjectFiles.length === 0) {
            setError(t('insertErrorNoSubjects'));
            return;
        }

        const insertedImageUrl = await generateCompositeImage(
            insertBackgroundFile,
            insertSubjectFiles,
            insertStyleFiles,
            null, // No swap face file in composite mode
            insertPrompt,
            null, // No mask file in composite mode
            insertUseSearch
        );
        const newImageFile = dataURLtoFile(insertedImageUrl, `inserted-${Date.now()}.png`);
        
        if (history.length === 0 || historyIndex === -1) {
            handleImageUpload(newImageFile);
        } else {
            addImageToHistory(newImageFile);
        }
    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
    } finally {
        setIsLoading(false);
    }
  }, [
    addImageToHistory, handleImageUpload, history.length, historyIndex, t, insertSubjectFiles, 
    insertStyleFiles, insertBackgroundFile, insertPrompt, handleApiError, insertUseSearch
  ]);

  const handleApplyFaceSwap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
        if (!currentImage || !swapFaceFile || !selectedSourceFace || (selectedTargetFace?.fileKey !== 'currentImage')) {
            setError(t('errorFaceSwapValidation'));
            return;
        }

        const faceBox = detectedFaces['currentImage']?.[selectedTargetFace.faceIndex]?.box;
        if (!faceBox) {
            setError(t('errorFaceSwapValidation'));
            return;
        }
        
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageDimensions?.width ?? 0;
        maskCanvas.height = imageDimensions?.height ?? 0;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context for mask");
        
        ctx.fillStyle = 'white';
        ctx.fillRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskFile = dataURLtoFile(maskDataUrl, 'facemask.png');
        
        const insertedImageUrl = await generateCompositeImage(
            null,
            [currentImage],
            [],
            swapFaceFile,
            t('faceSwapDefaultPrompt'),
            maskFile,
            false // Search grounding not applicable for face swap
        );
        const newImageFile = dataURLtoFile(insertedImageUrl, `swapped-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
    } finally {
        setIsLoading(false);
    }
  }, [
    addImageToHistory, t, handleApiError,
    currentImage, swapFaceFile, selectedTargetFace, selectedSourceFace, detectedFaces, imageDimensions
  ]);


  // --- Background Handler for Insert Panel ---
  const handleInsertBackgroundFileChange = useCallback(async (file: File | null) => {
    if (!file) {
      setInsertBackgroundFile(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const cleanedImageUrl = await removePeopleFromImage(file);
      const cleanedImageFile = dataURLtoFile(cleanedImageUrl, `bg-cleaned-${Date.now()}.png`);
      setInsertBackgroundFile(cleanedImageFile);
    } catch (err) {
      handleApiError(err, 'errorFailedToCleanBackground');
      setInsertBackgroundFile(file); // Fallback to original on error
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

    // --- Face Detection and Selection Handlers ---
    const handleFileFaceDetection = useCallback(async (file: File, type: 'target' | 'source', fileKey: string) => {
        try {
            const faces = await detectFaces(file);
            setDetectedFaces(prev => ({ ...prev, [fileKey]: faces }));

            if (faces.length === 1) {
                if (type === 'target') {
                    setSelectedTargetFace({ fileKey, faceIndex: 0 });
                } else {
                    setSelectedSourceFace({ fileKey, faceIndex: 0 });
                }
            }
        } catch (err) {
            handleApiError(err, 'errorFailedToGenerate'); // Using a generic error key
        }
    }, [handleApiError]);

    const handleInsertSubjectFilesChange = useCallback((files: File[]) => {
        setInsertSubjectFiles(files);
        setSelectedTargetFace(null);
        if (files.length > 0) {
            const firstFile = files[0];
            const fileKey = firstFile.name + firstFile.lastModified;
            handleFileFaceDetection(firstFile, 'target', fileKey);
        }
    }, [handleFileFaceDetection]);

    const handleSwapFaceFileChange = useCallback((file: File | null) => {
        setSwapFaceFile(file);
        setSelectedSourceFace(null);
        if (file) {
            const fileKey = file.name + file.lastModified;
            handleFileFaceDetection(file, 'source', fileKey);
        }
    }, [handleFileFaceDetection]);

  // --- Extract Handlers ---
  const handleApplyExtract = useCallback(async () => {
    if (!currentImage) {
        setError(t('errorNoImageLoaded'));
        return;
    }
    if (!extractPrompt.trim()) {
        setError(t('errorEnterDescription'));
        return;
    }
    setIsLoading(true);
    setError(null);
    setExtractedItems([]);
    try {
        const extractedDataUrls = await generateExtractedItem(currentImage, extractPrompt);
        const extractedFiles = extractedDataUrls.map((dataUrl, index) => 
            dataURLtoFile(dataUrl, `extracted-${Date.now()}-${index}.png`)
        );
        
        // Add the PREVIOUS result to history, then set the NEW one.
        if (extractedItems.length > 0) {
            setExtractHistory(prev => [extractedItems, ...prev]);
        }
        setExtractedItems(extractedFiles);

    } catch (err) {
        handleApiError(err, 'errorFailedToExtract');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, extractPrompt, t, handleApiError, extractedItems]);

  const handleUseExtractedAsStyle = useCallback((itemFile: File) => {
    if (itemFile) {
        // Add to style files, preventing duplicates
        setInsertStyleFiles(prev => {
            const alreadyExists = prev.some(file => file.name === itemFile.name && file.size === itemFile.size && file.lastModified === itemFile.lastModified);
            if (alreadyExists) {
                return prev;
            }
            return [...prev, itemFile];
        });
    }
  }, []);
  
  const handleDownloadExtractedItem = useCallback((itemFile: File) => {
    if (!itemFile) return;
    try {
        const link = document.createElement('a');
        const url = URL.createObjectURL(itemFile);
        link.href = url;
        link.download = itemFile.name || `pika-ai-extracted-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        setError(t('errorCouldNotProcessDownload'));
        console.error("Download extracted item error:", err);
    }
  }, [t]);

  // --- Scan Handlers ---
  const handleApplyScan = useCallback(async (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean) => {
    if (!currentImage) {
      setError('No image loaded to scan.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsScanModalOpen(true);
    setScannedImageUrl(null); // Show loading state in modal
    setScanParams({ enhancement, removeShadows, restoreText, removeHandwriting });

    try {
        const resultUrl = await generateScannedDocument(currentImage, enhancement, removeShadows, restoreText, removeHandwriting);
        setScannedImageUrl(resultUrl);
        setScanHistory(prev => [resultUrl, ...prev].slice(0, 5));
    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
        setIsScanModalOpen(false);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, t, handleApiError]);

  const handleApplyManualScan = useCallback(async () => {
    if (!currentImage || !corners || !scanParams) return;

    setIsLoading(true);
    setError(null);
    setIsManualScanMode(false);
    setIsScanModalOpen(true);
    setScannedImageUrl(null);

    try {
      const { enhancement, removeShadows, restoreText, removeHandwriting } = scanParams;
      const resultUrl = await generateScannedDocumentWithCorners(currentImage, corners, enhancement, removeShadows, restoreText, removeHandwriting);
      setScannedImageUrl(resultUrl);
      setScanHistory(prev => [resultUrl, ...prev].slice(0, 5));
    } catch (err) {
        handleApiError(err, 'errorFailedToGenerate');
        setIsScanModalOpen(false); // Close modal on error
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, corners, scanParams, t, handleApiError]);

  const handleCloseScanModal = useCallback(() => {
    setIsScanModalOpen(false);
    setScannedImageUrl(null);
  }, []);

  const handleSaveScannedImage = useCallback(() => {
    if (scannedImageUrl) {
        const newImageFile = dataURLtoFile(scannedImageUrl, `scanned-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        handleCloseScanModal();
    }
  }, [scannedImageUrl, addImageToHistory, handleCloseScanModal]);
  
  const handleReviewScan = useCallback((url: string) => {
    setScannedImageUrl(url);
    setIsScanModalOpen(true);
  }, []);

  const handleEnterManualMode = useCallback(() => {
      if (!imgRef.current) return;
      setIsScanModalOpen(false);
      setIsManualScanMode(true);

      const { naturalWidth: w, naturalHeight: h } = imgRef.current;
      // Initialize corners to a 10% inset rectangle
      setCorners({
          tl: { x: w * 0.1, y: h * 0.1 },
          tr: { x: w * 0.9, y: h * 0.1 },
          br: { x: w * 0.9, y: h * 0.9 },
          bl: { x: w * 0.1, y: h * 0.9 },
      });
      return true;
  }, []);

  const handleCancelManualMode = useCallback(() => {
      setCorners(null);
      setIsManualScanMode(false);
      setIsScanModalOpen(true); // Re-open the modal with the last result
  }, []);

  const handleDownloadPdf = useCallback(async () => {
      if (!scannedImageUrl) return;
      setIsDownloadingPdf(true);
      try {
          const pdf = new jsPDF();
          const img = new Image();
          img.src = scannedImageUrl;
          await new Promise(resolve => { img.onload = resolve; });
          
          const imgProps = pdf.getImageProperties(img);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`pika-ai-scan-${Date.now()}.pdf`);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create PDF.');
      } finally {
          setIsDownloadingPdf(false);
      }
  }, [scannedImageUrl]);

  const handleExportToWord = useCallback(async () => {
    if (!scannedImageUrl) return;
    setExportingDocType('word');
    setError(null);
    try {
        const structure = await generateDocumentStructure(scannedImageUrl);
        if (!structure || !Array.isArray(structure.elements)) {
            throw new Error("AI response did not contain the expected document elements.");
        }
        
        const docElements = [];

        for (const element of structure.elements) {
            if (element.type === 'heading' && element.text) {
                docElements.push(new Paragraph({ text: element.text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
            } else if (element.type === 'paragraph' && element.text) {
                docElements.push(new Paragraph({ text: element.text, spacing: { after: 100 } }));
            } else if (element.type === 'table' && Array.isArray(element.table)) {
                const tableRows = element.table.map((row: string[]) => {
                    return new TableRow({
                        children: row.map(cellText => new TableCell({ children: [new Paragraph(cellText || "")] }))
                    });
                });
                if (tableRows.length > 0) {
                    docElements.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                }
                docElements.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer after table
            }
        }

        if (docElements.length === 0) {
             throw new Error("No exportable content was found in the document.");
        }

        const doc = new Document({
            sections: [{ children: docElements }]
        });

        const blob = await Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pika-ai-scan-${Date.now()}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        handleApiError(err, 'errorFailedToExport');
    } finally {
        setExportingDocType(null);
    }
  }, [scannedImageUrl, handleApiError]);
  
  const handleExportToExcel = useCallback(async () => {
      if (!scannedImageUrl) return;
      setExportingDocType('excel');
      setError(null);
      try {
          const structure = await generateDocumentStructure(scannedImageUrl);
          if (!structure || !Array.isArray(structure.elements)) {
              throw new Error("AI response did not contain the expected document elements.");
          }

          const wb = XLSX.utils.book_new();
          let hasContent = false;

          const tables = structure.elements.filter((el: any) => el.type === 'table' && Array.isArray(el.table));
          if (tables.length > 0) {
              tables.forEach((tableEl: any, index: number) => {
                  const ws = XLSX.utils.aoa_to_sheet(tableEl.table);
                  XLSX.utils.book_append_sheet(wb, ws, `Table ${index + 1}`);
              });
              hasContent = true;
          }

          const textElements = structure.elements.filter((el: any) => (el.type === 'heading' || el.type === 'paragraph') && el.text);
          if (textElements.length > 0) {
              const textData = textElements.map((el: any) => [el.text]);
              const ws = XLSX.utils.aoa_to_sheet(textData);
              XLSX.utils.book_append_sheet(wb, ws, 'Text Content');
              hasContent = true;
          }

          if (!hasContent) {
              throw new Error("No exportable content (tables or text) was found in the document.");
          }

          XLSX.writeFile(wb, `pika-ai-scan-${Date.now()}.xlsx`);

      } catch (err) {
          handleApiError(err, 'errorFailedToExport');
      } finally {
          setExportingDocType(null);
      }
  }, [scannedImageUrl, handleApiError]);

  const handleSelectTargetFace = useCallback((faceIndex: number) => {
    setSelectedTargetFace({ fileKey: 'currentImage', faceIndex });
  }, []);

  const handleSelectSourceFace = useCallback((faceIndex: number) => {
    if (swapFaceFile) {
        const fileKey = swapFaceFile.name + swapFaceFile.lastModified;
        setSelectedSourceFace({ fileKey, faceIndex });
    }
  }, [swapFaceFile]);


  // Effect to detect faces on the main image for Face Swap mode
  useEffect(() => {
    if (currentImage) {
        const fileKey = 'currentImage';
        const faces = detectedFaces[fileKey];
        if (!faces) {
            handleFileFaceDetection(currentImage, 'target', fileKey);
        }
    }
  }, [currentImage, handleFileFaceDetection, detectedFaces]);


  const handleUndo = useCallback(() => {
    if (canUndo) {
      handleHistorySelect(historyIndex - 1);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      handleHistorySelect(historyIndex + 1);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      handleHistorySelect(0);
      setError(null);
      resetView();
    }
  }, [history, resetView]);

  const handleDownload = useCallback(() => {
    if (!currentImage) {
        setError(t('errorCouldNotFindImage'));
        return;
    }

    const mimeType = 'image/jpeg';
    const filename = `pika-ai-edited-${Date.now()}.jpg`;

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                setError(t('errorCouldNotProcessDownload'));
                return;
            }

            // Fill background with white if converting to JPEG from a source that might have transparency.
            if (currentImage.type !== 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(image, 0, 0);

            const dataUrl = canvas.toDataURL(mimeType, 0.92);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
             if (err instanceof DOMException && err.name === 'SecurityError') {
                setError(t('errorDownloadTainted'));
                console.error("Canvas is tainted, cannot download. Image src:", image.src, err);
             } else {
                setError(t('errorCouldNotProcessDownload'));
                console.error("Canvas toDataURL error:", err);
             }
        } finally {
             // Clean up the object URL after we're done with it
             URL.revokeObjectURL(image.src);
        }
    };
    
    image.onerror = () => {
        setError(t('errorImageLoadForDownload'));
        URL.revokeObjectURL(image.src); // Clean up on error too
    };

    // Create a temporary URL from the File object and assign it to the image
    image.src = URL.createObjectURL(currentImage);

  }, [currentImage, t]);


  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleRequestFileUpload = useCallback(() => {
    document.getElementById('global-file-input')?.click();
  }, []);

  const handleViewerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.corner-handle') || (e.target as HTMLElement).closest('[data-slider-handle="true"]')) return;
      if (activeTab === 'retouch' && selectionMode === 'brush') return; // Let canvas handle it
      if (activeTab === 'scan' && isManualScanMode) return; // Let corner handles manage clicks
      if (scale <= 1 && !isComparing) return; // Don't pan if not zoomed (allow in compare mode)

      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialPosition: position,
      };

  }, [activeTab, selectionMode, isManualScanMode, position, scale, isComparing]);

  const handleViewerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      showZoomControls();
      // For custom cursor
      if (activeTab === 'retouch' && selectionMode === 'brush') {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
  }, [showZoomControls, activeTab, selectionMode]);
  
  const handleViewerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTab !== 'retouch' || selectionMode !== 'point' || !imgRef.current) return;
      
      const img = imgRef.current;
      const imgRect = img.getBoundingClientRect();
      
      // Check if the click was inside the image bounds within the viewer
      if (e.clientX < imgRect.left || e.clientX > imgRect.right || e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
          return; // Click was outside the image, in the letterboxing area
      }

      const clickOnImgX = e.clientX - imgRect.left;
      const clickOnImgY = e.clientY - imgRect.top;
      
      const { naturalWidth, naturalHeight } = img;
      const originalX = Math.round((clickOnImgX / imgRect.width) * naturalWidth);
      const originalY = Math.round((clickOnImgY / imgRect.height) * naturalHeight);
      
      setEditHotspot({ x: originalX, y: originalY });
      setRetouchPrompt(''); // Reset prompt for new point
  };

  const handleViewerWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const zoomAmount = 0.1;
      if (e.deltaY < 0) {
          handleZoom('in', zoomAmount);
      } else {
          handleZoom('out', zoomAmount);
      }
  }, [handleZoom]);

  // --- Pinch-to-Zoom and Touch Pan Handlers ---
  const getDistanceBetweenTouches = (touches: React.TouchList): number => {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
  };
  
  const handleViewerTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    showZoomControls();
    if ((e.target as HTMLElement).closest('.corner-handle') || (e.target as HTMLElement).closest('[data-slider-handle="true"]')) return;
    if (activeTab === 'retouch' && selectionMode === 'brush') return;
    if (activeTab === 'scan' && isManualScanMode) return;

    e.preventDefault();

    if (e.touches.length === 2) {
        // Pinch start
        setIsPanning(false);
        panStartRef.current = null;
        pinchStartDistRef.current = getDistanceBetweenTouches(e.touches);
        pinchStartScaleRef.current = scale;
    } else if (e.touches.length === 1 && (scale > 1 || isComparing)) {
        // Pan start
        setIsPanning(true);
        panStartRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            initialPosition: position,
        };
    }
  }, [scale, showZoomControls, activeTab, selectionMode, isManualScanMode, position, isComparing]);

  const handleViewerTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    showZoomControls();
    e.preventDefault();
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
        reportInteraction(); // Provide visual feedback for pinch-zoom
        // Pinch move
        const newDist = getDistanceBetweenTouches(e.touches);
        const ratio = newDist / pinchStartDistRef.current;
        const newScale = pinchStartScaleRef.current * ratio;
        setScale(Math.max(0.2, Math.min(newScale, 10)));
    }
  }, [showZoomControls, reportInteraction]);

  const handleViewerTouchEnd = useCallback(() => {
    // Reset gesture states
    pinchStartDistRef.current = null;
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // --- Handlers for Tools Panel Swiping ---
  const handleToolsTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1) {
          swipeStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
              time: Date.now(),
          };
          gestureLockRef.current = null;
      } else {
          swipeStartRef.current = null; // Invalidate swipe if more than one finger
      }
  }, []);

  const handleToolsTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeStartRef.current || e.touches.length !== 1) {
          return;
      }
      
      // Determine and lock gesture direction on first significant movement
      if (gestureLockRef.current === null) {
          const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
          const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
          
          if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) { // Threshold to prevent locking on small jitters
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  gestureLockRef.current = 'horizontal';
              } else {
                  gestureLockRef.current = 'vertical';
              }
          }
      }
      
      // If gesture is horizontal, prevent vertical scroll
      if (gestureLockRef.current === 'horizontal') {
          e.preventDefault();
      }
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

      const swipeThreshold = 50; // Min horizontal pixels
      const verticalThreshold = 75; // Max vertical movement for a horizontal swipe

      if (deltaTime < 500 && Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < verticalThreshold) {
          const availableTabs = TABS_CONFIG.filter(tab => {
              if (tab.id === 'insert' || tab.id === 'faceswap') return true; // Always available
              return !!currentImage;
          });
          const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);
          
          if (currentIndex !== -1) {
              let nextIndex;
              if (deltaX < 0) { // Swipe left (next tab)
                  nextIndex = (currentIndex + 1) % availableTabs.length;
              } else { // Swipe right (previous tab)
                  nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
              }
              setActiveTab(availableTabs[nextIndex].id as Tab);
          }
      }
      
      // Reset for next gesture
      swipeStartRef.current = null;
      gestureLockRef.current = null;
  }, [activeTab, currentImage]);
  
  // --- Mask Canvas Drawing Handlers ---
  const getBrushCoordinates = (point: { clientX: number; clientY: number }): { x: number; y: number } | null => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // Point position relative to the canvas element
    const pointX = point.clientX - rect.left;
    const pointY = point.clientY - rect.top;
    
    // The canvas's drawing surface dimensions (from the image's natural dimensions)
    const contentWidth = canvas.width;
    const contentHeight = canvas.height;
    
    // The canvas element's dimensions on the screen
    const elementWidth = rect.width;
    const elementHeight = rect.height;

    // Calculate aspect ratios
    const contentAspectRatio = contentWidth / contentHeight;
    const elementAspectRatio = elementWidth / elementHeight;
    
    let renderedWidth: number, renderedHeight: number, renderedX: number, renderedY: number;

    // Calculate the actual size and position of the 'contained' content
    if (elementAspectRatio > contentAspectRatio) {
        // Element is wider than content, so it's letterboxed vertically
        renderedHeight = elementHeight;
        renderedWidth = renderedHeight * contentAspectRatio;
        renderedX = (elementWidth - renderedWidth) / 2;
        renderedY = 0;
    } else {
        // Element is taller than content, so it's letterboxed horizontally
        renderedWidth = elementWidth;
        renderedHeight = renderedWidth / contentAspectRatio;
        renderedX = 0;
        renderedY = (elementHeight - renderedHeight) / 2;
    }
    
    // Check if the point is outside the rendered content area
    if (pointX < renderedX || pointX > renderedX + renderedWidth || pointY < renderedY || pointY > renderedY + renderedHeight) {
        return null; // Point is in the "empty" letterboxed area
    }

    // Translate point coordinates to be relative to the rendered content's top-left corner
    const xInContent = pointX - renderedX;
    const yInContent = pointY - renderedY;
    
    // Scale these coordinates to match the canvas's internal drawing surface resolution
    const scaleX = contentWidth / renderedWidth;
    const scaleY = contentHeight / renderedHeight;
    
    return { x: xInContent * scaleX, y: yInContent * scaleY };
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    
    const coords = getBrushCoordinates(e);
    if (!coords) return; // Don't start drawing if click is in letterbox

    setIsDrawing(true);
    lastDrawPointRef.current = coords;

    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    // Draw the initial dot for the brush stroke
    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  
  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!isDrawing) return;

    const coords = getBrushCoordinates(e);
    // If mouse is outside the drawable area, stop the line and wait.
    if (!coords) {
        lastDrawPointRef.current = null;
        return;
    }
    
    const lastPoint = lastDrawPointRef.current;
    // If the mouse just re-entered the drawable area, start a new point.
    if (!lastPoint) {
        lastDrawPointRef.current = coords;
        return;
    }

    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastDrawPointRef.current = coords;
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsDrawing(false);
    lastDrawPointRef.current = null;
  };
  
  const handleCanvasTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const coords = getBrushCoordinates(touch);
    if (!coords) return;

    setIsDrawing(true);
    lastDrawPointRef.current = coords;

    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  
  const handleCanvasTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || e.touches.length === 0) return;
    const touch = e.touches[0];
    const coords = getBrushCoordinates(touch);

    if (!coords) {
        lastDrawPointRef.current = null;
        return;
    }
    
    const lastPoint = lastDrawPointRef.current;
    if (!lastPoint) {
        lastDrawPointRef.current = coords;
        return;
    }

    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastDrawPointRef.current = coords;
  };

  useEffect(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas || activeTab !== 'retouch' || selectionMode !== 'brush') return;

      const onMouseDown = (e: MouseEvent) => handleCanvasMouseDown(e);
      const onMouseMove = (e: MouseEvent) => handleCanvasMouseMove(e);
      const onTouchStart = (e: TouchEvent) => handleCanvasTouchStart(e);
      const onTouchMove = (e: TouchEvent) => handleCanvasTouchMove(e);

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      
      // Handle end of drawing on window to catch cases where mouse leaves canvas while pressed
      window.addEventListener('mouseup', handleCanvasMouseUpOrLeave);
      window.addEventListener('touchend', handleCanvasMouseUpOrLeave);
      window.addEventListener('touchcancel', handleCanvasMouseUpOrLeave);
      
      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('mouseup', handleCanvasMouseUpOrLeave);
        window.removeEventListener('touchend', handleCanvasMouseUpOrLeave);
        window.removeEventListener('touchcancel', handleCanvasMouseUpOrLeave);
      };
  }, [activeTab, selectionMode, isDrawing, brushMode, brushSize]);


  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
      if (activeCorner) {
          handleCornerDrag(e.clientX, e.clientY);
      } else if (activeExpansionHandle && dragStart) {
        const deltaX = (e.clientX - dragStart.x) / scale;
        const deltaY = (e.clientY - dragStart.y) / scale;
        
        const newPadding = { ...dragStart.initialPadding };

        if (activeExpansionHandle.includes('t')) {
            newPadding.top = Math.max(0, dragStart.initialPadding.top - deltaY);
        }
        if (activeExpansionHandle.includes('b')) {
            newPadding.bottom = Math.max(0, dragStart.initialPadding.bottom + deltaY);
        }
        if (activeExpansionHandle.includes('l')) {
            newPadding.left = Math.max(0, dragStart.initialPadding.left - deltaX);
        }
        if (activeExpansionHandle.includes('r')) {
            newPadding.right = Math.max(0, dragStart.initialPadding.right + deltaX);
        }
        setExpansionPadding(newPadding);
    } else if (isPanning && panStartRef.current) {
          const dx = e.clientX - panStartRef.current.startX;
          const dy = e.clientY - panStartRef.current.startY;
          setPosition({
              x: panStartRef.current.initialPosition.x + dx,
              y: panStartRef.current.initialPosition.y + dy,
          });
      }
  }, [activeCorner, isPanning, activeExpansionHandle, dragStart, scale]);

  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
      if (e.touches.length === 0) return;
      if (activeCorner) {
          handleCornerDrag(e.touches[0].clientX, e.touches[0].clientY);
      } else if (activeExpansionHandle && dragStart && e.touches.length === 1) {
          const deltaX = (e.touches[0].clientX - dragStart.x) / scale;
          const deltaY = (e.touches[0].clientY - dragStart.y) / scale;
          const newPadding = { ...dragStart.initialPadding };
          if (activeExpansionHandle.includes('t')) {
              newPadding.top = Math.max(0, dragStart.initialPadding.top - deltaY);
          }
          if (activeExpansionHandle.includes('b')) {
              newPadding.bottom = Math.max(0, dragStart.initialPadding.bottom + deltaY);
          }
          if (activeExpansionHandle.includes('l')) {
              newPadding.left = Math.max(0, dragStart.initialPadding.left - deltaX);
          }
          if (activeExpansionHandle.includes('r')) {
              newPadding.right = Math.max(0, dragStart.initialPadding.right + deltaX);
          }
          setExpansionPadding(newPadding);
      } else if (isPanning && panStartRef.current && e.touches.length === 1) {
          // Handle pan move globally to allow dragging outside the viewer bounds.
          const dx = e.touches[0].clientX - panStartRef.current.startX;
          const dy = e.touches[0].clientY - panStartRef.current.startY;
          setPosition({
              x: panStartRef.current.initialPosition.x + dx,
              y: panStartRef.current.initialPosition.y + dy,
          });
      }
  }, [activeCorner, isPanning, activeExpansionHandle, dragStart, scale]);


  const handleGlobalMouseUp = useCallback(() => {
      setActiveCorner(null);
      setIsPanning(false);
      panStartRef.current = null;
      setActiveExpansionHandle(null);
      setDragStart(null);
  }, []);

  useEffect(() => {
      const isDragging = !!activeCorner || isPanning || !!activeExpansionHandle;
      if (isDragging) {
          window.addEventListener('mousemove', handleGlobalMouseMove);
          window.addEventListener('mouseup', handleGlobalMouseUp);
          window.addEventListener('mouseleave', handleGlobalMouseUp);
          
          window.addEventListener('touchmove', handleGlobalTouchMove);
          window.addEventListener('touchend', handleGlobalMouseUp);
          window.addEventListener('touchcancel', handleGlobalMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
          window.removeEventListener('mouseleave', handleGlobalMouseUp);
          
          window.removeEventListener('touchmove', handleGlobalTouchMove);
          window.removeEventListener('touchend', handleGlobalMouseUp);
          window.removeEventListener('touchcancel', handleGlobalMouseUp);
      };
  }, [activeCorner, isPanning, activeExpansionHandle, handleGlobalMouseMove, handleGlobalTouchMove, handleGlobalMouseUp]);
  
  // --- Corner Drag Handlers ---
  const handleCornerDrag = (clientX: number, clientY: number) => {
      if (!activeCorner || !imgRef.current) return;
      
      const img = imgRef.current;
      const imgRect = img.getBoundingClientRect();
      
      // Calculate mouse position relative to the scaled image
      let x = clientX - imgRect.left;
      let y = clientY - imgRect.top;
      
      // Clamp to image boundaries
      x = Math.max(0, Math.min(x, imgRect.width));
      y = Math.max(0, Math.min(y, imgRect.height));
      
      // Convert to natural image coordinates
      const naturalX = Math.round((x / imgRect.width) * img.naturalWidth);
      const naturalY = Math.round((y / imgRect.height) * img.naturalHeight);
      
      setCorners(prev => prev ? { ...prev, [activeCorner]: { x: naturalX, y: naturalY } } : null);
  };
  
  const handleCornerMouseDown = (e: React.MouseEvent, corner: keyof Corners) => {
      e.stopPropagation();
      setActiveCorner(corner);
  };

  const handleCornerTouchStart = (e: React.TouchEvent, corner: keyof Corners) => {
      e.stopPropagation();
      setActiveCorner(corner);
  };

  // --- Expand Handlers ---
  const handleExpansionHandleMouseDown = (e: React.MouseEvent, handle: ExpansionHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveExpansionHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY, initialPadding: expansionPadding });
  };

  const handleExpansionHandleTouchStart = (e: React.TouchEvent, handle: ExpansionHandle) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
        setActiveExpansionHandle(handle);
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, initialPadding: expansionPadding });
    }
  };


  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' || (e.target as HTMLElement).tagName.toLowerCase() === 'textarea') {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        let handled = false;
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              handleRedo(); // Ctrl+Shift+Z or Cmd+Shift+Z
            } else {
              handleUndo(); // Ctrl+Z or Cmd+Z
            }
            handled = true;
            break;
          case 'y':
            handleRedo(); // Ctrl+Y or Cmd+Y
            handled = true;
            break;
        }
        if (handled) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);
  
  const handleToggleCompare = () => {
    setIsComparing(prev => {
        if (!prev) { // Entering compare mode
            resetView();
        }
        return !prev;
    });
  };

  // --- Comparison Slider Handlers ---
  const handleSliderMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsSliding(true);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      setIsSliding(true);
  };
  
  const handleSliderMove = useCallback((clientX: number) => {
      if (!isSliding || !imageViewerRef.current) return;
      
      const rect = imageViewerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percent);
  }, [isSliding]);

  const handleSliderMouseUp = useCallback(() => {
      setIsSliding(false);
  }, []);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => handleSliderMove(e.clientX);
      const handleTouchMove = (e: TouchEvent) => {
          if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
      };

      if (isSliding) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleSliderMouseUp);
          window.addEventListener('touchmove', handleTouchMove);
          window.addEventListener('touchend', handleSliderMouseUp);
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleSliderMouseUp);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('touchend', handleSliderMouseUp);
      };
  }, [isSliding, handleSliderMove, handleSliderMouseUp]);

  // Attach pan/zoom handlers only when an image is loaded
  const viewerEventHandlers = currentImage ? {
      onMouseDown: handleViewerMouseDown,
      onMouseMove: handleViewerMouseMove,
      onMouseLeave: () => {
          setIsMouseOverViewer(false);
      },
      onMouseEnter: () => {
          setIsMouseOverViewer(true);
          showZoomControls();
      },
      onClick: handleViewerClick,
      onWheel: handleViewerWheel,
      onTouchStart: handleViewerTouchStart,
      onTouchMove: handleViewerTouchMove,
      onTouchEnd: handleViewerTouchEnd,
  } : {};


  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 backdrop-blur-xl border border-red-400/30 p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center gap-4 shadow-2xl shadow-black/30">
            <h2 className="text-2xl font-bold text-red-300">{t('errorAnErrorOccurred')}</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                {t('errorTryAgain')}
            </button>
          </div>
        );
    }
    
    const imageDisplay = (
        <div
            ref={imageViewerRef}
            className={`relative w-full h-full overflow-hidden bg-black/30 select-none rounded-2xl transition-all duration-200 ease-in-out
                ${currentImage ? 'touch-none' : ''}
                ${isPanning ? 'cursor-grabbing' : ''}
                ${!isPanning && scale > 1 ? 'cursor-grab' : ''}
                ${activeTab === 'retouch' && selectionMode === 'point' && currentImage && !isComparing ? 'cursor-crosshair' : ''}
                ${activeTab === 'retouch' && selectionMode === 'brush' && currentImage && !isComparing ? 'cursor-none' : ''}
                ${(isPanning || isInteracting) ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/25' : ''}
            `}
            {...viewerEventHandlers}
        >
             {/* Placeholder when no image is loaded */}
             {!currentImageUrl && (
                <div className="w-full h-full flex items-center justify-center">
                    <ImagePlaceholder onFileSelect={handleFileSelect} />
                </div>
            )}
            
            {/* --- RENDER LOGIC WITH IMAGE --- */}
            {currentImageUrl && (
                isComparing && canUndo && beforeImageUrl ? (
                    // --- COMPARING VIEW ---
                    windowSize.width < 768 ? (
                        // --- SLIDER VIEW (MOBILE) ---
                        <>
                            {/* Background Image (Original/Before) */}
                            <div
                                className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'center center',
                                }}
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={beforeImageUrl}
                                        alt={t('original')}
                                        crossOrigin="anonymous"
                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                    />
                                </div>
                            </div>
                        
                            {/* Foreground Image (Edited/After) - This one gets clipped */}
                            <div
                                className="absolute inset-0 w-full h-full"
                                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                            >
                                <div
                                    className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img
                                            ref={imgRef} // Keep ref on the visible "main" image
                                            key={historyIndex}
                                            src={currentImageUrl}
                                            alt={t('edited')}
                                            crossOrigin="anonymous"
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Slider Handle - Overlay on viewer */}
                            <div
                                ref={sliderRef}
                                className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize group z-30"
                                style={{ left: `calc(${sliderPosition}% - 2px)` }}
                                onMouseDown={handleSliderMouseDown}
                                onTouchStart={handleSliderTouchStart}
                                aria-label={t('compareSliderAria')}
                                data-slider-handle="true"
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 -left-3 bg-white rounded-full p-1.5 shadow-lg border-2 border-cyan-400 transition-transform group-hover:scale-110">
                                    <ChevronsLeftRightIcon className="w-5 h-5 text-black"/>
                                </div>
                            </div>
                        </>
                    ) : (
                        // --- SIDE-BY-SIDE VIEW (DESKTOP) ---
                        <div
                            className="transition-transform duration-100 ease-out w-full h-full flex items-center justify-center"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'center center',
                            }}
                        >
                            <div className="flex w-full h-full gap-4">
                                {/* Before Image Container */}
                                <div className="w-1/2 h-full relative flex items-center justify-center">
                                    <img
                                        src={beforeImageUrl}
                                        alt={t('original')}
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-10">
                                        {t('original')}
                                    </div>
                                </div>
                                {/* After Image Container */}
                                <div className="w-1/2 h-full relative flex items-center justify-center">
                                    <img
                                        ref={imgRef} // Keep ref on the "main" image
                                        key={historyIndex}
                                        src={currentImageUrl}
                                        alt={t('edited')}
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                     <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-10">
                                        {t('edited')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    // --- NORMAL VIEW ---
                    <div
                        className="transition-transform duration-100 ease-out w-full h-full"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: 'center center',
                        }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                ref={imgRef}
                                key={historyIndex}
                                src={currentImageUrl}
                                alt={t('edited')}
                                crossOrigin="anonymous"
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />
                            
                            {/* Overlays that transform with image */}
                             {/* Mask Canvas for brushing */}
                            <canvas
                                ref={maskCanvasRef}
                                className="absolute inset-0 w-full h-full object-contain opacity-40"
                                style={{
                                    pointerEvents: activeTab === 'retouch' && selectionMode === 'brush' && currentImage ? 'auto' : 'none',
                                    cursor: 'none'
                                }}
                            />

                            {/* Manual Scan UI Layer */}
                            {activeTab === 'scan' && isManualScanMode && corners && imgRef.current && (
                                <div className="absolute inset-0 w-full h-full object-contain pointer-events-none">
                                    <svg 
                                        className="absolute inset-0 w-full h-full"
                                        viewBox={`0 0 ${imgRef.current.naturalWidth} ${imgRef.current.naturalHeight}`}
                                        preserveAspectRatio="xMidYMid meet"
                                    >
                                        <polygon
                                            points={`${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`}
                                            className="fill-cyan-500/20 stroke-cyan-400"
                                            style={{ vectorEffect: 'non-scaling-stroke', strokeWidth: '2px' }}
                                        />
                                    </svg>
                                    {Object.keys(corners).map((key) => {
                                        const cornerKey = key as keyof Corners;
                                        return (
                                            <div
                                                key={cornerKey}
                                                className="corner-handle absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-cyan-500 cursor-move pointer-events-auto shadow-lg"
                                                style={{
                                                    left: `${(corners[cornerKey].x / imgRef.current!.naturalWidth) * 100}%`,
                                                    top: `${(corners[cornerKey].y / imgRef.current!.naturalHeight) * 100}%`,
                                                }}
                                                onMouseDown={(e) => handleCornerMouseDown(e, cornerKey)}
                                                onTouchStart={(e) => handleCornerTouchStart(e, cornerKey)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
            
             {/* Fixed Overlays (on top of viewer, don't transform) */}
             {!isComparing && (
                <>
                    {/* Interactive Expansion UI v2 */}
                    {currentImage && activeTab === 'expand' && imgRef.current && imageViewerRef.current && (() => {
                        const img = imgRef.current;
                        const viewer = imageViewerRef.current;

                        const imgRect = img.getBoundingClientRect();
                        const viewerRect = viewer.getBoundingClientRect();
                        if (imgRect.width === 0) return null;

                        const imgTop = imgRect.top - viewerRect.top;
                        const imgLeft = imgRect.left - viewerRect.left;

                        const newLeft = imgLeft - expansionPadding.left;
                        const newTop = imgTop - expansionPadding.top;
                        const newWidth = imgRect.width + expansionPadding.left + expansionPadding.right;
                        const newHeight = imgRect.height + expansionPadding.top + expansionPadding.bottom;
                        
                        const handles: { id: ExpansionHandle, cursor: string, positionStyle: React.CSSProperties, shapeClass: string }[] = [
                            // Corners
                            { id: 'tl', cursor: 'nwse-resize', positionStyle: { top: 0, left: 0 }, shapeClass: 'w-3 h-3' },
                            { id: 'tr', cursor: 'nesw-resize', positionStyle: { top: 0, right: 0 }, shapeClass: 'w-3 h-3' },
                            { id: 'bl', cursor: 'nesw-resize', positionStyle: { bottom: 0, left: 0 }, shapeClass: 'w-3 h-3' },
                            { id: 'br', cursor: 'nwse-resize', positionStyle: { bottom: 0, right: 0 }, shapeClass: 'w-3 h-3' },
                            // Edges
                            { id: 'top', cursor: 'ns-resize', positionStyle: { top: 0, left: '50%', transform: 'translateX(-50%)' }, shapeClass: 'w-6 h-1.5' },
                            { id: 'bottom', cursor: 'ns-resize', positionStyle: { bottom: 0, left: '50%', transform: 'translateX(-50%)' }, shapeClass: 'w-6 h-1.5' },
                            { id: 'left', cursor: 'ew-resize', positionStyle: { left: 0, top: '50%', transform: 'translateY(-50%)' }, shapeClass: 'w-1.5 h-6' },
                            { id: 'right', cursor: 'ew-resize', positionStyle: { right: 0, top: '50%', transform: 'translateY(-50%)' }, shapeClass: 'w-1.5 h-6' },
                        ];
                        
                        return (
                            <>
                                {/* Overlay to dim outside area */}
                                <div className="absolute pointer-events-none" style={{ top: newTop, left: newLeft, width: newWidth, height: newHeight, boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)' }} />

                                {/* Bounding box with handles */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        top: newTop,
                                        left: newLeft,
                                        width: newWidth,
                                        height: newHeight,
                                    }}
                                >
                                    {/* Border and rule-of-thirds lines */}
                                    <div className="absolute inset-0 border-2 border-white pointer-events-none">
                                        <div className="absolute top-1/3 w-full h-px bg-white/50"></div>
                                        <div className="absolute top-2/3 w-full h-px bg-white/50"></div>
                                        <div className="absolute left-1/3 h-full w-px bg-white/50"></div>
                                        <div className="absolute left-2/3 h-full w-px bg-white/50"></div>
                                    </div>
                                    
                                    {/* Render Handles */}
                                    {handles.map(({ id, cursor, positionStyle, shapeClass }) => (
                                        <div
                                            key={id}
                                            className="absolute pointer-events-auto"
                                            style={{ ...positionStyle, cursor }}
                                            onMouseDown={(e) => handleExpansionHandleMouseDown(e, id)}
                                            onTouchStart={(e) => handleExpansionHandleTouchStart(e, id)}
                                        >
                                            {/* Visual handle element with larger invisible touch area */}
                                            <div className="absolute p-2" style={{ transform: 'translate(-50%, -50%)' }}>
                                                <div className={`bg-white rounded-full border-2 border-cyan-500 shadow-lg ${shapeClass}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}

                    {/* Hotspot Indicator - Use pre-calculated position from state */}
                    {hotspotDisplayPosition && !isLoading && (
                      <div 
                          className="absolute rounded-full w-5 h-5 bg-cyan-500/70 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40"
                          style={{ left: `${hotspotDisplayPosition.left}px`, top: `${hotspotDisplayPosition.top}px` }}
                      >
                          <div className="absolute inset-[-4px] rounded-full w-7 h-7 animate-ping bg-cyan-400 opacity-80"></div>
                      </div>
                    )}
                    
                    {/* Custom Brush Cursor */}
                    {isMouseOverViewer && activeTab === 'retouch' && selectionMode === 'brush' && mousePosition && imgRef.current && (
                        (() => {
                            const img = imgRef.current;
                            const canvasRect = maskCanvasRef.current?.getBoundingClientRect();
                            if (!canvasRect || canvasRect.width === 0) return null;
                            
                            const pixelToScreenRatio = img.naturalWidth / canvasRect.width; 
                            const cursorSize = brushSize / pixelToScreenRatio;
                            
                            return (
                                <div
                                    className={`absolute pointer-events-none rounded-full z-50 transition-all duration-75 flex items-center justify-center ${brushMode === 'draw' ? 'cursor-draw-pulse' : 'cursor-erase-pulse'}`}
                                    style={{
                                        left: `${mousePosition.x}px`,
                                        top: `${mousePosition.y}px`,
                                        width: `${cursorSize}px`,
                                        height: `${cursorSize}px`,
                                        transform: 'translate(-50%, -50%)',
                                        border: `2px solid ${brushMode === 'draw' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 50, 50, 0.9)'}`,
                                        backgroundColor: brushMode === 'draw' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 50, 50, 0.2)'
                                    }}
                                >
                                     <div className="w-1 h-1 bg-white rounded-full"></div>
                                </div>
                            );
                        })()
                    )}
                </>
             )}

            {currentImage && (
              <>
                <div className={`absolute z-20 transition-all duration-300 ease-in-out
                    left-4 top-1/2 -translate-y-1/2
                    ${isZoomControlsVisible && !isSliding
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 pointer-events-none -translate-x-4'
                    }
                `}>
                    <div className="flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10">
                        <button onClick={() => handleZoom('out')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('zoomOut')}>
                            <ZoomOutIcon className="w-6 h-6" />
                        </button>
                        <button onClick={resetView} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('resetZoom')}>
                            <ArrowsPointingOutIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleZoom('in')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('zoomIn')}>
                            <ZoomInIcon className="w-6 h-6" />
                        </button>
                         {history.length > 1 && (
                           <button 
                              onClick={() => setIsHistoryPanelOpen(p => !p)}
                              className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95"
                              title={t('historyTitle')}
                           >
                             <ClockIcon className={`w-6 h-6 ${isHistoryPanelOpen ? 'text-cyan-400' : ''}`} />
                           </button>
                         )}
                         {canUndo && (
                            <button
                                onClick={handleToggleCompare}
                                className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95"
                                title={isComparing ? t('viewEdited') : t('viewOriginal')}
                            >
                                {isComparing ? (
                                    <EyeSlashIcon className="w-6 h-6 text-cyan-400" />
                                ) : (
                                    <EyeIcon className="w-6 h-6" />
                                )}
                            </button>
                         )}
                    </div>
                </div>

                <div className={`absolute z-20 transition-all duration-300 ease-in-out
                    right-4 top-1/2 -translate-y-1/2
                    ${isZoomControlsVisible && !isComparing && !isSliding
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 pointer-events-none translate-x-4'
                    }
                `}>
                    <div className="flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10">
                        <button onClick={() => handleApplyTransform('rotate-ccw')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('adjustmentRotateLeft')}>
                            <UndoIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleApplyTransform('rotate-cw')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('adjustmentRotateRight')}>
                            <RedoIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleApplyTransform('flip-h')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('adjustmentFlipHorizontal')}>
                            <FlipHorizontalIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleApplyTransform('flip-v')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('adjustmentFlipVertical')}>
                            <FlipVerticalIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
              </>
            )}
        </div>
    );
    
    const editorSidebarProps = {
        currentImage: currentImage,
        isImageLoaded: !!currentImage,
        isLoading: isLoading,
        activeTab: activeTab,
        setActiveTab: setActiveTab,
        onApplyRetouch: handleGenerate,
        onApplyIdPhoto: handleApplyIdPhoto,
        onApplyAdjustment: handleApplyAdjustment,
        onApplyFilter: handleApplyFilter,
        onApplyExpansion: handleApplyExpansion,
        expandPrompt: expandPrompt,
        onExpandPromptChange: setExpandPrompt,
        hasExpansion: hasExpansion,
        onApplyComposite: handleApplyComposite,
        onApplyFaceSwap: handleApplyFaceSwap,
        onSelectTargetFace: handleSelectTargetFace,
        onSelectSourceFace: handleSelectSourceFace,
        insertSubjectFiles: insertSubjectFiles,
        onInsertSubjectFilesChange: handleInsertSubjectFilesChange,
        insertStyleFiles: insertStyleFiles,
        onInsertStyleFilesChange: setInsertStyleFiles,
        swapFaceFile: swapFaceFile,
        onSwapFaceFileChange: handleSwapFaceFileChange,
        insertBackgroundFile: insertBackgroundFile,
        onInsertBackgroundFileChange: handleInsertBackgroundFileChange,
        insertPrompt: insertPrompt,
        onInsertPromptChange: setInsertPrompt,
        insertUseSearch: insertUseSearch,
        onInsertUseSearchChange: setInsertUseSearch,
        detectedFaces: detectedFaces,
        selectedTargetFace: selectedTargetFace,
        selectedSourceFace: selectedSourceFace,
        onApplyScan: handleApplyScan,
        onApplyManualScan: handleApplyManualScan,
        onCancelManualMode: handleCancelManualMode,
        onEnterManualMode: handleEnterManualMode,
        scanHistory: scanHistory,
        onReviewScan: handleReviewScan,
        onApplyExtract: handleApplyExtract,
        extractPrompt: extractPrompt,
        onExtractPromptChange: setExtractPrompt,
        extractedItemsFiles: extractedItems,
        extractedItemUrls: extractedItemUrls,
        extractHistoryFiles: extractHistory,
        extractedHistoryItemUrls: extractedHistoryItemUrls,
        onUseExtractedAsStyle: handleUseExtractedAsStyle,
        onDownloadExtractedItem: handleDownloadExtractedItem,
        isMaskPresent: isMaskPresent(),
        clearMask: clearMask,
        retouchPrompt: retouchPrompt,
        onRetouchPromptChange: setRetouchPrompt,
        retouchPromptInputRef: retouchPromptInputRef,
        retouchUseSearch: retouchUseSearch,
        onRetouchUseSearchChange: setRetouchUseSearch,
        selectionMode: selectionMode,
        setSelectionMode: (mode: SelectionMode) => {
            setSelectionMode(mode);
            setEditHotspot(null);
            clearMask();
            setRetouchPrompt('');
        },
        brushMode: brushMode,
        setBrushMode: setBrushMode,
        brushSize: brushSize,
        setBrushSize: setBrushSize,
        isHotspotSelected: !!editHotspot,
        isManualScanMode: isManualScanMode,
        setIsManualScanMode: setIsManualScanMode,
        onRequestFileUpload: handleRequestFileUpload,
    };

    const editorLayout = (
        <div className="w-full h-full flex-grow grid grid-cols-1 grid-rows-2 sm:grid-rows-1 sm:grid-cols-[1fr_auto] gap-4 overflow-hidden">
             {isScanModalOpen && (
              <ScanViewerModal
                imageUrl={scannedImageUrl}
                originalImageUrl={currentImageUrl}
                onClose={handleCloseScanModal}
                onSave={handleSaveScannedImage}
                onAdjust={handleEnterManualMode}
                isLoading={isLoading}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
                onExportToWord={handleExportToWord}
                onExportToExcel={handleExportToExcel}
                exportingDocType={exportingDocType}
              />
            )}
            
            {/* Image Viewer Area */}
            <div className="flex flex-col min-w-0 min-h-0 relative">
                 <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                    style={{ transform: activeTab === 'expand' ? 'scale(1)' : `scale(${imageScale})` }}
                 >
                    <div className="w-full h-full relative">
                        {isLoading && !isScanModalOpen && (
                            <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center gap-4 animate-fade-in rounded-2xl">
                                <Spinner />
                                <p className="text-gray-300">{t('loadingText')}</p>
                            </div>
                        )}
                        
                        <div className="w-full h-full border glow-border-animate rounded-2xl p-1 relative flex items-center justify-center">
                            { imageDisplay }
                        </div>
                    </div>
                </div>
                <HistoryPanel
                    history={history}
                    currentIndex={historyIndex}
                    onSelect={handleHistorySelect}
                    isLoading={isLoading}
                    isOpen={isHistoryPanelOpen}
                    onClose={() => setIsHistoryPanelOpen(false)}
                />
            </div>

            {/* Controls (visible on mobile and desktop) */}
            <div className={`
              transition-all duration-300 ease-in-out overflow-hidden
              ${isToolboxOpen ? 'w-full sm:w-[320px] md:w-[350px] lg:w-[400px]' : 'w-0 h-0 sm:w-0' }
            `}>
              <div 
                ref={toolsContainerRef} 
                className="w-full h-full flex flex-col overflow-y-auto sm:pr-2 touch-pan-y"
                onTouchStart={handleToolsTouchStart}
                onTouchMove={handleToolsTouchMove}
                onTouchEnd={handleToolsTouchEnd}
              >
                  <EditorSidebar {...editorSidebarProps} />
              </div>
            </div>
        </div>
    );
    
    return editorLayout;
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col h-screen overflow-hidden">
        <input
            type="file"
            id="global-file-input"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
                handleFileSelect(e.target.files);
                if (e.target) e.target.value = '';
            }}
        />
        <Header
            isImageLoaded={!!currentImage}
            imageFile={currentImage}
            imageDimensions={imageDimensions}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onDownload={handleDownload}
            isLoading={isLoading}
            onToggleToolbox={toggleToolbox}
            onStartOver={handleStartOver}
            isToolboxOpen={isToolboxOpen}
            onUploadNew={handleRequestFileUpload}
        />
        <main className={`flex-grow w-full p-2 md:p-4 flex flex-col justify-center items-stretch overflow-hidden`}>
            {renderContent()}
        </main>
        {activeTab === 'retouch' && selectionMode === 'point' && !!editHotspot && !isLoading && (
            <MobileInputBar 
                prompt={retouchPrompt}
                onPromptChange={setRetouchPrompt}
                onSubmit={() => handleGenerate()}
                isLoading={isLoading}
                hotspot={editHotspot}
            />
        )}
    </div>
  );
};

export default App;