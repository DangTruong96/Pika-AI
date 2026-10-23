/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ExpandIcon, FaceRestoreIcon, IdCardIcon } from './icons';
import type { Tab } from '../types';
import type { BeautyPreset } from '../services/beautyService';
import { SegmentedControl } from './IdPhotoPanel';

interface BeautyPanelProps {
  onApplyBeauty: (preset: BeautyPreset, intensity: number, customRequest?: string) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

const BeautyPanel: React.FC<BeautyPanelProps> = ({
  onApplyBeauty,
  isLoading,
  isImageLoaded,
  setActiveTab,
  onToggleToolbox,
  isMobile,
}) => {
  const { t } = useTranslation();

  const [preset, setPreset] = useState<BeautyPreset>('natural');
  const [intensity, setIntensity] = useState(50);
  const [customRequest, setCustomRequest] = useState('');

  const presetOptions = useMemo(
    () => [
      { value: 'natural' as BeautyPreset, label: t('beautyPresetNatural') },
      { value: 'glamour' as BeautyPreset, label: t('beautyPresetGlamour') },
      { value: 'skin' as BeautyPreset, label: t('beautyPresetSkin') },
      { value: 'face-shape' as BeautyPreset, label: t('beautyPresetFaceShape') },
      { value: 'custom' as BeautyPreset, label: t('beautyPresetCustom') },
    ],
    [t],
  );

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isMobile) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
    }
  };

  const handleApply = () => {
    onApplyBeauty(
      preset,
      intensity,
      preset === 'custom' ? customRequest.trim() || undefined : undefined,
    );
  };

  const isApplyDisabled =
    isLoading || !isImageLoaded || (preset === 'custom' && !customRequest.trim());

  const titleContent = (
    <>
      <FaceRestoreIcon className="w-6 h-6" />
      <span>{t('beautyTitle')}</span>
    </>
  );
  const commonTitleClasses =
    'text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10';

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setActiveTab('idphoto')}
          className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tooltipIdPhoto')}
          disabled={isLoading}
          aria-label={t('tooltipIdPhoto')}
        >
          <IdCardIcon className="w-6 h-6" />
        </button>
        {isMobile ? (
          <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
            {titleContent}
          </button>
        ) : (
          <h3 className={commonTitleClasses}>{titleContent}</h3>
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

      <p className="text-sm text-gray-400 -mt-2 text-center">{t('beautyDesc')}</p>

      <div className="w-full flex flex-col gap-4">
        <SegmentedControl
          options={presetOptions}
          selected={preset}
          onSelect={(value) => setPreset(value)}
          disabled={isLoading || !isImageLoaded}
          fullWidth
        />

        <div className="w-full flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="beauty-intensity" className="text-sm font-medium text-gray-300">
              {t('beautyIntensity')}
            </label>
            <span className="text-sm font-semibold text-cyan-300">{intensity}%</span>
          </div>
          <input
            id="beauty-intensity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !isImageLoaded}
          />
        </div>

        {preset === 'custom' && (
          <div className="w-full flex flex-col gap-1 animate-fade-in">
            <textarea
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              placeholder={t('beautyCustomPlaceholder')}
              className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
              disabled={isLoading || !isImageLoaded}
              onFocus={handleInputFocus}
              rows={3}
            />
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={isApplyDisabled}
          className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10 mt-2"
        >
          {t('beautyApply')}
        </button>
      </div>
    </div>
  );
};

export default React.memo(BeautyPanel);
