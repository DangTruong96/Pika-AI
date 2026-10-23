/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowPathIcon, ExpandIcon, UploadIcon, UsersIcon } from './icons';
import type { Tab } from '../types';

interface FaceSwapPanelProps {
  onApplyFaceSwap: (faceFile: File) => void;
  isLoading: boolean;
  isImageLoaded: boolean;
  setActiveTab: (tab: Tab) => void;
  onToggleToolbox: () => void;
  isMobile?: boolean;
}

const FaceSwapPanel: React.FC<FaceSwapPanelProps> = ({
  onApplyFaceSwap,
  isLoading,
  isImageLoaded,
  setActiveTab,
  onToggleToolbox,
  isMobile,
}) => {
  const { t } = useTranslation();

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);
  const [showNeedFaceHint, setShowNeedFaceHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create the preview object URL for the chosen face image and revoke it
  // whenever the selection changes or the panel unmounts.
  useEffect(() => {
    if (!faceFile) {
      setFacePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(faceFile);
    setFacePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [faceFile]);

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaceFile(file);
      setShowNeedFaceHint(false);
    }
    e.target.value = '';
  };

  const handleApply = useCallback(() => {
    if (!faceFile) {
      setShowNeedFaceHint(true);
      return;
    }
    onApplyFaceSwap(faceFile);
  }, [faceFile, onApplyFaceSwap]);

  // The Apply button is disabled while no face is chosen, so a click on its
  // wrapper is what surfaces the "pick a face first" hint in that state.
  const handleApplyAreaClick = () => {
    if (!faceFile && !isLoading && isImageLoaded) {
      setShowNeedFaceHint(true);
    }
  };

  const isApplyDisabled = isLoading || !isImageLoaded || !faceFile;

  const titleContent = (
    <>
      <ArrowPathIcon className="w-6 h-6" />
      <span>{t('faceSwapTitle')}</span>
    </>
  );
  const commonTitleClasses =
    'text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10';

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

      <p className="text-sm text-gray-400 -mt-2 text-center">{t('faceSwapDesc')}</p>

      <div className="w-full flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFaceFileChange}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !isImageLoaded}
          className="w-full flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/20 p-3 text-left transition hover:border-cyan-300/50 hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {facePreviewUrl ? (
            <img
              src={facePreviewUrl}
              alt={t('faceSwapFaceReady')}
              className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <span className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <UploadIcon className="w-6 h-6 text-gray-300" />
            </span>
          )}
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold text-gray-200">{t('faceSwapUploadFace')}</span>
            {faceFile && <span className="text-xs text-cyan-300 truncate">{t('faceSwapFaceReady')}</span>}
          </span>
        </button>

        <p className="text-xs text-center text-gray-500">{t('faceSwapNote')}</p>

        {showNeedFaceHint && !faceFile && (
          <p className="text-xs text-center text-amber-300 bg-amber-400/10 border border-amber-300/20 rounded-lg p-2 animate-fade-in">
            {t('faceSwapNeedFace')}
          </p>
        )}

        <div onClick={handleApplyAreaClick} className="w-full">
          <button
            onClick={handleApply}
            disabled={isApplyDisabled}
            className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
          >
            {t('faceSwapApply')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FaceSwapPanel);
