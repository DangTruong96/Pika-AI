

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, IdCardIcon, AdjustmentsIcon, MagicWandIcon, ExpandIcon, PlusCircleIcon, DocumentScannerIcon, TagIcon, SparklesIcon, UsersIcon, UserCircleIcon, RedoIcon, UndoIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, UploadIcon, XMarkIcon } from './icons';
// Fix: Import Gender type from App.tsx
import type { Tab, Gender } from '../App';
import RetouchPanel, { SelectionMode, BrushMode } from './RetouchPanel';
import IdPhotoPanel from './IdPhotoPanel';
import AdjustmentPanel from './AdjustmentPanel';
import ExpandPanel from './ExpandPanel';
import CompositePanel from './CompositePanel';
import ScanPanel from './ScanPanel';
import ManualScanPanel from './ManualScanPanel';
import type { Enhancement, IdPhotoOptions } from '../services/geminiService';

export type PoseStyle = 'automatic' | 'dynamic' | 'candid' | 'formal';

interface EditorSidebarProps {
  className?: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  // FIX: (components/EditorSidebar.tsx line 285) Add missing `currentImage` prop to be passed to child components.
  currentImage: File | null;
  onApplyRetouch: (promptOverride?: string) => void;
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
  // Fix: Add missing props for ID Photo panel
  idPhotoGender: Gender;
  onIdPhotoGenderChange: (gender: Gender) => void;
  onApplyAdjustment: (prompt: string) => void;
  onApplyMultipleAdjustments: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyExpansion: (prompt: string) => void;
  expandPrompt: string;
  onExpandPromptChange: (prompt: string) => void;
  hasExpansion: boolean;
  onSetAspectExpansion: (aspect: number | null) => void;
  imageDimensions: { width: number, height: number } | null;
  onApplyComposite: () => void;
  insertSubjectFiles: File[];
  onInsertSubjectFilesChange: (files: File[] | ((currentFiles: File[]) => File[])) => void;
  insertStyleFiles: File[];
  onInsertStyleFilesChange: (files: File[]) => void;
  insertBackgroundFile: File | null;
  onInsertBackgroundFileChange: (file: File | null) => void;
  insertPrompt: string;
  onInsertPromptChange: (prompt: string) => void;
  onApplyScan: (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean) => void;
  onApplyManualScan: () => void;
  onEnterManualMode: () => boolean;
  onCancelManualMode: () => void;
  scanHistory: string[];
  onReviewScan: (url: string) => void;
  onApplyExtract: () => void;
  extractPrompt: string;
  onExtractPromptChange: (prompt: string) => void;
  extractHistoryFiles: File[][];
  extractedHistoryItemUrls: string[][];
  onUseExtractedAsStyle: (file: File) => void;
  onDownloadExtractedItem: (file: File) => void;
  isMaskPresent: boolean;
  clearMask: () => void;
  retouchPrompt: string;
  onRetouchPromptChange: (prompt: string) => void;
  retouchPromptInputRef: React.RefObject<HTMLInputElement>;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isHotspotSelected: boolean;
  onClearHotspot: () => void;
  isManualScanMode: boolean;
  setIsManualScanMode: (isManual: boolean) => void;
  onRequestFileUpload: () => void;
  studioPrompt: string;
  onStudioPromptChange: (prompt: string) => void;
  studioPoseStyle: PoseStyle;
  onStudioPoseStyleChange: (style: PoseStyle) => void;
  onApplyStudio: () => void;
  studioStyleFile: File | null;
  onStudioStyleFileChange: (file: File | null) => void;
  studioStyleInfluence: number;
  onStudioStyleInfluenceChange: (value: number) => void;
  scanEnhancement: Enhancement;
  onScanEnhancementChange: (e: Enhancement) => void;
  scanRemoveShadows: boolean;
  onScanRemoveShadowsChange: (c: boolean) => void;
  scanRestoreText: boolean;
  onScanRestoreTextChange: (c: boolean) => void;
  scanRemoveHandwriting: boolean;
  onScanRemoveHandwritingChange: (c: boolean) => void;
  expandActiveAspect: number | null;
  onGenerateCreativePrompt: (context: 'studio' | 'insert') => void;
}

export const TABS_CONFIG = [
    { id: 'retouch', icon: BrushIcon, tooltip: 'tooltipRetouch' },
    { id: 'adjust', icon: SparklesIcon, tooltip: 'tooltipAdjust' },
    { id: 'studio', icon: UsersIcon, tooltip: 'tooltipStudio' },
    { id: 'insert', icon: PlusCircleIcon, tooltip: 'tooltipInsert' },
    { id: 'idphoto', icon: IdCardIcon, tooltip: 'tooltipIdPhoto' },
    { id: 'expand', icon: ExpandIcon, tooltip: 'tooltipExpand' },
    { id: 'scan', icon: DocumentScannerIcon, tooltip: 'tooltipScan' },
];

const StudioPanel: React.FC<Pick<EditorSidebarProps, 'isLoading' | 'isImageLoaded' | 'studioPrompt' | 'onStudioPromptChange' | 'studioPoseStyle' | 'onStudioPoseStyleChange' | 'onApplyStudio' | 'studioStyleFile' | 'onStudioStyleFileChange' | 'studioStyleInfluence' | 'onStudioStyleInfluenceChange' | 'onGenerateCreativePrompt'>> = 
({ isLoading, isImageLoaded, studioPrompt, onStudioPromptChange, studioPoseStyle, onStudioPoseStyleChange, onApplyStudio, studioStyleFile, onStudioStyleFileChange, studioStyleInfluence, onStudioStyleInfluenceChange, onGenerateCreativePrompt }) => {
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApplyStudio();
    };
    
    const poseOptions: { value: PoseStyle, label: string }[] = [
        { value: 'automatic', label: t('studioPoseStyleAutomatic') },
        { value: 'dynamic', label: t('studioPoseStyleDynamic') },
        { value: 'candid', label: t('studioPoseStyleCandid') },
        { value: 'formal', label: t('studioPoseStyleFormal') },
    ];

    const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStudioStyleFileChange(e.target.files[0]);
        }
        e.target.value = '';
    };

    const StylePreview: React.FC<{ file: File }> = ({ file }) => {
        const [url, setUrl] = useState<string | null>(null);
        useEffect(() => {
            const objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }, [file]);

        if (!url) return null;
        return <img src={url} alt="Style Reference" className="w-full h-full object-cover" />;
    };

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('studioTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('studioDescription')}</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
                <div className="w-full flex items-center gap-2">
                    <input
                        type="text"
                        value={studioPrompt}
                        onChange={(e) => onStudioPromptChange(e.target.value)}
                        placeholder={studioStyleFile ? t('studioPromptPlaceholderStyle') : t('studioPromptPlaceholder')}
                        className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
                        disabled={isLoading || !isImageLoaded}
                    />
                    <button 
                        type="button" 
                        onClick={() => onGenerateCreativePrompt('studio')}
                        disabled={isLoading || !isImageLoaded}
                        className="p-4 bg-white/5 rounded-lg text-cyan-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('suggestionTitle')}
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('studioPoseStyle')}</span>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1 flex-wrap">
                        {poseOptions.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onStudioPoseStyleChange(value)}
                                disabled={isLoading || !isImageLoaded}
                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${studioPoseStyle === value ? 'bg-white/15 text-white shadow-sm' : 'bg-transparent hover:bg-white/10 text-gray-300'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('insertStyle')}</span>
                    <div className="flex items-center justify-center gap-2">
                         <label htmlFor="studio-style-file-input" className={`relative w-24 h-24 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${studioStyleFile ? 'border-cyan-500' : 'border-dashed border-white/20 hover:border-cyan-500'}`}>
                            {studioStyleFile ? (
                                <>
                                    <StylePreview file={studioStyleFile} />
                                    <button type="button" onClick={() => onStudioStyleFileChange(null)} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-red-500"><XMarkIcon className="w-4 h-4"/></button>
                                </>
                            ): (
                                <UploadIcon className="w-8 h-8 text-gray-400"/>
                            )}
                        </label>
                        <input id="studio-style-file-input" type="file" className="hidden" accept="image/*" onChange={handleStyleFileChange} />

                        {studioStyleFile && (
                            <div className="flex-grow flex flex-col items-center gap-2 bg-white/5 p-2 rounded-lg">
                                <label htmlFor="style-influence-slider" className="text-xs font-medium text-gray-300">{t('studioStyleInfluenceLabel')}: {Math.round(studioStyleInfluence * 100)}%</label>
                                <input
                                    id="style-influence-slider"
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={studioStyleInfluence}
                                    onChange={(e) => onStudioStyleInfluenceChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    disabled={isLoading || !isImageLoaded || (!studioPrompt.trim() && !studioStyleFile)}
                >
                    {t('generatePhotoshoot')}
                </button>
            </form>
        </div>
    );
};

const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { className, isImageLoaded, isLoading, activeTab, setActiveTab } = props;
  const { t } = useTranslation();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 1024;

  const handleWheel = (e: WheelEvent) => {
    if (tabsContainerRef.current) {
        // Prevent page scroll while scrolling the tab bar
        e.preventDefault();
        tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
      const container = tabsContainerRef.current;
      if (container) {
          // Add passive: false to be able to preventDefault
          container.addEventListener('wheel', handleWheel, { passive: false });
      }
      return () => {
          if (container) {
              container.removeEventListener('wheel', handleWheel);
          }
      };
  }, []);

  useEffect(() => {
    if (tabsContainerRef.current) {
        const activeButton = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
        if (activeButton) {
            activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [activeTab]);

  const renderActivePanel = () => {
    if (props.isManualScanMode && activeTab === 'scan') {
        return <ManualScanPanel onApply={props.onApplyManualScan} onCancel={props.onCancelManualMode} isLoading={isLoading} />;
    }

    switch (activeTab) {
      case 'retouch':
        return <RetouchPanel 
          onApplyRetouch={props.onApplyRetouch}
          isLoading={isLoading}
          isHotspotSelected={props.isHotspotSelected}
          onClearHotspot={props.onClearHotspot}
          selectionMode={props.selectionMode}
          onSelectionModeChange={props.setSelectionMode}
          brushMode={props.brushMode}
          onBrushModeChange={props.setBrushMode}
          brushSize={props.brushSize}
          onBrushSizeChange={props.setBrushSize}
          onClearMask={props.clearMask}
          isImageLoaded={isImageLoaded}
          isMaskPresent={props.isMaskPresent}
          prompt={props.retouchPrompt}
          onPromptChange={props.onRetouchPromptChange}
          promptInputRef={props.retouchPromptInputRef}
          onApplyExtract={props.onApplyExtract}
          extractPrompt={props.extractPrompt}
          onExtractPromptChange={props.onExtractPromptChange}
          extractHistoryFiles={props.extractHistoryFiles}
          extractedHistoryItemUrls={props.extractedHistoryItemUrls}
          onUseExtractedAsStyle={props.onUseExtractedAsStyle}
          onDownloadExtractedItem={props.onDownloadExtractedItem}
        />;
      case 'idphoto':
        return <IdPhotoPanel
            onApplyIdPhoto={props.onApplyIdPhoto}
            isLoading={isLoading}
            isImageLoaded={isImageLoaded}
            currentImage={props.currentImage}
            gender={props.idPhotoGender}
            onGenderChange={props.onIdPhotoGenderChange}
        />;
      case 'adjust':
        return <AdjustmentPanel 
          onApplyAdjustment={props.onApplyAdjustment}
          onApplyMultipleAdjustments={props.onApplyMultipleAdjustments}
          onApplyFilter={props.onApplyFilter}
          isLoading={isLoading}
          isImageLoaded={isImageLoaded}
        />;
      case 'expand':
        return <ExpandPanel
          onApplyExpansion={props.onApplyExpansion}
          isLoading={isLoading}
          isImageLoaded={isImageLoaded}
          prompt={props.expandPrompt}
          onPromptChange={props.onExpandPromptChange}
          hasExpansion={props.hasExpansion}
          onSetAspectExpansion={props.onSetAspectExpansion}
          imageDimensions={props.imageDimensions}
          activeAspect={props.expandActiveAspect}
        />;
      case 'insert':
        return <CompositePanel
          onApplyComposite={props.onApplyComposite}
          isLoading={isLoading}
          subjectFiles={props.insertSubjectFiles}
          onSubjectFilesChange={props.onInsertSubjectFilesChange}
          styleFiles={props.insertStyleFiles}
          onStyleFilesChange={props.onInsertStyleFilesChange}
          backgroundFile={props.insertBackgroundFile}
          onBackgroundFileChange={props.onInsertBackgroundFileChange}
          prompt={props.insertPrompt}
          onPromptChange={props.onInsertPromptChange}
          onGenerateCreativePrompt={() => props.onGenerateCreativePrompt('insert')}
        />;
      case 'scan':
        return <ScanPanel
            onApplyScan={props.onApplyScan}
            isLoading={isLoading}
            isImageLoaded={isImageLoaded}
            scanHistory={props.scanHistory}
            onReviewScan={props.onReviewScan}
            enhancement={props.scanEnhancement}
            onEnhancementChange={props.onScanEnhancementChange}
            removeShadows={props.scanRemoveShadows}
            onRemoveShadowsChange={props.onScanRemoveShadowsChange}
            restoreText={props.scanRestoreText}
            onRestoreTextChange={props.onScanRestoreTextChange}
            removeHandwriting={props.scanRemoveHandwriting}
            onRemoveHandwritingChange={props.onScanRemoveHandwritingChange}
        />;
      case 'studio':
        return <StudioPanel
            isLoading={isLoading}
            isImageLoaded={isImageLoaded}
            studioPrompt={props.studioPrompt}
            onStudioPromptChange={props.onStudioPromptChange}
            studioPoseStyle={props.studioPoseStyle}
            onStudioPoseStyleChange={props.onStudioPoseStyleChange}
            onApplyStudio={props.onApplyStudio}
            studioStyleFile={props.studioStyleFile}
            onStudioStyleFileChange={props.onStudioStyleFileChange}
            studioStyleInfluence={props.studioStyleInfluence}
            onStudioStyleInfluenceChange={props.onStudioStyleInfluenceChange}
            onGenerateCreativePrompt={() => props.onGenerateCreativePrompt('studio')}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center p-2 lg:p-4 gap-3 ${className}`}>
      {/* Main editor toolbar for desktop/open mobile view */}
      <div className="w-full flex items-center justify-center p-1 bg-black/20 rounded-2xl border border-white/10 mb-3 sticky top-2 z-10">
          <div ref={tabsContainerRef} className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mb-1.5">
              {TABS_CONFIG.map(tab => {
                  const isTabDisabled = !isImageLoaded && !['insert', 'studio'].includes(tab.id);
                  const isActive = activeTab === tab.id && !isTabDisabled;
                  
                  const handleTabClick = () => {
                      if (isTabDisabled) {
                          props.onRequestFileUpload();
                      } else {
                          setActiveTab(tab.id as Tab);
                      }
                  };

                  return (
                      <button
                          key={tab.id}
                          data-tab-id={tab.id}
                          onClick={handleTabClick}
                          disabled={isLoading}
                          className={`relative p-3 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ease-in-out transform disabled:opacity-50 disabled:cursor-not-allowed ${
                              isActive ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          title={isTabDisabled ? t('uploadImage') : t(tab.tooltip as any)}
                      >
                          <tab.icon className="w-6 h-6" />
                      </button>
                  );
              })}
          </div>
      </div>
      
      {renderActivePanel()}

    </div>
  );
};

export default EditorSidebar;