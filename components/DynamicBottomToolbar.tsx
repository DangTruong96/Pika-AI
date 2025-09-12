/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Tab } from '../App';
import { 
    BrushIcon, SparklesIcon, ExpandIcon, PlusCircleIcon, DocumentScannerIcon, IdCardIcon, UsersIcon, PencilIcon, TrashIcon, 
    FaceRestoreIcon, SunIcon, MagicWandIcon 
} from './icons';
import { SelectionMode, BrushMode } from './RetouchPanel';
import { TABS_CONFIG } from './EditorSidebar';
import type { Enhancement } from '../services/geminiService';


interface DynamicBottomToolbarProps {
    activeTab: Tab;
    onShowFullEditor: () => void;
    isLoading: boolean;
    
    // Swipe Handlers
    handleToolsTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
    handleToolsTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
    handleToolsTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
    
    // Retouch
    selectionMode: SelectionMode;
    brushMode: BrushMode;
    onBrushModeChange: (mode: BrushMode) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    onClearMask: () => void;
    isMaskPresent: boolean;

    // Adjust
    onApplyAdjustment: (prompt: string) => void;
    
    // Expand
    onSetAspectExpansion: (aspect: number | null) => void;

    // Scan
    onApplyScan: (enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean) => void;
    onEnterManualMode: () => void;
}

// A generic "Open Editor" panel for complex tabs
const OpenEditorPanel: React.FC<{
    icon: React.FC<{className?: string}>,
    label: string,
    onOpen: () => void,
    isLoading: boolean,
}> = ({ icon: Icon, label, onOpen, isLoading }) => (
    <div className="flex items-center justify-between w-full h-full px-2">
        <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-cyan-300" />
            <span className="text-sm font-semibold text-gray-200">{label}</span>
        </div>
        <button
            onClick={onOpen}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/10 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
            <PencilIcon className="w-5 h-5"/>
            <span>Edit</span>
        </button>
    </div>
);

const RetouchControls: React.FC<Pick<DynamicBottomToolbarProps, 'selectionMode' | 'brushMode' | 'onBrushModeChange' | 'brushSize' | 'onBrushSizeChange' | 'onClearMask' | 'isMaskPresent' | 'onShowFullEditor' | 'isLoading'>> = 
({ selectionMode, brushMode, onBrushModeChange, brushSize, onBrushSizeChange, onClearMask, isMaskPresent, onShowFullEditor, isLoading }) => {
    const { t } = useTranslation();
    
    if (selectionMode !== 'brush') {
        // Point mode uses MobileInputBar, Extract has its own panel logic
        return <OpenEditorPanel icon={BrushIcon} label={t('tabRetouch')} onOpen={onShowFullEditor} isLoading={isLoading} />;
    }

    return (
        <div className="flex items-center gap-2 w-full h-full px-2">
            <div className="flex flex-col items-center w-14 flex-shrink-0">
                <BrushIcon className="w-5 h-5 text-cyan-300" />
                <span className="text-xs text-gray-300 mt-1">{t('tabRetouch')}</span>
            </div>
            
            <div className="flex-grow flex items-center gap-2">
                <div className="p-1 bg-black/30 rounded-lg flex gap-1">
                    <button onClick={() => onBrushModeChange('draw')} className={`px-2 py-1 rounded-md text-xs font-semibold ${brushMode === 'draw' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{t('retouchToolDraw')}</button>
                    <button onClick={() => onBrushModeChange('erase')} className={`px-2 py-1 rounded-md text-xs font-semibold ${brushMode === 'erase' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{t('retouchToolErase')}</button>
                </div>
                <input 
                    type="range" min="5" max="100" value={brushSize} onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    disabled={isLoading}
                />
                <button onClick={onClearMask} disabled={!isMaskPresent || isLoading} className="p-2 bg-white/10 rounded-lg text-white disabled:opacity-50"><TrashIcon className="w-5 h-5"/></button>
            </div>
            
            <button
                onClick={onShowFullEditor}
                disabled={isLoading}
                className="flex items-center gap-2 bg-cyan-500/20 text-cyan-300 font-semibold py-2 px-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 ml-2"
            >
                <PencilIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

const AdjustControls: React.FC<Pick<DynamicBottomToolbarProps, 'onApplyAdjustment' | 'onShowFullEditor' | 'isLoading'>> = ({ onApplyAdjustment, onShowFullEditor, isLoading }) => {
    const { t } = useTranslation();
    const oneClickActions = [
        { key: 'auto', label: t('oneClickAutoEnhance'), prompt: t('oneClickAutoEnhancePrompt'), icon: MagicWandIcon },
        { key: 'light', label: t('oneClickFixLighting'), prompt: t('oneClickFixLightingPrompt'), icon: SunIcon },
        { key: 'face', label: t('adjustmentFaceRestore'), prompt: t('adjustmentFaceRestorePrompt'), icon: FaceRestoreIcon },
    ];

    return (
         <div className="flex items-center gap-2 w-full h-full px-2">
            <div className="flex flex-col items-center w-14 flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-cyan-300" />
                <span className="text-xs text-gray-300 mt-1">{t('tabAdjust')}</span>
            </div>
            <div className="flex-grow grid grid-cols-3 gap-2">
                {oneClickActions.map(action => {
                    const Icon = action.icon;
                    return (
                        <button key={action.key} onClick={() => onApplyAdjustment(action.prompt)} disabled={isLoading} className="flex flex-col items-center justify-center gap-1 text-white bg-white/5 hover:bg-white/15 p-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 disabled:opacity-50 h-full">
                            <Icon className="w-5 h-5"/>
                            <span className="text-[10px] leading-tight text-center">{action.label}</span>
                        </button>
                    )
                })}
            </div>
            <button onClick={onShowFullEditor} disabled={isLoading} className="flex items-center gap-2 bg-white/10 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 ml-2">
                ...
            </button>
        </div>
    )
};

const ExpandControls: React.FC<Pick<DynamicBottomToolbarProps, 'onSetAspectExpansion' | 'onShowFullEditor' | 'isLoading'>> = ({ onSetAspectExpansion, onShowFullEditor, isLoading }) => {
    const { t } = useTranslation();
    const aspects = [
        { name: t('expandAspectFree'), value: null }, { name: '1:1', value: 1 / 1 },
        { name: '16:9', value: 16 / 9 }, { name: '4:3', value: 4 / 3 },
    ];
    return (
        <div className="flex items-center gap-2 w-full h-full px-2">
            <div className="flex flex-col items-center w-14 flex-shrink-0">
                <ExpandIcon className="w-5 h-5 text-cyan-300" />
                <span className="text-xs text-gray-300 mt-1">{t('tabExpand')}</span>
            </div>
            <div className="flex-grow flex items-center justify-center gap-2">
                {aspects.map(aspect => (
                    <button key={aspect.name} onClick={() => onSetAspectExpansion(aspect.value)} disabled={isLoading} className="flex-1 text-white bg-white/5 hover:bg-white/15 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 disabled:opacity-50">
                        {aspect.name}
                    </button>
                ))}
            </div>
            <button onClick={onShowFullEditor} disabled={isLoading} className="flex items-center gap-2 bg-cyan-500/20 text-cyan-300 font-semibold py-2 px-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 ml-2">
                <PencilIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

const ScanControls: React.FC<Pick<DynamicBottomToolbarProps, 'onApplyScan' | 'onEnterManualMode' | 'isLoading'>> = ({ onApplyScan, onEnterManualMode, isLoading }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-2 w-full h-full px-2">
            <div className="flex flex-col items-center w-14 flex-shrink-0">
                <DocumentScannerIcon className="w-5 h-5 text-cyan-300" />
                <span className="text-xs text-gray-300 mt-1">{t('tabScan')}</span>
            </div>
            <div className="flex-grow grid grid-cols-2 gap-2">
                <button onClick={onEnterManualMode} disabled={isLoading} className="text-white bg-white/5 hover:bg-white/15 p-2 rounded-lg text-sm font-semibold transition-colors duration-200 disabled:opacity-50">
                    {t('scanManual')}
                </button>
                 <button onClick={() => onApplyScan('color', true, false, false)} disabled={isLoading} className="text-white bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg text-sm font-semibold transition-colors duration-200 disabled:opacity-50">
                    {t('scanAuto')}
                </button>
            </div>
        </div>
    );
}

const DynamicBottomToolbar: React.FC<DynamicBottomToolbarProps> = (props) => {
  const { 
    activeTab, 
    onShowFullEditor, 
    isLoading,
    handleToolsTouchStart,
    handleToolsTouchMove,
    handleToolsTouchEnd,
  } = props;
  const { t } = useTranslation();

  const renderControls = () => {
    switch(activeTab) {
        case 'retouch':
            return <RetouchControls {...props} />;
        case 'adjust':
            return <AdjustControls {...props} />;
        case 'expand':
            return <ExpandControls {...props} />;
        case 'scan':
            return <ScanControls {...props} />;
        case 'insert':
            return <OpenEditorPanel icon={PlusCircleIcon} label={t('tabInsert')} onOpen={onShowFullEditor} isLoading={isLoading} />;
        case 'idphoto':
            return <OpenEditorPanel icon={IdCardIcon} label={t('tabIdPhoto')} onOpen={onShowFullEditor} isLoading={isLoading} />;
        case 'studio':
            return <OpenEditorPanel icon={UsersIcon} label={t('tabStudio')} onOpen={onShowFullEditor} isLoading={isLoading} />;
        default:
            return null;
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] animate-slide-up z-40 h-[84px]"
      onTouchStart={handleToolsTouchStart}
      onTouchMove={handleToolsTouchMove}
      onTouchEnd={handleToolsTouchEnd}
    >
        <div key={activeTab} className="animate-slide-in-bottom w-full h-full">
            {renderControls()}
        </div>
    </div>
  );
};

export default DynamicBottomToolbar;