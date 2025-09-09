/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
    FilmIcon, PaintBrushIcon, SwatchIcon, CpuChipIcon, 
    CameraIcon, CircleHalfStrokeIcon, DropletIcon, PencilIcon, 
    SparklesIcon, SunIcon, StopCircleIcon, Squares2x2Icon, WrenchScrewdriverIcon,
    ViewfinderCircleIcon, PhotoIcon, CloudIcon, UserCircleIcon
} from './icons';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading, isImageLoaded }) => {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<string>('camera');

  const allSections = [
    {
      id: 'camera',
      title: t('filterSectionCamera'),
      icon: <CameraIcon />,
      presets: [
        { name: t('filterCameraFuji'), prompt: "Apply a color grade that emulates the look of a classic Fujifilm camera. Focus on producing rich, deep greens, cinematic blues, and pleasing, natural skin tones, reminiscent of Fujifilm's film simulations.", icon: <SwatchIcon /> },
        { name: t('filterCameraKodak'), prompt: "Apply a color grade that emulates the warm, vibrant, and slightly saturated look of Kodak film stocks like Portra or Kodachrome. Emphasize rich reds and yellows for a nostalgic, timeless feel.", icon: <SunIcon /> },
        { name: t('filterCameraLeica'), prompt: "Apply a color grade that emulates the signature Leica look. Focus on creating deep contrast, rich blacks, and natural, true-to-life colors with a subtle, three-dimensional pop.", icon: <CircleHalfStrokeIcon /> },
        { name: t('filterCameraCanon'), prompt: "Apply a color grade that emulates the look of a Canon DSLR. Produce bright, clean colors with a focus on accurate and flattering skin tones, characteristic of Canon's color science.", icon: <UserCircleIcon /> },
      ]
    },
    {
      id: 'film',
      title: t('filterSectionFilm'),
      icon: <FilmIcon />,
      presets: [
        { name: t('filterFilmVintage'), prompt: 'Apply a vintage film look, with slightly faded colors, soft contrast, and a subtle warm tone.', icon: <CameraIcon /> },
        { name: t('filterFilmBW'), prompt: 'Convert the image to a high-contrast, dramatic black and white.', icon: <CircleHalfStrokeIcon /> },
        { name: t('filterFilmSepia'), prompt: 'Apply a classic sepia tone for a nostalgic, old-fashioned look.', icon: <SwatchIcon /> },
        { name: t('filterFilmPolaroid'), prompt: 'Simulate a polaroid photo effect with washed-out colors, a slight vignette, and a characteristic color shift.', icon: <PhotoIcon /> },
      ]
    },
    {
      id: 'artistic',
      title: t('filterSectionArtistic'),
      icon: <PaintBrushIcon />,
      presets: [
        { name: t('filterArtisticOil'), prompt: 'Transform the image into a textured oil painting with visible brushstrokes.', icon: <PaintBrushIcon /> },
        { name:t('filterArtisticWatercolor'), prompt: 'Give the image a soft, blended watercolor effect with translucent colors.', icon: <DropletIcon /> },
        { name: t('filterArtisticSketch'), prompt: 'Convert the image into a detailed pencil sketch with cross-hatching and defined lines.', icon: <PencilIcon /> },
        { name: t('filterArtisticPopArt'), prompt: 'Apply a vibrant, high-contrast pop art style inspired by Andy Warhol, using bold, flat areas of color.', icon: <SparklesIcon /> },
      ]
    },
    {
      id: 'digital',
      title: t('filterSectionDigital'),
      icon: <CpuChipIcon />,
      presets: [
        { name: t('filterDigitalSynthwave'), prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.', icon: <ViewfinderCircleIcon /> },
        { name: t('filterDigitalGlitch'), prompt: 'Transform the image with digital glitch effects and chromatic aberration.', icon: <WrenchScrewdriverIcon /> },
        { name: t('filterDigitalDuotone'), prompt: 'Apply a stylish duotone effect using a bold color combination, like cyan and magenta.', icon: <CircleHalfStrokeIcon /> },
        { name: t('filterDigitalPixel'), prompt: 'Convert the image into a retro 8-bit pixel art style.', icon: <Squares2x2Icon /> },
      ]
    }
  ];

  const handleApplyCustom = () => {
    if (customPrompt) {
        onApplyFilter(customPrompt);
        setCustomPrompt('');
    }
  };

  const handlePresetClick = (prompt: string) => {
    setCustomPrompt('');
    onApplyFilter(prompt);
  };

  const renderPresets = () => {
    const currentSection = allSections.find(sec => sec.id === mode);
    if (!currentSection) return null;

    const presets = currentSection.presets;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading || !isImageLoaded}
            className="w-full h-24 flex flex-col items-center justify-center text-center gap-1 bg-white/5 border border-white/10 text-gray-300 font-medium p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={preset.name}
          >
            {React.cloneElement(preset.icon, { className: 'w-7 h-7 text-gray-300' })}
            <span className="leading-tight">{preset.name}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-center text-gray-200">{t('filterTitle')}</h3>
      
      <div className="p-1 bg-black/30 rounded-lg flex gap-1 w-full max-w-sm mx-auto">
        {allSections.map(btn => (
          <button
            key={btn.id}
            onClick={() => setMode(btn.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === btn.id ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
            title={btn.title}
          >
            {React.cloneElement(btn.icon, { className: 'w-5 h-5' })}
            <span className="hidden md:inline">{btn.title}</span>
          </button>
        ))}
      </div>
      
      <div className="w-full">
        {renderPresets()}
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
          placeholder={t('filterPlaceholder')}
          className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
          disabled={isLoading || !isImageLoaded}
        />
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
          disabled={isLoading || !customPrompt.trim() || !isImageLoaded}
        >
          {t('applyFilter')}
        </button>
      </form>
    </div>
  );
};

export default FilterPanel;
