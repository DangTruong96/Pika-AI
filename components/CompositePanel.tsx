/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UploadIcon, XMarkIcon } from './icons';

interface InsertPanelProps {
    onApplyInsert: () => void;
    isLoading: boolean;
    subjectFiles: File[];
    onSubjectFilesChange: (files: File[]) => void;
    styleFiles: File[];
    onStyleFilesChange: (files: File[]) => void;
    backgroundFile: File | null;
    onBackgroundFileChange: (file: File | null) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
}

const CompositePanel: React.FC<InsertPanelProps> = ({ 
    onApplyInsert, 
    isLoading,
    subjectFiles,
    onSubjectFilesChange,
    styleFiles,
    onStyleFilesChange,
    backgroundFile,
    onBackgroundFileChange,
    prompt,
    onPromptChange
}) => {
    const { t } = useTranslation();
    const [subjectPreviews, setSubjectPreviews] = useState<string[]>([]);
    const [stylePreviews, setStylePreviews] = useState<string[]>([]);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [isDraggingSubjects, setIsDraggingSubjects] = useState(false);
    const [isDraggingStyle, setIsDraggingStyle] = useState(false);
    const [isDraggingBackground, setIsDraggingBackground] = useState(false);
    
    useEffect(() => {
        let url: string | null = null;
        if (backgroundFile) {
            url = URL.createObjectURL(backgroundFile);
        }
        setBackgroundPreview(url);
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [backgroundFile]);

    useEffect(() => {
        const urls = subjectFiles.map(file => URL.createObjectURL(file));
        setSubjectPreviews(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [subjectFiles]);
    
    useEffect(() => {
        const urls = styleFiles.map(file => URL.createObjectURL(file));
        setStylePreviews(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [styleFiles]);

    const handleAddSubjectFile = (file: File) => {
        if (subjectFiles.length < 4) {
            onSubjectFilesChange([...subjectFiles, file]);
        }
    };

    const handleSubjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleAddSubjectFile(e.target.files[0]);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleRemoveSubject = (index: number) => {
        onSubjectFilesChange(subjectFiles.filter((_, i) => i !== index));
    };

    const handleSubjectDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingSubjects(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleAddSubjectFile(e.dataTransfer.files[0]);
        }
    };
    
    const handleAddStyleFile = (file: File) => {
        if (styleFiles.length < 3) {
            onStyleFilesChange([...styleFiles, file]);
        }
    };

    const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleAddStyleFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleRemoveStyle = (index: number) => {
        onStyleFilesChange(styleFiles.filter((_, i) => i !== index));
    };

    const handleStyleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingStyle(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleAddStyleFile(e.dataTransfer.files[0]);
        }
    };
    
    const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onBackgroundFileChange(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleBackgroundDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBackground(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onBackgroundFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleClearBackground = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onBackgroundFileChange(null);
    };

    const subjectDragProps = {
        onDragEnter: () => setIsDraggingSubjects(true),
        onDragLeave: () => setIsDraggingSubjects(false),
        onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(),
        onDrop: handleSubjectDrop,
    };
    
    const styleDragProps = {
        onDragEnter: () => setIsDraggingStyle(true),
        onDragLeave: () => setIsDraggingStyle(false),
        onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(),
        onDrop: handleStyleDrop,
    };
    
    const backgroundDragProps = {
        onDragEnter: () => setIsDraggingBackground(true),
        onDragLeave: () => setIsDraggingBackground(false),
        onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(),
        onDrop: handleBackgroundDrop,
    };

    const canGenerate = subjectFiles.length > 0 && !isLoading;

    const handleGenerate = () => {
        if (canGenerate) {
            onApplyInsert();
        }
    };

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('insertTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('insertDescription')}</p>

            <div className="w-full flex flex-col items-start gap-4">
                {/* Subjects Section */}
                <div className="w-full flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('insertSubject')} ({subjectFiles.length}/4)</span>
                    <div className="grid grid-cols-4 gap-2">
                        {subjectPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-black/20">
                                <img src={preview} alt={`Subject ${index + 1}`} className="w-full h-full object-contain" />
                                <button
                                    onClick={() => handleRemoveSubject(index)}
                                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    aria-label={`Remove subject ${index + 1}`}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {subjectFiles.length < 4 && (
                            <label
                                {...subjectDragProps}
                                className={`aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-center p-1 transition-all duration-200 cursor-pointer overflow-hidden
                                    ${isDraggingSubjects ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50'}`
                                }
                            >
                                <UploadIcon className="w-6 h-6 text-gray-400" />
                                <span className="text-xs mt-1 text-gray-500">{t('insertUploadPlaceholder')}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleSubjectFileChange} />
                            </label>
                        )}
                    </div>
                </div>
                
                {/* Style Section */}
                <div className="w-full flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('insertStyle')} ({styleFiles.length}/3)</span>
                    <div className="grid grid-cols-3 gap-2">
                         {stylePreviews.map((preview, index) => (
                            <div key={index} className="relative h-24 rounded-lg overflow-hidden group bg-black/20">
                                <img src={preview} alt={`Style ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handleRemoveStyle(index)}
                                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    aria-label={`Remove style ${index + 1}`}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {styleFiles.length < 3 && (
                             <label
                                {...styleDragProps}
                                className={`h-24 border-2 rounded-lg flex flex-col items-center justify-center text-center p-1 transition-all duration-200 cursor-pointer overflow-hidden
                                    ${isDraggingStyle ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50'}`
                                }
                            >
                                <UploadIcon className="w-6 h-6 text-gray-400" />
                                <span className="text-xs mt-1 text-gray-500">{t('insertUploadPlaceholder')}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleStyleFileChange} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Background Section */}
                <div className="w-full flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('insertBackground')}</span>
                     <label
                        {...backgroundDragProps}
                        className={`relative w-full h-24 border-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden
                            ${isDraggingBackground ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 bg-black/20 hover:border-cyan-500/50'}`
                        }
                    >
                        {backgroundPreview ? (
                           <>
                                <img src={backgroundPreview} alt={t('insertBackground')} className="w-full h-full object-cover" />
                                {backgroundFile && (
                                    <button
                                        onClick={handleClearBackground}
                                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white z-10 hover:bg-black/80"
                                        aria-label={`Clear background image`}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-gray-400 p-2">
                                <UploadIcon className="w-6 h-6 mx-auto" />
                                <span className="text-xs mt-1 block">{t('insertUploadPlaceholder')}</span>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundFileChange} />
                    </label>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col items-center gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder={backgroundFile ? t('insertPromptPlaceholder') : t('insertPromptPlaceholderInitial')}
                  className="bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
                  disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    disabled={!canGenerate}
                >
                    {t('insertApply')}
                </button>
            </form>
        </div>
    );
};

export default CompositePanel;
