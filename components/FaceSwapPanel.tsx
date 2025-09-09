/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UploadIcon } from './icons';
import type { Face } from '../services/geminiService';

interface FaceSwapPanelProps {
    onApplyFaceSwap: () => void;
    onSelectTargetFace: (index: number) => void;
    onSelectSourceFace: (index: number) => void;
    isLoading: boolean;
    currentImage: File | null;
    swapFaceFile: File | null;
    onSwapFaceFileChange: (file: File | null) => void;
    detectedFaces: Record<string, Face[]>;
    selectedTargetFace: { fileKey: string; faceIndex: number } | null;
    selectedSourceFace: { fileKey: string; faceIndex: number } | null;
}

// A new component specifically for displaying an image and its selectable face markers.
const FaceSelectionDisplay: React.FC<{
    file: File | null;
    title: string;
    noImageMessage: string;
    onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    dragProps?: any;
    inputId?: string;
    detectedFaces: Face[] | undefined;
    selectedFaceIndex: number | null;
    onFaceSelect: (index: number) => void;
}> = ({ file, title, noImageMessage, onFileChange, dragProps, inputId, detectedFaces, selectedFaceIndex, onFaceSelect }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // We need to keep track of the image's rendered size to correctly position the overlays
    const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

    const updateRenderedSize = useCallback(() => {
        if (imgRef.current && containerRef.current) {
            const { naturalWidth, naturalHeight } = imgRef.current;
            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
            
            if (naturalWidth === 0 || naturalHeight === 0 || containerWidth === 0 || containerHeight === 0) {
                return;
            }

            const imgAspectRatio = naturalWidth / naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let finalWidth, finalHeight;

            if (imgAspectRatio > containerAspectRatio) {
                finalWidth = containerWidth;
                finalHeight = finalWidth / imgAspectRatio;
            } else {
                finalHeight = containerHeight;
                finalWidth = finalHeight * imgAspectRatio;
            }

            setRenderedSize({
                width: finalWidth,
                height: finalHeight,
                top: (containerHeight - finalHeight) / 2,
                left: (containerWidth - finalWidth) / 2,
            });
        }
    }, []);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        // Reset rendered size when file changes, it will be recalculated on load
        setRenderedSize({ width: 0, height: 0, top: 0, left: 0 });
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    // Recalculate size on window resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(updateRenderedSize);
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [updateRenderedSize]);

    
    const content = (
        <>
            {file && url ? (
                <img ref={imgRef} src={url} alt={title} className="w-full h-full object-contain" onLoad={updateRenderedSize} />
            ) : (
                <div className="text-center text-gray-400 p-2 flex flex-col items-center justify-center h-full">
                    {onFileChange && <UploadIcon className="w-8 h-8 mx-auto mb-2" />}
                    <span className="text-sm mt-1 block">{noImageMessage}</span>
                </div>
            )}
            
            {/* SVG Overlay for Bounding Boxes */}
            {detectedFaces && imgRef.current?.naturalWidth && renderedSize.width > 0 && (
                <svg
                    className="absolute w-full h-full pointer-events-none"
                    style={{ top: 0, left: 0 }}
                    viewBox={`0 0 ${containerRef.current?.clientWidth || 0} ${containerRef.current?.clientHeight || 0}`}
                >
                    <g transform={`translate(${renderedSize.left} ${renderedSize.top}) scale(${renderedSize.width / imgRef.current.naturalWidth})`}>
                        {detectedFaces.map((face, index) => (
                            <rect
                                key={index}
                                x={face.box.x}
                                y={face.box.y}
                                width={face.box.width}
                                height={face.box.height}
                                className={`transition-all duration-200 fill-opacity-20 ${selectedFaceIndex === index 
                                    ? 'stroke-cyan-400 stroke-[4px] fill-cyan-400/20' 
                                    : 'stroke-white/80 stroke-[2px] fill-transparent hover:fill-white/20'
                                }`}
                                style={{ vectorEffect: 'non-scaling-stroke' }}
                            />
                        ))}
                    </g>
                </svg>
            )}

            {/* Clickable Number Markers */}
            {detectedFaces && imgRef.current?.naturalWidth && renderedSize.width > 0 && detectedFaces.map((face, index) => {
                const scale = renderedSize.width / imgRef.current.naturalWidth;
                const markerX = (face.box.x + face.box.width / 2) * scale + renderedSize.left;
                const markerY = (face.box.y + face.box.height / 2) * scale + renderedSize.top;
                
                return (
                    <button
                        key={index}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFaceSelect(index); }}
                        className={`absolute rounded-full w-7 h-7 flex items-center justify-center font-bold text-white text-sm transition-all duration-200 hover:scale-110 focus:outline-none z-10
                            ${selectedFaceIndex === index 
                                ? 'bg-cyan-500 ring-2 ring-white' 
                                : 'bg-black/60 backdrop-blur-sm ring-1 ring-white/50'}`}
                        style={{
                            top: `${markerY}px`,
                            left: `${markerX}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        aria-label={`Select face ${index + 1}`}
                    >
                        {index + 1}
                    </button>
                )
            })}
        </>
    );

    const containerClasses = `relative w-full aspect-square rounded-lg bg-black/20 border-2  flex items-center justify-center overflow-hidden group 
      ${dragProps?.isDragging ? 'border-cyan-400 bg-cyan-500/10' : (file ? 'border-cyan-500/50' : 'border-dashed border-white/20 hover:border-cyan-500/50')}`;

    return (
        <div className="w-full flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-300">{title}</span>
            <div ref={containerRef} className={containerClasses}>
                {onFileChange ? (
                    <label htmlFor={inputId} {...dragProps?.handlers} className="w-full h-full cursor-pointer flex items-center justify-center">
                        {content}
                    </label>
                ) : (
                    content
                )}
            </div>
            {onFileChange && <input id={inputId} type="file" className="hidden" accept="image/*" onChange={onFileChange} />}
        </div>
    );
};

const FaceSwapPanel: React.FC<FaceSwapPanelProps> = ({ 
    onApplyFaceSwap, 
    onSelectTargetFace,
    onSelectSourceFace,
    isLoading,
    currentImage,
    swapFaceFile,
    onSwapFaceFileChange,
    detectedFaces,
    selectedTargetFace,
    selectedSourceFace
}) => {
    const { t } = useTranslation();
    const [isDraggingSwapFace, setIsDraggingSwapFace] = useState(false);

    const handleSwapFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onSwapFaceFileChange(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleSwapFaceDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingSwapFace(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onSwapFaceFileChange(e.dataTransfer.files[0]);
        }
    };

    const swapFaceDragProps = {
        isDragging: isDraggingSwapFace,
        handlers: {
            onDragEnter: () => setIsDraggingSwapFace(true),
            onDragLeave: () => setIsDraggingSwapFace(false),
            onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(),
            onDrop: handleSwapFaceDrop,
        }
    };

    const canFaceSwap = !!(currentImage && selectedTargetFace && selectedSourceFace && !isLoading);
    
    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('swapFaceTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('swapFaceDescription')}</p>
            
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                 <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-300">
                     <h4 className="font-semibold text-center mb-2">{t('faceSwapHowToTitle')}</h4>
                     <ul className="list-inside list-decimal space-y-1.5 text-gray-400 text-xs pl-2">
                         <li>{t('faceSwapHowTo1_p1')} <strong className="text-cyan-300 font-medium">{t('faceSwapTargetTitle')}</strong>, {t('faceSwapHowTo1_p2')}</li>
                         <li>{t('faceSwapHowTo2_p1')} <strong className="text-cyan-300 font-medium">{t('faceSwapSourceTitle')}</strong> {t('faceSwapHowTo2_p2')}</li>
                         <li>{t('faceSwapHowTo3')}</li>
                         <li>{t('faceSwapHowTo4_p1')} <strong className="text-cyan-300 font-medium">{t('swapFaceApply')}</strong> {t('faceSwapHowTo4_p2')}</li>
                     </ul>
                 </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <FaceSelectionDisplay
                        file={currentImage}
                        title={t('faceSwapTargetTitle')}
                        noImageMessage={t('faceSwapNoTargetImage')}
                        detectedFaces={detectedFaces['currentImage']}
                        selectedFaceIndex={selectedTargetFace?.fileKey === 'currentImage' ? selectedTargetFace.faceIndex : null}
                        onFaceSelect={onSelectTargetFace}
                    />
                    <FaceSelectionDisplay
                        file={swapFaceFile}
                        title={t('faceSwapSourceTitle')}
                        noImageMessage={t('faceSwapUploadFaceButton')}
                        onFileChange={handleSwapFaceFileChange}
                        dragProps={swapFaceDragProps}
                        inputId="swap-face-file-input"
                        detectedFaces={swapFaceFile ? detectedFaces[swapFaceFile.name + swapFaceFile.lastModified] : undefined}
                        selectedFaceIndex={selectedSourceFace?.faceIndex ?? null}
                        onFaceSelect={onSelectSourceFace}
                    />
                </div>
                 <button onClick={onApplyFaceSwap} disabled={!canFaceSwap} className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10">
                     {t('swapFaceApply')}
                 </button>
             </div>
        </div>
    );
};

export default FaceSwapPanel;