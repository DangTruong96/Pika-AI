/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useReducer, useMemo } from 'react';

// --- TYPES ---
export type TransformState = {
  rotate: number;
  scaleX: 1 | -1;
  scaleY: 1 | -1;
};
export const initialTransformState: TransformState = { rotate: 0, scaleX: 1, scaleY: 1 };

export type HistoryItem = {
  file: File;
  url: string;
  transform: TransformState;
};

type HistoryState = {
  items: HistoryItem[];
  currentIndex: number;
};
const initialHistoryState: HistoryState = { items: [], currentIndex: -1 };

export type HistoryAction =
  | { type: 'PUSH'; payload: { item: HistoryItem } }
  | { type: 'UNDO'; payload: { resultsBaseIndex: number | null } }
  | { type: 'REDO' }
  | { type: 'SELECT'; payload: { index: number } }
  | { type: 'SET_FROM_RESULT'; payload: { baseIndex: number; item: HistoryItem } }
  | { type: 'RESET_TO_FIRST' }
  | { type: 'RESET_ALL' };

// --- REDUCER ---
function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const newHistory = state.items.slice(0, state.currentIndex + 1);
      // Revoke URLs for items that are being discarded
      state.items.slice(state.currentIndex + 1).forEach(item => URL.revokeObjectURL(item.url));
      newHistory.push(action.payload.item);
      return {
        items: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }
    case 'UNDO': {
        if (state.currentIndex <= 0) return state;
        const { resultsBaseIndex } = action.payload;
        // If we are undoing past a result generation point, jump back to that point
        const isAfterResultGeneration = resultsBaseIndex !== null && state.currentIndex > resultsBaseIndex;
        const newIndex = isAfterResultGeneration ? resultsBaseIndex : state.currentIndex - 1;
        return { ...state, currentIndex: newIndex };
    }
    case 'REDO': {
        if (state.currentIndex >= state.items.length - 1) return state;
        return { ...state, currentIndex: state.currentIndex + 1 };
    }
    case 'SELECT': {
        if (action.payload.index < 0 || action.payload.index >= state.items.length) return state;
        return { ...state, currentIndex: action.payload.index };
    }
    case 'SET_FROM_RESULT': {
        const { baseIndex, item } = action.payload;
        const newHistory = state.items.slice(0, baseIndex + 1);
        state.items.slice(baseIndex + 1).forEach(i => URL.revokeObjectURL(i.url));
        newHistory.push(item);
        return {
            items: newHistory,
            currentIndex: newHistory.length - 1,
        };
    }
    case 'RESET_TO_FIRST': {
        if (state.items.length > 1) {
            state.items.slice(1).forEach(item => URL.revokeObjectURL(item.url));
            return {
                items: [state.items[0]],
                currentIndex: 0,
            };
        }
        return state;
    }
    case 'RESET_ALL': {
        state.items.forEach(item => URL.revokeObjectURL(item.url));
        return initialHistoryState;
    }
    default:
      return state;
  }
}

// --- HOOK ---
export const useHistory = () => {
    const [historyState, dispatch] = useReducer(historyReducer, initialHistoryState);
    const { items, currentIndex } = historyState;

    const currentHistoryItem = useMemo(() => items[currentIndex] ?? null, [items, currentIndex]);
    const beforeHistoryItem = useMemo(() => items[currentIndex - 1] ?? null, [items, currentIndex]);
    const canUndo = useMemo(() => currentIndex > 0, [currentIndex]);
    const canRedo = useMemo(() => currentIndex < items.length - 1, [currentIndex, items.length]);

    // The reducer now handles all URL revocation logic during the app's lifecycle.
    // This prevents a bug where URLs were revoked prematurely. Browser garbage collection
    // will handle object URLs when the page is closed.

    return {
        history: items,
        historyIndex: currentIndex,
        currentHistoryItem,
        beforeHistoryItem,
        canUndo,
        canRedo,
        historyDispatch: dispatch,
    };
};
