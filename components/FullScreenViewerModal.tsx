/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { DownloadIcon, XMarkIcon, EyeIcon, EyeSlashIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './icons';
import type { TransformState } from '../types';

interface FullScreenViewerModalProps {
  items: Array<{ url: string; transform: TransformState; }>;
  initialIndex: number;
  type: 'history' | 'result' | 'extract';
  comparisonUrl: string | null;
  onClose: () => void;
  onDownload: (url: string) => void;
  onSelect: (url: string, index: number) => void;
}

const FullScreenViewerModal: React.FC<FullScreenViewerModalProps> = ({ items, initialIndex, type, comparisonUrl, onClose, onDownload, onSelect }) => {
    const { t } = useTranslation();
    const [isComparing, setIsComparing] = useState(false);
    
    // --- State for Zoom & Pan ---
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isGesturing, setIsGesturing] = useState(false); // To disable transitions during gestures
    const panStartRef = useRef<{ startX: number; startY: number; initialPosition: { x: number; y: number; } } | null>(null);
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);
    const doubleTapTimerRef = useRef<number | null>(null);

    // UI Controls State
    const [isControlsVisible, setIsControlsVisible] = useState(false);
    const hideControlsTimeoutRef = useRef<number | null>(null);
    const swipeStartRef = useRef<{ x: number, y: number } | null>(null);
    
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const currentItem = items[currentIndex];
    const imageUrl = currentItem.url;
    const currentTransform = currentItem.transform;
    const transformString = useMemo(() => `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scaleX}, ${currentTransform.scaleY})`, [currentTransform]);
    
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent background scroll
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const showControls = useCallback(() => {
        if (hideControlsTimeoutRef.current) {
            window.clearTimeout(hideControlsTimeoutRef.current);
        }
        setIsControlsVisible(true);
        hideControlsTimeoutRef.current = window.setTimeout(() => {
            setIsControlsVisible(false);
        }, 3000);
    }, []);

    const resetView = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const canCompare = !!comparisonUrl;

    const handleNext = useCallback(() => {
        if (items.length > 1) {
            setCurrentIndex(prev => (prev + 1) % items.length);
        } else if (canCompare) {
            setIsComparing(prev => !prev);
        }
    }, [items.length, canCompare]);
    
    const handlePrev = useCallback(() => {
        if (items.length > 1) {
            setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
        } else if (canCompare) {
            setIsComparing(prev => !prev);
        }
    }, [items.length, canCompare]);
    
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (items.length > 1 || canCompare) {
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, handleNext, handlePrev, items.length, canCompare]);
    
    // Reset index and view when the modal is reopened with new data
    useEffect(() => {
        setCurrentIndex(initialIndex);
        setIsComparing(false);
        showControls();
        resetView();
    }, [initialIndex, items, showControls, resetView]);
    
    // Reset view when swiping to a new image
    useEffect(() => {
        setIsComparing(false);
        showControls();
        resetView();
    }, [currentIndex, showControls, resetView]);

    useEffect(() => {
      return () => {
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
        if (doubleTapTimerRef.current) window.clearTimeout(doubleTapTimerRef.current);
      };
    }, []);

    // Preload adjacent images for smoother swiping
    useEffect(() => {
        if (items.length > 1) {
            const nextIndex = (currentIndex + 1) % items.length;
            const prevIndex = (currentIndex - 1 + items.length) % items.length;
    
            const nextImg = new Image();
            if (items[nextIndex]?.url) {
                nextImg.src = items[nextIndex].url;
            }
    
            const prevImg = new Image();
            if (items[prevIndex]?.url) {
                prevImg.src = items[prevIndex].url;
            }
        }
    }, [currentIndex, items]);

    const getDistanceBetweenTouches = (touches: React.TouchList | Touch[]): number => {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;

        e.preventDefault();

        if (e.touches.length === 2) { // Pinch start
            setIsGesturing(true);
            setIsPanning(false);
            panStartRef.current = null;
            pinchStartDistRef.current = getDistanceBetweenTouches(e.touches);
            pinchStartScaleRef.current = scale;
            swipeStartRef.current = null;
        } else if (e.touches.length === 1) {
            if (scale > 1 || isComparing) { // Pan start (allow pan in compare mode even if not zoomed)
                setIsGesturing(true);
                setIsPanning(true);
                panStartRef.current = {
                    startX: e.touches[0].clientX,
                    startY: e.touches[0].clientY,
                    initialPosition: position,
                };
                swipeStartRef.current = null;
            } else { // Swipe start
                swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();

        if (e.touches.length === 2 && pinchStartDistRef.current !== null) { // Pinch move
            const newDist = getDistanceBetweenTouches(e.touches);
            const ratio = newDist / pinchStartDistRef.current;
            const newScale = pinchStartScaleRef.current * ratio;
            setScale(Math.max(0.5, Math.min(10, newScale))); // Clamp scale
        } else if (isPanning && panStartRef.current && e.touches.length === 1) { // Pan move
            const dx = e.touches[0].clientX - panStartRef.current.startX;
            const dy = e.touches[0].clientY - panStartRef.current.startY;
            setPosition({
                x: panStartRef.current.initialPosition.x + dx,
                y: panStartRef.current.initialPosition.y + dy,
            });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;

        // Swipe logic
        if ((items.length > 1 || canCompare) && swipeStartRef.current && e.changedTouches.length === 1 && !isPanning && scale === 1) {
            const deltaX = e.changedTouches[0].clientX - swipeStartRef.current.x;
            const deltaY = Math.abs(e.changedTouches[0].clientY - swipeStartRef.current.y);

            if (Math.abs(deltaX) > 50 && deltaY < 75) {
                if (deltaX > 0) handlePrev();
                else handleNext();
            }
        }
        
        // Double tap logic
        const tapDelay = 300; // ms
        if (e.touches.length === 0) {
            if (doubleTapTimerRef.current === null) {
                doubleTapTimerRef.current = window.setTimeout(() => {
                    doubleTapTimerRef.current = null;
                }, tapDelay);
            } else {
                clearTimeout(doubleTapTimerRef.current);
                doubleTapTimerRef.current = null;
                if (scale > 1) {
                    resetView();
                } else {
                    setScale(2.5);
                }
            }
        }

        // Reset gesture states
        setIsGesturing(false);
        swipeStartRef.current = null;
        pinchStartDistRef.current = null;
        setIsPanning(false);
        panStartRef.current = null;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.button !== 0) return; // Only main mouse button

        // Allow panning if zoomed in, or if in side-by-side comparison mode on desktop
        if (scale <= 1 && !(isDesktop && isComparing)) return;

        e.preventDefault();
        
        setIsGesturing(true);
        setIsPanning(true);
        panStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialPosition: position,
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning || !panStartRef.current) return;
        e.preventDefault();
        const dx = e.clientX - panStartRef.current.startX;
        const dy = e.clientY - panStartRef.current.startY;
        setPosition({
            x: panStartRef.current.initialPosition.x + dx,
            y: panStartRef.current.initialPosition.y + dy,
        });
    };

    const handleMouseUpAndLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        e.preventDefault();
        setIsGesturing(false);
        setIsPanning(false);
        panStartRef.current = null;
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        // The multiplier is sensitive, 0.001 is a good starting point
        const newScale = scale * (1 - e.deltaY * 0.001);
        setScale(Math.max(0.5, Math.min(10, newScale))); // Clamp scale
        showControls();
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        if (scale > 1) {
            resetView();
        } else {
            // Zoom to a specific point could be an improvement, but for now, center zoom is fine.
            setScale(2.5);
        }
    };
    
    const selectButtonText = useMemo(() => {
        if (type === 'extract') {
            return t('extractUseAsOutfit');
        }
        return t('studioSelectResult');
    }, [type, t]);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex flex-col items-center justify-center p-0 animate-fade-in touch-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fullscreen-image-viewer-title"
        >
            <h2 id="fullscreen-image-viewer-title" className="sr-only">{t('imageViewerTitle')}</h2>

            <div 
                className="flex-grow w-full h-full flex items-center justify-center relative overflow-hidden"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    showControls();
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpAndLeave}
                onMouseLeave={handleMouseUpAndLeave}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
            >
                 {/* Background click handler */}
                <div 
                    className="absolute inset-0" 
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            e.stopPropagation();
                            onClose();
                        }
                    }}
                />

                <div
                    className="relative w-full h-full flex items-center justify-center"
                    style={{ cursor: isPanning ? 'grabbing' : ((scale > 1 || (isDesktop && isComparing)) ? 'grab' : 'default') }}
                >
                    <div
                        className={`${isGesturing ? '' : 'transition-transform duration-300 ease-out'} w-full h-full flex items-center justify-center`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        }}
                    >
                         {isComparing && isDesktop && comparisonUrl ? (
                            // --- SIDE-BY-SIDE VIEW (DESKTOP MODAL) ---
                            <div className="flex w-full h-full gap-0 relative">
                                {/* Before Image Container */}
                                <div className="w-1/2 h-full relative flex items-center justify-center p-4">
                                    <img
                                        src={comparisonUrl}
                                        alt={t('historyOriginal')}
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-10">
                                        {t('historyOriginal')}
                                    </div>
                                </div>
                                {/* Separator Line */}
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/30 z-10 pointer-events-none"></div>
                                {/* After Image Container */}
                                <div className="w-1/2 h-full relative flex items-center justify-center p-4">
                                    <div className="w-full h-full flex items-center justify-center" style={{ transform: transformString, transition: 'transform 0.2s ease-in-out' }}>
                                        <img
                                            src={imageUrl}
                                            alt={t('viewEdited')}
                                            className="w-full h-full object-contain pointer-events-none"
                                        />
                                    </div>
                                     <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none z-10">
                                        {t('viewEdited')}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- TOGGLE VIEW (MOBILE) OR NORMAL VIEW ---
                            <div className="w-full h-full flex items-center justify-center" style={{ transform: (isComparing && comparisonUrl) ? 'none' : transformString, transition: 'transform 0.2s ease-in-out' }}>
                                <img
                                    key={`${currentIndex}-${isComparing}`}
                                    src={isComparing && comparisonUrl ? comparisonUrl : imageUrl}
                                    alt={isComparing ? t('historyOriginal') : t('viewEdited')}
                                    className="max-w-[100vw] max-h-[100vh] object-contain shadow-2xl pointer-events-none animate-fade-in"
                                />
                            </div>
                        )}
                    </div>
                </div>
                 <div className={`absolute top-4 left-4 bg-black/50 text-white text-sm font-bold py-1 px-3 rounded-md pointer-events-none z-[110] transition-opacity duration-300 ${isControlsVisible && !(isDesktop && isComparing) ? 'opacity-100' : 'opacity-0'}`}>
                    {isComparing ? t('historyOriginal') : (type === 'history' && currentIndex === 0 ? t('historyOriginal') : t('viewEdited'))}
                </div>

                {(items.length > 1 || canCompare) && (
                    <>
                        <button onClick={handlePrev} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all z-[110] ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-label={t('previousImage')}>
                            <ChevronLeftIcon className="w-7 h-7" />
                        </button>
                         <button onClick={handleNext} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all z-[110] ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-label={t('nextImage')}>
                            <ChevronRightIcon className="w-7 h-7" />
                        </button>
                    </>
                )}
            </div>

            <div className={`flex-shrink-0 w-full flex flex-col items-center justify-center gap-2 sm:gap-3 p-2 sm:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
                {items.length > 1 && (
                    <div className="flex items-center justify-center gap-2.5">
                        {items.map((_, index) => (
                            <button 
                                key={index} 
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                                aria-label={t('goToImage', { index: index + 1 })}
                            />
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <button onClick={onClose} className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-5 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base flex items-center gap-2">
                        <XMarkIcon className="w-5 h-5"/>
                    </button>
                    {canCompare && (
                         <button onClick={() => setIsComparing(p => !p)} className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base flex items-center gap-2">
                            {isComparing ? <EyeSlashIcon className="w-5 h-5 text-cyan-400"/> : <EyeIcon className="w-5 h-5"/>}
                            <span className="hidden sm:inline">{isComparing ? t('viewEdited') : t('historyOriginal')}</span>
                        </button>
                    )}
                    <button onClick={() => onDownload(imageUrl)} className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">{t('downloadImage')}</span>
                    </button>
                    <button onClick={() => onSelect(imageUrl, currentIndex)} className="text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 active:scale-95 text-base flex items-center gap-2">
                        <CheckIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">{selectButtonText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(FullScreenViewerModal);