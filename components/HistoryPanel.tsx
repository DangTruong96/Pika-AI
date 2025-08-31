/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const HistoryPanel: React.FC<{
    history: File[];
    currentIndex: number;
    onSelect: (index: number) => void;
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
}> = ({ history, currentIndex, onSelect, isLoading, isOpen, onClose }) => {
    const { t } = useTranslation();
    const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
    const activeItemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const urls = history.map(file => URL.createObjectURL(file));
        setThumbnailUrls(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [history]);

    useEffect(() => {
        if (isOpen && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [currentIndex, isOpen]);

    if (history.length <= 1) return null;

    return (
        <>
            {/* Backdrop for mobile */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel Container */}
            <div
                className={`
                    ${/* --- MOBILE: Horizontal bottom sheet --- */''}
                    fixed bottom-0 left-0 right-0 z-50
                    bg-black/40 backdrop-blur-xl border-t border-white/10
                    transition-transform duration-300 ease-in-out 
                    ${isOpen ? 'translate-y-0' : 'translate-y-full'}

                    ${/* --- DESKTOP: Vertical side panel --- */''}
                    md:absolute md:top-2 md:right-2 md:bottom-2 md:left-auto md:w-24 md:z-40
                    md:border md:border-white/10 md:rounded-xl
                    md:translate-y-0
                    md:transition-all md:duration-300
                    ${isOpen ? 'md:opacity-100 md:translate-x-0' : 'md:opacity-0 md:translate-x-4 md:pointer-events-none'}
                `}
            >
                <div className="
                    p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] 
                    md:p-2 md:pb-2 md:h-full
                ">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 px-1 text-center md:hidden">
                        {t('historyTitle')}
                    </h3>
                    <div className="
                        flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory px-[calc(50%-2.5rem)]
                        md:flex-col md:h-full md:overflow-y-auto md:pb-0 md:snap-none md:px-0
                    ">
                        {thumbnailUrls.map((url, index) => (
                            <button
                                key={`${history[index].name}-${index}`}
                                ref={index === currentIndex ? activeItemRef : null}
                                onClick={() => onSelect(index)}
                                disabled={isLoading}
                                className={`
                                    w-20 h-20 md:w-full md:aspect-square
                                    flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ring-2 focus:outline-none focus:ring-offset-2 focus:ring-offset-black/50
                                    snap-center
                                    ${currentIndex === index ? 'ring-cyan-400 scale-105' : 'ring-transparent hover:ring-white/50 opacity-80 hover:opacity-100'}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                                aria-label={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
                                title={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
                            >
                                <img src={url} alt={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default HistoryPanel;
