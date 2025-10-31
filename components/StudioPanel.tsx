/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { UsersIcon, XMarkIcon, UploadIcon, SparklesIcon, IdCardIcon } from './icons';
// Fix: Corrected the import path for the 'Tab' type from '../hooks/usePika' to '../types' to resolve module export error.
import type { Tab } from '../types';

interface StudioPanelProps {
  isLoading: boolean;
  isImageLoaded: boolean;
  studioPrompt: string;
  onStudioPromptChange: (prompt: string) => void;
  onApplyStudio: () => void;
  studioStyleFile: File | null;
  onStudioStyleFileChange: (file: File | null) => void;
  onGenerateCreativePrompt: () => void;
  studioSubjects: File[];
  onStudioAddSubject: (file: File) => void;
  onStudioRemoveSubject: (index: number) => void;
  currentImage: File | null;
  studioOutfitFiles: File[];
  onStudioAddOutfitFile: (file: File) => void;
  onStudioRemoveOutfitFile: (index: number) => void;
  setActiveTab: (tab: Tab) => void;
  isMobile?: boolean;
  onToggleToolbox: () => void;
}

const Preview: React.FC<{ file: File }> = React.memo(({ file }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;
    return <img src={url} alt={t('previewAlt')} className="w-full h-full object-cover" />;
});
Preview.displayName = 'Preview';


const StudioPanel: React.FC<StudioPanelProps> = React.memo(
({ isLoading, isImageLoaded, studioPrompt, onStudioPromptChange, onApplyStudio, studioStyleFile, onStudioStyleFileChange, onGenerateCreativePrompt, studioSubjects, onStudioAddSubject, onStudioRemoveSubject, currentImage, studioOutfitFiles, onStudioAddOutfitFile, onStudioRemoveOutfitFile, setActiveTab, isMobile, onToggleToolbox }) => {
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApplyStudio();
    };

    const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStudioStyleFileChange(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleOutfitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStudioAddOutfitFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleSubjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && isImageLoaded) {
            onStudioAddSubject(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isMobile) {
        setTimeout(() => {
          event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 300);
      }
    };
    
    const allSubjects = currentImage ? [currentImage, ...studioSubjects] : [];

    const titleContent = (
        <>
            <UsersIcon className="w-6 h-6" />
            <span>{t('studioTitle')}</span>
        </>
    );
    const commonTitleClasses = "text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10";

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="w-full flex items-center justify-between">
                <button 
                  onClick={() => setActiveTab('adjust')} 
                  className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('tooltipAdjust')}
                  disabled={isLoading}
                  aria-label={t('tooltipAdjust')}
                >
                  <SparklesIcon className="w-6 h-6" />
                </button>
                {isMobile ? (
                    <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
                        {titleContent}
                    </button>
                ) : (
                    <h3 className={commonTitleClasses}>
                        {titleContent}
                    </h3>
                )}
                <button 
                  onClick={() => setActiveTab('idphoto')} 
                  className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('tooltipIdPhoto')}
                  disabled={isLoading}
                  aria-label={t('tooltipIdPhoto')}
                >
                  <IdCardIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('studioDescription')}</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
                
                 <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-300">{t('studioSubjectsCount', { count: allSubjects.length, max: 7 })}</span>
                    <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {allSubjects.map((subject, index) => (
                            <div key={index} className="relative w-14 h-14 rounded-lg flex-shrink-0 bg-black/20 overflow-hidden border border-white/10">
                                <Preview file={subject} />
                                {index > 0 && !isLoading && (
                                <button
                                    type="button"
                                    onClick={() => onStudioRemoveSubject(index - 1)}
                                    className="absolute -top-1 -right-1 p-0.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                                    title={t('remove')}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                                )}
                            </div>
                        ))}
                        {isImageLoaded && allSubjects.length < 7 && (
                            <label htmlFor="studio-subject-file-input" className="w-14 h-14 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500 flex items-center justify-center cursor-pointer transition-colors" title={t('studioAddSubject')}>
                                <UploadIcon className="w-6 h-6 text-gray-400" />
                            </label>
                        )}
                        <input id="studio-subject-file-input" type="file" className="hidden" accept="image/*" onChange={handleSubjectFileChange} disabled={isLoading || !isImageLoaded || allSubjects.length >= 7} />
                    </div>
                </div>

                <div className="w-full flex items-center gap-2">
                    <textarea
                        value={studioPrompt}
                        onChange={(e) => onStudioPromptChange(e.target.value)}
                        placeholder={studioStyleFile ? t('studioPromptPlaceholderStyle') : t('studioPromptPlaceholder')}
                        className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base focus:bg-white/10 resize-none"
                        disabled={isLoading || !isImageLoaded}
                        onFocus={handleInputFocus}
                        rows={4}
                    />
                    <button 
                        type="button" 
                        onClick={onGenerateCreativePrompt}
                        disabled={isLoading || !isImageLoaded}
                        className="p-4 bg-white/5 rounded-lg text-cyan-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('suggestionTitle')}
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="w-full flex flex-row items-start justify-center gap-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-sm font-semibold text-gray-300">{t('studioStyle')}</span>
                        <div className="flex items-center justify-center gap-2">
                             <label htmlFor="studio-style-file-input" className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-black/20 ${studioStyleFile ? 'border-cyan-500' : 'border-dashed border-white/20 hover:border-cyan-500'}`}>
                                {studioStyleFile ? (
                                    <>
                                        <Preview file={studioStyleFile} />
                                        <button type="button" onClick={(e) => { e.preventDefault(); onStudioStyleFileChange(null); }} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-red-500" title={t('remove')}><XMarkIcon className="w-4 h-4"/></button>
                                    </>
                                ): (
                                    <UploadIcon className="w-8 h-8 text-gray-400"/>
                                )}
                            </label>
                            <input id="studio-style-file-input" type="file" className="hidden" accept="image/*" onChange={handleStyleFileChange} />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-sm font-semibold text-gray-300">{t('studioObjects')}</span>
                        <div className="w-full flex flex-wrap items-center justify-center gap-2 p-1 min-h-[6rem]">
                            {studioOutfitFiles.map((file, index) => (
                                <div key={index} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 bg-black/20 overflow-hidden border border-cyan-500">
                                    <Preview file={file} />
                                    {!isLoading && (
                                        <button
                                            type="button"
                                            onClick={() => onStudioRemoveOutfitFile(index)}
                                            className="absolute -top-1 -right-1 p-0.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                                            title={t('remove')}
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isImageLoaded && studioOutfitFiles.length < 3 && (
                                <label htmlFor="studio-outfit-file-input" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500 flex items-center justify-center cursor-pointer transition-colors">
                                    <UploadIcon className="w-8 h-8 text-gray-400" />
                                </label>
                            )}
                        </div>
                        <input id="studio-outfit-file-input" type="file" className="hidden" accept="image/*" onChange={handleOutfitFileChange} disabled={isLoading || !isImageLoaded || studioOutfitFiles.length >= 3} />
                    </div>
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    disabled={isLoading || !isImageLoaded || (!studioPrompt.trim() && !studioStyleFile)}
                >
                    {t('generatePhotoshoot')}
                </button>
            </form>
        </div>
    );
});

export default StudioPanel;