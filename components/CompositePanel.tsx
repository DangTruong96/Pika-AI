

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UploadIcon, XMarkIcon, PlusCircleIcon, SparklesIcon } from './icons';

interface CompositePanelProps {
    onApplyComposite: () => void;
    isLoading: boolean;
    subjectFiles: File[];
    onSubjectFilesChange: (files: File[] | ((currentFiles: File[]) => File[])) => void;
    styleFiles: File[];
    onStyleFilesChange: (files: File[]) => void;
    backgroundFile: File | null;
    onBackgroundFileChange: (file: File | null) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerateCreativePrompt: () => void;
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

const CompositePanel: React.FC<CompositePanelProps> = (props) => {
    const { 
        onApplyComposite, isLoading, subjectFiles, onSubjectFilesChange,
        styleFiles, onStyleFilesChange, backgroundFile, onBackgroundFileChange,
        prompt, onPromptChange, onGenerateCreativePrompt
    } = props;
    
    const { t } = useTranslation();
    const [stylePreviews, setStylePreviews] = useState<string[]>([]);
    const [isDraggingSubjects, setIsDraggingSubjects] = useState(false);
    const [isDraggingStyle, setIsDraggingStyle] = useState(false);
    const [isDraggingBackground, setIsDraggingBackground] = useState(false);
    
    useEffect(() => {
        const urls = styleFiles.map(file => URL.createObjectURL(file));
        setStylePreviews(urls);
        return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
    }, [styleFiles]);

    const handleAddSubjectFile = (file: File) => {
        onSubjectFilesChange(currentFiles => {
            if (currentFiles.length >= 8) return currentFiles;
            return [...currentFiles, file];
        });
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
    
    const subjectDragProps = { onDragEnter: () => setIsDraggingSubjects(true), onDragLeave: () => setIsDraggingSubjects(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleSubjectDrop };
    const styleDragProps = { onDragEnter: () => setIsDraggingStyle(true), onDragLeave: () => setIsDraggingStyle(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleStyleDrop };
    const backgroundDragProps = { onDragEnter: () => setIsDraggingBackground(true), onDragLeave: () => setIsDraggingBackground(false), onDragOver: (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault(), onDrop: handleBackgroundDrop };

    const canComposite = subjectFiles.length > 0 && !!prompt.trim() && !isLoading;
    
    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('insertTitle')}</h3>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('insertDescription')}</p>
            
            <div className="w-full flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-full flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('insertSubject')}</span>
                    <div className="grid grid-cols-4 gap-2">
                        {subjectFiles.map((file, index) => (
                            <div key={`${file.name}-${file.lastModified}-${index}`} className="relative w-full aspect-square rounded-lg bg-black/20 p-1 border border-white/10">
                                <ImagePreview file={file} />
                                <button onClick={() => handleRemoveSubject(index)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {subjectFiles.length < 8 && (
                            <label {...subjectDragProps} htmlFor="subject-file-input" className={`relative w-full aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${isDraggingSubjects ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 hover:border-cyan-500/50'}`}>
                                <PlusCircleIcon className="w-8 h-8 text-gray-400" />
                            </label>
                        )}
                        <input id="subject-file-input" type="file" className="hidden" accept="image/*" onChange={handleSubjectFileChange} />
                    </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="w-full flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-300">{t('insertBackgroundOptional')}</span>
                        <label {...backgroundDragProps} htmlFor="background-file-input" className={`relative w-full aspect-video rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${isDraggingBackground ? 'border-cyan-400 bg-cyan-500/10' : (backgroundFile ? 'border-cyan-500/50' : 'border-dashed border-white/20 hover:border-cyan-500/50')}`}>
                            {backgroundFile ? (
                                <>
                                    <ImagePreview file={backgroundFile} />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">{t('insertClickToChange')}</div>
                                </>
                            ) : (
                                <UploadIcon className="w-8 h-8 text-gray-400" />
                            )}
                        </label>
                        <input id="background-file-input" type="file" className="hidden" accept="image/*" onChange={handleBackgroundFileChange} />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-300">{t('insertStyle')}</span>
                        <div className="grid grid-cols-2 gap-2">
                            {stylePreviews.map((url, index) => (
                                <div key={index} className="relative w-full aspect-square rounded-lg bg-black/20 p-1 border border-white/10">
                                    <img src={url} alt={`Style ${index}`} className="w-full h-full object-cover" />
                                    <button onClick={() => handleRemoveStyle(index)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {styleFiles.length < 3 && (
                                <label {...styleDragProps} htmlFor="style-file-input" className={`relative w-full aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${isDraggingStyle ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-white/20 hover:border-cyan-500/50'}`}>
                                    <PlusCircleIcon className="w-6 h-6 text-gray-400" />
                                </label>
                            )}
                            <input id="style-file-input" type="file" className="hidden" accept="image/*" onChange={handleStyleFileChange} />
                        </div>
                    </div>
                </div>
                <div className="w-full flex items-center gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder={t('insertPromptPlaceholder')}
                        className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 lg:p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base lg:text-lg focus:bg-white/10"
                        disabled={isLoading}
                    />
                    <button 
                        type="button" 
                        onClick={onGenerateCreativePrompt}
                        disabled={isLoading || subjectFiles.length === 0}
                        className="p-4 bg-white/5 rounded-lg text-cyan-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('suggestionTitle')}
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>
                <button onClick={onApplyComposite} disabled={!canComposite} className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10">
                    {t('insertApply')}
                </button>
            </div>
        </div>
    );
};

export default CompositePanel;