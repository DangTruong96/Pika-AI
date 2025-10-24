/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import type { Tab } from '../types';

export type ResultsState = {
  items: string[];
  isGenerating: boolean;
  expectedCount: number;
  sourceTab: Tab | null;
  persistentItems: string[]; // To restore results when undoing back to the generation point
  baseHistoryIndex: number | null;
};

const initialResultsState: ResultsState = {
  items: [],
  isGenerating: false,
  expectedCount: 1,
  sourceTab: null,
  persistentItems: [],
  baseHistoryIndex: null,
};

export const useResults = () => {
  const [resultsState, setResultsState] = useState<ResultsState>(initialResultsState);

  const startGeneratingResults = useCallback((count: number, sourceTab: Tab, baseHistoryIndex: number) => {
    setResultsState({
      items: [],
      persistentItems: [],
      isGenerating: true,
      expectedCount: count,
      sourceTab,
      baseHistoryIndex,
    });
  }, []);

  const addResult = useCallback((url: string) => {
    setResultsState(prevState => {
      const newItems = [...prevState.items, url].sort();
      return { ...prevState, items: newItems, persistentItems: newItems };
    });
  }, []);
  
  const finishGeneratingResults = useCallback(() => {
      setResultsState(s => ({...s, isGenerating: false}));
  }, []);

  const clearResults = useCallback(() => {
      setResultsState(s => ({...s, items: []}));
  }, []);

  const clearAllResults = useCallback(() => {
      setResultsState(initialResultsState);
  }, []);

  const restoreResults = useCallback(() => {
      setResultsState(s => ({...s, items: s.persistentItems}));
  }, []);

  return {
    resultsState,
    setResultsState,
    startGeneratingResults,
    addResult,
    finishGeneratingResults,
    clearResults,
    clearAllResults,
    restoreResults,
  };
};
