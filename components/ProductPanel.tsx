/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import type { Tab } from '../types';
import type { ProductOperation } from '../services/productService';
import { CameraIcon, SparklesIcon, UsersIcon } from './icons';

interface ProductPanelProps {
    onApplyProduct: (operation: ProductOperation) => void;
    isLoading: boolean;
    isImageLoaded: boolean;
    setActiveTab: (tab: Tab) => void;
    onToggleToolbox: () => void;
    isMobile?: boolean;
}

const ProductPanel: React.FC<ProductPanelProps> = ({
    onApplyProduct,
    isLoading,
    isImageLoaded,
    setActiveTab,
    onToggleToolbox,
    isMobile,
}) => {
    const { t } = useTranslation();
    const [operation, setOperation] = useState<ProductOperation>('remove-bg');

    const operationOptions = useMemo(
        () => [
            { value: 'remove-bg' as ProductOperation, label: t('productOpRemoveBg') },
            { value: 'white-bg' as ProductOperation, label: t('productOpWhiteBg') },
            { value: 'shadow' as ProductOperation, label: t('productOpShadow') },
            { value: 'enhance' as ProductOperation, label: t('productOpEnhance') },
        ],
        [t],
    );

    const titleContent = (
        <>
            <CameraIcon className="w-6 h-6" />
            <span>{t('productTitle')}</span>
        </>
    );
    const commonTitleClasses =
        'text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10';

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="w-full flex items-center justify-between">
                <button
                    onClick={() => setActiveTab('studio')}
                    className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('productTitle')}
                    disabled={isLoading}
                    aria-label={t('productTitle')}
                >
                    <UsersIcon className="w-6 h-6" />
                </button>
                {isMobile ? (
                    <button onClick={onToggleToolbox} className={`${commonTitleClasses} transition-colors hover:bg-black/40`}>
                        {titleContent}
                    </button>
                ) : (
                    <h3 className={commonTitleClasses}>{titleContent}</h3>
                )}
                <button
                    onClick={() => setActiveTab('adjust')}
                    className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('productTitle')}
                    disabled={isLoading}
                    aria-label={t('productTitle')}
                >
                    <SparklesIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('productDesc')}</p>

            <div className="w-full flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 w-full">
                    {operationOptions.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setOperation(value)}
                            disabled={isLoading || !isImageLoaded}
                            aria-pressed={operation === value}
                            className={`px-3 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-11 flex items-center justify-center text-center ${
                                operation === value
                                    ? 'bg-cyan-500/20 border-cyan-400/60 text-white shadow-sm shadow-cyan-400/20'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onApplyProduct(operation)}
                    disabled={isLoading || !isImageLoaded}
                    className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10 mt-2"
                >
                    {t('productApply')}
                </button>
            </div>
        </div>
    );
};

export default React.memo(ProductPanel);
