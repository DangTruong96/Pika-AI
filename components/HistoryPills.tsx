/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import Spinner from './Spinner';
import { ClockIcon, XMarkIcon } from './icons';
import type { TransformState } from '../types';

interface HistoryItemData {
  url: string;
  thumbnailUrl: string;
  transform: TransformState;
}

interface HistoryPillsProps {
  historyItems: HistoryItemData[];
  results: string[];
  isGeneratingResults: boolean;
  expectedResultsCount: number;
  currentIndex: number;
  resultsBaseHistoryIndex: number | null;
  onHistorySelect: (index: number) => void;
  onResultSelect: (url: string, index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isMobileToolbarVisible?: boolean;
  isMobile?: boolean;
  isControlsVisible?: boolean;
}

const LazyPillImage: React.FC<{
  thumbnailUrl: string;
  transform: TransformState;
  alt: string;
}> = ({ thumbnailUrl, transform, alt }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '200px' } // Preload when it's 200px away from viewport
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const transformString = `rotate(${transform.rotate}deg) scale(${transform.scaleX}, ${transform.scaleY})`;

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          decoding="async"
          style={{ transform: transformString }}
        />
      ) : (
        <div className="w-full h-full bg-white/5" /> // Placeholder
      )}
    </div>
  );
};


const HistoryPills: React.FC<HistoryPillsProps> = ({
  historyItems,
  results,
  isGeneratingResults,
  expectedResultsCount,
  currentIndex,
  resultsBaseHistoryIndex,
  onHistorySelect,
  onResultSelect,
  isExpanded,
  onToggle,
  isMobileToolbarVisible,
  isMobile,
  isControlsVisible,
}) => {
  const { t } = useTranslation();
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const isShowingResults = results.length > 0 || isGeneratingResults;
  
  const placeholdersCount = isGeneratingResults ? Math.max(0, expectedResultsCount - results.length) : 0;
  const placeholders = Array(placeholdersCount).fill(0);
  
  // Scroll to active item when expanded (but not when generating results)
  useEffect(() => {
      if (isExpanded && !isShowingResults && activeItemRef.current) {
          activeItemRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
          });
      }
  }, [isExpanded, currentIndex, isShowingResults]);

  const activeHistoryIndexForSlicing = resultsBaseHistoryIndex !== null ? resultsBaseHistoryIndex : currentIndex;
  const visibleHistoryItems = isShowingResults ? historyItems.slice(0, activeHistoryIndexForSlicing + 1) : historyItems;
  const bottomClass = isMobileToolbarVisible ? 'bottom-20' : 'bottom-4';
  const isVisible = !isMobile || isControlsVisible;

  return (
    <div className={`fixed ${bottomClass} left-4 z-40 flex flex-col items-start gap-2 transition-all duration-300 ease-in-out ${!isVisible ? 'opacity-0 -translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div 
            className={`flex flex-col-reverse items-start gap-2 transition-all duration-300 ease-in-out hide-scrollbar ${isExpanded ? 'max-h-[calc(100vh-15rem)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}
        >
          {placeholders.map((_, index) => (
              <div key={`placeholder-${index}`} className="w-12 h-12 flex-shrink-0 rounded-full bg-white/5 flex items-center justify-center animate-fade-in">
                  <Spinner className="w-6 h-6"/>
              </div>
          ))}
          {results.map((url, index) => (
              <button
                  key={url}
                  onClick={() => onResultSelect(url, index)}
                  className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden group transition-all duration-300 ring-2 ring-cyan-400/70 hover:ring-cyan-400 bg-black/30 glow-border-animate animate-fade-in"
                  aria-label={t('selectResult', { index: index + 1 })}
              >
                  <img src={url} alt={t('resultAlt', { index: index + 1 })} className="w-full h-full object-cover transition-transform group-hover:scale-110" decoding="async" />
                  <div className="absolute top-0 right-0 bg-cyan-500/90 text-white text-[8px] font-bold py-0.5 px-1 rounded-bl-md pointer-events-none">
                      {t('new')}
                  </div>
              </button>
          ))}
          {visibleHistoryItems.map((item, index) => {
              return (
                <button
                    ref={currentIndex === index ? activeItemRef : null}
                    key={`${item.url}-${index}`}
                    onClick={() => onHistorySelect(index)}
                    className={`relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden group transition-all duration-300 ring-2
                        ${currentIndex === index && !isShowingResults ? 'ring-cyan-400 scale-110 ring-offset-2 ring-offset-black/50' : 'ring-transparent hover:ring-white/50'}`
                    }
                    aria-label={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
                    title={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
                >
                    <LazyPillImage 
                      thumbnailUrl={item.thumbnailUrl}
                      transform={item.transform}
                      alt={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
                    />
                </button>
              );
          })}
        </div>

        <button 
            onClick={onToggle}
            className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('collapseHistory') : t('expandHistory')}
        >
          {isExpanded ? <XMarkIcon className="w-7 h-7"/> : <ClockIcon className="w-7 h-7" />}
        </button>
    </div>
  );
};

export default React.memo(HistoryPills);