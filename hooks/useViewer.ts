/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Added missing React import to resolve errors with event types.
import React, { useReducer, useCallback, useRef, useState, useEffect } from 'react';

// --- TYPES & REDUCER ---
type ViewerState = {
  scale: number;
  position: { x: number; y: number; };
  isPanning: boolean;
  panStart: { startX: number; startY: number; initialPosition: { x: number; y: number; }; } | null;
};
const initialViewerState: ViewerState = { scale: 1, position: { x: 0, y: 0 }, isPanning: false, panStart: null };

type ViewerAction =
  | { type: 'ZOOM'; payload: { direction: 'in' | 'out'; amount?: number; }; }
  | { type: 'SET_SCALE'; payload: { scale: number; }; }
  | { type: 'START_PAN'; payload: { clientX: number; clientY: number; }; }
  | { type: 'PAN'; payload: { clientX: number; clientY: number; }; }
  | { type: 'END_PAN'; }
  | { type: 'RESET'; };

function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'ZOOM': {
      const amount = action.payload.amount || 0.2;
      const newScale = action.payload.direction === 'in'
        ? state.scale * (1 + amount)
        : state.scale / (1 + amount);
      return { ...state, scale: Math.max(0.2, Math.min(newScale, 10)) };
    }
    case 'SET_SCALE': {
        return { ...state, scale: Math.max(0.2, Math.min(action.payload.scale, 10)) };
    }
    case 'START_PAN': {
      return {
        ...state,
        isPanning: true,
        panStart: {
          startX: action.payload.clientX,
          startY: action.payload.clientY,
          initialPosition: { ...state.position }
        }
      };
    }
    case 'PAN': {
      if (!state.isPanning || !state.panStart) return state;
      const dx = action.payload.clientX - state.panStart.startX;
      const dy = action.payload.clientY - state.panStart.startY;
      return {
        ...state,
        position: {
          x: state.panStart.initialPosition.x + dx,
          y: state.panStart.initialPosition.y + dy,
        }
      };
    }
    case 'END_PAN': {
      return { ...state, isPanning: false, panStart: null };
    }
    case 'RESET':
      return initialViewerState;
    default:
      return state;
  }
}

interface UseViewerProps {
    isComparing: boolean;
    isMobile: boolean;
    isImageLoaded: boolean;
    isToolboxOpen: boolean;
    toggleToolbox: () => void;
    windowHeight: number;
    showControls: () => void;
}

// --- HOOK ---
export const useViewer = ({ isComparing, isMobile, isImageLoaded, isToolboxOpen, toggleToolbox, windowHeight, showControls }: UseViewerProps) => {
    const [viewerState, dispatch] = useReducer(viewerReducer, initialViewerState);
    const { scale, position, isPanning } = viewerState;

    const [isPinching, setIsPinching] = useState(false);
    
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);
    const touchStartTimeRef = useRef<number>(0);
    const interactionTimeoutRef = useRef<number | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const swipeUpToOpenToolsRef = useRef<{ y: number } | null>(null);

    const reportInteraction = useCallback(() => {
        if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current);
        setIsInteracting(true);
        interactionTimeoutRef.current = window.setTimeout(() => setIsInteracting(false), 300);
    }, []);
    
    // Cleanup timeouts on unmount
    useEffect(() => () => {
        if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current);
    }, []);

    const resetView = useCallback(() => dispatch({ type: 'RESET' }), []);
    
    useEffect(() => {
        if (isComparing) resetView();
    }, [isComparing, resetView]);

    const handleZoom = useCallback((direction: 'in' | 'out', amount: number = 0.2) => {
        reportInteraction();
        showControls();
        dispatch({ type: 'ZOOM', payload: { direction, amount } });
    }, [reportInteraction, showControls]);

    const handleViewerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        dispatch({ type: 'START_PAN', payload: { clientX: e.clientX, clientY: e.clientY } });
        showControls();
        reportInteraction();
    };
    
    const handleViewerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        dispatch({ type: 'PAN', payload: { clientX: e.clientX, clientY: e.clientY } });
    };

    const handleViewerMouseUp = () => dispatch({ type: 'END_PAN' });

    const handleViewerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        dispatch({ type: 'ZOOM', payload: { direction: e.deltaY < 0 ? 'in' : 'out', amount: 0.1 } });
        showControls();
        reportInteraction();
    };
    
    const handleViewerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isMobile && !isToolboxOpen && e.touches.length === 1) {
            if (e.touches[0].clientY > windowHeight * 0.8) { 
                swipeUpToOpenToolsRef.current = { y: e.touches[0].clientY };
                return;
            }
        }
        swipeUpToOpenToolsRef.current = null;

        showControls();
        reportInteraction();
        
        if (e.touches.length === 2) {
            e.preventDefault();
            pinchStartDistRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            pinchStartScaleRef.current = scale;
            dispatch({ type: 'END_PAN' });
            setIsPinching(true);
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - touchStartTimeRef.current < 300) { // Double tap
                e.preventDefault();
                if (scale > 1) resetView(); else dispatch({ type: 'SET_SCALE', payload: { scale: 2.5 } });
                touchStartTimeRef.current = 0; // Reset after double tap
            } else {
                touchStartTimeRef.current = now;
                if (scale > 1) { // Only start pan if zoomed
                    dispatch({ type: 'START_PAN', payload: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }});
                }
            }
        }
    };
    
    const handleViewerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (swipeUpToOpenToolsRef.current) {
            e.preventDefault();
            return;
        }

        if (e.touches.length === 2 && pinchStartDistRef.current !== null) { // Pinching
            e.preventDefault();
            const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const newScale = pinchStartScaleRef.current * (newDist / pinchStartDistRef.current);
            dispatch({ type: 'SET_SCALE', payload: { scale: newScale } });
        } else if (isPanning && e.touches.length === 1) { // Panning (only happens if scale > 1)
            e.preventDefault();
            dispatch({ type: 'PAN', payload: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }});
        }
    };

    const handleViewerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (swipeUpToOpenToolsRef.current && e.changedTouches.length === 1) {
            const deltaY = e.changedTouches[0].clientY - swipeUpToOpenToolsRef.current.y;
            if (deltaY < -50) { // Swiped up by at least 50px
                toggleToolbox();
            }
            swipeUpToOpenToolsRef.current = null;
            return;
        }

        dispatch({ type: 'END_PAN' });
        pinchStartDistRef.current = null;
        setIsPinching(false);
    };

    return {
        scale,
        position,
        isPanning,
        isPinching,
        isInteracting,
        resetView,
        handleZoom,
        handleViewerMouseDown,
        handleViewerMouseMove,
        handleViewerMouseUp,
        handleViewerWheel,
        handleViewerTouchStart,
        handleViewerTouchMove,
        handleViewerTouchEnd,
    };
};
