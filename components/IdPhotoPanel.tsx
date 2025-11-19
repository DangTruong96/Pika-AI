

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { type IdPhotoOptions } from '../services/geminiService';
import { IdCardIcon, ExpandIcon, UsersIcon } from './icons';
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
type Hair = 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium' | 'long-hair';
type Size = '3x4' | '4x6' | '2x3' | '2x2' | '3.5x4.5' | '5x5' | '2.4x3' | '4x5';


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
        
        const resizeObserver = new ResizeObserver(() => debouncedCalculate());
        
        resizeObserver.observe(container);
        container.querySelectorAll('button').forEach(btn => resizeObserver.observe(btn));

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
  
  useEffect(() => {
    setOutfit(prevOutfit => {
      const isFemaleOutfit = ['ao-dai', 'blouse', 'collared-shirt-f'].includes(prevOutfit);
      const isMaleOutfit = ['suit', 'collared-shirt-m'].includes(prevOutfit);

      if (gender === 'male' && isFemaleOutfit) {
        return 'collared-shirt-m';
      }
      if (gender === 'female' && isMaleOutfit) {
        return 'blouse';
      }
      return prevOutfit;
    });
    setHair('keep');
  }, [gender]);

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

  const photoTypeOptions = useMemo(() => [
    { value: 'standard' as PhotoType, label: t('idPhotoTypeStandard') },
    { value: 'newborn' as PhotoType, label: t('idPhotoTypeNewborn') },
  ], [t]);

  const genderOptions = useMemo(() => [
    { value: 'female' as Gender, label: t('idPhotoGenderFemale') },
    { value: 'male' as Gender, label: t('idPhotoGenderMale') },
  ], [t]);

  const outfitOptions = useMemo(() => (gender === 'male'
    ? [
        { value: 'collared-shirt-m' as Outfit, label: t('idPhotoOutfitCollaredShirtM') },
        { value: 'suit' as Outfit, label: t('idPhotoOutfitSuit') },
      ]
    : [
        { value: 'blouse' as Outfit, label: t('idPhotoOutfitBlouse') },
        { value: 'ao-dai' as Outfit, label: t('idPhotoOutfitAoDai') },
        { value: 'collared-shirt-f' as Outfit, label: t('idPhotoOutfitCollaredShirtF') },
      ]), [gender, t]);

  const hairOptions = useMemo(() => (gender === 'male'
    ? [
        { value: 'keep' as Hair, label: t('idPhotoHairKeep') },
        { value: 'male-neat' as Hair, label: t('idPhotoHairMaleNeat') },
        { value: 'male-short' as Hair, label: t('idPhotoHairMaleShort') },
        { value: 'male-medium' as Hair, label: t('idPhotoHairMaleMedium') },
      ]
    : [
        { value: 'keep' as Hair, label: t('idPhotoHairKeep') },
        { value: 'professional-short' as Hair, label: t('idPhotoHairShortNeat') },
        { value: 'long-hair' as Hair, label: t('idPhotoHairLong') },
        { value: 'professional-tied-back' as Hair, label: t('idPhotoHairTiedBack') },
        { value: 'professional-neat-down' as Hair, label: t('idPhotoHairNeatDown') },
      ]), [gender, t]);

  const expressionOptions = useMemo(() => [
      { value: 'keep' as Expression, label: t('idPhotoExpressionKeep') },
      { value: 'neutral' as Expression, label: t('idPhotoExpressionNeutral') },
      { value: 'smile' as Expression, label: t('idPhotoExpressionSmile') },
      { value: 'big-smile' as Expression, label: t('idPhotoExpressionBigSmile') },
  ], [t]);

  const bgOptions = useMemo(() => [
      { value: 'white' as Background, label: t('idPhotoBgWhite'), icon: () => <ColorSwatch color="#FFFFFF" /> },
      { value: 'blue' as Background, label: t('idPhotoBgBlue'), icon: () => <ColorSwatch color="#0077FF" /> },
      { value: 'gray' as Background, label: t('idPhotoBgGray'), icon: () => <ColorSwatch color="#CCCCCC" /> },
      { value: 'green' as Background, label: t('idPhotoBgGreen'), icon: () => <ColorSwatch color="#008000" /> },
  ], [t]);
  
  const sizeOptions = useMemo(() => [
    { value: '3x4' as Size, label: '3x4 cm' },
    { value: '3.5x4.5' as Size, label: '3.5x4.5 cm' },
    { value: '4x6' as Size, label: '4x6 cm' },
    { value: '2x3' as Size, label: '2x3 cm' },
    { value: '2.4x3' as Size, label: '2.4x3 cm' },
    { value: '4x5' as Size, label: '4x5 cm' },
    { value: '5x5' as Size, label: '5x5 cm' },
    { value: '2x2' as Size, label: '2x2 in' },
  ], []);

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
          onClick={() => setActiveTab('studio')} 
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipStudio')}
          disabled={isLoading}
          aria-label={t('tooltipStudio')}
        >
          <UsersIcon className="w-6 h-6" />
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
      
      <div className="w-full flex flex-col gap-4">
          <SegmentedControl
            label={t('idPhotoType')}
            options={photoTypeOptions}
            selected={photoType}
            onSelect={(value) => setPhotoType(value)}
            disabled={isLoading || !isImageLoaded}
            fullWidth
          />
          {photoType === 'standard' ? (
              <div className="w-full flex flex-col gap-4 animate-fade-in">
                  <SegmentedControl
                    label={t('idPhotoGender')}
                    options={genderOptions}
                    selected={gender}
                    onSelect={handleGenderChange}
                    disabled={isLoading || !isImageLoaded}
                    fullWidth
                  />
                  <SegmentedControl
                    label={t('idPhotoOutfit')}
                    options={outfitOptions}
                    selected={outfit}
                    onSelect={(value) => setOutfit(value)}
                    disabled={isLoading || !isImageLoaded}
                  />
                   <SegmentedControl
                    label={t('idPhotoHairstyle')}
                    options={hairOptions}
                    selected={hair}
                    onSelect={(value) => setHair(value)}
                    disabled={isLoading || !isImageLoaded}
                  />
                  <SegmentedControl
                    label={t('idPhotoExpression')}
                    options={expressionOptions}
                    selected={expression}
                    onSelect={(value) => setExpression(value)}
                    disabled={isLoading || !isImageLoaded}
                  />
              </div>
          ) : (
            <p className="text-xs text-center text-gray-400 bg-black/20 p-2 rounded-lg animate-fade-in">{t('idPhotoNewbornInfo')}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
              <SegmentedControl
                  label={t('idPhotoBackgroundColor')}
                  options={bgOptions}
                  selected={background}
                  onSelect={(value) => setBackground(value)}
                  disabled={isLoading || !isImageLoaded}
              />
              <SegmentedControl
                  label={t('idPhotoSize')}
                  options={sizeOptions}
                  selected={size}
                  onSelect={(value) => setSize(value)}
                  disabled={isLoading || !isImageLoaded}
              />
          </div>
           
           {photoType === 'standard' && (
            <div className="w-full flex flex-col gap-1 animate-fade-in">
              <label htmlFor="custom-prompt" className="text-sm font-medium text-gray-300">{t('idPhotoCustomPromptLabel')}</label>
              <input 
                id="custom-prompt"
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t('idPhotoCustomPromptPlaceholder')}
                className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm focus:bg-white/10"
                disabled={isLoading || !isImageLoaded}
                onFocus={handleInputFocus}
              />
            </div>
           )}

          <button
              onClick={handleApply}
              disabled={isLoading || !isImageLoaded}
              className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10 mt-2"
          >
              {t('idPhotoApply')}
          </button>
      </div>
    </div>
  );
};

export default React.memo(IdPhotoPanel);
