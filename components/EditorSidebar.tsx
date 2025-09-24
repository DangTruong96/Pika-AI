

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
// Fix: Removed unused AdjustmentsIcon import.
import { BrushIcon, IdCardIcon, ExpandIcon, SparklesIcon, UsersIcon, XMarkIcon, UploadIcon, EyeIcon } from './icons';
import type { Tab, Gender } from '../hooks/usePika';
import RetouchPanel, { SelectionMode, BrushMode } from './RetouchPanel';
import IdPhotoPanel from './IdPhotoPanel';
import AdjustmentPanel from './AdjustmentPanel';
import ExpandPanel from './ExpandPanel';
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
  retouchPromptInputRef: React.RefObject<HTMLInputElement>;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
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
  studioStyleInfluence: number;
  onStudioStyleInfluenceChange: (value: number) => void;
  studioOutfitFiles: File[];
  onStudioAddOutfitFile: (file: File) => void;
  onStudioRemoveOutfitFile: (index: number) => void;
  studioSubjects: File[];
  onStudioAddSubject: (file: File) => void;
  onStudioRemoveSubject: (index: number) => void;
  expandActiveAspect: number | null;
  onGenerateCreativePrompt: () => void;
  onViewExtractedItem: (setIndex: number, itemIndex: number) => void;
}

export const TABS_CONFIG = [
    { id: 'retouch', icon: BrushIcon, tooltip: 'tooltipRetouch' },
    { id: 'adjust', icon: SparklesIcon, tooltip: 'tooltipAdjust' },
    { id: 'studio', icon: UsersIcon, tooltip: 'tooltipStudio' },
    { id: 'idphoto', icon: IdCardIcon, tooltip: 'tooltipIdPhoto' },
    { id: 'expand', icon: ExpandIcon, tooltip: 'tooltipExpand' },
];

const StudioPanel: React.FC<Pick<EditorSidebarProps, 'isLoading' | 'isImageLoaded' | 'studioPrompt' | 'onStudioPromptChange' | 'onApplyStudio' | 'studioStyleFile' | 'onStudioStyleFileChange' | 'studioStyleInfluence' | 'onStudioStyleInfluenceChange' | 'onGenerateCreativePrompt' | 'studioSubjects' | 'onStudioAddSubject' | 'onStudioRemoveSubject' | 'currentImage' | 'studioOutfitFiles' | 'onStudioAddOutfitFile' | 'onStudioRemoveOutfitFile'>> = React.memo(
({ isLoading, isImageLoaded, studioPrompt, onStudioPromptChange, onApplyStudio, studioStyleFile, onStudioStyleFileChange, studioStyleInfluence, onStudioStyleInfluenceChange, onGenerateCreativePrompt, studioSubjects, onStudioAddSubject, onStudioRemoveSubject, currentImage, studioOutfitFiles, onStudioAddOutfitFile, onStudioRemoveOutfitFile }) => {
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApplyStudio();
    };

    const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStudioStyleFileChange(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleOutfitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStudioAddOutfitFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleSubjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && isImageLoaded) {
            onStudioAddSubject(e.target.files[0]);
        }
        e.target.value = '';
    };

    const Preview: React.FC<{ file: File }> = ({ file }) => {
        const [url, setUrl] = useState<string | null>(null);
        useEffect(() => {
            const objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }, [file]);

        if (!url) return null;
        return <img src={url} alt="Preview" className="w-full h-full object-cover" />;
    };
    
    const allSubjects = currentImage ? [currentImage, ...studioSubjects] : [];

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('studioTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('studioDescription')}</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
                
                 <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('studioSubjectsCount', { count: allSubjects.length, max: 7 })}</span>
                    <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {allSubjects.map((subject, index) => (
                            <div key={index} className="relative w-16 h-16 rounded-lg flex-shrink-0 bg-black/20 overflow-hidden border border-white/10">
                                <Preview file={subject} />
                                {index > 0 && !isLoading && (
                                <button
                                    type="button"
                                    onClick={() => onStudioRemoveSubject(index - 1)}
                                    className="absolute -top-1 -right-1 p-0.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                                    title={t('remove')}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                                )}
                            </div>
                        ))}
                        {isImageLoaded && allSubjects.length < 7 && (
                            <label htmlFor="studio-subject-file-input" className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500 flex items-center justify-center cursor-pointer transition-colors" title={t('studioAddSubject')}>
                                <UploadIcon className="w-6 h-6 text-gray-400" />
                            </label>
                        )}
                        <input id="studio-subject-file-input" type="file" className="hidden" accept="image/*" onChange={handleSubjectFileChange} disabled={isLoading || !isImageLoaded || allSubjects.length >= 7} />
                    </div>
                </div>

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
                        onClick={onGenerateCreativePrompt}
                        disabled={isLoading || !isImageLoaded}
                        className="p-4 bg-white/5 rounded-lg text-cyan-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('suggestionTitle')}
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full flex items-start justify-center gap-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {/* Fix: Corrected the translation key from 'insertStyle' to 'studioStyle' to resolve a TypeScript error. */}
                        <span className="text-sm font-semibold text-gray-300">{t('studioStyle')}</span>
                        <div className="flex items-center justify-center gap-2">
                             <label htmlFor="studio-style-file-input" className={`relative w-24 h-24 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-black/20 ${studioStyleFile ? 'border-cyan-500' : 'border-dashed border-white/20 hover:border-cyan-500'}`}>
                                {studioStyleFile ? (
                                    <>
                                        <Preview file={studioStyleFile} />
                                        <button type="button" onClick={(e) => { e.preventDefault(); onStudioStyleFileChange(null); }} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-red-500"><XMarkIcon className="w-4 h-4"/></button>
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
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-sm font-semibold text-gray-300">{t('studioObjects')}</span>
                        <div className="w-full flex flex-wrap items-center justify-center gap-2 p-1 min-h-[6rem]">
                            {studioOutfitFiles.map((file, index) => (
                                <div key={index} className="relative w-20 h-20 rounded-lg flex-shrink-0 bg-black/20 overflow-hidden border border-cyan-500">
                                    <Preview file={file} />
                                    {!isLoading && (
                                        <button
                                            type="button"
                                            onClick={() => onStudioRemoveOutfitFile(index)}
                                            className="absolute -top-1 -right-1 p-0.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                                            title={t('remove')}
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isImageLoaded && studioOutfitFiles.length < 3 && (
                                <label htmlFor="studio-outfit-file-input" className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500 flex items-center justify-center cursor-pointer transition-colors">
                                    <UploadIcon className="w-8 h-8 text-gray-400" />
                                </label>
                            )}
                        </div>
                        <input id="studio-outfit-file-input" type="file" className="hidden" accept="image/*" onChange={handleOutfitFileChange} disabled={isLoading || !isImageLoaded || studioOutfitFiles.length >= 3} />
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
});

const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { className, isImageLoaded, isLoading, activeTab, setActiveTab } = props;
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
          onUseExtractedAsOutfit={props.onUseExtractedAsOutfit}
          onDownloadExtractedItem={props.onDownloadExtractedItem}
          onClearExtractHistory={props.onClearExtractHistory}
          onViewExtractedItem={props.onViewExtractedItem}
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
            studioStyleInfluence={props.studioStyleInfluence}
            onStudioStyleInfluenceChange={props.onStudioStyleInfluenceChange}
            studioOutfitFiles={props.studioOutfitFiles}
            onStudioAddOutfitFile={props.onStudioAddOutfitFile}
            onStudioRemoveOutfitFile={props.onStudioRemoveOutfitFile}
            onGenerateCreativePrompt={props.onGenerateCreativePrompt}
            studioSubjects={props.studioSubjects}
            onStudioAddSubject={props.onStudioAddSubject}
            onStudioRemoveSubject={props.onStudioRemoveSubject}
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
                  const isTabDisabled = !isImageLoaded && !['studio'].includes(tab.id);
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
      
      {renderActivePanel()}

    </div>
  );
};

export default React.memo(EditorSidebar);