
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, IdCardIcon, AdjustmentsIcon, MagicWandIcon, ExpandIcon, PlusCircleIcon, DocumentScannerIcon, TagIcon, SparklesIcon, UsersIcon, UserCircleIcon, RedoIcon, UndoIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import type { Tab } from '../App';
import RetouchPanel, { SelectionMode, BrushMode } from './RetouchPanel';
import IdPhotoPanel from './IdPhotoPanel';
import AdjustmentPanel from './AdjustmentPanel';
import ExpandPanel from './ExpandPanel';
import CompositePanel from './CompositePanel';
import ScanPanel from './ScanPanel';
import ManualScanPanel from './ManualScanPanel';
import type { Enhancement, IdPhotoOptions, Face } from '../services/geminiService';

export type PoseStyle = 'automatic' | 'dynamic' | 'candid' | 'formal';
export type CameraAngle = 'front' | 'threeQuartersLeft' | 'threeQuartersRight' | 'profileLeft' | 'profileRight' | 'slightlyAbove' | 'slightlyBelow';

interface EditorSidebarProps {
  className?: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onApplyRetouch: (promptOverride?: string) => void;
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
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
  onApplyFaceSwap: () => void;
  onSelectTargetFace: (index: number) => void;
  onSelectSourceFace: (index: number) => void;
  currentImage: File | null;
  insertSubjectFiles: File[];
  onInsertSubjectFilesChange: (files: File[]) => void;
  insertStyleFiles: File[];
  onInsertStyleFilesChange: (files: File[]) => void;
  swapFaceFile: File | null;
  onSwapFaceFileChange: (file: File | null) => void;
  insertBackgroundFile: File | null;
  onInsertBackgroundFileChange: (file: File | null) => void;
  insertPrompt: string;
  onInsertPromptChange: (prompt: string) => void;
  insertCameraAngle: CameraAngle;
  onInsertCameraAngleChange: (angle: CameraAngle) => void;
  detectedFaces: Record<string, Face[]>;
  selectedTargetFace: { fileKey: string; faceIndex: number } | null;
  selectedSourceFace: { fileKey: string; faceIndex: number } | null;
  onApplyScan: (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean) => void;
  onApplyManualScan: () => void;
  onEnterManualMode: () => boolean;
  onCancelManualMode: () => void;
  scanHistory: string[];
  onReviewScan: (url: string) => void;
  onApplyExtract: () => void;
  extractPrompt: string;
  onExtractPromptChange: (prompt: string) => void;
  extractedItemsFiles: File[];
  extractedItemUrls: string[];
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
  isManualScanMode: boolean;
  setIsManualScanMode: (isManual: boolean) => void;
  onRequestFileUpload: () => void;
  studioPrompt: string;
  onStudioPromptChange: (prompt: string) => void;
  studioPoseStyle: PoseStyle;
  onStudioPoseStyleChange: (style: PoseStyle) => void;
  studioCameraAngle: CameraAngle;
  onStudioCameraAngleChange: (angle: CameraAngle) => void;
  onApplyStudio: () => void;
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

const StudioPanel: React.FC<Pick<EditorSidebarProps, 'isLoading' | 'isImageLoaded' | 'studioPrompt' | 'onStudioPromptChange' | 'studioPoseStyle' | 'onStudioPoseStyleChange' | 'studioCameraAngle' | 'onStudioCameraAngleChange' | 'onApplyStudio'>> = 
({ isLoading, isImageLoaded, studioPrompt, onStudioPromptChange, studioPoseStyle, onStudioPoseStyleChange, studioCameraAngle, onStudioCameraAngleChange, onApplyStudio }) => {
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

    // Fix: Changed JSX.Element to React.ReactElement to resolve JSX namespace error.
    const cameraAngleOptions: { value: CameraAngle, label: string, icon: React.FC<{ className?: string }> }[] = [
        { value: 'front', label: t('studioAngleFront'), icon: UserCircleIcon },
        { value: 'threeQuartersLeft', label: t('studioAngle34Left'), icon: UndoIcon },
        { value: 'threeQuartersRight', label: t('studioAngle34Right'), icon: RedoIcon },
        { value: 'profileLeft', label: t('studioAngleProfileLeft'), icon: ChevronLeftIcon },
        { value: 'profileRight', label: t('studioAngleProfileRight'), icon: ChevronRightIcon },
        { value: 'slightlyAbove', label: t('studioAngleAbove'), icon: ChevronUpIcon },
        { value: 'slightlyBelow', label: t('studioAngleBelow'), icon: ChevronDownIcon },
    ];


    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('studioTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('studioDescription')}</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
                <input
                    type="text"
                    value={studioPrompt}
                    onChange={(e) => onStudioPromptChange(e.target.value)}
                    placeholder={t('studioPromptPlaceholder')}
                    className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
                    disabled={isLoading || !isImageLoaded}
                />
                
                <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{t('studioPoseStyle')}:</span>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1 flex-wrap">
                        {poseOptions.map(({ value, label }) => (
                             <button
                                type="button"
                                key={value}
                                onClick={() => onStudioPoseStyleChange(value)}
                                disabled={isLoading || !isImageLoaded}
                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                                    studioPoseStyle === value
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'bg-transparent hover:bg-white/10 text-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{t('studioCameraAngle')}:</span>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1 flex-wrap">
                        {cameraAngleOptions.map(({ value, label, icon: Icon }) => (
                            <button
                                type="button"
                                key={value}
                                onClick={() => onStudioCameraAngleChange(value)}
                                disabled={isLoading || !isImageLoaded}
                                title={label}
                                className={`p-2 rounded-md transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center ${
                                    studioCameraAngle === value
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'bg-transparent hover:bg-white/10 text-gray-300'
                                }`}
                            >
                                {/* Fix: Replaced React.cloneElement with direct component rendering to fix type error. */}
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>


                <button
                    type="submit"
                    disabled={isLoading || !isImageLoaded || !studioPrompt.trim()}
                    className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                >
                    {t('generatePhotoshoot')}
                </button>
            </form>
        </div>
    );
};


const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { t } = useTranslation();
  const { 
      activeTab, setActiveTab, selectionMode, setSelectionMode, brushMode, 
      setBrushMode, brushSize, setBrushSize, isManualScanMode, setIsManualScanMode,
      onRequestFileUpload
  } = props;
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Effect to automatically scroll focused inputs into view on mobile
  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      // Check for text inputs or textareas
      if (
        (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'text') ||
        target.tagName.toLowerCase() === 'textarea'
      ) {
        // A timeout is crucial to allow the keyboard animation to start and the viewport to resize.
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 350);
      }
    };

    // Listen during the capture phase to handle the event reliably.
    sidebarElement.addEventListener('focus', handleFocus, true);

    return () => {
      sidebarElement.removeEventListener('focus', handleFocus, true);
    };
  }, []); // Run only once on mount.

  const panelContent = () => {
    switch (activeTab) {
      case 'retouch':
        return <RetouchPanel 
                  onApplyRetouch={props.onApplyRetouch} 
                  isLoading={props.isLoading} 
                  isHotspotSelected={props.isHotspotSelected}
                  selectionMode={selectionMode}
                  onSelectionModeChange={setSelectionMode}
                  brushMode={brushMode}
                  onBrushModeChange={setBrushMode}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                  onClearMask={props.clearMask}
                  isImageLoaded={props.isImageLoaded}
                  isMaskPresent={props.isMaskPresent}
                  prompt={props.retouchPrompt}
                  onPromptChange={props.onRetouchPromptChange}
                  promptInputRef={props.retouchPromptInputRef}
                  onApplyExtract={props.onApplyExtract}
                  extractPrompt={props.extractPrompt}
                  onExtractPromptChange={props.onExtractPromptChange}
                  extractedItemsFiles={props.extractedItemsFiles}
                  extractedItemUrls={props.extractedItemUrls}
                  extractHistoryFiles={props.extractHistoryFiles}
                  extractedHistoryItemUrls={props.extractedHistoryItemUrls}
                  onUseExtractedAsStyle={props.onUseExtractedAsStyle}
                  onDownloadExtractedItem={props.onDownloadExtractedItem}
                />;
      case 'idphoto':
        return <IdPhotoPanel 
                  onApplyIdPhoto={props.onApplyIdPhoto} 
                  isLoading={props.isLoading} 
                  isImageLoaded={props.isImageLoaded}
                  currentImage={props.currentImage}
                />;
      case 'adjust':
        return <AdjustmentPanel onApplyAdjustment={props.onApplyAdjustment} onApplyMultipleAdjustments={props.onApplyMultipleAdjustments} onApplyFilter={props.onApplyFilter} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      case 'expand':
        return <ExpandPanel 
                  onApplyExpansion={props.onApplyExpansion} 
                  isLoading={props.isLoading} 
                  isImageLoaded={props.isImageLoaded}
                  prompt={props.expandPrompt}
                  onPromptChange={props.onExpandPromptChange}
                  hasExpansion={props.hasExpansion}
                  onSetAspectExpansion={props.onSetAspectExpansion}
                  imageDimensions={props.imageDimensions}
                />;
      case 'insert':
        return <CompositePanel
                    onApplyComposite={props.onApplyComposite} 
                    isLoading={props.isLoading}
                    subjectFiles={props.insertSubjectFiles}
                    onSubjectFilesChange={props.onInsertSubjectFilesChange}
                    styleFiles={props.insertStyleFiles}
                    onStyleFilesChange={props.onInsertStyleFilesChange}
                    backgroundFile={props.insertBackgroundFile}
                    onBackgroundFileChange={props.onInsertBackgroundFileChange}
                    prompt={props.insertPrompt}
                    onPromptChange={props.onInsertPromptChange}
                    insertCameraAngle={props.insertCameraAngle}
                    onInsertCameraAngleChange={props.onInsertCameraAngleChange}
                    currentImage={props.currentImage}
                    onApplyFaceSwap={props.onApplyFaceSwap}
                    onSelectTargetFace={props.onSelectTargetFace}
                    onSelectSourceFace={props.onSelectSourceFace}
                    swapFaceFile={props.swapFaceFile}
                    onSwapFaceFileChange={props.onSwapFaceFileChange}
                    detectedFaces={props.detectedFaces}
                    selectedTargetFace={props.selectedTargetFace}
                    selectedSourceFace={props.selectedSourceFace}
                />;
      case 'scan':
        return isManualScanMode
          ? <ManualScanPanel onApply={props.onApplyManualScan} onCancel={() => { setIsManualScanMode(false); props.onCancelManualMode(); }} isLoading={props.isLoading} />
          : <ScanPanel
              onApplyScan={(...args) => { props.onApplyScan(...args); setIsManualScanMode(false); }}
              isLoading={props.isLoading}
              isImageLoaded={props.isImageLoaded}
              scanHistory={props.scanHistory}
              onReviewScan={props.onReviewScan}
            />;
      case 'studio':
        return <StudioPanel
                  isLoading={props.isLoading}
                  isImageLoaded={props.isImageLoaded}
                  studioPrompt={props.studioPrompt}
                  onStudioPromptChange={props.onStudioPromptChange}
                  studioPoseStyle={props.studioPoseStyle}
                  onStudioPoseStyleChange={props.onStudioPoseStyleChange}
                  studioCameraAngle={props.studioCameraAngle}
                  onStudioCameraAngleChange={props.onStudioCameraAngleChange}
                  onApplyStudio={props.onApplyStudio}
                />;
      default:
        return null;
    }
  };

  return (
    <div ref={sidebarRef} id="editor-toolbox" className={`w-full flex flex-col gap-4 ${props.className ?? ''}`}>
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-1.5 md:p-2 flex items-center justify-start md:justify-center gap-1 backdrop-blur-xl overflow-x-auto md:overflow-x-visible md:flex-wrap">
            {TABS_CONFIG.map(tab => {
                const isTabDisabledForEditing = !props.isImageLoaded && !['insert', 'studio'].includes(tab.id);

                const handleTabClick = () => {
                    if (isTabDisabledForEditing) {
                        onRequestFileUpload();
                    } else {
                        setActiveTab(tab.id as Tab);
                    }
                };
                
                return (
                    <div key={tab.id} className="relative group flex-1 min-w-[70px] md:min-w-0 md:flex-1">
                        <button
                            onClick={handleTabClick}
                            className={`relative p-3 w-full flex items-center justify-center rounded-xl transition-all duration-200 ${
                               activeTab === tab.id && !isTabDisabledForEditing
                               ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-400/25' 
                               : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
                            } ${isTabDisabledForEditing ? 'opacity-60' : ''}`}
                            title={isTabDisabledForEditing ? t('uploadImage') : t(tab.tooltip as any)}
                            disabled={props.isLoading}
                        >
                            <tab.icon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                    </div>
                );
            })}
        </div>
        
        <div className="w-full">
          <div key={activeTab} className="animate-slide-in-right">
            {panelContent()}
          </div>
        </div>
    </div>
  );
};

export default EditorSidebar;