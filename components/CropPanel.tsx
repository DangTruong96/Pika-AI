/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from '../contexts/LanguageContext';
import type { Tab } from '../types';
import { centeredRectForAspect, rectToPixels, type CropRect, type PixelSize } from '../utils/cropMath';
import { SegmentedControl } from './IdPhotoPanel';
import { BrushIcon, ExpandIcon, ViewfinderCircleIcon } from './icons';

interface CropPanelProps {
    currentImage: string | null;
    imageDimensions: { width: number; height: number } | null;
    isLoading: boolean;
    isImageLoaded: boolean;
    onApplyCrop: (dataUrl: string) => void;
    onApplyCropAndEnhance: (dataUrl: string) => void;
    setActiveTab: (tab: Tab) => void;
    onToggleToolbox: () => void;
    isMobile?: boolean;
}

type AspectPresetId = 'free' | 'original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

const FIXED_ASPECTS: Record<Exclude<AspectPresetId, 'free' | 'original'>, number> = {
    '1:1': 1,
    '4:3': 4 / 3,
    '3:4': 3 / 4,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
};

/** Pixel-space aspect (width / height) for a preset, or undefined for free-form. */
const resolveAspect = (id: AspectPresetId, dimensions: PixelSize | null): number | undefined => {
    if (id === 'free') return undefined;
    if (id === 'original') {
        return dimensions && dimensions.height > 0 ? dimensions.width / dimensions.height : undefined;
    }
    return FIXED_ASPECTS[id];
};

const percentCropForRect = (rect: CropRect): PercentCrop => ({
    unit: '%',
    x: rect.x * 100,
    y: rect.y * 100,
    width: rect.width * 100,
    height: rect.height * 100,
});

const CropPanel: React.FC<CropPanelProps> = ({
    currentImage,
    imageDimensions,
    isLoading,
    isImageLoaded,
    onApplyCrop,
    onApplyCropAndEnhance,
    setActiveTab,
    onToggleToolbox,
    isMobile,
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const [aspectId, setAspectId] = useState<AspectPresetId>('free');
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const [completedPercentCrop, setCompletedPercentCrop] = useState<PercentCrop | null>(null);

    // A new image starts with a fresh, free-form selection.
    useEffect(() => {
        setAspectId('free');
        setCrop(undefined);
        setCompletedPercentCrop(null);
    }, [currentImage]);

    const initializeCropForAspect = useCallback(
        (id: AspectPresetId, dimensions: PixelSize | null) => {
            const aspect = resolveAspect(id, dimensions);
            if (aspect === undefined || !dimensions) return;
            const percentCrop = percentCropForRect(centeredRectForAspect(dimensions, aspect));
            setCrop(percentCrop);
            setCompletedPercentCrop(percentCrop);
        },
        [],
    );

    // If dimensions arrive after a preset was picked, initialize the crop then.
    useEffect(() => {
        if (aspectId === 'free' || crop !== undefined || !imageDimensions) return;
        initializeCropForAspect(aspectId, imageDimensions);
    }, [aspectId, crop, imageDimensions, initializeCropForAspect]);

    const handleAspectSelect = useCallback(
        (id: AspectPresetId) => {
            setAspectId(id);
            if (id === 'free') {
                setCrop(undefined);
                setCompletedPercentCrop(null);
                return;
            }
            const fallbackDimensions: PixelSize | null =
                imageDimensions ??
                (imgRef.current && imgRef.current.naturalWidth > 0
                    ? { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight }
                    : null);
            initializeCropForAspect(id, fallbackDimensions);
        },
        [imageDimensions, initializeCropForAspect],
    );

    const activeAspect = resolveAspect(aspectId, imageDimensions);

    const aspectOptions = useMemo(
        () => [
            { value: 'free' as AspectPresetId, label: t('cropAspectFree') },
            { value: 'original' as AspectPresetId, label: t('cropAspectOriginal') },
            { value: '1:1' as AspectPresetId, label: '1:1' },
            { value: '4:3' as AspectPresetId, label: '4:3' },
            { value: '3:4' as AspectPresetId, label: '3:4' },
            { value: '16:9' as AspectPresetId, label: '16:9' },
            { value: '9:16' as AspectPresetId, label: '9:16' },
        ],
        [t],
    );

    /**
     * Draws the selected region (or the full image when nothing is selected)
     * onto a canvas at natural resolution and returns it as a PNG data URL.
     */
    const buildCroppedDataUrl = useCallback((): string | null => {
        const img = imgRef.current;
        if (!img || !currentImage || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
            return null;
        }
        const natural: PixelSize = imageDimensions ?? { width: img.naturalWidth, height: img.naturalHeight };

        const hasSelection =
            completedPercentCrop !== null && completedPercentCrop.width > 0 && completedPercentCrop.height > 0;
        const relativeRect: CropRect = hasSelection
            ? {
                  x: completedPercentCrop.x / 100,
                  y: completedPercentCrop.y / 100,
                  width: completedPercentCrop.width / 100,
                  height: completedPercentCrop.height / 100,
              }
            : { x: 0, y: 0, width: 1, height: 1 };

        const { sx, sy, sw, sh } = rectToPixels(relativeRect, natural);
        if (sw <= 0 || sh <= 0) {
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        return canvas.toDataURL('image/png');
    }, [completedPercentCrop, currentImage, imageDimensions]);

    const handleApply = useCallback(() => {
        const dataUrl = buildCroppedDataUrl();
        if (dataUrl) {
            onApplyCrop(dataUrl);
        }
    }, [buildCroppedDataUrl, onApplyCrop]);

    const handleApplyEnhance = useCallback(() => {
        const dataUrl = buildCroppedDataUrl();
        if (dataUrl) {
            onApplyCropAndEnhance(dataUrl);
        }
    }, [buildCroppedDataUrl, onApplyCropAndEnhance]);

    const titleContent = (
        <>
            <ViewfinderCircleIcon className="w-6 h-6" />
            <span>{t('cropTitle')}</span>
        </>
    );
    const commonTitleClasses =
        'text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 bg-black/20 rounded-full px-6 py-2 border border-white/10';

    const controlsDisabled = isLoading || !isImageLoaded || !currentImage;

    return (
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="w-full flex items-center justify-between">
                <button
                    onClick={() => setActiveTab('retouch')}
                    className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('cropTitle')}
                    disabled={isLoading}
                    aria-label={t('cropTitle')}
                >
                    <BrushIcon className="w-6 h-6" />
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
                    title={t('cropTitle')}
                    disabled={isLoading}
                    aria-label={t('cropTitle')}
                >
                    <ExpandIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-sm text-gray-400 -mt-2 text-center">{t('cropDesc')}</p>

            <div className="w-full flex flex-col gap-4">
                <SegmentedControl
                    label={t('cropAspectLabel')}
                    options={aspectOptions}
                    selected={aspectId}
                    onSelect={handleAspectSelect}
                    disabled={controlsDisabled}
                />

                {currentImage ? (
                    <div className="w-full flex justify-center bg-black/20 border border-white/10 rounded-xl p-2 overflow-hidden">
                        <ReactCrop
                            crop={crop}
                            onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                            onComplete={(_pixelCrop, percentCrop) => setCompletedPercentCrop(percentCrop)}
                            aspect={activeAspect}
                            disabled={controlsDisabled}
                            keepSelection
                            className="max-w-full"
                        >
                            <img
                                ref={imgRef}
                                src={currentImage}
                                alt={t('cropTitle')}
                                className="max-w-full h-auto"
                                draggable={false}
                            />
                        </ReactCrop>
                    </div>
                ) : null}

                <p className="text-xs text-center text-gray-400">{t('cropHint')}</p>

                <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                        onClick={handleApply}
                        disabled={controlsDisabled}
                        className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    >
                        {t('cropApply')}
                    </button>
                    <button
                        onClick={handleApplyEnhance}
                        disabled={controlsDisabled}
                        className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-400/20 hover:shadow-xl hover:shadow-purple-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
                    >
                        {t('cropApplyEnhance')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CropPanel);
