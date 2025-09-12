/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ZoomInIcon, ZoomOutIcon, ArrowsPointingOutIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from './icons';
import Spinner from './Spinner';

interface ScanViewerModalProps {
  imageUrl: string | null;
  originalImageUrl: string | null;
  onClose: () => void;
  onSave: () => void;
  onAdjust: () => void;
  isLoading: boolean;
  onDownloadPdf: () => void;
  isDownloadingPdf: boolean;
  onExportToWord: () => void;
  onExportToExcel: () => void;
  exportingDocType: 'word' | 'excel' | null;
}

const ScanViewerModal: React.FC<ScanViewerModalProps> = ({ imageUrl, originalImageUrl, onClose, onSave, onAdjust, isLoading, onDownloadPdf, isDownloadingPdf, onExportToWord, onExportToExcel, exportingDocType }) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out', amount: number = 0.2) => {
    setScale(prevScale => {
        const newScale = direction === 'in' ? prevScale * (1 + amount) : prevScale / (1 + amount);
        return Math.max(0.1, Math.min(newScale, 10)); // Clamp scale
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPosition({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoom('in', 0.1);
    } else {
      handleZoom('out', 0.1);
    }
  };

  // Reset view when image changes
  useEffect(() => {
    if(imageUrl) {
        resetView();
        setIsComparing(false);
    }
  }, [imageUrl, resetView]);

  // Keyboard shortcuts for the modal
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              onClose();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
      };
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex flex-col items-center justify-center animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
    >
      <h2 id="scan-modal-title" className="sr-only">{t('scanModalTitle')}</h2>
      <div 
        ref={viewerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
      >
        {imageUrl ? (
            <>
                <img
                    src={(isComparing && originalImageUrl) ? originalImageUrl : imageUrl}
                    alt={isComparing ? t('original') : t('scanModalTitle')}
                    className={`transition-transform duration-100 ease-out shadow-2xl border border-white/10 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      maxWidth: '95vw',
                      maxHeight: '85vh',
                    }}
                    onMouseDown={handleMouseDown}
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-sm font-bold py-1 px-3 rounded-md pointer-events-none z-[111]">
                    {isComparing ? t('original') : t('scanModalTitle')}
                </div>
            </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-gray-300">{t('loadingScan')}</p>
          </div>
        )}
      </div>

      <button
          onClick={onClose}
          disabled={isLoading || isDownloadingPdf || !!exportingDocType}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors z-[110] disabled:opacity-50"
          aria-label={t('scanModalClose')}
          title={t('scanModalClose')}
        >
          <XMarkIcon className="w-6 h-6" />
      </button>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[110] flex-wrap justify-center">
          <button
            onClick={onClose}
            disabled={isLoading || isDownloadingPdf || !!exportingDocType}
            className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base disabled:opacity-50"
          >
            {t('scanDiscard')}
          </button>
          <button
            onClick={onAdjust}
            disabled={isLoading || isDownloadingPdf || !imageUrl || !!exportingDocType}
            className="text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base disabled:opacity-50"
          >
            {t('scanAdjustCorners')}
          </button>
        <button
            onClick={onDownloadPdf}
            disabled={isLoading || isDownloadingPdf || !imageUrl || !!exportingDocType}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/30 hover:shadow-xl active:scale-95 disabled:from-gray-600 disabled:to-gray-500 disabled:shadow-none flex items-center justify-center min-w-[150px]"
        >
           {isDownloadingPdf ? <Spinner className="w-6 h-6" /> : t('scanDownloadPdf')}
        </button>
        <button
            onClick={onExportToWord}
            disabled={isLoading || isDownloadingPdf || !imageUrl || !!exportingDocType}
            className="bg-gradient-to-br from-blue-500 to-sky-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-95 disabled:from-gray-600 disabled:to-gray-500 disabled:shadow-none flex items-center justify-center min-w-[170px]"
        >
           {exportingDocType === 'word' ? <Spinner className="w-6 h-6"/> : t('scanExportToWord')}
        </button>
        <button
            onClick={onExportToExcel}
            disabled={isLoading || isDownloadingPdf || !imageUrl || !!exportingDocType}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-green-500/30 hover:shadow-xl active:scale-95 disabled:from-gray-600 disabled:to-gray-500 disabled:shadow-none flex items-center justify-center min-w-[170px]"
        >
           {exportingDocType === 'excel' ? <Spinner className="w-6 h-6"/> : t('scanExportToExcel')}
        </button>
        <button
            onClick={onSave}
            disabled={isLoading || isDownloadingPdf || !imageUrl || !!exportingDocType}
            className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/30 hover:shadow-xl active:scale-95 disabled:from-gray-600 disabled:to-gray-500 disabled:shadow-none flex items-center justify-center min-w-[150px]"
        >
           {t('scanSave')}
        </button>
      </div>
      
      {imageUrl && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 p-1.5 bg-black/40 rounded-lg backdrop-blur-xl border border-white/10 z-[110]">
            <button onClick={() => handleZoom('out')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('scanModalZoomOut')}>
                <ZoomOutIcon className="w-6 h-6" />
            </button>
            <button onClick={resetView} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('scanModalResetZoom')}>
                <ArrowsPointingOutIcon className="w-6 h-6" />
            </button>
            <button onClick={() => handleZoom('in')} className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95" title={t('scanModalZoomIn')}>
                <ZoomInIcon className="w-6 h-6" />
            </button>
            {originalImageUrl && (
                <button
                    onClick={() => setIsComparing(p => !p)}
                    className="p-2.5 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95"
                    // Fix: Use existing translation keys for better accessibility and to resolve TS error.
                    aria-label={isComparing ? t('viewEdited') : t('viewOriginal')}
                    title={isComparing ? t('viewEdited') : t('viewOriginal')}
                >
                    {isComparing ? <EyeSlashIcon className="w-6 h-6 text-cyan-400" /> : <EyeIcon className="w-6 h-6" />}
                </button>
            )}
        </div>
      )}
    </div>
  );
};
export default ScanViewerModal;