/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ExtractPanelProps {
    onApplyExtract: () => void;
    isLoading: boolean;
    isImageLoaded: boolean;
    extractPrompt: string;
    onExtractPromptChange: (prompt: string) => void;
    extractedItemsFiles: File[];
    extractedItemUrls: string[];
    extractHistoryFiles: File[][];
    extractedHistoryItemUrls: string[][];
    onUseExtractedAsStyle: (file: File) => void;
    onDownloadExtractedItem: (file: File) => void;
}

const ExtractPanel: React.FC<ExtractPanelProps> = (props) => {
    const { t } = useTranslation();
    const { 
        onApplyExtract, isLoading, isImageLoaded,
        extractPrompt, onExtractPromptChange, extractedItemsFiles, extractedItemUrls, 
        extractHistoryFiles, extractedHistoryItemUrls, onUseExtractedAsStyle, onDownloadExtractedItem
    } = props;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (extractPrompt.trim()) {
            onApplyExtract();
        }
    };

    const canGenerate = isImageLoaded && !isLoading && !!extractPrompt.trim();
  
    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold text-gray-200">{t('extractTitle')}</h3>
            <p className="text-sm text-gray-400 text-center">{t('extractDescription')}</p>
      
            <form onSubmit={handleFormSubmit} className="w-full flex flex-col items-center gap-3">
                <div className="w-full flex items-center gap-2">
                    <input
                        type="text"
                        value={extractPrompt}
                        onChange={(e) => onExtractPromptChange(e.target.value)}
                        placeholder={t('extractPlaceholder')}
                        className="flex-grow bg-white/5 border border-white/10 text-gray-200 rounded-lg p-4 focus:ring-1 focus:ring-cyan-300 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base focus:bg-white/10"
                        disabled={isLoading || !isImageLoaded}
                    />
                    <button
                        type="submit"
                        className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                        disabled={!canGenerate}
                    >
                        {t('extractApply')}
                    </button>
                </div>
            </form>
      
            {extractedItemUrls.length > 0 && (
                <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4 animate-fade-in">
                    <h4 className="text-md font-semibold text-gray-300">{t('extractResultTitle')}</h4>
                    <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                        {extractedItemUrls.map((url, index) => (
                            <div key={index} className="flex flex-col gap-2">
                                <div 
                                    className="w-full aspect-square rounded-lg bg-black/20 p-2 border border-white/10"
                                    style={{ 
                                        backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)',
                                        backgroundSize: '16px 16px'
                                    }}
                                >
                                    <img src={url} alt={`${t('extractResultTitle')} ${index + 1}`} className="w-full h-full object-contain"/>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onUseExtractedAsStyle(extractedItemsFiles[index])}
                                        disabled={isLoading}
                                        className="w-full text-xs text-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                        title={t('extractUseAsStyle')}
                                    >
                                        {t('extractUseAsStyle')}
                                    </button>
                                    <button
                                        onClick={() => onDownloadExtractedItem(extractedItemsFiles[index])}
                                        disabled={isLoading}
                                        className="w-full text-xs text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                        title={t('downloadImage')}
                                    >
                                        {t('downloadImage')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {extractedHistoryItemUrls.length > 0 && (
                <div className="w-full pt-4 mt-4 border-t border-white/10 flex flex-col items-center gap-4 animate-fade-in">
                    <h4 className="text-md font-semibold text-gray-300">{t('extractHistoryTitle')}</h4>
                    <div className="w-full flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                        {extractedHistoryItemUrls.map((urlSet, setIndex) => (
                            <div key={setIndex} className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                                {urlSet.map((url, itemIndex) => (
                                    <div key={`${setIndex}-${itemIndex}`} className="flex flex-col gap-2">
                                        <div 
                                            className="w-full aspect-square rounded-lg bg-black/20 p-2 border border-white/10"
                                            style={{ 
                                                backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)',
                                                backgroundSize: '16px 16px'
                                            }}
                                        >
                                            <img src={url} alt={`History item ${setIndex}-${itemIndex}`} className="w-full h-full object-contain"/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => onUseExtractedAsStyle(extractHistoryFiles[setIndex][itemIndex])}
                                                disabled={isLoading}
                                                className="w-full text-xs text-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                title={t('extractUseAsStyle')}
                                            >
                                                {t('extractUseAsStyle')}
                                            </button>
                                            <button
                                                onClick={() => onDownloadExtractedItem(extractHistoryFiles[setIndex][itemIndex])}
                                                disabled={isLoading}
                                                className="w-full text-xs text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                title={t('downloadImage')}
                                            >
                                                {t('downloadImage')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtractPanel;
