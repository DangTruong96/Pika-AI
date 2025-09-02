/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { SparklesIcon, UndoIcon, RedoIcon, DownloadIcon, ArrowPathIcon } from './icons';

interface HeaderProps {
    isImageLoaded: boolean;
    imageFile: File | null;
    imageDimensions: { width: number, height: number } | null;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    onDownload: () => void;
    isLoading: boolean;
    onToggleToolbox: () => void;
    onStartOver: () => void;
    isToolboxOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
    isImageLoaded,
    imageFile,
    imageDimensions,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onReset,
    onDownload,
    isLoading,
    onToggleToolbox,
    onStartOver,
    isToolboxOpen
}) => {
  const { t } = useTranslation();

  return (
    <header className="w-full py-2 px-4 sm:px-6 border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full flex items-center justify-between gap-4">
          {/* Left Section: Logo and Image Info */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
                onClick={onToggleToolbox}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('appName')}
                aria-expanded={isToolboxOpen}
                aria-controls="editor-toolbox"
                title={isImageLoaded ? (isToolboxOpen ? t('hideTools') : t('showTools')) : t('appName')}
            >
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {t('appName')}
                </h1>
            </button>
            {isImageLoaded && imageFile && imageDimensions && (
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 border-l border-white/20 pl-4">
                   <span className="font-medium text-gray-300 truncate max-w-[200px]">{imageFile.name}</span>
                   <span>({imageDimensions.width} x {imageDimensions.height})</span>
                </div>
            )}
          </div>

          {/* Right Section: Actions & Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isImageLoaded && (
                <>
                    <button 
                        onClick={onUndo}
                        disabled={!canUndo || isLoading}
                        className="flex items-center justify-center p-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('undo')}
                    >
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRedo}
                        disabled={!canRedo || isLoading}
                        className="flex items-center justify-center p-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('redo')}
                    >
                        <RedoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onReset}
                        disabled={!canUndo || isLoading}
                        className="flex items-center justify-center p-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('reset')}
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-white/20 mx-1"></div>

                    <button 
                        onClick={onStartOver}
                        disabled={isLoading}
                        className="hidden sm:inline-block text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm disabled:opacity-50"
                    >
                        {t('startOver')}
                    </button>
                    <button
                      onClick={onDownload}
                      disabled={!isImageLoaded || isLoading}
                      className="flex items-center justify-center text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-500 ring-1 ring-white/10"
                      title={t('downloadImage')}
                    >
                      <DownloadIcon className="w-5 h-5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('downloadImage')}</span>
                    </button>
                </>
            )}
            <LanguageSwitcher />
          </div>
      </div>
    </header>
  );
};

export default Header;