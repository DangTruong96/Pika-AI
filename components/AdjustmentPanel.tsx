/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Corrected invalid import syntax for React hooks.
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import type { Tab } from '../types';
import { SegmentedControl } from './IdPhotoPanel';
import { 
    UserCircleIcon,
    SmileIcon, EyeIcon, UpscaleIcon, SparklesIcon, PaletteIcon,
    BrushIcon, UsersIcon,
    FaceSlimIcon,
    CameraIcon, ViewfinderCircleIcon,
    PostureCorrectionIcon, RedoIcon, UndoIcon, HairRimLightIcon,
    LightningBoltIcon, FaceRestoreIcon, DocumentScannerIcon, ArrowPathIcon, StarburstIcon
} from './icons';
import type { TranslationKey } from '../translations';

interface EnhancePanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyMultipleAdjustments: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

type EnhanceMode = 'oneClick' | 'portrait' | 'pose' | 'color';

// Fix: Changed icon type to React.FC to allow passing props like className.
type AdjustmentPreset = {
  name: string;
  prompt?: string;
  action?: () => void;
  icon: React.FC<{ className?: string }>;
  multiple?: boolean;
  isFilter?: boolean;
};

const AdjustmentPanel: React.FC<EnhancePanelProps> = ({ onApplyAdjustment, onApplyFilter, onApplyMultipleAdjustments, isLoading, isImageLoaded, setActiveTab, onToggleToolbox, isMobile }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<EnhanceMode>('oneClick');
  
  const handleApplyCustom = () => {
    if (customPrompt) {
        onApplyAdjustment(customPrompt);
        setCustomPrompt('');
    }
  };

  const handlePresetClick = (preset: AdjustmentPreset) => {
    setCustomPrompt('');
    if (preset.action) {
      preset.action();
    } else if (preset.prompt) {
      if (preset.isFilter) {
        onApplyFilter(preset.prompt);
      } else if (preset.multiple) {
        onApplyMultipleAdjustments(preset.prompt);
      } else {
        onApplyAdjustment(preset.prompt);
      }
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };

  // Fix: Explicitly typed the presets to match `AdjustmentPreset[]` to resolve the error on `preset.multiple`.
  const oneClickFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('oneClickAutoEnhance'), prompt: t('oneClickAutoEnhancePrompt'), icon: SparklesIcon },
      { name: t('oneClickRestoreModern'), prompt: t('oneClickRestoreModernPrompt'), icon: FaceRestoreIcon },
      { name: t('adjustmentUpscale8K'), prompt: t('adjustmentUpscale8KPrompt'), icon: UpscaleIcon },
      { name: t('oneClickReconstructForPrint'), prompt: t('oneClickReconstructForPrintPrompt'), icon: DocumentScannerIcon },
      { name: t('oneClickHairRimLight'), prompt: t('oneClickHairRimLightPrompt'), icon: HairRimLightIcon },
      { name: t('oneClickLumoFlash'), prompt: t('oneClickLumoFlashPrompt'), icon: LightningBoltIcon },
      { name: t('oneClickStarFilter'), prompt: t('oneClickStarFilterPrompt'), icon: StarburstIcon },
    ]
  };

  const portraitFixes: { presets: AdjustmentPreset[] } = {
      presets: [
          { name: t('adjustmentPortrait50mm'), prompt: t('adjustmentPortrait50mmPrompt'), icon: CameraIcon },
          { name: t('adjustmentPortrait85mm'), prompt: t('adjustmentPortrait85mmPrompt'), icon: ViewfinderCircleIcon },
          { name: t('adjustmentNaturalSmile'), prompt: t('adjustmentNaturalSmilePrompt'), icon: SmileIcon },
          { name: t('adjustmentSlimFace'), prompt: t('adjustmentSlimFacePrompt'), icon: FaceSlimIcon },
          { name: t('adjustmentSlimChinAndNeck'), prompt: t('adjustmentSlimChinAndNeckPrompt'), icon: PostureCorrectionIcon },
          { name: t('adjustmentOpenEyes'), prompt: t('adjustmentOpenEyesPrompt'), icon: EyeIcon },
      ]
  };

  const poseFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('poseNaturalWalk'), prompt: t('poseNaturalWalkPrompt'), icon: RedoIcon },
      { name: t('poseLeaningBack'), prompt: t('poseLeaningBackPrompt'), icon: UndoIcon },
      { name: t('poseLookOverShoulder'), prompt: t('poseLookOverShoulderPrompt'), icon: ArrowPathIcon },
      { name: t('poseCandidSitting'), prompt: t('poseCandidSittingPrompt'), icon: CameraIcon },
      { name: t('poseHandsInPockets'), prompt: t('poseHandsInPocketsPrompt'), icon: UserCircleIcon },
    ]
  };

  const colorFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('filterColorVibrant'), prompt: t('filterColorVibrantPrompt'), icon: PaletteIcon, isFilter: true },
      { name: t('filterColorGoldenSun'), prompt: t('filterColorGoldenSunPrompt'), icon: PaletteIcon, isFilter: true },
      { name: t('filterColorBlueSunset'), prompt: t('filterColorBlueSunsetPrompt'), icon: PaletteIcon, isFilter: true },
    ]
  };

  const modeOptions = useMemo(() => [
    { value: 'oneClick' as EnhanceMode, label: t('oneClickTitle'), icon: SparklesIcon },
    { value: 'portrait' as EnhanceMode, label: t('adjustmentPortraitTitle'), icon: UserCircleIcon },
    { value: 'pose' as EnhanceMode, label: t('poseCorrectionTitle'), icon: PostureCorrectionIcon },
    { value: 'color' as EnhanceMode, label: t('filterSectionColor'), icon: PaletteIcon },
  ], [t]);

  const renderPresets = (presets: AdjustmentPreset[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-fade-in">
      {presets.map(preset => (
          <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading || !isImageLoaded}
              className="w-full h-20 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-transparent text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/10 active:scale-95 text-[11px] leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
              title={preset.name}
          >
              <preset.icon className='w-6 h-6 text-gray-300' />
              <span className="leading-tight">{preset.name}</span>
          </button>
      ))}
    </div>
  );
  
  const titleContent = (
    <>
        <SparklesIcon className="w-6 h-6" />
        <span>{t('enhanceTitle')}</span>
    </>
  );
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('retouch')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipRetouch')}
          disabled={isLoading}
          aria-label={t('tooltipRetouch')}
        >
          <BrushIcon className="w-6 h-6" />
        </button>
        
        {isMobile ? (
            <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
                {titleContent}
            </button>
        ) : (
            <h3 className={commonTitleClasses}>
                {titleContent}
            </h3>
        )}

        <button 
          onClick={() => setActiveTab('studio')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipStudio')}
          disabled={isLoading}
          aria-label={t('tooltipStudio')}
        >
          <UsersIcon className="w-6 h-6" />
        </button>
      </div>
      
      <SegmentedControl
        options={modeOptions}
        selected={mode}
        onSelect={(value) => setMode(value)}
        disabled={isLoading || !isImageLoaded}
        fullWidth
      />
      
      <div className="w-full">
          {mode === 'oneClick' && renderPresets(oneClickFixes.presets)}
          {mode === 'portrait' && renderPresets(portraitFixes.presets)}
          {mode === 'pose' && renderPresets(poseFixes.presets)}
          {mode === 'color' && renderPresets(colorFixes.presets)}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">{t('orSeparator')}</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApplyCustom(); }} className="w-full flex items-center gap-2">
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t('adjustmentPlaceholder')}
          className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
          disabled={isLoading || !isImageLoaded}
          onFocus={handleInputFocus}
          rows={2}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
          disabled={isLoading || !customPrompt.trim() || !isImageLoaded}
        >
          {t('applyAdjustment')}
        </button>
      </form>
    </div>
  );
};

export default React.memo(AdjustmentPanel);