/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, IdCardIcon, ExpandIcon, SparklesIcon, UsersIcon, LightbulbIcon } from './icons';
import type { Tab, Gender, SelectionMode, BrushMode, AspectRatio } from '../types';
import RetouchPanel from './RetouchPanel';
import IdPhotoPanel from './IdPhotoPanel';
import AdjustmentPanel from './AdjustmentPanel';
import { ExpandPanel } from './ExpandPanel';
import StudioPanel from './StudioPanel';
import GeneratePanel from './GeneratePanel';
import type { IdPhotoOptions } from '../services/geminiService';

interface EditorSidebarProps {
  className?: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currentImage: File | null;
  onApplyRetouch: (promptOverride?: string) => void;
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
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
  onApplyExtract: () => void;
  extractPrompt: string;
  onExtractPromptChange: (prompt: string) => void;
  extractHistoryFiles: File[][];
  extractedHistoryItemUrls: string[][];
  onUseExtractedAsOutfit: (file: File) => void;
  onDownloadExtractedItem: (file: File) => void;
  onClearExtractHistory: () => void;
  isMaskPresent: boolean;
  clearMask: () => void;
  retouchPrompt: string;
  onRetouchPromptChange: (prompt: string) => void;
  retouchPromptInputRef: React.RefObject<HTMLTextAreaElement>;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isHotspotSelected: boolean;
  onClearHotspot: () => void;
  onRequestFileUpload: () => void;
  studioPrompt: string;
  onStudioPromptChange: (prompt: string) => void;
  onApplyStudio: () => void;
  studioStyleFile: File | null;
  onStudioStyleFileChange: (file: File | null) => void;
  studioOutfitFiles: File[];
  onStudioAddOutfitFile: (file: File) => void;
  onStudioRemoveOutfitFile: (index: number) => void;
  studioSubjects: File[];
  onStudioAddSubject: (file: File) => void;
  onStudioRemoveSubject: (index: number) => void;
  expandActiveAspect: number | null;
  onGenerateCreativePrompt: () => void;
  onGenerateImageFromText: () => void;
  generatePrompt: string;
  onGeneratePromptChange: (prompt: string) => void;
  generateAspectRatio: AspectRatio;
  onGenerateAspectRatioChange: (aspect: AspectRatio) => void;
  generateNumImages: number;
  // FIX: Add missing onGenerateNumImagesChange to EditorSidebarProps interface.
  onGenerateNumImagesChange: (num: number) => void;
  onViewExtractedItem: (setIndex: number, itemIndex: number) => void;
  isMobile?: boolean;
  onToggleToolbox: () => void;
}

export const TABS_CONFIG = [
    { id: 'retouch', icon: BrushIcon, tooltip: 'tooltipRetouch' },
    { id: 'adjust', icon: SparklesIcon, tooltip: 'tooltipAdjust' },
    { id: 'studio', icon: UsersIcon, tooltip: 'tooltipStudio' },
    { id: 'generate', icon: LightbulbIcon, tooltip: 'tooltipGenerate' },
    { id: 'idphoto', icon: IdCardIcon, tooltip: 'tooltipIdPhoto' },
    { id: 'expand', icon: ExpandIcon, tooltip: 'tooltipExpand' },
];

const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { className, isImageLoaded, isLoading, activeTab, setActiveTab, isMobile } = props;
  const { t } = useTranslation();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

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
    switch (activeTab) {
      case 'retouch':
        return <RetouchPanel 
          onApplyRetouch={props.onApplyRetouch}
          isLoading={isLoading}
          isHotspotSelected={props.isHotspotSelected}
          onClearHotspot={props.onClearHotspot}
          selectionMode={props.selectionMode}
          onSelectionModeChange={props.onSelectionModeChange}
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
          onUseExtractedAsOutfit={props.onUseExtractedAsOutfit}
          onDownloadExtractedItem={props.onDownloadExtractedItem}
          onClearExtractHistory={props.onClearExtractHistory}
          onViewExtractedItem={props.onViewExtractedItem}
          setActiveTab={props.setActiveTab}
          isMobile={props.isMobile}
          onToggleToolbox={props.onToggleToolbox}
        />;
      case 'idphoto':
        return <IdPhotoPanel
            onApplyIdPhoto={props.onApplyIdPhoto}
            isLoading={isLoading}
            isImageLoaded={isImageLoaded}
            currentImage={props.currentImage}
            gender={props.idPhotoGender}
            onGenderChange={props.onIdPhotoGenderChange}
            setActiveTab={props.setActiveTab}
            isMobile={props.isMobile}
            onToggleToolbox={props.onToggleToolbox}
        />;
      case 'adjust':
        return <AdjustmentPanel 
          onApplyAdjustment={props.onApplyAdjustment}
          onApplyMultipleAdjustments={props.onApplyMultipleAdjustments}
          onApplyFilter={props.onApplyFilter}
          isLoading={isLoading}
          isImageLoaded={isImageLoaded}
          setActiveTab={setActiveTab}
          isMobile={props.isMobile}
          onToggleToolbox={props.onToggleToolbox}
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
          setActiveTab={props.setActiveTab}
          isMobile={props.isMobile}
          onToggleToolbox={props.onToggleToolbox}
        />;
      case 'studio':
        return <StudioPanel
            isLoading={isLoading}
            isImageLoaded={isImageLoaded}
            currentImage={props.currentImage}
            studioPrompt={props.studioPrompt}
            onStudioPromptChange={props.onStudioPromptChange}
            onApplyStudio={props.onApplyStudio}
            studioStyleFile={props.studioStyleFile}
            onStudioStyleFileChange={props.onStudioStyleFileChange}
            studioOutfitFiles={props.studioOutfitFiles}
            onStudioAddOutfitFile={props.onStudioAddOutfitFile}
            onStudioRemoveOutfitFile={props.onStudioRemoveOutfitFile}
            onGenerateCreativePrompt={props.onGenerateCreativePrompt}
            studioSubjects={props.studioSubjects}
            onStudioAddSubject={props.onStudioAddSubject}
            onStudioRemoveSubject={props.onStudioRemoveSubject}
            setActiveTab={props.setActiveTab}
            isMobile={props.isMobile}
            onToggleToolbox={props.onToggleToolbox}
        />;
      case 'generate':
        return <GeneratePanel
          isLoading={isLoading}
          prompt={props.generatePrompt}
          onPromptChange={props.onGeneratePromptChange}
          onGenerate={props.onGenerateImageFromText}
          aspectRatio={props.generateAspectRatio}
          onAspectRatioChange={props.onGenerateAspectRatioChange}
          numImages={props.generateNumImages}
          // FIX: Pass correct prop 'onGenerateNumImagesChange' to child component.
          onNumImagesChange={props.onGenerateNumImagesChange}
          setActiveTab={props.setActiveTab}
          isMobile={props.isMobile}
          onToggleToolbox={props.onToggleToolbox}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center p-2 lg:p-4 gap-3 ${className}`}>
      {/* Main editor toolbar for desktop/open mobile view */}
      {!isMobile && (
        <div className="w-full flex items-center justify-center p-1 bg-black/20 rounded-2xl border border-white/10 mb-3 sticky top-2 z-10">
            <div ref={tabsContainerRef} className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mb-1.5">
                {TABS_CONFIG.map(tab => {
                    const isTabDisabled = !isImageLoaded && !['studio', 'generate'].includes(tab.id);
                    const isActive = activeTab === tab.id && !isTabDisabled;
                    const label = isTabDisabled ? t('uploadImage') : t(tab.tooltip as any);
                    
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
                            title={label}
                            aria-label={label}
                        >
                            <tab.icon className="w-6 h-6" />
                        </button>
                    );
                })}
            </div>
        </div>
      )}
      
      {renderActivePanel()}

    </div>
  );
};

export default React.memo(EditorSidebar);