/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UploadIcon, XMarkIcon, PlusCircleIcon, UsersIcon } from './icons';
import type { Face } from '../services/geminiService';

interface CompositePanelProps {
    onApplyComposite: () => void;
    isLoading: boolean;
    subjectFiles: File[];
    onSubjectFilesChange: (files: File[]) => void;
    styleFiles: File[];
    onStyleFilesChange: (files: File[]) => void;
    backgroundFile: File | null;
    onBackgroundFileChange: (file: File | null) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    useSearchGrounding: boolean;
    onUseSearchGroundingChange: (useSearch: boolean) => void;
    // Props merged from FaceSwapPanel
    onApplyFaceSwap: () => void;
    onSelectTargetFace: (index: number) => void;
    onSelectSourceFace: (index: number) => void;
    currentImage: File | null;
    swapFaceFile: File | null;
    onSwapFaceFileChange: (file: File | null) => void;
    detectedFaces: Record<string, Face[]>;
    selectedTargetFace: { fileKey: string; faceIndex: number } | null;
    selectedSourceFace: { fileKey: string; faceIndex: number } | null;
}

const ImagePreview: React.FC<{
    file: File;
}> = ({ file }) => {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;

    return (
        <div className="relative w-full h-full">
            <img
                src={url}
                alt={file.name}
                className="w-full h-full object-contain"
            />
        </div>
    );
};

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
    const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

    const updateRenderedSize = useCallback(() => {
        if (imgRef.current && containerRef.current) {
            const { naturalWidth, naturalHeight } = imgRef.current;
            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
            if (naturalWidth === 0 || naturalHeight === 0 || containerWidth === 0 || containerHeight === 0) return;
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
        if (!file) { setUrl(null); return; }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        setRenderedSize({ width: 0, height: 0, top: 0, left: 0 });
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

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
            {detectedFaces && imgRef.current?.naturalWidth && renderedSize.width > 0 && (
                <svg className="absolute w-full h-full pointer-events-none" style={{ top: 0, left: 0 }} viewBox={`0 0 ${containerRef.current?.clientWidth || 0} ${containerRef.current?.clientHeight || 0}`}>
                    <g transform={`translate(${renderedSize.left} ${renderedSize.top}) scale(${renderedSize.width / imgRef.current.naturalWidth})`}>
                        {detectedFaces.map((face, index) => (
                            <rect key={index} x={face.box.x} y={face.box.y} width={face.box.width} height={face.box.height} className={`transition-all duration-200 fill-opacity-20 ${selectedFaceIndex === index ? 'stroke-cyan-400 stroke-[4px] fill-cyan-400/20' : 'stroke-white/80 stroke-[2px] fill-transparent hover:fill-white/20'}`} style={{ vectorEffect: 'non-scaling-stroke' }} />
                        ))}
                    </g>
                </svg>
            )}
            {detectedFaces && imgRef.current?.naturalWidth && renderedSize.width > 0 && detectedFaces.map((face, index) => {
                const scale = renderedSize.width / imgRef.current.naturalWidth;
                const markerX = (face.box.x + face.box.width / 2) * scale + renderedSize.left;
                const markerY = (face.box.y + face.box.height / 2) * scale + renderedSize.top;
                return (<button key={index} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFaceSelect(index); }} className={`absolute rounded-full w-7 h-7 flex items-center justify-center font-bold text-white text-sm transition-all duration-200 hover:scale-110 focus:outline-none z-10 ${selectedFaceIndex === index ? 'bg-cyan-500 ring-2 ring-white' : 'bg-black/60 backdrop-blur-sm ring-1 ring-white/50'}`} style={{ top: `${markerY}px`, left: `${markerX}px`, transform: 'translate(-50%, -50%)' }} aria-label={`Select face ${index + 1}`}>{index + 1}</button>)
            })}
        </>
    );

    const containerClasses = `relative w-full aspect-square rounded-lg bg-black/20 border-2 flex items-center justify-center overflow-hidden group ${dragProps?.isDragging ? 'border-cyan-400 bg-cyan-500/10' : (file ? 'border-cyan-500/50' : 'border-dashed border-white/20 hover:border-cyan-500/50')}`;

    return (
        <div className="w-full flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-300">{title}</span>
            <div ref={containerRef} className={containerClasses}>
                {onFileChange ? (<label htmlFor={inputId} {...dragProps?.handlers} className="w-full h-full cursor-pointer flex items-center justify-center">{content}</label>) : (content)}
            </div>
            {onFileChange && <input id={inputId} type="file" className="hidden" accept="image/*" onChange={onFileChange} />}
        </div>
    );
};

const CompositePanel: React.FC<CompositePanelProps> = (props) => {
    const { 
        onApplyComposite, isLoading, subjectFiles, onSubjectFilesChange,
        styleFiles, onStyleFilesChange, backgroundFile, onBackgroundFileChange,
        prompt, onPromptChange, useSearchGrounding, onUseSearchGroundingChange,
        onApplyFaceSwap, onSelectTargetFace, onSelectSourceFace, currentImage,
        swapFaceFile, onSwapFaceFileChange, detectedFaces, selectedTargetFace, selectedSourceFace
    } = props;
    
    const { t } = useTranslation();
    const [mode, setMode] = useState<'composite' | 'faceswap'>('composite');
    const [stylePreviews, setStylePreviews] = useState<string[]>([]);
    const [isDraggingSubjects, setIsDraggingSubjects] = useState(false);
    const [isDraggingStyle, setIsDraggingStyle] = useState(false);
    const [isDraggingBackground, setIsDraggingBackground] = useState(false);
    const [isDraggingSwapFace, setIsDraggingSwapFace] = useState(false);
    
    useEffect(() => {
        const urls = styleFiles.map(file => URL.createObjectURL(file));
        setStylePreviews(urls);
        return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
    }, [styleFiles]);

    const handleAddSubjectFile = (file: File) => {
        if (subjectFiles.length >= 8) return;
        onSubjectFilesChange([...subjectFiles, file]);
    };

    const handleSubjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleAddSubjectFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleRemoveSubject = (index: number) => {
        onSubjectFilesChange(subjectFiles.filter((_, i) => i !== index));
    };

    const handleSubjectDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingSubjects(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleAddSubjectFile(e.dataTransfer.files[0]);
    };
    
    const handleAddStyleFile = (file: File) => {
        if (styleFiles.length < 3) onStyleFilesChange([...styleFiles, file]);
    };

    const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) handleAddStyleFile(e.target.files[0]);
        e.target.value = '';
    };

    const handleRemoveStyle = (index: number) => {
        onStyleFilesChange(styleFiles.filter((_, i) => i !== index));
    };

    const handleStyleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingStyle(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleAddStyleFile(e.dataTransfer.files[0]);
    };

    const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) onBackgroundFileChange(e.target.files[0]);
        e.target.value = '';
    };

    const handleBackgroundDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingBackground(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) onBackgroundFileChange(e.dataTransfer.files[0]);
    };
    
    const handleSwapFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) onSwapFaceFileChange(e.target.files[0]);
        e.target.value = '';
    };

    const handleSwapFaceDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingSwapFace(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) onSwapFaceFileChange(e.dataTransfer.files[0]);
    };

    const subjectDragProps = { onDragEnter: () => setIsDraggingSubjects(true), onDragLeave: () => setIsDraggingSubjects(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleSubjectDrop };
    const styleDragProps = { onDragEnter: () => setIsDraggingStyle(true), onDragLeave: () => setIsDraggingStyle(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleStyleDrop };
    const backgroundDragProps = { onDragEnter: () => setIsDraggingBackground(true), onDragLeave: () => setIsDraggingBackground(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleBackgroundDrop };
    const swapFaceDragProps = { isDragging: isDraggingSwapFace, handlers: { onDragEnter: () => setIsDraggingSwapFace(true), onDragLeave: () => setIsDraggingSwapFace(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleSwapFaceDrop } };

    const canComposite = subjectFiles.length > 0 && !isLoading;
    const canFaceSwap = !!(currentImage && selectedTargetFace && selectedSourceFace && !isLoading);
    
    const title = mode === 'composite' ? t('insertTitle') : t('swapFaceTitle');
    const description = mode === 'composite' ? t('insertDescription') : t('swapFaceDescription');

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
             <div className="p-1 bg-black/30 rounded-lg flex gap-1">
                <button onClick={() => setMode('composite')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${mode === 'composite' ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                    <PlusCircleIcon className="w-5 h-5" /> {t('insertTitle')}
                </button>
                <button onClick={() => setMode('faceswap')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${mode === 'faceswap' ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                    <UsersIcon className="w-5 h-5" /> {t('swapFaceTitle')}
                </button>
            </div>
            <p className="text-sm text-gray-400 -mt-2 text-center">{description}</p>
            
            {mode === 'composite' ? (
                <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-full flex flex-col items-start gap-4">
                        <div className="w-full flex flex-col gap-2">
                            <span className="text-sm font-semibold text-gray-300">{t('insertSubject')} ({subjectFiles.length}/8)</span>
                            <div className="grid grid-cols-4 gap-2">
                                {subjectFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden group bg-black/20">
                                        <ImagePreview file={file} />
                                        <button onClick={() => handleRemoveSubject(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label={`Remove subject ${index + 1}`} ><XMarkIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {subjectFiles.length < 8 && (
                                    <div className="relative aspect-square">
                                        <label htmlFor="subject-file-input" {...subjectDragProps} className={`aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-center p-1 transition-all duration-200 cursor-pointer overflow-hidden w-full h-full ${isDraggingSubjects ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50'}`}>
                                            <UploadIcon className="w-6 h-6 text-gray-400" />
                                            <span className="text-xs mt-1 text-gray-500">{t('insertUploadPlaceholder')}</span>
                                        </label>
                                        <input id="subject-file-input" type="file" className="hidden" accept="image/*" onChange={handleSubjectFileChange} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="w-full flex flex-col gap-2">
                                <span className="text-sm font-semibold text-gray-300">{t('insertBackgroundOptional')}</span>
                                <div>
                                    <label htmlFor="background-file-input" {...backgroundDragProps} className={`relative w-full aspect-square border-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden group ${isDraggingBackground ? 'border-cyan-400 bg-cyan-500/10' : (backgroundFile ? 'border-cyan-500/50' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50')}`}>
                                        {backgroundFile ? (<><ImagePreview file={backgroundFile} /><div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><UploadIcon className="w-6 h-6 text-white" /><span className="text-xs mt-1 text-white font-semibold">{t('insertClickToChange')}</span></div></>) : (<div className="text-center text-gray-400 p-2"><UploadIcon className="w-6 h-6 mx-auto" /><span className="text-xs mt-1 block">{t('insertUploadPlaceholder')}</span></div>)}
                                    </label>
                                    <input id="background-file-input" type="file" className="hidden" accept="image/*" onChange={handleBackgroundFileChange} />
                                </div>
                            </div>
                            <div className="w-full flex flex-col gap-2">
                                <span className="text-sm font-semibold text-gray-300">{t('insertStyle')} ({styleFiles.length}/3)</span>
                                <div className="grid grid-rows-2 grid-cols-2 gap-2 flex-grow">
                                    {stylePreviews.map((preview, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-black/20"><img src={preview} alt={`Style ${index + 1}`} className="w-full h-full object-cover" /><button onClick={() => handleRemoveStyle(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label={`Remove style ${index + 1}`}><XMarkIcon className="w-4 h-4" /></button></div>
                                    ))}
                                    {styleFiles.length < 3 && (
                                        <div className="aspect-square">
                                            <label htmlFor="style-file-input" {...styleDragProps} className={`h-full border-2 rounded-lg flex flex-col items-center justify-center text-center p-1 transition-all duration-200 cursor-pointer overflow-hidden w-full ${isDraggingStyle ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50'}`}><UploadIcon className="w-6 h-6 text-gray-400" /><span className="text-xs mt-1 text-gray-500">{t('insertUploadPlaceholder')}</span></label>
                                            <input id="style-file-input" type="file" className="hidden" accept="image/*" onChange={handleStyleFileChange} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); onApplyComposite(); }} className="w-full flex flex-col items-center gap-3">
                        <input type="text" value={prompt} onChange={(e) => onPromptChange(e.target.value)} placeholder={backgroundFile ? t('insertPromptPlaceholder') : t('insertPromptPlaceholderInitial')} className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10" disabled={isLoading} />
                        <div className="flex items-center gap-2 self-start">
                            <input type="checkbox" id="use-search-checkbox" checked={useSearchGrounding} onChange={(e) => onUseSearchGroundingChange(e.target.checked)} disabled={isLoading} className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 ring-offset-gray-900 focus:ring-2 cursor-pointer disabled:cursor-not-allowed" />
                            <label htmlFor="use-search-checkbox" className="text-sm font-medium text-gray-300 cursor-pointer">{t('insertUseSearch')}</label>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10" disabled={!canComposite} >{t('insertApply')}</button>
                    </form>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-300">
                        <h4 className="font-semibold text-center mb-2">{t('faceSwapHowToTitle')}</h4>
                        <ul className="list-inside list-decimal space-y-1.5 text-gray-400 text-xs pl-2">
                            <li>{t('faceSwapHowTo1_p1')} <strong className="text-cyan-300 font-medium">{t('faceSwapTargetTitle')}</strong>{t('faceSwapHowTo1_p2')}</li>
                            <li>{t('faceSwapHowTo2_p1')} <strong className="text-cyan-300 font-medium">{t('faceSwapSourceTitle')}</strong> {t('faceSwapHowTo2_p2')}</li>
                            <li>{t('faceSwapHowTo3')}</li>
                            <li>{t('faceSwapHowTo4_p1')} <strong className="text-cyan-300 font-medium">{t('swapFaceApply')}</strong> {t('faceSwapHowTo4_p2')}</li>
                        </ul>
                    </div>
                    <div className="w-full flex flex-col items-center gap-4">
                        <FaceSelectionDisplay file={currentImage} title={t('faceSwapTargetTitle')} noImageMessage={t('faceSwapNoTargetImage')} detectedFaces={detectedFaces['currentImage']} selectedFaceIndex={selectedTargetFace?.fileKey === 'currentImage' ? selectedTargetFace.faceIndex : null} onFaceSelect={onSelectTargetFace} />
                        <FaceSelectionDisplay file={swapFaceFile} title={t('faceSwapSourceTitle')} noImageMessage={t('faceSwapUploadFaceButton')} onFileChange={handleSwapFaceFileChange} dragProps={swapFaceDragProps} inputId="swap-face-file-input" detectedFaces={swapFaceFile ? detectedFaces[swapFaceFile.name + swapFaceFile.lastModified] : undefined} selectedFaceIndex={selectedSourceFace?.faceIndex ?? null} onFaceSelect={onSelectSourceFace} />
                    </div>
                    <button onClick={onApplyFaceSwap} disabled={!canFaceSwap} className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10">
                        {t('swapFaceApply')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CompositePanel;