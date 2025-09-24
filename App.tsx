

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef } from 'react';
import { usePika, type Tab } from './hooks/usePika';

import Header from './components/Header';
import Spinner from './components/Spinner';
import EditorSidebar, { TABS_CONFIG } from './components/EditorSidebar';
import { ArrowsPointingOutIcon, ZoomInIcon, ZoomOutIcon, UploadIcon, PaperAirplaneIcon, UndoIcon, RedoIcon, FlipHorizontalIcon, FlipVerticalIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from './components/icons';
import { useTranslation } from './contexts/LanguageContext';
import { SelectionMode } from './components/RetouchPanel';
import HistoryPills from './components/HistoryPills';
import FullScreenViewerModal from './components/FullScreenViewerModal';


const ImagePlaceholder: React.FC<{ onFileSelect: (files: FileList | null) => void }> = React.memo(({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

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
});

const CompactMobileToolbar: React.FC<{
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenEditor: () => void;
  isImageLoaded: boolean;
  onRequestFileUpload: () => void;
}> = React.memo(({ activeTab, setActiveTab, onOpenEditor, isImageLoaded, onRequestFileUpload }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 p-1.5 z-[60] flex items-center justify-center gap-2 animate-slide-up pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS_CONFIG.map(tab => {
          const isTabDisabled = !isImageLoaded && !['studio'].includes(tab.id);
          const isActive = activeTab === tab.id && !isTabDisabled;
          const label = isTabDisabled ? t('uploadImage') : t(tab.tooltip as any);
          
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
              title={label}
              aria-label={label}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

const MobileRetouchInputBar: React.FC<{
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = React.memo(({ prompt, onPromptChange, onGenerate, onCancel, isLoading }) => {
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
});

const App: React.FC = () => {
  const pika = usePika();

  return (
    <div
      className={`w-screen bg-black text-gray-100 flex flex-col overflow-hidden antialiased`}
      style={{ height: pika.isMobile ? `${pika.windowSize.height}px` : '100vh' }}
    >
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
      />
      <main className="flex-grow w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
        <div 
          className={`touch-none w-full bg-black/30 relative flex items-center justify-center p-2 lg:p-4 overflow-hidden transition-all duration-300 ease-in-out ${ pika.isMobile ? (pika.isToolboxOpen ? 'h-1/2' : 'h-full') : (pika.isToolboxOpen ? 'lg:w-[70%]' : 'lg:w-full') }`}
          onMouseDown={pika.handleViewerMouseDown} onMouseMove={pika.handleViewerMouseMove} onMouseUp={pika.handleViewerMouseUp} onMouseLeave={pika.handleViewerMouseUp} onWheel={pika.handleViewerWheel} onTouchStart={pika.handleViewerTouchStart} onTouchMove={pika.handleViewerTouchMove} onTouchEnd={pika.handleViewerTouchEnd}
        >
            {pika.isLoading && (<div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex flex-col items-center justify-center gap-4 text-white p-4"><Spinner /><p className="text-lg font-semibold animate-pulse">{pika.loadingMessage}</p></div>)}
            {!pika.currentImage ? <ImagePlaceholder onFileSelect={pika.handleFileSelect} /> : (
                <div ref={pika.imageViewerRef} className="w-full h-full relative" onMouseLeave={() => pika.setMousePosition(null)}>
                    {pika.isComparing && pika.isMobile && pika.isViewingOriginalOnHold && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-bold py-1 px-3 rounded-md pointer-events-none z-30 animate-fade-in">
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
                            <img ref={pika.imgRef} src={(pika.isComparing && pika.isMobile && pika.isViewingOriginalOnHold && pika.beforeImageUrl) ? pika.beforeImageUrl : pika.currentImageUrl ?? undefined} alt="Main content" className={`max-w-full max-h-full object-contain`} />
                            <canvas ref={pika.maskCanvasRef} className={`absolute pointer-events-none top-0 left-0 w-full h-full opacity-50`} style={{ mixBlendMode: 'screen' }}/>
                            {pika.activeTab === 'retouch' && (
                                <canvas className={`absolute top-0 left-0 w-full h-full ${pika.selectionMode === 'brush' ? 'cursor-none' : 'cursor-crosshair'}`}
                                    onMouseDown={e => pika.handleCanvasInteraction(e, 'start')} onMouseMove={e => pika.handleCanvasInteraction(e, 'move')} onMouseUp={e => pika.handleCanvasInteraction(e, 'end')} onMouseLeave={e => pika.handleCanvasInteraction(e, 'end')}
                                    onTouchStart={e => pika.handleCanvasInteraction(e, 'start')} onTouchMove={e => pika.handleCanvasInteraction(e, 'move')} onTouchEnd={e => pika.handleCanvasInteraction(e, 'end')}
                                    onClick={pika.selectionMode === 'point' ? pika.handleViewerClick : undefined}
                                />
                            )}
                        </div>
                        {pika.hotspotDisplayPosition && <div className="absolute w-4 h-4 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-2 ring-black/50 animate-pulse z-20" style={pika.hotspotDisplayPosition} />}
                    </div>
                    
                    {pika.selectionMode === 'brush' && pika.mousePosition && (<div className={`absolute rounded-full border-2 pointer-events-none z-50 ${pika.brushMode === 'draw' ? 'bg-white/30 border-white' : 'bg-red-500/30 border-red-500'} ${pika.isDrawing ? 'opacity-0' : 'opacity-70'} transition-opacity duration-100`} style={{ left: pika.mousePosition.x, top: pika.mousePosition.y, width: pika.brushSize, height: pika.brushSize, transform: 'translate(-50%, -50%)' }} />)}
                </div>
            )}
            {pika.currentImage && (pika.isZoomControlsVisible || pika.isInteracting) && (
                <>
                    <div className={`absolute left-4 flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10 z-40 animate-fade-in transition-all duration-300 ease-in-out top-16 ${pika.isHistoryExpanded ? 'lg:top-16 lg:translate-y-0' : 'lg:top-1/2 lg:-translate-y-1/2'}`}>
                        <button onClick={() => pika.handleZoom('in')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('zoomIn')}><ZoomInIcon className="w-6 h-6"/></button>
                        <button onClick={pika.resetView} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('resetZoom')}><ArrowsPointingOutIcon className="w-6 h-6"/></button>
                        <button onClick={() => pika.handleZoom('out')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('zoomOut')}><ZoomOutIcon className="w-6 h-6"/></button>
                        {pika.canUndo && <div className="h-px w-6 bg-white/20 my-1"></div>}
                        {pika.canUndo && <button onClick={() => pika.setComparisonState(s => ({...s, isComparing: !s.isComparing}))} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" aria-label={pika.isComparing ? pika.t('viewEdited') : pika.t('viewOriginal')} title={pika.isComparing ? pika.t('viewEdited') : pika.t('viewOriginal')}>{pika.isComparing ? <EyeSlashIcon className="w-6 h-6 text-cyan-400"/> : <EyeIcon className="w-6 h-6"/>}</button>}
                    </div>
                    <div className="absolute top-16 lg:top-1/2 lg:-translate-y-1/2 right-4 flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10 z-40 animate-fade-in">
                        <button onClick={() => pika.handleApplyTransform('rotate-ccw')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformRotateCCW')}><UndoIcon className="w-6 h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('rotate-cw')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformRotateCW')}><RedoIcon className="w-6 h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('flip-h')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformFlipH')}><FlipHorizontalIcon className="w-6 h-6"/></button>
                        <button onClick={() => pika.handleApplyTransform('flip-v')} disabled={pika.isLoading} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50" title={pika.t('transformFlipV')}><FlipVerticalIcon className="w-6 h-6"/></button>
                    </div>
                </>
            )}
        </div>
        
        <div ref={pika.toolsContainerRef} className={`flex-shrink-0 bg-black/30 transition-all duration-300 ease-in-out ${ pika.isMobile ? 'w-full' : (pika.isToolboxOpen ? 'lg:w-[30%]' : 'lg:w-0') } ${ pika.isMobile ? (pika.isToolboxOpen ? 'h-1/2' : 'h-0') : 'h-full' } ${ pika.isToolboxOpen ? 'overflow-y-auto will-change-scroll' : 'overflow-hidden' } ${pika.isMobile ? (pika.isToolboxOpen ? 'pb-4' : 'p-0') : 'lg:pb-4'}`} onTouchStart={pika.handleToolsTouchStart} onTouchMove={pika.handleToolsTouchMove} onTouchEnd={pika.handleToolsTouchEnd}>
            <EditorSidebar className="w-full" isImageLoaded={!!pika.currentImage} isLoading={pika.isLoading} activeTab={pika.activeTab} setActiveTab={pika.handleTabChange} currentImage={pika.currentImage}
              onApplyRetouch={pika.handleGenerate} retouchPrompt={pika.retouchPrompt} onRetouchPromptChange={v => pika.setRetouchState(s=>({...s, prompt: v}))} retouchPromptInputRef={pika.retouchPromptInputRef} isHotspotSelected={!!pika.editHotspot} onClearHotspot={() => pika.setRetouchState(s=>({...s, editHotspot: null}))} selectionMode={pika.selectionMode} setSelectionMode={v => pika.setRetouchState(s=>({...s, selectionMode: v}))} brushMode={pika.brushMode} setBrushMode={v => pika.setRetouchState(s=>({...s, brushMode: v}))} brushSize={pika.brushSize} setBrushSize={v => pika.setRetouchState(s=>({...s, brushSize: v}))} clearMask={pika.clearMask} isMaskPresent={pika.isMaskPresent()}
              onApplyIdPhoto={pika.handleGenerateIdPhoto} idPhotoGender={pika.idPhotoGender} onIdPhotoGenderChange={pika.setIdPhotoGender}
              onApplyAdjustment={pika.handleApplyAdjustment} onApplyMultipleAdjustments={pika.handleApplyMultipleAdjustments} onApplyFilter={pika.handleApplyFilter}
              onApplyExpansion={pika.handleGenerateExpandedImage} expandPrompt={pika.expandPrompt} onExpandPromptChange={v => pika.setExpandState(s=>({...s, prompt: v}))} hasExpansion={pika.hasExpansion} onSetAspectExpansion={pika.setExpansionByAspect} imageDimensions={pika.imageDimensions} expandActiveAspect={pika.expandActiveAspect}
              onApplyExtract={pika.handleGenerateExtract} extractPrompt={pika.extractPrompt} onExtractPromptChange={v => pika.setExtractState(s=>({...s, prompt: v}))} extractHistoryFiles={pika.extractHistory} extractedHistoryItemUrls={pika.extractedHistoryItemUrls} onUseExtractedAsOutfit={pika.handleUseExtractedAsOutfit} onDownloadExtractedItem={pika.handleDownloadExtractedItem} onClearExtractHistory={pika.handleClearExtractHistory} onViewExtractedItem={pika.handleViewExtractedItem}
              studioPrompt={pika.studioPrompt} onStudioPromptChange={v => pika.setStudioState(s=>({...s, prompt: v}))} onApplyStudio={pika.handleGeneratePhotoshoot} studioStyleFile={pika.studioStyleFile} onStudioStyleFileChange={v => pika.setStudioState(s=>({...s, styleFile: v}))} studioStyleInfluence={pika.studioStyleInfluence} onStudioStyleInfluenceChange={v => pika.setStudioState(s=>({...s, styleInfluence: v}))}
              studioOutfitFiles={pika.studioOutfitFiles} onStudioAddOutfitFile={pika.handleStudioAddOutfitFile} onStudioRemoveOutfitFile={pika.handleStudioRemoveOutfitFile}
              studioSubjects={pika.studioSubjects} onStudioAddSubject={pika.handleStudioAddSubject} onStudioRemoveSubject={pika.handleStudioRemoveSubject}
              onRequestFileUpload={pika.handleRequestFileUpload}
              onGenerateCreativePrompt={pika.handleGenerateCreativePrompt}
            />
          </div>
          
          {pika.currentImage && !pika.isMobileRetouchInputActive && !pika.isKeyboardOpen && (
              <HistoryPills historyItems={pika.history.map(item => ({ url: item.url, transform: item.transform }))} results={pika.results} isGeneratingResults={pika.isGeneratingResults} expectedResultsCount={pika.expectedResultsCount} currentIndex={pika.historyIndex} resultsBaseHistoryIndex={pika.resultsBaseHistoryIndex} onHistorySelect={pika.handleHistoryPillClick} onResultSelect={pika.handleResultPillClick} isExpanded={pika.isHistoryExpanded} onToggle={() => pika.setIsHistoryExpanded(p => !p)} isMobileToolbarVisible={pika.isMobileToolbarVisible} />
          )}

          {pika.isMobileRetouchInputActive && <MobileRetouchInputBar key={pika.mobileInputKey} prompt={pika.retouchPrompt} onPromptChange={v => pika.setRetouchState(s=>({...s, prompt: v}))} onGenerate={() => pika.handleGenerate()} onCancel={() => pika.setRetouchState(s=>({...s, editHotspot: null}))} isLoading={pika.isLoading}/>}
          
          {pika.isViewerOpen && <FullScreenViewerModal items={pika.viewerItems} initialIndex={pika.viewerInitialIndex} type={pika.viewerType} comparisonUrl={pika.viewerComparisonUrl} onClose={() => pika.setFullscreenViewerState(s=>({...s, isOpen: false}))} onDownload={pika.triggerDownload} onSelect={pika.handleSelectFromViewer} />}
          {pika.isMobileToolbarVisible && <CompactMobileToolbar activeTab={pika.activeTab} setActiveTab={pika.handleTabChange} onOpenEditor={pika.toggleToolbox} isImageLoaded={!!pika.currentImage} onRequestFileUpload={pika.handleRequestFileUpload} />}
      </main>
    </div>
  );
};

export default App;