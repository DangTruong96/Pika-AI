/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { BrushIcon, CropIcon, AdjustmentsIcon, MagicWandIcon, ExpandIcon, PlusCircleIcon, DocumentScannerIcon } from './icons';
import type { Tab } from '../App';
import RetouchPanel, { SelectionMode, BrushMode } from './RetouchPanel';
import CropPanel from './CropPanel';
import AdjustmentPanel from './AdjustmentPanel';
import FilterPanel from './FilterPanel';
import ExpandPanel from './ExpandPanel';
import CompositePanel from './CompositePanel';
import ScanPanel from './ScanPanel';
import ManualScanPanel from './ManualScanPanel';
import type { Enhancement } from '../services/geminiService';

interface EditorSidebarProps {
  className?: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onApplyRetouch: () => void;
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isCropping: boolean;
  onApplyAdjustment: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyExpansion: (aspectRatio: number, prompt: string) => void;
  onApplyInsert: () => void;
  insertSubjectFiles: File[];
  onInsertSubjectFilesChange: (files: File[]) => void;
  insertStyleFiles: File[];
  onInsertStyleFilesChange: (files: File[]) => void;
  insertBackgroundFile: File | null;
  onInsertBackgroundFileChange: (file: File | null) => void;
  insertPrompt: string;
  onInsertPromptChange: (prompt: string) => void;
  onApplyScan: (enhancement: Enhancement, removeShadows: boolean) => void;
  onApplyManualScan: () => void;
  onEnterManualMode: () => boolean;
  onCancelManualMode: () => void;
  isMaskPresent: boolean;
  clearMask: () => void;
  retouchPrompt: string;
  onRetouchPromptChange: (prompt: string) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isHotspotSelected: boolean;
  isManualScanMode: boolean;
  setIsManualScanMode: (isManual: boolean) => void;
}

export const TABS_CONFIG = [
    { id: 'retouch', icon: BrushIcon, tooltip: 'tooltipRetouch' },
    { id: 'scan', icon: DocumentScannerIcon, tooltip: 'tooltipScan' },
    { id: 'insert', icon: PlusCircleIcon, tooltip: 'tooltipInsert' },
    { id: 'crop', icon: CropIcon, tooltip: 'tooltipCrop' },
    { id: 'adjust', icon: AdjustmentsIcon, tooltip: 'tooltipAdjust' },
    { id: 'filters', icon: MagicWandIcon, tooltip: 'tooltipFilters' },
    { id: 'expand', icon: ExpandIcon, tooltip: 'tooltipExpand' },
];

const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
  const { t } = useTranslation();
  const { 
      activeTab, setActiveTab, selectionMode, setSelectionMode, brushMode, 
      setBrushMode, brushSize, setBrushSize, isManualScanMode, setIsManualScanMode
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
                />;
      case 'crop':
        return <CropPanel onApplyCrop={props.onApplyCrop} onSetAspect={props.onSetAspect} isLoading={props.isLoading} isCropping={props.isCropping} isImageLoaded={props.isImageLoaded} />;
      case 'adjust':
        return <AdjustmentPanel onApplyAdjustment={props.onApplyAdjustment} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      case 'filters':
        return <FilterPanel onApplyFilter={props.onApplyFilter} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      case 'expand':
        return <ExpandPanel onApplyExpansion={props.onApplyExpansion} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      case 'insert':
        return <CompositePanel 
                    onApplyInsert={props.onApplyInsert} 
                    isLoading={props.isLoading}
                    subjectFiles={props.insertSubjectFiles}
                    onSubjectFilesChange={props.onInsertSubjectFilesChange}
                    styleFiles={props.insertStyleFiles}
                    onStyleFilesChange={props.onInsertStyleFilesChange}
                    backgroundFile={props.insertBackgroundFile}
                    onBackgroundFileChange={props.onInsertBackgroundFileChange}
                    prompt={props.insertPrompt}
                    onPromptChange={props.onInsertPromptChange}
                />;
      case 'scan':
        return isManualScanMode
          ? <ManualScanPanel onApply={props.onApplyManualScan} onCancel={() => { setIsManualScanMode(false); props.onCancelManualMode(); }} isLoading={props.isLoading} />
          : <ScanPanel onApplyScan={(...args) => { props.onApplyScan(...args); setIsManualScanMode(false); }} isLoading={props.isLoading} isImageLoaded={props.isImageLoaded} />;
      default:
        return null;
    }
  };

  return (
    <div id="editor-toolbox" className={`w-full flex flex-col gap-4 ${props.className ?? ''}`}>
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-1.5 md:p-2 flex items-center justify-start md:justify-center gap-1 backdrop-blur-xl overflow-x-auto md:overflow-x-visible md:flex-wrap">
            {TABS_CONFIG.map(tab => (
                <div key={tab.id} className="relative group flex-1 min-w-[70px] md:min-w-0 md:flex-1">
                    <button
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`relative p-3 w-full flex items-center justify-center rounded-xl transition-all duration-200 ${
                           activeTab === tab.id 
                           ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-400/25' 
                           : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
                        }`}
                        title={t(tab.tooltip as any)}
                        disabled={props.isLoading || (!props.isImageLoaded && tab.id !== 'insert')}
                    >
                        <tab.icon className="w-6 h-6 md:w-7 md:h-7" />
                    </button>
                </div>
            ))}
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
