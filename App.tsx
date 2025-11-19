/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef, useState } from 'react';
import { usePika } from './hooks/usePika';
import type { Tab } from './types';

import Header from './components/Header';
import EditorSidebar, { TABS_CONFIG } from './components/EditorSidebar';
import { ArrowsPointingOutIcon, ZoomInIcon, ZoomOutIcon, UploadIcon, UndoIcon, RedoIcon, FlipHorizontalIcon, FlipVerticalIcon, EyeIcon, EyeSlashIcon } from './components/icons';
import { useTranslation } from './contexts/LanguageContext';
import HistoryPills from './components/HistoryPills';
import FullScreenViewerModal from './components/FullScreenViewerModal';
import ExpansionFrame from './components/ExpansionFrame';
import OptimizedImage from './components/OptimizedImage';


const ImagePlaceholder: React.FC<{ onFileSelect: (files: FileList | null) => void }> = React.memo(({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8 transition-all duration-500 ease-out rounded-3xl bg-white/5 backdrop-blur-md border ${isDraggingOver ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 text-center max-w-md animate-fade-in">
        <label htmlFor="image-upload-main" className="flex flex-col items-center gap-5 cursor-pointer group">
            <div className={`relative p-6 rounded-full transition-all duration-500 ${isDraggingOver ? 'bg-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.3)]' : 'bg-gradient-to-b from-white/10 to-white/5 border border-white/10 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]'}`}>
              <UploadIcon className={`w-10 h-10 transition-colors duration-300 ${isDraggingOver ? 'text-cyan-300' : 'text-gray-300 group-hover:text-white'}`} />
              {isDraggingOver && <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400/20" />}
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 group-hover:from-cyan-200 group-hover:to-blue-400 transition-all duration-300">
                  {t('uploadImage')}
                </span>
                <p className="text-sm text-gray-500 font-medium tracking-wide group-hover:text-gray-400 transition-colors">{t('dragAndDrop')}</p>
            </div>
        </label>
      </div>
    </div>
  );
});

interface CompactMobileToolbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenEditorToTab: (tab: Tab) => void;
  isImageLoaded: boolean;
  onRequestFileUpload: () => void;
  areControlsVisible: boolean;
  isInteracting: boolean;
  showControls: () => void;
}

const CompactMobileToolbar: React.FC<CompactMobileToolbarProps> = React.memo(({ activeTab, setActiveTab, onOpenEditorToTab, isImageLoaded, onRequestFileUpload, areControlsVisible, isInteracting, showControls }) => {
  const { t } = useTranslation();
  const swipeStartRef = useRef<{ x: number, y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      gestureLockRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!swipeStartRef.current || e.touches.length !== 1) return;
      if (gestureLockRef.current === null) {
          const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
          const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
          if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
              gestureLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
          }
      }
      if (gestureLockRef.current === 'horizontal') {
        e.preventDefault();
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartRef.current && e.changedTouches.length === 1 && gestureLockRef.current === 'horizontal') {
      const deltaX = e.changedTouches[0].clientX - swipeStartRef.current.x;

      if (Math.abs(deltaX) > 50) {
        const availableTabs = TABS_CONFIG.filter(tab => isImageLoaded || ['studio'].includes(tab.id));
        const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);
        if (currentIndex === -1) return;

        let nextIndex;
        if (deltaX < 0) { // Swipe Left -> Next
          nextIndex = (currentIndex + 1) % availableTabs.length;
        } else { // Swipe Right -> Previous
          nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
        }
        const nextTab = availableTabs[nextIndex];
        if (nextTab) {
          setActiveTab(nextTab.id as Tab);
          showControls();
        }
      }
    }
    swipeStartRef.current = null;
    gestureLockRef.current = null;
  };

  // Center active tab and update pill style
  useEffect(() => {
    if (containerRef.current && scrollContainerRef.current) {
        const activeButton = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
        
        const availableTabs = TABS_CONFIG.filter(tab => isImageLoaded || ['studio'].includes(tab.id));
        const isActiveTabAvailable = availableTabs.some(tab => tab.id === activeTab);

        if (activeButton && isActiveTabAvailable) {
            activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            setPillStyle({
                left: activeButton.offsetLeft,
                width: activeButton.offsetWidth,
                opacity: 1
            });
        } else {
            setPillStyle(s => ({ ...s, opacity: 0 }));
        }
    }
  }, [activeTab, isImageLoaded]);

  const isVisible = areControlsVisible || isInteracting;

  return (
    <div
      className={`fixed bottom-4 left-1/2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 z-[60] flex items-center justify-center gap-2 rounded-full shadow-2xl shadow-black/50 mb-[env(safe-area-inset-bottom)] transform -translate-x-1/2 transition-all duration-300 ease-in-out ${!isVisible ? 'opacity-0 translate-y-[calc(100%+1rem)] pointer-events-none' : 'opacity-100 translate-y-0'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={scrollContainerRef} className="overflow-x-auto hide-scrollbar">
        <div ref={containerRef} className="relative flex items-center gap-1">
          <div 
            className="absolute top-0 h-full mobile-toolbar-active-pill rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={pillStyle}
          />
          {TABS_CONFIG.map(tab => {
            const isTabDisabled = !isImageLoaded && !['studio'].includes(tab.id);
            const isActive = activeTab === tab.id && !isTabDisabled;
            const label = isTabDisabled ? t('uploadImage') : t(tab.tooltip as any);
            
            const handleTabClick = () => {
                if (navigator.vibrate) {
                  navigator.vibrate(10); // Short vibration for haptic feedback
                }

                if (isTabDisabled) {
                    onRequestFileUpload();
                } else {
                    onOpenEditorToTab(tab.id as Tab);
                }
            };

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={handleTabClick}
                className={`relative p-2.5 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-300 hover:bg-white/10'
                }`}
                title={label}
                aria-label={label}
              >
                <tab.icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const pika = usePika();

  // Create a single source of truth for UI chrome visibility to prevent race conditions.
  const areControlsVisible = pika.isZoomControlsVisible || pika.isInteracting || (pika.isMobile && pika.isToolboxOpen);

  return (
    <div
      className={`w-screen ${pika.currentImage ? 'bg-transparent' : 'bg-transparent'} text-gray-100 flex flex-col overflow-hidden antialiased`}
      style={{ height: pika.isMobile ? `${pika.windowSize.height}px` : '100vh' }}
    >
       {pika.currentImageUrl && (
            <>
                <div 
                    aria-hidden="true"
                    className="fixed inset-0 z-[-2] bg-cover bg-center transition-opacity duration-500 scale-110"
                    style={{ backgroundImage: `url(${pika.currentThumbnailUrl ?? pika.currentImageUrl})`, filter: 'blur(40px) brightness(0.4)' }}
                />
                <div aria-hidden="true" className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-3xl" />
            </>
        )}
       <input id="image-upload-main" type="file" className="hidden" accept="image/*" onChange={(e) => { pika.handleFileSelect(e.target.files); e.target.value = ''; }} />
      <Header 
        isImageLoaded={!!pika.currentImage} 
        imageFile={pika.currentImage} 
        imageDimensions={pika.imageDimensions} 
        canUndo={pika.canUndo} 
        canRedo={pika.canRedo} 
        onUndo={pika.handleUndo} 
        onRedo={pika.handleRedo} 
        onReset={pika.handleResetHistory} 
        onDownload={pika.handleDownload} 
        isLoading={pika.isLoading} 
        onToggleToolbox={pika.toggleToolbox} 
        onStartOver={pika.handleStartOver} 
        isToolboxOpen={pika.isToolboxOpen} 
        onUploadNew={() => document.getElementById('image-upload-main')?.click()}
        isMobile={pika.isMobile}
        isControlsVisible={areControlsVisible}
      />
      <main className={`flex-grow w-full h-full flex lg:flex-row overflow-hidden relative ${pika.isMobile && pika.isLandscape ? 'flex-row' : 'flex-col'}`}>
        <div 
          className={`touch-none bg-black/30 relative flex items-center justify-center p-2 lg:p-4 overflow-hidden transition-all duration-300 ease-in-out ${ pika.isMobile ? (pika.isLandscape ? `h-full ${pika.isToolboxOpen ? 'w-[60%]' : 'w-full'}` : `w-full ${pika.isToolboxOpen ? 'h-[60%]' : 'h-full'}`) : `w-full ${pika.isToolboxOpen ? 'lg:w-[70%]' : 'lg:w-full'}` }`}
          onMouseDown={pika.handleViewerMouseDown} onMouseMove={pika.handleViewerMouseMove} onMouseUp={pika.handleViewerMouseUp} onMouseLeave={pika.handleViewerMouseUp} onWheel={pika.handleViewerWheel} onTouchStart={pika.handleViewerTouchStart} onTouchMove={pika.handleViewerTouchMove} onTouchEnd={pika.handleViewerTouchEnd}
        >
            {pika.isLoading && (
                <div className="loading-overlay absolute inset-0 z-40 flex flex-col items-center justify-center text-white overflow-hidden">
                    {pika.currentImageUrl && (
                        <img
                            src={pika.currentImageUrl}
                            alt="" // Decorative image
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-contain filter blur-xl scale-110" // scale-110 to hide blurred edges from view
                            style={{ transform: pika.transformString }}
                        />
                    )}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="liquid-spinner"></div>
                        <p className="text-lg font-medium tracking-wide animate-pulse text-cyan-100 text-shadow">{pika.loadingMessage}</p>
                    </div>
                </div>
            )}
            {!pika.currentImage ? <ImagePlaceholder onFileSelect={pika.handleFileSelect} /> : (
                <div ref={pika.imageViewerRef} className="w-full h-full relative">
                    {pika.isComparing && pika.isMobile && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white text-sm font-bold py-1.5 px-4 rounded-full pointer-events-none z-30 animate-fade-in shadow-lg">
                            {pika.t('historyOriginal')}
                        </div>
                    )}
                    <div className={`relative w-full h-full flex items-center justify-center ${(pika.isPanning || pika.isPinching) ? '' : (pika.isInteracting ? 'transition-transform duration-200 ease-in-out' : 'transition-transform duration-300 ease-out')}`} style={{ transform: `scale(${pika.scale}) translate(${pika.position.x}px, ${pika.position.y}px)` }}>
                        {pika.isComparing && pika.beforeImageUrl && !pika.isMobile ? (
                            <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center p-0 gap-0">
                                <div className="relative w-1/2 h-full flex flex-col items-center justify-center"><img src={pika.beforeImageUrl} alt={pika.t('historyOriginal')} className="max-w-full max-h-full object-contain" /><div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none">{pika.t('historyOriginal')}</div></div>
                                <div className="w-px h-full bg-cyan-400/50 shadow-lg shrink-0"></div>
                                <div className="relative w-1/2 h-full flex flex-col items-center justify-center"><img src={pika.currentImageUrl ?? undefined} alt={pika.t('viewEdited')} className="max-w-full max-h-full object-contain" style={{ transform: pika.transformString }} /><div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none">{pika.t('viewEdited')}</div></div>
                            </div>
                        ) : null}
                        
                        <div className="relative w-full h-full flex items-center justify-center" style={{ transform: (pika.isComparing && !pika.isMobile) ? 'scale(0)' : pika.transformString, transition: 'transform 0.2s ease-in-out' }}>
                            { (pika.isComparing && pika.isMobile && pika.beforeImageUrl) ? (
                                <img ref={pika.imgRef} src={pika.beforeImageUrl} alt={pika.t('mainContentAlt')} className={`max-w-full max-h-full object-contain`} />
                            ) : (
                                <OptimizedImage
                                    ref={pika.imgRef}
                                    highResSrc={pika.currentImageUrl ?? ''}
                                    lowResSrc={pika.currentThumbnailUrl ?? ''}
                                    alt={pika.t('mainContentAlt')}
                                    className={`max-w-full max-h-full object-contain`}
                                />
                            )}
                            {pika.activeTab === 'expand' && pika.currentImage && pika.imgRef.current && (
                                <ExpansionFrame
                                    imgRef={pika.imgRef}
                                    padding={pika.expandPadding}
                                    onDragStart={pika.handleExpansionDragStart}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            {pika.currentImage && (
                <>
                    <div className={`absolute left-4 top-4 flex flex-col items-center gap-0.5 lg:gap-1 p-1.5 lg:p-2 bg-black/40 rounded-full backdrop-blur-xl border border-white/10 z-40 transition-all duration-300 ease-in-out shadow-xl
                        ${areControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
                        ${pika.isMobile && areControlsVisible ? '!translate-y-16' : ''}`}>
                        <button onClick={() => pika.handleZoom('in')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('zoomIn')}><ZoomInIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        <button onClick={pika.resetView} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('resetZoom')}><ArrowsPointingOutIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        <button onClick={() => pika.handleZoom('out')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('zoomOut')}><ZoomOutIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        {pika.canUndo && <div className="h-px w-8 lg:w-10 my-0.5 lg:my-1 bg-white/20"></div>}
                        {pika.canUndo && <button onClick={() => pika.setComparisonState(s => ({...s, isComparing: !s.isComparing}))} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" aria-label={pika.isComparing ? pika.t('viewEdited') : pika.t('viewOriginal')} title={pika.isComparing ? pika.t('viewEdited') : pika.t('viewOriginal')}>{pika.isComparing ? <EyeSlashIcon className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400"/> : <EyeIcon className="w-5 h-5 lg:w-6 lg:h-6"/>}</button>}
                    </div>
                    <div className={`absolute right-4 top-4 flex flex-col items-center gap-0.5 lg:gap-1 p-1.5 lg:p-2 bg-black/40 rounded-full backdrop-blur-xl border border-white/10 z-40 transition-all duration-300 ease-in-out shadow-xl
                        ${areControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
                        ${pika.isMobile && areControlsVisible ? '!translate-y-16' : ''}`}>
                        <button onClick={() => pika.handleApplyTransform('rotate-ccw')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformRotateCCW')}><UndoIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('rotate-cw')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformRotateCW')}><RedoIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('flip-h')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformFlipH')}><FlipHorizontalIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('flip-v')} disabled={pika.isLoading} className="p-2 lg:p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformFlipV')}><FlipVerticalIcon className="w-5 h-5 lg:w-6 lg:h-6"/></button>
                    </div>
                </>
            )}
        </div>
        
        <div ref={pika.toolsContainerRef} className={`flex-shrink-0 bg-black/30 border-l border-white/5 transition-all duration-300 ease-in-out ${ pika.isMobile ? (pika.isLandscape ? `h-full ${pika.isToolboxOpen ? 'w-[40%]' : 'w-0'}` : `w-full ${pika.isToolboxOpen ? 'h-[40%]' : 'h-0'}`) : `h-full ${pika.isToolboxOpen ? 'lg:w-[30%]' : 'lg:w-0'}` } ${ pika.isToolboxOpen ? 'overflow-y-auto will-change-scroll' : 'overflow-hidden' } ${pika.isMobile ? (pika.isToolboxOpen ? 'pb-4' : 'p-0') : 'lg:pb-4'}`} onTouchStart={pika.handleToolsTouchStart} onTouchMove={pika.handleToolsTouchMove} onTouchEnd={pika.handleToolsTouchEnd}>
            <EditorSidebar className="w-full" isImageLoaded={!!pika.currentImage} isLoading={pika.isLoading} activeTab={pika.activeTab} setActiveTab={pika.handleTabChange} currentImage={pika.currentImage}
              onApplyRetouch={pika.handleGenerate} retouchPrompt={pika.retouchPrompt} onRetouchPromptChange={v => pika.setRetouchState(s=>({...s, prompt: v}))} retouchPromptInputRef={pika.retouchPromptInputRef} selectionMode={pika.selectionMode} onSelectionModeChange={pika.handleSelectionModeChange}
              onApplyIdPhoto={pika.handleGenerateIdPhoto} idPhotoGender={pika.idPhotoGender} onIdPhotoGenderChange={pika.setIdPhotoGender}
              onApplyAdjustment={pika.handleApplyAdjustment} onApplyMultipleAdjustments={pika.handleApplyMultipleAdjustments} onApplyFilter={pika.handleApplyFilter}
              onApplyExpansion={pika.handleGenerateExpandedImage} expandPrompt={pika.expandPrompt} onExpandPromptChange={v => pika.setExpandState(s=>({...s, prompt: v}))} hasExpansion={pika.hasExpansion} onSetAspectExpansion={pika.setExpansionByAspect} imageDimensions={pika.imageDimensions} expandActiveAspect={pika.expandActiveAspect}
              onApplyExtract={pika.handleGenerateExtract} extractPrompt={pika.extractPrompt} onExtractPromptChange={v => pika.setExtractState(s=>({...s, prompt: v}))} extractHistoryFiles={pika.extractHistory} extractedHistoryItemUrls={pika.extractedHistoryItemUrls} onUseExtractedAsOutfit={pika.handleUseExtractedAsOutfit} onDownloadExtractedItem={pika.handleDownloadExtractedItem} onClearExtractHistory={pika.handleClearExtractHistory} onViewExtractedItem={pika.handleViewExtractedItem}
              studioPrompt={pika.studioPrompt} onStudioPromptChange={v => pika.setStudioState(s=>({...s, prompt: v}))} onApplyStudio={pika.handleGeneratePhotoshoot} studioStyleFile={pika.studioStyleFile} onStudioStyleFileChange={v => pika.setStudioState(s=>({...s, styleFile: v}))}
              studioOutfitFiles={pika.studioOutfitFiles} onStudioAddOutfitFile={pika.handleStudioAddOutfitFile} onStudioRemoveOutfitFile={pika.handleStudioRemoveOutfitFile}
              studioSubjects={pika.studioSubjects} onStudioAddSubject={pika.handleStudioAddSubject} onStudioRemoveSubject={pika.handleStudioRemoveSubject}
              onRequestFileUpload={pika.handleRequestFileUpload}
              onGenerateCreativePrompt={pika.handleGenerateCreativePrompt}
              sources={pika.sources}
              isMobile={pika.isMobile}
              onToggleToolbox={pika.toggleToolbox}
            />
          </div>
          
          {pika.currentImage && !pika.isKeyboardOpen && (
              <HistoryPills historyItems={pika.history.map(item => ({ url: item.url, thumbnailUrl: item.thumbnailUrl, transform: item.transform }))} results={pika.results} isGeneratingResults={pika.isGeneratingResults} expectedResultsCount={pika.expectedResultsCount} currentIndex={pika.historyIndex} resultsBaseHistoryIndex={pika.resultsBaseHistoryIndex} onHistorySelect={pika.handleHistoryPillClick} onResultSelect={pika.handleResultPillClick} isExpanded={pika.isHistoryExpanded} onToggle={() => pika.setIsHistoryExpanded(p => !p)} isMobileToolbarVisible={pika.isMobileToolbarVisible} isMobile={pika.isMobile} isControlsVisible={areControlsVisible} />
          )}
          
          {pika.isViewerOpen && <FullScreenViewerModal items={pika.viewerItems} initialIndex={pika.viewerInitialIndex} type={pika.viewerType} comparisonUrl={pika.viewerComparisonUrl} onClose={() => pika.setFullscreenViewerState(s=>({...s, isOpen: false}))} onDownload={(url) => pika.triggerDownload(url, `pika_ai_viewer_${Date.now()}.png`)} onSelect={pika.handleSelectFromViewer} />}
          {pika.isMobileToolbarVisible && <CompactMobileToolbar activeTab={pika.activeTab} setActiveTab={pika.handleTabChange} onOpenEditorToTab={pika.handleTabChangeAndOpen} isImageLoaded={!!pika.currentImage} onRequestFileUpload={pika.handleRequestFileUpload} areControlsVisible={pika.isZoomControlsVisible} isInteracting={pika.isInteracting} showControls={pika.showControls} />}
      </main>
    </div>
  );
};

export default App;