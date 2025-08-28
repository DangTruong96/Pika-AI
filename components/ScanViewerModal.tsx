/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ZoomInIcon, ZoomOutIcon, ArrowsPointingOutIcon, XMarkIcon } from './icons';

interface ScanViewerModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ScanViewerModal: React.FC<ScanViewerModalProps> = ({ imageUrl, onClose }) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoom = (direction: 'in' | 'out', amount: number = 0.2) => {
    setScale(prevScale => {
        const newScale = direction === 'in' ? prevScale * (1 + amount) : prevScale / (1 + amount);
        return Math.max(0.1, Math.min(newScale, 10)); // Clamp scale between 0.1x and 10x
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (scale <= 1) return;
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
    resetView();
  }, [imageUrl]);

  return (
    <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center animate-fade-in"
        onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the image area
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={t('scanModalTitle')}
          className={`transition-transform duration-100 ease-out ${isPanning || scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-auto'}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            maxWidth: '95vw',
            maxHeight: '95vh',
          }}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Header with Title and Close button */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <h2 className="text-xl font-bold text-white">{t('scanModalTitle')}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/30 text-white hover:bg-black/60 transition-colors"
          aria-label={t('scanModalClose')}
          title={t('scanModalClose')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Controls at the bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => handleZoom('out')}
          className="p-3 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          aria-label={t('scanModalZoomOut')}
          title={t('scanModalZoomOut')}
        >
          <ZoomOutIcon className="w-6 h-6" />
        </button>
        <button
          onClick={resetView}
          className="p-3 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          aria-label={t('scanModalResetZoom')}
          title={t('scanModalResetZoom')}
        >
          <ArrowsPointingOutIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleZoom('in')}
          className="p-3 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          aria-label={t('scanModalZoomIn')}
          title={t('scanModalZoomIn')}
        >
          <ZoomInIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ScanViewerModal;
