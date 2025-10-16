/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { SparklesIcon, UndoIcon, RedoIcon, DownloadIcon, ArrowPathIcon, UploadIcon } from './icons';

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
    onUploadNew: () => void;
    isMobile?: boolean;
    isControlsVisible?: boolean;
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
    isToolboxOpen,
    onUploadNew,
    isMobile,
    isControlsVisible,
}) => {
  const { t } = useTranslation();

  const isHeaderVisible = !isMobile || !isImageLoaded || isControlsVisible;

  return (
    <header className={`w-full py-1.5 px-3 sm:px-4 border-b border-white/10 header-bg z-50 transition-all duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'} ${isMobile ? 'absolute top-0' : 'sticky top-0'}`}>
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Section: Logo and Image Info */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button 
                onClick={onToggleToolbox}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 sm:gap-3 transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed p-2 sm:p-0"
                aria-label={t('appName')}
                aria-expanded={isToolboxOpen}
                title={isImageLoaded ? (isToolboxOpen ? t('hideTools') : t('showTools')) : t('appName')}
            >
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
                <div className="hidden sm:flex items-baseline">
                    <h1 className="text-xl font-bold tracking-tight text-white">
                      {t('appName')}
                    </h1>
                    <span className="ml-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded-full border border-cyan-400/50">v1.0</span>
                </div>
            </button>
            
            {/* --- Mobile-only actions group --- */}
            {isImageLoaded && (
                <div className="flex sm:hidden items-center gap-2">
                    <button 
                        onClick={onUploadNew}
                        disabled={isLoading}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('uploadNew')}
                    >
                        <UploadIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onUndo}
                        disabled={!canUndo || isLoading}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('undo')}
                    >
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRedo}
                        disabled={!canRedo || isLoading}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('redo')}
                    >
                        <RedoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onReset}
                        disabled={!canUndo || isLoading}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('reset')}
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onDownload}
                      disabled={!canUndo || isLoading}
                      className="flex items-center justify-center text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold p-2 rounded-lg transition-all duration-200 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-500 ring-1 ring-white/10"
                      title={t('downloadImage')}
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {isImageLoaded && imageFile && imageDimensions && (
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400 border-l border-white/20 pl-4">
                   <span className="font-medium text-gray-300 truncate max-w-[150px] lg:max-w-[300px] xl:max-w-[400px]">{imageFile.name}</span>
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
                        className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('undo')}
                    >
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRedo}
                        disabled={!canRedo || isLoading}
                        className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('redo')}
                    >
                        <RedoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onReset}
                        disabled={!canUndo || isLoading}
                        className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        title={t('reset')}
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>
                    
                    <button 
                        onClick={onStartOver}
                        disabled={isLoading}
                        className="hidden sm:inline-block text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-2 px-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-sm disabled:opacity-50"
                    >
                        {t('startOver')}
                    </button>
                    <button
                      onClick={onDownload}
                      disabled={!canUndo || isLoading}
                      className="hidden sm:flex items-center justify-center text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-200 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-500 ring-1 ring-white/10"
                      title={t('downloadImage')}
                    >
                      <DownloadIcon className="w-5 h-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">{t('downloadImage')}</span>
                    </button>
                </>
            )}
          </div>
      </div>
    </header>
  );
};

export default React.memo(Header);