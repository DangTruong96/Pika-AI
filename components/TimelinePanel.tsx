/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import Spinner from './Spinner';
import { DownloadIcon, ChevronDownIcon, ClockIcon, ChevronUpIcon } from './icons';

export type TimelineItem = 
  | { type: 'history'; data: { file: File; index: number }; key: string }
  | { type: 'result'; data: { url: string }; key: string }
  | { type: 'placeholder'; data: {}; key: string };

interface TimelinePanelProps {
  items: TimelineItem[];
  currentIndex: number;
  isLoading: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onItemClick: (item: TimelineItem) => void;
  onDownloadResult: (url: string, index: number) => void;
  hasNewResults: boolean;
  isOffsetForToolbar?: boolean;
  isOffsetForInputBar?: boolean;
}


const MiniaturePreview: React.FC<{ file: File | null }> = ({ file }) => {
    const [url, setUrl] = React.useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) {
        return (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-gray-400"/>
            </div>
        );
    }

    return <img src={url} className="w-10 h-10 rounded-full object-cover border-2 border-white/50" alt="Current step" />;
};

const HistoryItem: React.FC<{
  item: Extract<TimelineItem, { type: 'history' }>;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const { t } = useTranslation();
  const { file, index } = item.data;
  const [url, setUrl] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Scroll into view if active
  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [isActive]);

  if (!url) return null;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative w-28 h-36 md:w-40 md:h-52 flex-shrink-0 rounded-xl overflow-hidden group transition-all duration-300 ring-2 bg-black/30 animate-fade-in
        ${isActive ? 'ring-cyan-400 scale-105 shadow-lg' : 'ring-transparent hover:ring-white/50 opacity-80 hover:opacity-100'}`}
      aria-label={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
      title={index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
    >
      <img src={url} alt={t('historyStep', { step: index })} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <span className="text-white text-xs font-bold drop-shadow-md">
          {index === 0 ? t('historyOriginal') : t('historyStep', { step: index })}
        </span>
      </div>
    </button>
  );
};

const ResultItem: React.FC<{
  item: Extract<TimelineItem, { type: 'result' }>;
  index: number;
  onClick: () => void;
  onDownload: () => void;
}> = ({ item, index, onClick, onDownload }) => {
  const { t } = useTranslation();
  const { url } = item.data;

  return (
    <button
      onClick={onClick}
      className={`relative w-28 h-36 md:w-40 md:h-52 flex-shrink-0 rounded-xl overflow-hidden group transition-all duration-300 ring-2 ring-cyan-400/70 hover:ring-cyan-400 bg-black/30 animate-fade-in cursor-pointer glow-border-animate`}
    >
      <img src={url} alt={`Result ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1.5 gap-1.5">
        <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="p-1.5 bg-white/10 backdrop-blur-md text-white rounded-md hover:bg-white/20" title={t('studioDownloadResult')}><DownloadIcon className="w-4 h-4"/></button>
      </div>
       <div className="absolute top-1.5 left-1.5 bg-cyan-500/80 text-white text-xs font-bold py-0.5 px-2 rounded-full pointer-events-none">
        NEW
      </div>
    </button>
  );
};

const PlaceholderItem: React.FC = () => {
  return (
    <div className={`flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center animate-fade-in w-28 h-36 md:w-40 md:h-52`}>
      <Spinner className="w-8 h-8"/>
    </div>
  );
};

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ 
  items, currentIndex, isOpen, onToggleOpen,
  onItemClick, onDownloadResult, hasNewResults,
  isOffsetForToolbar = false, isOffsetForInputBar = false
}) => {
  const { t } = useTranslation();

  const getBottomClass = () => {
      if (isOffsetForInputBar) return 'bottom-[74px]'; // Approx height of mobile input bar
      if (isOffsetForToolbar) return 'bottom-[84px]'; // Height of dynamic toolbar
      return 'bottom-2';
  };
  
  if (items.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <button 
        onClick={onToggleOpen}
        className={`fixed ${getBottomClass()} left-2 md:bottom-4 md:left-4 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl w-12 h-12 shadow-2xl transition-all duration-300 ease-in-out hover:bg-black/60 hover:border-white/20 animate-fade-in ${hasNewResults ? 'glow-border-animate' : ''}`}
        aria-label="Open Timeline"
      >
        <ChevronUpIcon className="w-6 h-6 text-white" />
      </button>
    );
  }
  
  return (
    <div className={`fixed ${getBottomClass()} left-2 right-2 md:left-4 md:right-auto md:w-auto max-w-full z-50 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 md:p-3 shadow-2xl animate-fade-in transition-all duration-300 ease-in-out`}>
        <button
          onClick={onToggleOpen}
          className="w-full flex justify-between items-center mb-2 md:mb-3 px-1 text-left"
          aria-expanded={isOpen}
          aria-controls="timeline-content"
        >
            <h3 className="text-md font-semibold text-gray-200">Timeline</h3>
            <div 
                className={`p-1.5 bg-white/5 text-gray-200 rounded-lg transition-transform duration-300 ${isOpen ? '' : '-rotate-180'}`}
            >
                <ChevronDownIcon className="w-5 h-5"/>
            </div>
        </button>
        <div id="timeline-content" className="flex overflow-x-auto pb-2 gap-3 max-w-[calc(100vw-3rem)] md:max-w-2xl lg:max-w-3xl">
            {items.map((item, index) => {
              switch (item.type) {
                case 'history':
                  return (
                    <HistoryItem
                      key={item.key}
                      item={item}
                      isActive={item.data.index === currentIndex}
                      onClick={() => onItemClick(item)}
                    />
                  );
                case 'result':
                  return (
                    <ResultItem
                      key={item.key}
                      item={item}
                      index={index}
                      onClick={() => onItemClick(item)}
                      onDownload={() => onDownloadResult(item.data.url, index)}
                    />
                  );
                case 'placeholder':
                   return <PlaceholderItem key={item.key} />;
                default:
                  return null;
              }
            })}
        </div>
    </div>
  );
};