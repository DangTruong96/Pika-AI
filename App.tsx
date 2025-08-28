/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateEditedImageWithMask } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import ExpandPanel from './components/ExpandPanel';
import RetouchPanel, { SelectionMode, BrushMode } from './components/RetouchPanel';
import { UndoIcon, RedoIcon, ArrowsPointingOutIcon, ZoomInIcon, ZoomOutIcon, ChevronsLeftRightIcon, DownloadIcon, BrushIcon, CropIcon, AdjustmentsIcon, MagicWandIcon, ExpandIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import { useTranslation } from './contexts/LanguageContext';
// Fix: Import TranslationKey to allow casting for dynamic translation keys.
import type { TranslationKey } from './translations';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    // Fix: Corrected typo from UintArray to Uint8Array.
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'crop' | 'adjust' | 'filters' | 'expand';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  
  // Retouch state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('point');
  const [brushMode, setBrushMode] = useState<BrushMode>('draw');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMouseOverViewer, setIsMouseOverViewer] = useState(false);
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);

  // Main image viewer refs
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const didPanRef = useRef(false);
  
  // Slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  
  const clearMask = useCallback(() => {
    if (maskCanvasRef.current) {
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Effect to sync mask canvas size with image and clear it
  useEffect(() => {
    if (imgRef.current && maskCanvasRef.current) {
        const img = imgRef.current;
        const canvas = maskCanvasRef.current;
        const setCanvasSize = () => {
            if (img.naturalWidth > 0) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                clearMask();
            }
        };

        if (img.complete) {
            setCanvasSize();
        } else {
            img.addEventListener('load', setCanvasSize);
        }
        return () => img.removeEventListener('load', setCanvasSize);
    }
  }, [currentImageUrl, clearMask]);


  // Effect to create and revoke object URLs safely
  useEffect(() => {
    let currentUrl: string | null = null;
    let originalUrl: string | null = null;
    
    if (currentImage) {
      currentUrl = URL.createObjectURL(currentImage);
      setCurrentImageUrl(currentUrl);
    } else {
      setCurrentImageUrl(null);
    }
    
    if (originalImage) {
      originalUrl = URL.createObjectURL(originalImage);
      setOriginalImageUrl(originalUrl);
    } else {
      setOriginalImageUrl(null);
    }
  
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [currentImage, originalImage]);

  // Effect to draw a circular mask when a hotspot is selected in 'point' mode.
  useEffect(() => {
    clearMask();
    if (activeTab === 'retouch' && selectionMode === 'point' && editHotspot && maskCanvasRef.current) {
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Use a radius proportional to the image's smaller dimension for better scaling.
            const pointRadius = Math.max(15, Math.min(canvas.width, canvas.height) * 0.025);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Opaque white for a clear mask
            ctx.beginPath();
            ctx.arc(editHotspot.x, editHotspot.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
  }, [editHotspot, selectionMode, activeTab, clearMask]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    setEditHotspot(null);
    setDisplayHotspot(null);
    clearMask();
  }, [history, historyIndex, clearMask]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setEditHotspot(null);
    setDisplayHotspot(null);
    clearMask();
  }, [clearMask]);

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

  const handleGenerate = useCallback(async (prompt: string) => {
    if (!currentImage) {
      setError(t('errorNoImageLoaded'));
      return;
    }
    
    if (!prompt.trim()) {
        setError(t('errorEnterDescription'));
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        if (!maskCanvasRef.current || !isMaskPresent()) {
            if (selectionMode === 'point' && !editHotspot) {
                setError(t('errorSelectArea'));
            } else {
                setError(t('errorNoMask'));
            }
            setIsLoading(false);
            return;
        }
        const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
        const editedImageUrl = await generateEditedImageWithMask(currentImage, prompt, maskDataUrl);

        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${t('errorFailedToGenerate')} ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, editHotspot, selectionMode, addImageToHistory, isMaskPresent, t]);
  
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
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${t('errorFailedToApplyFilter')} ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t]);
  
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
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${t('errorFailedToApplyAdjustment')} ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError(t('errorPleaseSelectCrop'));
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError(t('errorCouldNotProcessCrop'));
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory, t]);

  const handleApplyExpansion = useCallback(async (aspectRatio: number, prompt: string) => {
    if (!currentImage) {
        setError(t('errorNoImageLoadedToExpand'));
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const expandedImageUrl = await generateExpandedImage(currentImage, aspectRatio, prompt);
        const newImageFile = dataURLtoFile(expandedImageUrl, `expanded-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${t('errorFailedToExpandImage')} ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t]);
  
  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      clearMask();
    }
  }, [canUndo, historyIndex, clearMask]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      clearMask();
    }
  }, [canRedo, historyIndex, clearMask]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
      clearMask();
      resetView();
    }
  }, [history, clearMask]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
      clearMask();
  }, [clearMask]);

  const handleDownload = useCallback(() => {
    if (!currentImage) {
        setError(t('errorCouldNotFindImage'));
        return;
    }

    const mimeType = 'image/jpeg';
    const filename = `pixshop-edited-${Date.now()}.jpg`;

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

  const handleAspectSelect = (newAspect: number | undefined) => {
    setAspect(newAspect);

    if (imgRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        if (newAspect) {
            const newCrop = makeAspectCrop({ unit: '%', width: 90 }, newAspect, naturalWidth, naturalHeight);
            const centeredCrop = centerCrop(newCrop, naturalWidth, naturalHeight);
            setCrop(centeredCrop);
            setCompletedCrop({
                unit: 'px',
                x: (centeredCrop.x / 100) * naturalWidth,
                y: (centeredCrop.y / 100) * naturalHeight,
                width: (centeredCrop.width / 100) * naturalWidth,
                height: (centeredCrop.height / 100) * naturalHeight,
            });
        } else {
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }
  };

  // --- Zoom and Pan Handlers ---
  const handleZoom = useCallback((direction: 'in' | 'out', amount: number = 0.2) => {
    setScale(prevScale => {
        const newScale = direction === 'in' ? prevScale * (1 + amount) : prevScale / (1 + amount);
        return Math.max(0.2, Math.min(newScale, 10)); // Clamp scale
    });
  }, []);

  const resetView = useCallback(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setSliderPosition(50);
  }, []);
  
  const handleViewerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.slider-handle')) return;
      if (activeTab === 'retouch' && selectionMode === 'brush') return; // Let canvas handle it
      didPanRef.current = false;
      setIsPanning(true);
      panStartRef.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
      };
  }, [position, activeTab, selectionMode]);

  const handleViewerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      // For custom cursor
      if (activeTab === 'retouch' && selectionMode === 'brush') {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      // For panning
      if (isPanning) {
        didPanRef.current = true;
        setPosition({
            x: e.clientX - panStartRef.current.x,
            y: e.clientY - panStartRef.current.y,
        });
      }
  }, [isPanning, activeTab, selectionMode]);
  
  const handleViewerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (didPanRef.current || activeTab !== 'retouch' || selectionMode !== 'point' || !imgRef.current) return;
      
      const img = imgRef.current;
      const viewer = e.currentTarget;
      
      const viewerRect = viewer.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      
      const clickOnImgX = e.clientX - imgRect.left;
      const clickOnImgY = e.clientY - imgRect.top;
      
      const displayX = e.clientX - viewerRect.left;
      const displayY = e.clientY - viewerRect.top;
      setDisplayHotspot({ x: displayX, y: displayY });
      
      const { naturalWidth, naturalHeight } = img;
      const originalX = Math.round((clickOnImgX / imgRect.width) * naturalWidth);
      const originalY = Math.round((clickOnImgY / imgRect.height) * naturalHeight);
      
      setEditHotspot({ x: originalX, y: originalY });
  };

  const handleViewerMouseUpOrLeave = useCallback(() => {
      setIsPanning(false);
  }, []);

  const handleViewerWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const zoomAmount = 0.1;
      if (e.deltaY < 0) {
          handleZoom('in', zoomAmount);
      } else {
          handleZoom('out', zoomAmount);
      }
  }, [handleZoom]);
  
  // --- Mask Canvas Drawing Handlers ---
  const getBrushCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // Mouse position relative to the canvas element
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
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
    
    // Check if the mouse is outside the rendered content area
    if (mouseX < renderedX || mouseX > renderedX + renderedWidth || mouseY < renderedY || mouseY > renderedY + renderedHeight) {
        return null; // Mouse is in the "empty" letterboxed area
    }

    // Translate mouse coordinates to be relative to the rendered content's top-left corner
    const xInContent = mouseX - renderedX;
    const yInContent = mouseY - renderedY;
    
    // Scale these coordinates to match the canvas's internal drawing surface resolution
    const scaleX = contentWidth / renderedWidth;
    const scaleY = contentHeight / renderedHeight;
    
    return { x: xInContent * scaleX, y: yInContent * scaleY };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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


  // --- Slider Handlers ---
  const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSlider(true);
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
      if (!isDraggingSlider || !imageViewerRef.current) return;
      const rect = imageViewerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const viewerWidth = rect.width;
      const newSliderPosition = Math.max(0, Math.min(100, (x / viewerWidth) * 100));
      setSliderPosition(newSliderPosition);
  }, [isDraggingSlider]);

  const handleGlobalMouseUp = useCallback(() => {
      setIsDraggingSlider(false);
  }, []);

  useEffect(() => {
      if (isDraggingSlider) {
          window.addEventListener('mousemove', handleGlobalMouseMove);
          window.addEventListener('mouseup', handleGlobalMouseUp);
          window.addEventListener('mouseleave', handleGlobalMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
          window.removeEventListener('mouseleave', handleGlobalMouseUp);
      };
  }, [isDraggingSlider, handleGlobalMouseMove, handleGlobalMouseUp]);
  
  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-900/20 backdrop-blur-md border border-red-500/30 p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center gap-4">
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
    
    if (!currentImageUrl || !originalImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const TABS_CONFIG = [
        { id: 'retouch', icon: BrushIcon, tooltip: t('tooltipRetouch') },
        { id: 'crop', icon: CropIcon, tooltip: t('tooltipCrop') },
        { id: 'adjust', icon: AdjustmentsIcon, tooltip: t('tooltipAdjust') },
        { id: 'filters', icon: MagicWandIcon, tooltip: t('tooltipFilters') },
        { id: 'expand', icon: ExpandIcon, tooltip: t('tooltipExpand') },
    ];
    
    const actionButtons = (
      <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-3 w-full bg-black/20 backdrop-blur-lg border border-white/10 p-2 rounded-2xl">
        <div className="flex items-center gap-2">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold p-3 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('undo')}
            >
                <UndoIcon className="w-5 h-5 lg:mr-2" />
                <span className="hidden lg:inline">{t('undo')}</span>
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold p-3 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('redo')}
            >
                <RedoIcon className="w-5 h-5 lg:mr-2" />
                <span className="hidden lg:inline">{t('redo')}</span>
            </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('reset')}
            </button>
            <button 
                onClick={handleUploadNew}
                className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm"
            >
                {t('uploadNew')}
            </button>
            <div className="relative">
              <button
                onClick={handleDownload}
                disabled={!currentImage}
                className="flex items-center justify-center text-center bg-gradient-to-br from-green-500 to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out hover:opacity-90 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-500"
                title={t('downloadImage')}
              >
                <DownloadIcon className="w-5 h-5 lg:mr-2" />
                <span className="hidden lg:inline">{t('downloadImage')}</span>
              </button>
            </div>
        </div>
      </div>
    );
    
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${historyIndex}`}
        src={currentImageUrl} 
        alt="Crop this image"
        crossOrigin="anonymous"
        className="w-full h-auto object-contain max-h-[75vh] rounded-2xl"
      />
    );

    const imageDisplay = (
        <div
            ref={imageViewerRef}
            className={`relative w-full h-full min-h-[50vh] lg:min-h-0 overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl select-none 
                ${activeTab === 'retouch' && selectionMode === 'point' ? 'cursor-crosshair' : ''}
                ${activeTab !== 'retouch' && !isDraggingSlider ? 'cursor-move active:cursor-grabbing' : ''}
                ${activeTab === 'retouch' && selectionMode === 'brush' ? 'cursor-none' : ''}
            `}
            onMouseDown={handleViewerMouseDown}
            onMouseMove={handleViewerMouseMove}
            onMouseUp={handleViewerMouseUpOrLeave}
            onMouseLeave={(e) => {
                handleViewerMouseUpOrLeave();
                setIsMouseOverViewer(false);
            }}
            onMouseEnter={() => setIsMouseOverViewer(true)}
            onClick={handleViewerClick}
            onWheel={handleViewerWheel}
        >
            <div
                className="transition-transform duration-100 ease-out"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center center',
                    width: '100%', height: '100%',
                }}
            >
                <div 
                  className="relative w-full h-full"
                >
                    {/* Original Image (bottom layer) */}
                    <img
                        src={originalImageUrl}
                        alt={t('original')}
                        crossOrigin="anonymous"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    {/* Edited Image (top layer, clipped only if an edit has been made) */}
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{ clipPath: historyIndex > 0 ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` : 'none' }}
                    >
                        <img
                            ref={imgRef}
                            key={historyIndex}
                            src={currentImageUrl}
                            alt={t('edited')}
                            crossOrigin="anonymous"
                            className={`absolute inset-0 w-full h-full object-contain pointer-events-none`}
                        />
                    </div>
                    
                    {/* Mask Canvas for brushing */}
                    <canvas
                        ref={maskCanvasRef}
                        className="absolute inset-0 w-full h-full object-contain opacity-40"
                        style={{
                            pointerEvents: activeTab === 'retouch' && selectionMode === 'brush' ? 'auto' : 'none',
                            cursor: 'none'
                        }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUpOrLeave}
                        onMouseLeave={handleCanvasMouseUpOrLeave}
                    />
                    
                    {/* Slider Handle (only shown after first edit) */}
                    {historyIndex > 0 && (
                      <div
                          className="slider-handle absolute top-0 bottom-0 -translate-x-1/2 w-1 bg-cyan-400 cursor-col-resize group z-30"
                          style={{ left: `${sliderPosition}%` }}
                          onMouseDown={handleSliderMouseDown}
                          role="separator"
                          aria-label={t('compareSliderAria')}
                          aria-valuenow={sliderPosition}
                          aria-orientation="vertical"
                      >
                          <div className="absolute top-1/2 -translate-y-1/2 bg-cyan-400/80 backdrop-blur-sm rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform -left-4">
                              <ChevronsLeftRightIcon className="w-5 h-5 text-white" />
                          </div>
                      </div>
                    )}
                    
                    {/* Labels (only shown after first edit) */}
                    {historyIndex > 0 && (
                      <>
                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-20">
                            {t('original')}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-20"
                          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                        >
                            {t('edited')}
                        </div>
                      </>
                    )}
                </div>
            </div>

            {displayHotspot && !isLoading && activeTab === 'retouch' && selectionMode === 'point' && (
                <div 
                    className="absolute rounded-full w-5 h-5 bg-cyan-500/70 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/30 rounded-lg backdrop-blur-md border border-white/10 z-20">
                <button onClick={() => handleZoom('out')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('zoomOut')}>
                    <ZoomOutIcon className="w-6 h-6" />
                </button>
                <button onClick={resetView} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('resetZoom')}>
                    <ArrowsPointingOutIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleZoom('in')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('zoomIn')}>
                    <ZoomInIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
    
    const panelContent = () => {
        switch (activeTab) {
            case 'retouch':
                return <RetouchPanel 
                            onApplyRetouch={handleGenerate} 
                            isLoading={isLoading} 
                            isHotspotSelected={!!editHotspot}
                            selectionMode={selectionMode}
                            onSelectionModeChange={(mode) => {
                                setSelectionMode(mode);
                                setEditHotspot(null);
                                setDisplayHotspot(null);
                                clearMask();
                            }}
                            brushMode={brushMode}
                            onBrushModeChange={setBrushMode}
                            brushSize={brushSize}
                            onBrushSizeChange={setBrushSize}
                            onClearMask={clearMask}
                        />;
            case 'crop':
                return <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={handleAspectSelect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />;
            case 'adjust':
                return <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />;
            case 'filters':
                return <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />;
            case 'expand':
                return <ExpandPanel onApplyExpansion={handleApplyExpansion} isLoading={isLoading} />;
            default:
                return null;
        }
    };


    return (
      <div className="w-full animate-fade-in flex flex-col lg:flex-row gap-6">
        {/* Main Content Area (Image + Actions) */}
        <div className="flex-1 flex flex-col gap-4">
            <div className="relative w-full shadow-2xl flex-1 flex">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center gap-4 animate-fade-in rounded-2xl">
                        <Spinner />
                        <p className="text-gray-300">{t('loadingText')}</p>
                    </div>
                )}
                
                <div className="w-full border glow-border-animate rounded-2xl p-1">
                    {activeTab === 'crop' ? (
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                        <ReactCrop 
                          crop={crop} 
                          onChange={c => setCrop(c)} 
                          onComplete={c => setCompletedCrop(c)}
                          aspect={aspect}
                          className="max-h-[75vh]"
                        >
                          {cropImageElement}
                        </ReactCrop>
                      </div>
                    ) : imageDisplay }
                </div>
            </div>
            <div className="hidden lg:block">
              {actionButtons}
            </div>
        </div>

        {/* Right Sidebar (Toolbar + Panels) */}
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-auto bg-black/20 border border-white/10 rounded-2xl p-2 flex lg:flex-col items-center justify-center gap-2 backdrop-blur-lg">
                {TABS_CONFIG.map(tab => (
                    <div key={tab.id} className="relative group">
                        <button
                           onClick={() => setActiveTab(tab.id as Tab)}
                           className={`relative w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-200 ${
                               activeTab === tab.id 
                               ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/30' 
                               : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
                           }`}
                           title={tab.tooltip}
                        >
                            <tab.icon className="w-7 h-7" />
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="w-full lg:w-[360px]">
              <div key={activeTab} className="animate-slide-in-right">
                {panelContent()}
              </div>
            </div>
        </div>
        
        {/* Mobile Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-2">
            {actionButtons}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-screen-2xl mx-auto p-4 md:p-6 flex justify-center ${currentImage ? 'items-start' : 'items-center'} pb-28 lg:pb-6`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;