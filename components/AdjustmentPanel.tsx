
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

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
    PostureCorrectionIcon, HairRimLightIcon,
    LightningBoltIcon, FaceRestoreIcon, DocumentScannerIcon, StarburstIcon,
    CloudIcon, SnowflakeIcon, SunIcon, LeafIcon
} from './icons';

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

type EnhanceMode = 'oneClick' | 'portrait' | 'pose' | 'filter';

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
  const [mode, setMode] = useState<EnhanceMode>('oneClick');

  const handlePresetClick = (preset: AdjustmentPreset) => {
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

  const allModes = useMemo(() => ({
    oneClick: {
        presets: [
            { name: t('oneClickAutoEnhance'), prompt: t('oneClickAutoEnhancePrompt'), icon: SparklesIcon },
            { name: t('oneClickAIComposition'), prompt: t('oneClickAICompositionPrompt'), icon: ViewfinderCircleIcon },
            { name: t('oneClickRestoreModern'), prompt: t('oneClickRestoreModernPrompt'), icon: FaceRestoreIcon },
            { name: t('oneClickLumoFlash'), prompt: t('oneClickLumoFlashPrompt'), icon: LightningBoltIcon },
            { name: t('adjustmentUpscale8K'), prompt: t('adjustmentUpscale8KPrompt'), icon: UpscaleIcon },
            { name: t('oneClickAdPoster'), prompt: t('oneClickAdPosterPrompt'), icon: CameraIcon, multiple: true },
            { name: t('oneClickReconstructForPrint'), prompt: t('oneClickReconstructForPrintPrompt'), icon: DocumentScannerIcon },
        ]
    },
    portrait: {
        presets: [
            { name: t('adjustmentPortrait50mm'), prompt: t('adjustmentPortrait50mmPrompt'), icon: CameraIcon },
            { name: t('adjustmentPortrait85mm'), prompt: t('adjustmentPortrait85mmPrompt'), icon: CameraIcon },
            { name: t('adjustmentNaturalSmile'), prompt: t('adjustmentNaturalSmilePrompt'), icon: SmileIcon },
            { name: t('adjustmentSlimFace'), prompt: t('adjustmentSlimFacePrompt'), icon: FaceSlimIcon },
            { name: t('adjustmentOpenEyes'), prompt: t('adjustmentOpenEyesPrompt'), icon: EyeIcon },
            { name: t('oneClickHairRimLight'), prompt: t('oneClickHairRimLightPrompt'), icon: HairRimLightIcon },
            { name: t('oneClickBrighteningBathSilver'), prompt: t('oneClickBrighteningBathSilverPrompt'), icon: LightningBoltIcon },
            { name: t('oneClickBrighteningBathGold'), prompt: t('oneClickBrighteningBathGoldPrompt'), icon: LightningBoltIcon },
        ]
    },
    pose: {
        presets: [
            { name: t('poseNaturalWalk'), prompt: t('poseNaturalWalkPrompt'), icon: PostureCorrectionIcon },
            { name: t('poseLeaningBack'), prompt: t('poseLeaningBackPrompt'), icon: PostureCorrectionIcon },
            { name: t('poseLookOverShoulder'), prompt: t('poseLookOverShoulderPrompt'), icon: PostureCorrectionIcon },
            { name: t('poseCandidSitting'), prompt: t('poseCandidSittingPrompt'), icon: PostureCorrectionIcon },
            { name: t('poseHandsInPockets'), prompt: t('poseHandsInPocketsPrompt'), icon: PostureCorrectionIcon },
        ]
    },
    filter: {
        presets: [
            { name: t('oneClickStarFilter'), prompt: t('oneClickStarFilterPrompt'), icon: StarburstIcon, isFilter: true },
            { name: t('filterColorVibrant'), prompt: t('filterColorVibrantPrompt'), icon: PaletteIcon, isFilter: true },
            { name: t('filterColorGoldenSun'), prompt: t('filterColorGoldenSunPrompt'), icon: SunIcon, isFilter: true },
            { name: t('filterGoldenAutumn'), prompt: t('filterGoldenAutumnPrompt'), icon: LeafIcon, isFilter: true },
            { name: t('filterColorBlueSunset'), prompt: t('filterColorBlueSunsetPrompt'), icon: CloudIcon, isFilter: true },
            { name: t('oneClickFog'), prompt: t('oneClickFogPrompt'), icon: CloudIcon, isFilter: true },
            { name: t('oneClickSnow'), prompt: t('oneClickSnowPrompt'), icon: SnowflakeIcon, isFilter: true },
        ]
    }
  }), [t]);
  
  const currentModeData = allModes[mode];

  const titleContent = (
    <>
      <SparklesIcon className="w-6 h-6"/>
      <span>{t('enhanceTitle')}</span>
    </>
  );
  
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";

  const modeOptions = useMemo(() => [
    { value: 'oneClick' as EnhanceMode, label: t('oneClickTitle'), icon: SparklesIcon },
    { value: 'portrait' as EnhanceMode, label: t('adjustmentPortraitTitle'), icon: UserCircleIcon },
    { value: 'pose' as EnhanceMode, label: t('poseCorrectionTitle'), icon: UsersIcon },
    { value: 'filter' as EnhanceMode, label: t('filterTitle'), icon: PaletteIcon },
  ], [t]);
  

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('retouch')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
          title={t('tooltipRetouch')} disabled={isLoading}>
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
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
          title={t('tooltipStudio')} disabled={isLoading}>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 w-full animate-fade-in">
          {currentModeData.presets.map((preset) => (
              <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset)}
                  disabled={isLoading || !isImageLoaded}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-200 active:scale-95 disabled:opacity-50 text-center group"
              >
                  <preset.icon className="w-8 h-8 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">{preset.name}</span>
              </button>
          ))}
      </div>
      
    </div>
  );
};

export default AdjustmentPanel;
