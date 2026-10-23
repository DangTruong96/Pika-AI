/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import type { Tab } from '../types';
import type { ScanMode } from '../services/scanService';
import { SegmentedControl } from './IdPhotoPanel';
import { DocumentScannerIcon, ExpandIcon, IdCardIcon } from './icons';

interface ScanPanelProps {
    onApplyScan: (mode: ScanMode) => void;
    isLoading: boolean;
    isImageLoaded: boolean;
    setActiveTab: (tab: Tab) => void;
    onToggleToolbox: () => void;
    isMobile?: boolean;
}

const ScanPanel: React.FC<ScanPanelProps> = ({
    onApplyScan,
    isLoading,
    isImageLoaded,
    setActiveTab,
    onToggleToolbox,
    isMobile,
}) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<ScanMode>('cleanup');

    const modeOptions = useMemo(
        () => [
            { value: 'cleanup' as ScanMode, label: t('scanModeCleanup') },
            { value: 'enhance' as ScanMode, label: t('scanModeEnhance') },
        ],
        [t],
    );

    const titleContent = (
        <>
            <DocumentScannerIcon className="w-6 h-6" />
            <span>{t('scanTitle')}</span>
        </>
    );
    const commonTitleClasses =
        'text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10';

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="w-full flex items-center justify-between">
                <button
                    onClick={() => setActiveTab('idphoto')}
                    className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('scanTitle')}
                    disabled={isLoading}
                    aria-label={t('scanTitle')}
                >
                    <IdCardIcon className="w-6 h-6" />
                </button>
                {isMobile ? (
                    <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
                        {titleContent}
                    </button>
                ) : (
                    <h3 className={commonTitleClasses}>{titleContent}</h3>
                )}
                <button
                    onClick={() => setActiveTab('expand')}
                    className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('scanTitle')}
                    disabled={isLoading}
                    aria-label={t('scanTitle')}
                >
                    <ExpandIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('scanDesc')}</p>

            <div className="w-full flex flex-col gap-4">
                <SegmentedControl
                    options={modeOptions}
                    selected={mode}
                    onSelect={(value) => setMode(value)}
                    disabled={isLoading || !isImageLoaded}
                    fullWidth
                />

                <p className="text-xs text-center text-gray-400 bg-black/20 p-2 rounded-lg">{t('scanNote')}</p>

                <button
                    onClick={() => onApplyScan(mode)}
                    disabled={isLoading || !isImageLoaded}
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10 mt-2"
                >
                    {t('scanApply')}
                </button>
            </div>
        </div>
    );
};

export default React.memo(ScanPanel);
