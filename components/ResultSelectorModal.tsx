/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { XMarkIcon } from './icons';

interface ResultSelectorModalProps {
  results: string[];
  onSelect: (resultUrl: string) => void;
  onCancel: () => void;
  title: string;
}

const ResultSelectorModal: React.FC<ResultSelectorModalProps> = ({ results, onSelect, onCancel, title }) => {
  const { t } = useTranslation();

  // Handle keyboard events for accessibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);
  
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex flex-col items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-selector-title"
    >
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
            <h2 id="result-selector-title" className="text-2xl md:text-3xl font-bold text-white">
                {title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {results.map((url, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(url)}
                        className="relative aspect-square rounded-xl overflow-hidden group transition-all duration-300 ring-2 ring-transparent hover:ring-cyan-400 focus:ring-cyan-400 focus:outline-none focus:ring-offset-2 focus:ring-offset-black/50"
                        aria-label={`Select result ${index + 1}`}
                    >
                        <img src={url} alt={`Result option ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                            <span className="text-lg font-bold text-white drop-shadow-lg">Select this result</span>
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={onCancel}
                className="mt-4 text-center bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-8 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base"
            >
                {t('scanDiscard')}
            </button>
        </div>

      <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors z-[110]"
          aria-label={t('scanModalClose')}
          title={t('scanModalClose')}
        >
          <XMarkIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ResultSelectorModal;