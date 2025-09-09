/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { detectSubjectDetails, type IdPhotoOptions } from '../services/geminiService';
import Spinner from './Spinner';

interface IdPhotoPanelProps {
  onApplyIdPhoto: (options: IdPhotoOptions) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  currentImage: File | null;
}

type PhotoType = 'standard' | 'newborn';
type Gender = 'male' | 'female';
type Expression = 'neutral' | 'smile' | 'keep' | 'big-smile';
type Outfit = 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai';
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

const IdPhotoPanel: React.FC<IdPhotoPanelProps> = ({ onApplyIdPhoto, isLoading, isImageLoaded, currentImage }) => {
  const { t } = useTranslation();

  const [isDetecting, setIsDetecting] = useState(false);
  const [photoType, setPhotoType] = useState<PhotoType>('standard');
  const [gender, setGender] = useState<Gender>('female');
  const [expression, setExpression] = useState<Expression>('keep');
  const [outfit, setOutfit] = useState<Outfit>('blouse');
  const [background, setBackground] = useState<Background>('white');
  const [hair, setHair] = useState<Hair>('keep');
  const [size, setSize] = useState<Size>('3x4');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenderChange = useCallback((newGender: Gender) => {
    setGender(newGender);
    setHair('keep');
    // Automatically switch to a suitable default outfit using functional update
    setOutfit(prevOutfit => {
      if (newGender === 'male') {
          if (prevOutfit === 'ao-dai' || prevOutfit === 'blouse') {
            return 'suit';
          }
      } else { // female
          if (prevOutfit === 'suit') {
            return 'blouse';
          }
      }
      return prevOutfit; // No change needed
    });
  }, []);

  // Effect to auto-detect subject details when the image changes
  useEffect(() => {
    // Don't run if no image is loaded
    if (!isImageLoaded || !currentImage) {
        return;
    }

    const detectDetails = async () => {
        setIsDetecting(true);
        try {
            const details = await detectSubjectDetails(currentImage);
            setPhotoType(details.ageCategory === 'newborn' ? 'newborn' : 'standard');
            // Fix: The `ageCategory` from the API is 'adult' or 'newborn', not 'standard'.
            if (details.ageCategory === 'adult') {
                handleGenderChange(details.gender);
            }
        } catch (error) {
            console.error("Failed to detect subject details for ID photo:", error);
            // Fallback to defaults on error, don't show an error to the user
            setPhotoType('standard');
            handleGenderChange('female');
        } finally {
            setIsDetecting(false);
        }
    };

    detectDetails();
    // Reset custom prompt whenever the image changes
    setCustomPrompt('');

  }, [currentImage, isImageLoaded, handleGenderChange]);
  
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
        { value: 'suit', label: t('idPhotoOutfitSuit') },
        { value: 'collared-shirt-m', label: t('idPhotoOutfitCollaredShirtM') }
      ]
    : [
        { value: 'ao-dai', label: t('idPhotoOutfitAoDai') },
        { value: 'blouse', label: t('idPhotoOutfitBlouse') },
        { value: 'collared-shirt-f', label: t('idPhotoOutfitCollaredShirtF') }
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
        {isDetecting && <Spinner className="w-5 h-5" />}
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
              disabled={isLoading || isDetecting || !isImageLoaded}
          />
          
          {photoType === 'standard' ? (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
              <SegmentedControl
                  label={t('idPhotoGender')}
                  options={[{ value: 'female', label: t('idPhotoGenderFemale') }, { value: 'male', label: t('idPhotoGenderMale') }]}
                  selected={gender}
                  onSelect={handleGenderChange}
                  disabled={isLoading || isDetecting || !isImageLoaded}
              />
              <SegmentedControl
                  label={t('idPhotoOutfit')}
                  options={outfitOptions}
                  selected={outfit}
                  onSelect={(value) => setOutfit(value)}
                  disabled={isLoading || isDetecting || !isImageLoaded}
              />
               <SegmentedControl
                  label={t('idPhotoHairstyle')}
                  options={gender === 'male' ? maleHairOptions : femaleHairOptions}
                  selected={hair}
                  onSelect={(value) => setHair(value)}
                  disabled={isLoading || isDetecting || !isImageLoaded}
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
                  disabled={isLoading || isDetecting || !isImageLoaded}
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
                    disabled={isLoading || isDetecting || !isImageLoaded}
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
              disabled={isLoading || isDetecting || !isImageLoaded}
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
              disabled={isLoading || isDetecting || !isImageLoaded}
          />
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || isDetecting || !isImageLoaded}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
      >
        {t('idPhotoApply')}
      </button>
    </div>
  );
};

export default IdPhotoPanel;
