/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Imported 'useEffect' from React.
import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { type IdPhotoOptions } from '../services/geminiService';
import { IdCardIcon, ExpandIcon, LightbulbIcon } from './icons';
import type { Gender, Tab } from '../types';

interface IdPhotoPanelProps {
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  currentImage: File | null;
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

type PhotoType = 'standard' | 'newborn';
type Expression = 'neutral' | 'smile' | 'keep' | 'big-smile';
type Outfit = 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai';
type Background = 'white' | 'blue' | 'gray' | 'green';
type Hair = 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
type Size = '3x4' | '4x6' | '2x3' | '2x2' | '3.5x4.5' | '5x5' | '2.4x3' | '4x5';


// Fix: Correctly define a generic memoized component to accept type arguments.
interface SegmentedControlProps<T extends string> {
    label?: string;
    options: { value: T; label: string, icon?: React.FC<{ className?: string }>, hideLabel?: boolean }[];
    selected: T;
    onSelect: (value: T) => void;
    disabled: boolean;
    fullWidth?: boolean;
}

const ColorSwatch: React.FC<{ color: string }> = ({ color }) => (
    <span className="w-6 h-6 rounded-full border border-white/30 shadow-inner" style={{ backgroundColor: color }} />
);

export const SegmentedControl = React.memo(function SegmentedControl<T extends string>({ label, options, selected, onSelect, disabled, fullWidth }: SegmentedControlProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({ width: 0, height: 0, transform: 'scale(0.5)', opacity: 0 });

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const calculatePillStyle = () => {
            const activeButton = container.querySelector<HTMLButtonElement>(`[data-value="${selected}"]`);
            if (activeButton && activeButton.offsetWidth > 0) {
                setPillStyle({
                    width: activeButton.offsetWidth,
                    height: activeButton.offsetHeight,
                    transform: `translateX(${activeButton.offsetLeft}px) translateY(${activeButton.offsetTop}px)`,
                    opacity: 1
                });
            } else {
                 setPillStyle(s => ({ ...s, opacity: 0 }));
            }
        };
        
        calculatePillStyle();

        let timeoutId: number;
        const debouncedCalculate = () => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(calculatePillStyle, 50);
        };
        
        const resizeObserver = new ResizeObserver(debouncedCalculate);
        
        resizeObserver.observe(container);
        Array.from(container.querySelectorAll('button')).forEach(btn => resizeObserver.observe(btn));

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [selected, options, fullWidth]);
    
    return (
        <div className="w-full flex flex-col items-center gap-2">
            {label && <span className="text-sm font-medium text-gray-300">{label}:</span>}
            <div ref={containerRef} className="relative flex items-center justify-center gap-1 rounded-xl bg-black/20 p-1 flex-wrap w-full">
                <div 
                  className="absolute top-0 left-0 segmented-control-pill rounded-md shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                      width: pillStyle.width,
                      height: pillStyle.height,
                      transform: pillStyle.transform,
                      opacity: pillStyle.opacity,
                      willChange: 'transform, width, height'
                  }}
                />
                {options.map(({ value, label: optionLabel, icon: Icon, hideLabel }) => (
                    <button
                        key={value}
                        data-value={value}
                        onClick={() => onSelect(value)}
                        disabled={disabled}
                        className={`relative px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors duration-200 active:scale-95 disabled:opacity-50 min-h-11 flex items-center justify-center gap-2 z-10 ${fullWidth ? 'flex-1' : ''} ${
                            selected === value
                                ? 'text-white'
                                : 'text-gray-300 hover:text-white'
                        }`}
                        title={optionLabel}
                        aria-label={optionLabel}
                    >
                        {Icon && <Icon className="w-5 h-5" />}
                        {optionLabel && !hideLabel && <span>{optionLabel}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}) as <T extends string>(props: SegmentedControlProps<T>) => React.ReactElement;

const IdPhotoPanel: React.FC<IdPhotoPanelProps> = ({ onApplyIdPhoto, isLoading, isImageLoaded, currentImage, gender, onGenderChange, setActiveTab, onToggleToolbox, isMobile }) => {
  const { t } = useTranslation();

  const [photoType, setPhotoType] = useState<PhotoType>('standard');
  const [expression, setExpression] = useState<Expression>('keep');
  const [outfit, setOutfit] = useState<Outfit>(gender === 'male' ? 'collared-shirt-m' : 'blouse');
  const [background, setBackground] = useState<Background>('white');
  const [hair, setHair] = useState<Hair>('keep');
  const [size, setSize] = useState<Size>('3x4');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenderChange = useCallback((newGender: Gender) => {
    onGenderChange(newGender);
  }, [onGenderChange]);
  
  // Effect to sync outfit and hair when gender prop changes from parent (e.g., quick actions)
  useEffect(() => {
    // When gender changes, check if the current outfit is gender-specific and incorrect.
    // If so, switch to the default outfit for the new gender.
    setOutfit(prevOutfit => {
      const isFemaleOutfit = ['ao-dai', 'blouse', 'collared-shirt-f'].includes(prevOutfit);
      const isMaleOutfit = ['suit', 'collared-shirt-m'].includes(prevOutfit);

      if (gender === 'male' && isFemaleOutfit) {
        return 'collared-shirt-m'; // User requested default for male
      }
      if (gender === 'female' && isMaleOutfit) {
        return 'blouse'; // Default for female
      }
      // If current outfit is unisex (office-wear) or already correct for gender, keep it.
      return prevOutfit;
    });
    setHair('keep'); // Always reset hair style on gender change for simplicity
  }, [gender]);

  // Effect to reset custom prompt when image changes
  useEffect(() => {
    setCustomPrompt('');
  }, [currentImage]);

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };
  
  const handleApply = () => {
    const optionsForApi: IdPhotoOptions = photoType === 'standard'
      ? {
          type: 'standard',
          gender,
          expression,
          outfit,
          backgroundColor: background,
          size,
          hairstyle: hair,
          customPrompt: customPrompt.trim() || undefined,
        }
      : {
          type: 'newborn',
          backgroundColor: background,
          size,
        };
    onApplyIdPhoto(optionsForApi);
  };

  const outfitOptions: { value: Outfit, label: string }[] = gender === 'male'
    ? [
        { value: 'collared-shirt-m', label: t('idPhotoOutfitCollaredShirtM') },
        { value: 'suit', label: t('idPhotoOutfitSuit') },
      ]
    : [
        { value: 'blouse', label: t('idPhotoOutfitBlouse') },
        { value: 'ao-dai', label: t('idPhotoOutfitAoDai') },
        { value: 'collared-shirt-f', label: t('idPhotoOutfitCollaredShirtF') },
      ];

  const femaleHairOptions: { value: Hair; label: string }[] = [
    { value: 'keep', label: t('idPhotoHairKeep') },
    { value: 'professional-short', label: t('idPhotoHairShortNeat') },
    { value: 'professional-tied-back', label: t('idPhotoHairTiedBack') },
    { value: 'professional-neat-down', label: t('idPhotoHairNeatDown') }
  ];

  const maleHairOptions: { value: Hair; label: string }[] = [
    { value: 'keep', label: t('idPhotoHairKeep') },
    { value: 'male-neat', label: t('idPhotoHairMaleNeat') },
    { value: 'male-short', label: t('idPhotoHairMaleShort') },
    { value: 'male-medium', label: t('idPhotoHairMaleMedium') }
  ];

  const titleContent = (
    <>
      <IdCardIcon className="w-6 h-6" />
      <span>{t('idPhotoTitle')}</span>
    </>
  );
  const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";


  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('generate')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipGenerate')}
          disabled={isLoading}
          aria-label={t('tooltipGenerate')}
        >
          <LightbulbIcon className="w-6 h-6" />
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
          onClick={() => setActiveTab('expand')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipExpand')}
          disabled={isLoading}
          aria-label={t('tooltipExpand')}
        >
          <ExpandIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('idPhotoDescription')}</p>
      
      <div className="w-full flex flex-col items-center gap-4">
          <SegmentedControl<PhotoType>
              label={t('idPhotoType')}
              options={[
                { value: 'standard', label: t('idPhotoTypeStandard') }, 
                { value: 'newborn', label: t('idPhotoTypeNewborn') }, 
              ]}
              selected={photoType}
              onSelect={setPhotoType}
              disabled={isLoading || !isImageLoaded}
          />
          
          {photoType === 'standard' ? (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
              <SegmentedControl<Gender>
                  label={t('idPhotoGender')}
                  options={[{ value: 'female', label: t('idPhotoGenderFemale') }, { value: 'male', label: t('idPhotoGenderMale') }]}
                  selected={gender}
                  onSelect={handleGenderChange}
                  disabled={isLoading || !isImageLoaded}
              />
              <SegmentedControl<Outfit>
                  label={t('idPhotoOutfit')}
                  options={outfitOptions}
                  selected={outfit}
                  onSelect={setOutfit}
                  disabled={isLoading || !isImageLoaded}
              />
               <SegmentedControl<Hair>
                  label={t('idPhotoHairstyle')}
                  options={gender === 'male' ? maleHairOptions : femaleHairOptions}
                  selected={hair}
                  onSelect={setHair}
                  disabled={isLoading || !isImageLoaded}
              />
              <SegmentedControl<Expression>
                  label={t('idPhotoExpression')}
                  options={[
                    { value: 'keep', label: t('idPhotoExpressionKeep') }, 
                    { value: 'neutral', label: t('idPhotoExpressionNeutral') }, 
                    { value: 'smile', label: t('idPhotoExpressionSmile') },
                    { value: 'big-smile', label: t('idPhotoExpressionBigSmile') }
                  ]}
                  selected={expression}
                  onSelect={setExpression}
                  disabled={isLoading || !isImageLoaded}
              />
              <div className="w-full flex flex-col items-center gap-2 pt-2">
                <label htmlFor="custom-prompt-input" className="text-sm font-medium text-gray-300">{t('idPhotoCustomPromptLabel')}:</label>
                <input
                    id="custom-prompt-input"
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t('idPhotoCustomPromptPlaceholder')}
                    className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm focus:bg-white/10"
                    disabled={isLoading || !isImageLoaded}
                    onFocus={handleInputFocus}
                />
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/10 animate-fade-in">
              {t('idPhotoNewbornInfo')}
            </div>
          )}

          <SegmentedControl<Background>
              label={t('idPhotoBackgroundColor')}
              options={[
                { value: 'white', label: t('idPhotoBgWhite'), icon: () => <ColorSwatch color="white" />, hideLabel: true }, 
                { value: 'blue', label: t('idPhotoBgBlue'), icon: () => <ColorSwatch color="#85C1E9" />, hideLabel: true }, 
                { value: 'gray', label: t('idPhotoBgGray'), icon: () => <ColorSwatch color="#dcdcdc" />, hideLabel: true },
                { value: 'green', label: t('idPhotoBgGreen'), icon: () => <ColorSwatch color="#90ee90" />, hideLabel: true }
              ]}
              selected={background}
              onSelect={setBackground}
              disabled={isLoading || !isImageLoaded}
          />
          <SegmentedControl<Size>
              label={t('idPhotoSize')}
              options={[
                { value: '3x4', label: '3x4 cm' },
                { value: '3.5x4.5', label: '3.5x4.5 cm' },
                { value: '4x6', label: '4x6 cm' },
                { value: '2x2', label: '2x2 in' },
                { value: '2.4x3', label: '2.4x3 cm' },
                { value: '4x5', label: '4x5 cm' },
                { value: '2x3', label: '2x3 cm' },
                { value: '5x5', label: '5x5 cm' },
              ]}
              selected={size}
              onSelect={setSize}
              disabled={isLoading || !isImageLoaded}
          />
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !isImageLoaded}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
      >
        {t('idPhotoApply')}
      </button>
    </div>
  );
};

export default React.memo(IdPhotoPanel);