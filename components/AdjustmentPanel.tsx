

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Corrected invalid import syntax for React hooks.
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
// Fix: Imported the missing `EyeSlashIcon` component to resolve a compilation error.
import { 
    MagicWandIcon, UserCircleIcon, CloudIcon, PhotoIcon, ArrowPathIcon, ChevronUpIcon,
    BlurBackgroundIcon, SharpenIcon, TemperatureIcon, SpotlightIcon, 
    SmileIcon, EyeIcon, SunIcon, MoonIcon, RemoveBgIcon, UpscaleIcon, SparklesIcon, PaletteIcon,
    BlemishRemovalIcon, MakeupIcon, FaceSlimIcon, PostureCorrectionIcon, AdjustmentsIcon, StopCircleIcon, DropletIcon, CircleHalfStrokeIcon, EyeSlashIcon,
    FilmIcon, PaintBrushIcon, SwatchIcon, CpuChipIcon, CameraIcon, WrenchScrewdriverIcon, ViewfinderCircleIcon, Squares2x2Icon, PencilIcon
} from './icons';
import type { TranslationKey } from '../translations';

interface EnhancePanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyFilter: (prompt: string) => void;
  onApplyMultipleAdjustments: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

type EnhanceMode = 'oneClick' | 'portrait' | 'color' | 'filters';

// Fix: Changed icon type to React.FC to allow passing props like className.
type AdjustmentPreset = {
  name: string;
  prompt?: string;
  action?: () => void;
  icon: React.FC<{ className?: string }>;
  multiple?: boolean;
};

const AdjustmentPanel: React.FC<EnhancePanelProps> = ({ onApplyAdjustment, onApplyFilter, onApplyMultipleAdjustments, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<EnhanceMode>('oneClick');
  const [filterCategory, setFilterCategory] = useState<string>('camera');
  
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
      if (preset.multiple) {
        onApplyMultipleAdjustments(preset.prompt);
      } else {
        onApplyAdjustment(preset.prompt);
      }
    }
  };

  // Fix: Explicitly typed the presets to match `AdjustmentPreset[]` to resolve the error on `preset.multiple`.
  const oneClickFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('oneClickAutoEnhance'), prompt: t('oneClickAutoEnhancePrompt'), icon: SparklesIcon },
      { name: t('oneClickRestoreModern'), prompt: t('oneClickRestoreModernPrompt'), icon: SparklesIcon },
      { name: t('oneClickReconstructForPrint'), prompt: t('oneClickReconstructForPrintPrompt'), icon: ViewfinderCircleIcon },
      { name: t('adjustmentUpscale8K'), prompt: t('adjustmentUpscale8KPrompt'), icon: UpscaleIcon },
      { name: t('oneClickBoostColor'), prompt: t('oneClickBoostColorPrompt'), icon: PaletteIcon },
      { name: t('oneClickFixLighting'), prompt: t('oneClickFixLightingPrompt'), icon: SunIcon },
    ]
  };

  const portraitFixes: { presets: AdjustmentPreset[] } = {
      presets: [
          { name: t('adjustmentPortraitPreset1'), prompt: t('adjustmentPortraitSmoothSkinPrompt'), icon: BlemishRemovalIcon },
          { name: t('adjustmentNaturalSmile'), prompt: t('adjustmentNaturalSmilePrompt'), icon: SmileIcon },
          { name: t('adjustmentSlimChinAndNeck'), prompt: t('adjustmentSlimChinAndNeckPrompt'), icon: FaceSlimIcon },
          { name: t('adjustmentOpenEyes'), prompt: t('adjustmentOpenEyesPrompt'), icon: EyeIcon },
          { name: t('adjustmentWhitenTeeth'), prompt: t('adjustmentWhitenTeethPrompt'), icon: SparklesIcon },
          { name: t('adjustmentPreset1'), prompt: t('adjustmentPortraitBlurBgPrompt'), icon: BlurBackgroundIcon },
          { name: t('adjustmentRemoveBg'), prompt: t('adjustmentRemoveBgPrompt'), icon: RemoveBgIcon },
      ]
  };

  const colorFixes: { presets: AdjustmentPreset[] } = {
    presets: [
      { name: t('filterColorCinematic'), prompt: t('filterColorCinematicPrompt'), icon: FilmIcon },
      { name: t('filterColorVibrant'), prompt: t('filterColorVibrantPrompt'), icon: PaletteIcon },
      { name: t('filterColorGolden'), prompt: t('filterColorGoldenPrompt'), icon: SunIcon },
      { name: t('filterColorMoody'), prompt: t('filterColorMoodyPrompt'), icon: MoonIcon },
    ]
  };

  const filterPresets = [
    { id: 'camera', title: t('filterSectionCamera'), icon: CameraIcon, presets: [
        { name: t('filterCameraFuji'), prompt: t('filterCameraFujiPrompt'), icon: SwatchIcon },
        { name: t('filterCameraKodak'), prompt: t('filterCameraKodakPrompt'), icon: SunIcon },
        { name: t('filterCameraLeica'), prompt: t('filterCameraLeicaPrompt'), icon: CircleHalfStrokeIcon },
        { name: t('filterCameraCanon'), prompt: t('filterCameraCanonPrompt'), icon: UserCircleIcon },
    ]},
    { id: 'film', title: t('filterSectionFilm'), icon: FilmIcon, presets: [
        { name: t('filterFilmVintage'), prompt: t('filterFilmVintagePrompt'), icon: PhotoIcon },
        { name: t('filterFilmBW'), prompt: t('filterFilmBWPrompt'), icon: CircleHalfStrokeIcon },
        { name: t('filterFilmSepia'), prompt: t('filterFilmSepiaPrompt'), icon: SwatchIcon },
        { name: t('filterFilmPolaroid'), prompt: t('filterFilmPolaroidPrompt'), icon: CloudIcon },
    ]},
    { id: 'artistic', title: t('filterSectionArtistic'), icon: PaintBrushIcon, presets: [
        { name: t('filterArtisticOil'), prompt: t('filterArtisticOilPrompt'), icon: PaintBrushIcon },
        { name: t('filterArtisticWatercolor'), prompt: t('filterArtisticWatercolorPrompt'), icon: DropletIcon },
        { name: t('filterArtisticSketch'), prompt: t('filterArtisticSketchPrompt'), icon: PencilIcon },
        { name: t('filterArtisticPopArt'), prompt: t('filterArtisticPopArtPrompt'), icon: SparklesIcon },
    ]},
    { id: 'digital', title: t('filterSectionDigital'), icon: CpuChipIcon, presets: [
        { name: t('filterDigitalSynthwave'), prompt: t('filterDigitalSynthwavePrompt'), icon: ViewfinderCircleIcon },
        { name: t('filterDigitalGlitch'), prompt: t('filterDigitalGlitchPrompt'), icon: WrenchScrewdriverIcon },
        { name: t('filterDigitalDuotone'), prompt: t('filterDigitalDuotonePrompt'), icon: CircleHalfStrokeIcon },
        { name: t('filterDigitalPixel'), prompt: t('filterDigitalPixelPrompt'), icon: Squares2x2Icon },
    ]}
  ];


  const renderPresets = (presets: AdjustmentPreset[]) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 animate-fade-in">
      {presets.map(preset => (
          <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading || !isImageLoaded}
              className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title={preset.name}
          >
              <preset.icon className='w-7 h-7 text-gray-300' />
              <span className="leading-tight">{preset.name}</span>
          </button>
      ))}
    </div>
  );

  const renderFilterPresets = () => {
    const currentSection = filterPresets.find(sec => sec.id === filterCategory);
    if (!currentSection) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 animate-fade-in">
        {currentSection.presets.map(preset => (
            <button
                key={preset.name}
                onClick={() => onApplyFilter(preset.prompt)}
                disabled={isLoading || !isImageLoaded}
                className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title={preset.name}
            >
                <preset.icon className='w-7 h-7 text-gray-300' />
                <span className="leading-tight">{preset.name}</span>
            </button>
        ))}
      </div>
    );
  };
  
  const renderModeButtons = () => (
      <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
          <button onClick={() => setMode('oneClick')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'oneClick' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}><SparklesIcon className="w-5 h-5"/>{t('oneClickTitle')}</button>
          <button onClick={() => setMode('portrait')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'portrait' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}><UserCircleIcon className="w-5 h-5"/>{t('adjustmentPortraitTitle')}</button>
          <button onClick={() => setMode('color')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'color' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}><PaletteIcon className="w-5 h-5"/>{t('filterSectionColor')}</button>
          <button onClick={() => setMode('filters')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'filters' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}><CameraIcon className="w-5 h-5"/>{t('filterTitle')}</button>
      </div>
  );

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('enhanceTitle')}</h3>
      
      {renderModeButtons()}
      
      <div className="w-full">
          {mode === 'oneClick' && renderPresets(oneClickFixes.presets)}
          {mode === 'portrait' && renderPresets(portraitFixes.presets)}
          {mode === 'color' && renderPresets(colorFixes.presets)}
          {mode === 'filters' && (
              <div className="w-full flex flex-col gap-3">
                  <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
                      {filterPresets.map(btn => (
                          <button key={btn.id} onClick={() => setFilterCategory(btn.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${filterCategory === btn.id ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`} title={btn.title}>
                              <btn.icon className='w-5 h-5' />
                          </button>
                      ))}
                  </div>
                  {renderFilterPresets()}
              </div>
          )}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-gray-400 uppercase text-xs">{t('orSeparator')}</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApplyCustom(); }} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t('adjustmentPlaceholder')}
          className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
          disabled={isLoading || !customPrompt.trim() || !isImageLoaded}
        >
          {t('applyAdjustment')}
        </button>
      </form>
    </div>
  );
};

export default React.memo(AdjustmentPanel);