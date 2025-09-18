/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { SparklesIcon, SunIcon, UserCircleIcon, XMarkIcon } from './icons';
import Spinner from './Spinner';

// Fix: Define the Suggestion type locally as it is no longer exported from geminiService.
export type Suggestion = {
    id: 'restore_face' | 'fix_lighting' | 'portrait_tools';
};

interface SuggestionBarProps {
  suggestions: Suggestion[];
  isAnalyzing: boolean;
  onApply: (id: Suggestion['id']) => void;
  onDismiss: () => void;
}

// Fix: Changed JSX.Element to React.ReactElement to resolve JSX namespace error.
const suggestionConfig: Record<Suggestion['id'], { icon: React.FC<{ className?: string }>; labelKey: 'suggestionRestoreFace' | 'suggestionFixLighting' | 'suggestionPortraitTools' }> = {
    'restore_face': {
        icon: SparklesIcon,
        labelKey: 'suggestionRestoreFace',
    },
    'fix_lighting': {
        icon: SunIcon,
        labelKey: 'suggestionFixLighting',
    },
    'portrait_tools': {
        icon: UserCircleIcon,
        labelKey: 'suggestionPortraitTools',
    }
};

const SuggestionBar: React.FC<SuggestionBarProps> = ({ suggestions, isAnalyzing, onApply, onDismiss }) => {
    const { t } = useTranslation();

    const renderContent = () => {
        if (isAnalyzing) {
            return (
                <div className="flex items-center gap-2 text-sm">
                    <Spinner className="w-4 h-4" />
                    <span className="text-gray-300">Analyzing...</span>
                </div>
            );
        }

        if (suggestions.length === 0) {
            return null;
        }

        return (
            <>
                <span className="text-sm font-semibold text-cyan-300 px-3 hidden sm:block">{t('suggestionTitle')}</span>
                {suggestions.map(suggestion => {
                    const config = suggestionConfig[suggestion.id];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                        <button
                            key={suggestion.id}
                            onClick={() => onApply(suggestion.id)}
                            className="flex items-center justify-center text-white bg-white/5 hover:bg-white/15 p-2.5 sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-colors duration-200"
                            title={t(config.labelKey)}
                        >
                            {/* Fix: Replaced React.cloneElement with direct component rendering to fix type error. */}
                            <Icon className="w-5 h-5" />
                            <span className="hidden sm:inline sm:ml-2">{t(config.labelKey)}</span>
                        </button>
                    );
                })}
                <button 
                    onClick={onDismiss}
                    className="p-2.5 bg-white/5 hover:bg-white/15 rounded-full text-gray-400 hover:text-white transition-colors"
                    aria-label={t('suggestionDismiss')}
                    title={t('suggestionDismiss')}
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </>
        );
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-[90%] bg-black/50 backdrop-blur-xl rounded-full p-1.5 sm:p-2 flex items-center justify-center gap-2 shadow-2xl border border-white/10 animate-fade-in z-30">
            {renderContent()}
        </div>
    );
};

export default SuggestionBar;
