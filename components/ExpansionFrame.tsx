/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useLayoutEffect, useMemo } from 'react';
import type { ExpansionHandle } from '../types';

interface ExpansionFrameProps {
  imgRef: React.RefObject<HTMLImageElement>;
  padding: { top: number; right: number; bottom: number; left: number };
  onDragStart: (e: React.MouseEvent | React.TouchEvent, handle: ExpansionHandle) => void;
}

const getHandleStyle = (handle: ExpansionHandle): React.CSSProperties => {
  const style: React.CSSProperties = { transform: 'translate(-50%, -50%)', zIndex: 1 };
  
  if (handle.includes('top')) style.top = '0%';
  if (handle.includes('bottom')) style.top = '100%';
  if (handle.includes('left')) style.left = '0%';
  if (handle.includes('right')) style.left = '100%';
  
  if (handle === 'top' || handle === 'bottom') {
    style.left = '50%';
    style.cursor = 'ns-resize';
  }
  if (handle === 'left' || handle === 'right') {
    style.top = '50%';
    style.cursor = 'ew-resize';
  }

  if (handle === 'tl' || handle === 'br') style.cursor = 'nwse-resize';
  if (handle === 'tr' || handle === 'bl') style.cursor = 'nesw-resize';
  
  return style;
};

const ExpansionFrame: React.FC<ExpansionFrameProps> = ({ imgRef, padding, onDragStart }) => {
    const [imgRect, setImgRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    useLayoutEffect(() => {
        const img = imgRef.current;
        if (img) {
            const updateRect = () => {
                if (img.offsetWidth > 0 && img.offsetHeight > 0) {
                    setImgRect({
                        top: img.offsetTop,
                        left: img.offsetLeft,
                        width: img.offsetWidth,
                        height: img.offsetHeight,
                    });
                }
            };

            const observer = new ResizeObserver(updateRect);
            observer.observe(img);

            const resizingParent = img.closest('.transition-all');
            if (resizingParent) {
                resizingParent.addEventListener('transitionend', updateRect);
            }
            
            if (img.complete && img.offsetWidth > 0) {
              updateRect();
            } else {
              img.onload = updateRect;
            }
            return () => {
              observer.disconnect();
              if (img) {
                img.onload = null;
              }
              if (resizingParent) {
                resizingParent.removeEventListener('transitionend', updateRect);
              }
            };
        }
    }, [imgRef]);

    const frameProps = useMemo(() => {
        if (!imgRect || !imgRef.current || !imgRef.current.naturalWidth || !imgRef.current.naturalHeight) return null;
    
        const scaleX = imgRect.width / imgRef.current.naturalWidth;
        const scaleY = imgRect.height / imgRef.current.naturalHeight;
    
        const scaledPadding = {
            top: padding.top * scaleY,
            bottom: padding.bottom * scaleY,
            left: padding.left * scaleX,
            right: padding.right * scaleX,
        };
    
        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${imgRect.top - scaledPadding.top}px`,
            left: `${imgRect.left - scaledPadding.left}px`,
            width: `${imgRect.width + scaledPadding.left + scaledPadding.right}px`,
            height: `${imgRect.height + scaledPadding.top + scaledPadding.bottom}px`,
        };
        return { style };

    }, [imgRect, imgRef, padding]);
    
    if (!frameProps) return null;

    const handles: ExpansionHandle[] = ['tl', 'top', 'tr', 'left', 'right', 'bl', 'bottom', 'br'];
    
    return (
        <div style={frameProps.style} className="pointer-events-none">
            <div className="absolute inset-0 border-2 border-cyan-400 border-dashed rounded-md animate-pulse-slow" />
            {handles.map(handle => (
                <div
                    key={handle}
                    className="absolute w-4 h-4 bg-cyan-400 rounded-full border-2 border-black pointer-events-auto cursor-grab active:cursor-grabbing shadow-md"
                    style={getHandleStyle(handle)}
                    onMouseDown={e => onDragStart(e, handle)}
                    onTouchStart={e => onDragStart(e, handle)}
                    aria-label={`drag to expand ${handle}`}
                />
            ))}
        </div>
    );
};

export default React.memo(ExpansionFrame);