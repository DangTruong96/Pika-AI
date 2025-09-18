/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { type IdPhotoOptions } from '../services/geminiService';
import Spinner from './Spinner';
import type { Gender } from '../App';

interface IdPhotoPanelProps {
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  currentImage: File | null;
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
}

type PhotoType = 'standard' | 'newborn';
type Expression = 'neutral' | 'smile' | 'keep' | 'big-smile';
type Outfit = 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai' | 'office-wear';
type Background = 'white' | 'blue' | 'gray' | 'green';
type Hair = 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
type Size = '3x4' | '4x6' | '2x2' | '3.5x4.5' | '5x5';


const SegmentedControl = <T extends string>({ label, options, selected, onSelect, disabled }: {
    label: string;
    options: { value: T; label: string }[];
    selected: T;
    onSelect: (value: T) => void;
    disabled: boolean;
}) => (
    <div className="w-full flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-300">{label}:</span>
        <div className="flex items-center justify-center gap-1 rounded-lg bg-black/30 p-1 flex-wrap">
            {options.map(({ value, label: optionLabel }) => (
                <button
                    key={value}
                    onClick={() => onSelect(value)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                        selected === value
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'bg-transparent hover:bg-white/10 text-gray-300'
                    }`}
                >
                    {optionLabel}
                </button>
            ))}
        </div>
    </div>
);

const IdPhotoPanel: React.FC<IdPhotoPanelProps> = ({ onApplyIdPhoto, isLoading, isImageLoaded, currentImage, gender, onGenderChange }) => {
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
        { value: 'office-wear', label: t('idPhotoOutfitOfficeWear') },
      ]
    : [
        { value: 'blouse', label: t('idPhotoOutfitBlouse') },
        { value: 'ao-dai', label: t('idPhotoOutfitAoDai') },
        { value: 'collared-shirt-f', label: t('idPhotoOutfitCollaredShirtF') },
        { value: 'office-wear', label: t('idPhotoOutfitOfficeWear') },
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

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200 flex items-center justify-center gap-2">
        {t('idPhotoTitle')}
      </h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('idPhotoDescription')}</p>
      
      <div className="w-full flex flex-col items-center gap-4">
          <SegmentedControl
              label={t('idPhotoType')}
              options={[
                { value: 'standard', label: t('idPhotoTypeStandard') }, 
                { value: 'newborn', label: t('idPhotoTypeNewborn') }, 
              ]}
              selected={photoType}
              // Fix: Wrapped state setter in a lambda to resolve TypeScript inference issue.
              onSelect={(value) => setPhotoType(value)}
              disabled={isLoading || !isImageLoaded}
          />
          
          {photoType === 'standard' ? (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
              <SegmentedControl
                  label={t('idPhotoGender')}
                  options={[{ value: 'female', label: t('idPhotoGenderFemale') }, { value: 'male', label: t('idPhotoGenderMale') }]}
                  selected={gender}
                  onSelect={handleGenderChange}
                  disabled={isLoading || !isImageLoaded}
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
                  options={gender === 'male' ? maleHairOptions : femaleHairOptions}
                  selected={hair}
                  onSelect={(value) => setHair(value)}
                  disabled={isLoading || !isImageLoaded}
              />
              <SegmentedControl
                  label={t('idPhotoExpression')}
                  options={[
                    { value: 'keep', label: t('idPhotoExpressionKeep') }, 
                    { value: 'neutral', label: t('idPhotoExpressionNeutral') }, 
                    { value: 'smile', label: t('idPhotoExpressionSmile') },
                    { value: 'big-smile', label: t('idPhotoExpressionBigSmile') }
                  ]}
                  selected={expression}
                  onSelect={(value) => setExpression(value)}
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
                />
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/10 animate-fade-in">
              {t('idPhotoNewbornInfo')}
            </div>
          )}

          <SegmentedControl
              label={t('idPhotoBackgroundColor')}
              options={[
                { value: 'white', label: t('idPhotoBgWhite') }, 
                { value: 'blue', label: t('idPhotoBgBlue') }, 
                { value: 'gray', label: t('idPhotoBgGray') },
                { value: 'green', label: t('idPhotoBgGreen') }
              ]}
              selected={background}
              onSelect={(value) => setBackground(value)}
              disabled={isLoading || !isImageLoaded}
          />
          <SegmentedControl
              label={t('idPhotoSize')}
              options={[
                { value: '3x4', label: '3x4 cm' }, 
                { value: '4x6', label: '4x6 cm' }, 
                { value: '3.5x4.5', label: '3.5x4.5 cm' },
                { value: '5x5', label: '5x5 cm' },
                { value: '2x2', label: '2x2 in' }
              ]}
              selected={size}
              onSelect={(value) => setSize(value)}
              disabled={isLoading || !isImageLoaded}
          />
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !isImageLoaded}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
      >
        {t('idPhotoApply')}
      </button>
    </div>
  );
};

export default IdPhotoPanel;