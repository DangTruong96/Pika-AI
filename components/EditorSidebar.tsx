/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, IdCardIcon, AdjustmentsIcon, MagicWandIcon, ExpandIcon, PlusCircleIcon, DocumentScannerIcon, TagIcon, SparklesIcon, UsersIcon } from './icons';
import type { Tab } from '../App';
import RetouchPanel, { SelectionMode, BrushMode } from './RetouchPanel';
import IdPhotoPanel from './IdPhotoPanel';
import AdjustmentPanel from './AdjustmentPanel';
import ExpandPanel from './ExpandPanel';
import CompositePanel from './CompositePanel';
import ScanPanel from './ScanPanel';
import ManualScanPanel from './ManualScanPanel';
import type { Enhancement, IdPhotoOptions, Face } from '../services/geminiService';

interface EditorSidebarProps {
  className?: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onApplyRetouch: (promptOverride?: string) => void;
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
  onApplyAdjustment: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyExpansion: (prompt: string) => void;
  expandPrompt: string;
  onExpandPromptChange: (prompt: string) => void;
  hasExpansion: boolean;
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
  insertUseSearch: boolean;
  onInsertUseSearchChange: (useSearch: boolean) => void;
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
  retouchUseSearch: boolean;
  onRetouchUseSearchChange: (useSearch: boolean) => void;
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
}

export const TABS_CONFIG = [
    { id: 'retouch', icon: BrushIcon, tooltip: 'tooltipRetouch' },
    { id: 'adjust', icon: SparklesIcon, tooltip: 'tooltipAdjust' },
    { id: 'insert', icon: PlusCircleIcon, tooltip: 'tooltipInsert' },
    { id: 'idphoto', icon: IdCardIcon, tooltip: 'tooltipIdPhoto' },
    { id: 'expand', icon: ExpandIcon, tooltip: 'tooltipExpand' },
    { id: 'scan', icon: DocumentScannerIcon, tooltip: 'tooltipScan' },
];

const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { t } = useTranslation();
  const { 
      activeTab, setActiveTab, selectionMode, setSelectionMode, brushMode, 
      setBrushMode, brushSize, setBrushSize, isManualScanMode, setIsManualScanMode,
      onRequestFileUpload
  } = props;

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
                  retouchUseSearch={props.retouchUseSearch}
                  onRetouchUseSearchChange={props.onRetouchUseSearchChange}
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
        return <AdjustmentPanel onApplyAdjustment={props.onApplyAdjustment} onApplyFilter={props.onApplyFilter} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      case 'expand':
        return <ExpandPanel 
                  onApplyExpansion={props.onApplyExpansion} 
                  isLoading={props.isLoading} 
                  isImageLoaded={props.isImageLoaded}
                  prompt={props.expandPrompt}
                  onPromptChange={props.onExpandPromptChange}
                  hasExpansion={props.hasExpansion}
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
                    useSearchGrounding={props.insertUseSearch}
                    onUseSearchGroundingChange={props.onInsertUseSearchChange}
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
      default:
        return null;
    }
  };

  return (
    <div id="editor-toolbox" className={`w-full flex flex-col gap-4 ${props.className ?? ''}`}>
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-1.5 md:p-2 flex items-center justify-start md:justify-center gap-1 backdrop-blur-xl overflow-x-auto md:overflow-x-visible md:flex-wrap">
            {TABS_CONFIG.map(tab => {
                const isTabDisabledForEditing = !props.isImageLoaded && tab.id !== 'insert';

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