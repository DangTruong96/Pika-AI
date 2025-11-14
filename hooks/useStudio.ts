/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  generatePhotoshootImage, generateCompositeImage, generatePromptFromStyleImage, 
  generateCreativePrompt, inferOutfitFromPrompt, generateOutfitDescriptionFromFiles, 
  type GroundingChunk
} from '../services/geminiService';
import { initialTransformState } from '../types';
import type { FullscreenViewerState, Tab, TransformState } from '../types';
import type { TranslationKey } from '../translations';
import { useResults } from './useResults';

type StudioHookProps = {
  currentImage: File | null;
  getCommittedImage: () => Promise<File>;
  addImageToHistory: (newImageFile: File) => Promise<void>;
  setUiState: React.Dispatch<React.SetStateAction<{ isLoading: boolean; loadingMessage: string; error: string | null; }>>;
  setPendingAction: React.Dispatch<React.SetStateAction<{ action: 'openViewerForNewItem'; } | null>>;
  handleApiError: (err: unknown, contextKey: TranslationKey) => void;
  onEditComplete: () => void;
  isMobile: boolean;
  resultsManager: ReturnType<typeof useResults>;
  openFullScreenViewer: (items: Array<{ url: string; transform: TransformState; }>, index: number, type: FullscreenViewerState['type'], context?: FullscreenViewerState['context']) => void;
  t: (key: TranslationKey, replacements?: { [key: string]: string | number; }) => string;
  historyIndex: number;
  activeTab: Tab;
  setToolboxState: React.Dispatch<React.SetStateAction<{ activeTab: Tab; isOpen: boolean; }>>;
  setIsHistoryExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setSources: React.Dispatch<React.SetStateAction<GroundingChunk[]>>;
  studioSubjects: File[];
  updateStudioSubjectsInHistory: (newSubjects: File[]) => Promise<void>;
};

export const useStudio = ({
  setUiState, 
  handleApiError, 
  resultsManager, 
  isMobile, 
  openFullScreenViewer, 
  t, 
  historyIndex, 
  activeTab, 
  setToolboxState, 
  setIsHistoryExpanded,
  setSources,
  studioSubjects,
  updateStudioSubjectsInHistory,
}: StudioHookProps) => {
  const [studioState, setStudioState] = useState({
    prompt: '',
    styleFile: null as File | null,
    outfitFiles: [] as File[],
  });
  const prevStudioStyleFileRef = useRef<File | null>(null);

  const { prompt: studioPrompt, styleFile: studioStyleFile, outfitFiles: studioOutfitFiles } = studioState;

  const handleStudioAddSubject = useCallback((file: File) => {
    if (studioSubjects.length < 7) {
      updateStudioSubjectsInHistory([...studioSubjects, file]);
    }
  }, [studioSubjects, updateStudioSubjectsInHistory]);

  const handleStudioRemoveSubject = useCallback((index: number) => {
    const newSubjects = studioSubjects.filter((_, i) => i !== index);
    updateStudioSubjectsInHistory(newSubjects);
  }, [studioSubjects, updateStudioSubjectsInHistory]);

  const handleStudioAddOutfitFile = useCallback((file: File) => {
    setStudioState(s => {
      if (s.outfitFiles.length >= 3) return s;
      return { ...s, outfitFiles: [...s.outfitFiles, file] };
    });
  }, []);

  const handleStudioRemoveOutfitFile = useCallback((index: number) => {
    setStudioState(s => ({ ...s, outfitFiles: s.outfitFiles.filter((_, i) => i !== index) }));
  }, []);

  const handleGeneratePhotoshoot = useCallback(async () => {
    if (!studioSubjects || studioSubjects.length === 0) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }
    
    setUiState({ isLoading: true, loadingMessage: t('generatePhotoshoot'), error: null });
    resultsManager.startGeneratingResults(2, activeTab, historyIndex);
    setIsHistoryExpanded(true);
    if(isMobile) setToolboxState(s => ({...s, isOpen: false}));

    try {
        let finalPrompt = studioPrompt.trim();
        
        if (!finalPrompt && studioStyleFile) {
            setUiState(s => ({...s, loadingMessage: t('loadingStyle')}));
            finalPrompt = await generatePromptFromStyleImage(studioStyleFile, false);
            setStudioState(s => ({...s, prompt: finalPrompt}));
        } else if (!finalPrompt) {
            setUiState(s => ({...s, loadingMessage: t('loadingAnalyzingScene')}));
            const { prompt: creativePrompt } = await generateCreativePrompt(studioSubjects, null, [], '');
            finalPrompt = creativePrompt;
            setStudioState(s => ({...s, prompt: finalPrompt}));
        }

        let outfitDescription: string;
        if (studioOutfitFiles.length > 0) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingOutfitStyle') }));
            outfitDescription = await generateOutfitDescriptionFromFiles(studioOutfitFiles);
        } else if (studioStyleFile) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingOutfitStyle') }));
            outfitDescription = await generatePromptFromStyleImage(studioStyleFile, true);
        } else if (finalPrompt) {
            setUiState(s => ({ ...s, loadingMessage: t('loadingInferOutfit') }));
            outfitDescription = await inferOutfitFromPrompt(finalPrompt, studioSubjects);
        } else {
            outfitDescription = "Phù hợp với bối cảnh và phong cách của cảnh được mô tả";
        }
        
        const seeds = [1, 2];
        let completedCount = 0;
        setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (0/${seeds.length})` }));
        
        let generationPromises;
        const mainStudioSubject = studioSubjects[0];
        if (studioSubjects.length > 1) {
            generationPromises = seeds.map(() => generateCompositeImage(studioSubjects, finalPrompt, outfitDescription, studioOutfitFiles));
        } else {
            generationPromises = seeds.map(() => generatePhotoshootImage(mainStudioSubject, finalPrompt, outfitDescription, studioStyleFile, studioOutfitFiles));
        }

        const allSources: GroundingChunk[] = [];
        const promises = generationPromises.map(p => p.then(response => {
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            resultsManager.addResult(response.imageUrl);
            if (response.sources) {
              allSources.push(...response.sources);
            }
            return response.imageUrl;
        }).catch(err => {
            console.warn(`Generation failed:`, err);
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            return null;
        }));
        
        const results = await Promise.all(promises);
        const successfulUrls = results.filter((url): url is string => url !== null);
        
        if (successfulUrls.length === 0) throw new Error("All photoshoot image generations failed.");

        const seenUris = new Set<string>();
        const uniqueSources = allSources.filter(s => {
          if (!s.web || !s.web.uri) return false;
          if (seenUris.has(s.web.uri)) return false;
          seenUris.add(s.web.uri);
          return true;
        });
        setSources(uniqueSources);

        if (isMobile && successfulUrls.length > 0) {
            openFullScreenViewer(successfulUrls.map(url => ({ url, transform: initialTransformState })), 0, 'result');
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      resultsManager.finishGeneratingResults();
    }
  }, [studioSubjects, studioPrompt, studioStyleFile, t, handleApiError, historyIndex, activeTab, isMobile, studioOutfitFiles, openFullScreenViewer, setUiState, resultsManager, setToolboxState, setIsHistoryExpanded, setSources]);

  const handleGenerateCreativePrompt = useCallback(async () => {
    if (!studioSubjects || studioSubjects.length === 0) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return;
    }
    setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStudioAnalysis')}));
    try {
        const { prompt: newPrompt } = await generateCreativePrompt(studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt);
        setStudioState(s => ({...s, prompt: newPrompt}));
    } catch (err) {
        handleApiError(err, 'errorFailedToProcessImage');
    } finally {
        setUiState(s => ({...s, isLoading: false}));
    }
  }, [studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt, handleApiError, t, setUiState]);

  useEffect(() => {
    if (studioStyleFile && studioStyleFile !== prevStudioStyleFileRef.current) {
        setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStyle')}));
        generatePromptFromStyleImage(studioStyleFile, false)
            .then(prompt => setStudioState(s => ({...s, prompt})))
            .catch(err => handleApiError(err, 'errorFailedToProcessImage'))
            .finally(() => setUiState(s => ({...s, isLoading: false})));
    } else if (!studioStyleFile && prevStudioStyleFileRef.current) {
        setStudioState(s => ({...s, prompt: ''}));
    }
    prevStudioStyleFileRef.current = studioStyleFile;
  }, [studioStyleFile, handleApiError, t, setUiState]);

  useEffect(() => {
    if (studioSubjects.length === 0) {
      setStudioState(s => ({ ...s, prompt: '', styleFile: null, outfitFiles: [] }));
    }
  }, [studioSubjects]);

  return {
    studioState, setStudioState,
    studioPrompt, studioStyleFile, studioOutfitFiles,
    handleGeneratePhotoshoot,
    handleStudioAddSubject,
    handleStudioRemoveSubject,
    handleStudioAddOutfitFile,
    handleStudioRemoveOutfitFile,
    handleGenerateCreativePrompt,
  };
};