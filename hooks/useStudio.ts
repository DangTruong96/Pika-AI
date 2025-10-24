/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  generatePhotoshootImage, generateCompositeImage, generatePromptFromStyleImage, 
  generateCreativePrompt, inferOutfitFromPrompt, generateOutfitDescriptionFromFiles 
} from '../services/geminiService';
import { initialTransformState } from '../types';

export const useStudio = ({
  currentImage, getCommittedImage, setUiState, 
  handleApiError, resultsManager, isMobile, openFullScreenViewer, t, 
  historyIndex, activeTab, setToolboxState, setIsHistoryExpanded
}) => {
  const [studioState, setStudioState] = useState({
    prompt: '',
    styleFile: null as File | null,
    subjects: [] as File[],
    outfitFiles: [] as File[],
  });
  const prevStudioStyleFileRef = useRef<File | null>(null);

  const { prompt: studioPrompt, styleFile: studioStyleFile, subjects: studioSubjects, outfitFiles: studioOutfitFiles } = studioState;

  const handleStudioAddSubject = useCallback((file: File) => {
    setStudioState(s => {
      if ((s.subjects.length + 1) >= 7) return s;
      return { ...s, subjects: [...s.subjects, file] };
    });
  }, []);

  const handleStudioRemoveSubject = useCallback((index: number) => {
    setStudioState(s => ({ ...s, subjects: s.subjects.filter((_, i) => i !== index) }));
  }, []);
  
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
    if (!currentImage) { setUiState(s => ({...s, error: t('errorNoImageLoaded')})); return; }

    const allSubjects = [currentImage, ...studioSubjects];
    
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
            finalPrompt = await generateCreativePrompt(allSubjects, null, [], '');
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
            outfitDescription = await inferOutfitFromPrompt(finalPrompt, allSubjects);
        } else {
            outfitDescription = "Phù hợp với bối cảnh và phong cách của cảnh được mô tả";
        }
        
        const seeds = [1, 2];
        let completedCount = 0;
        setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (0/${seeds.length})` }));
        
        let generationPromises;
        if (allSubjects.length > 1) {
            const committedSubjects = await Promise.all(allSubjects.map(async (subj, index) => {
                if (index === 0) return await getCommittedImage();
                return subj;
            }));
            generationPromises = seeds.map(() => generateCompositeImage(committedSubjects, finalPrompt, outfitDescription, studioOutfitFiles));
        } else {
            const imageToProcess = await getCommittedImage();
            generationPromises = seeds.map(() => generatePhotoshootImage(imageToProcess, finalPrompt, outfitDescription, studioStyleFile, studioOutfitFiles));
        }

        const promises = generationPromises.map(p => p.then(imageUrl => {
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            resultsManager.addResult(imageUrl);
            return imageUrl;
        }).catch(err => {
            console.warn(`Generation failed:`, err);
            completedCount++;
            setUiState(s => ({ ...s, loadingMessage: `${t('generatePhotoshoot')} (${completedCount}/${seeds.length})` }));
            return null;
        }));
        
        const results = await Promise.all(promises);
        const successfulUrls = results.filter((url): url is string => url !== null);
        
        if (successfulUrls.length === 0) throw new Error("All photoshoot image generations failed.");

        if (isMobile && successfulUrls.length > 0) {
            openFullScreenViewer(successfulUrls.map(url => ({ url, transform: initialTransformState })), 0, 'result');
        }
    } catch (err) { handleApiError(err, 'errorFailedToGenerate'); } 
    finally { 
      setUiState(s => ({...s, isLoading: false})); 
      resultsManager.finishGeneratingResults();
    }
  }, [currentImage, studioSubjects, studioPrompt, studioStyleFile, t, handleApiError, historyIndex, activeTab, isMobile, getCommittedImage, studioOutfitFiles, openFullScreenViewer, setUiState, resultsManager, setToolboxState, setIsHistoryExpanded]);

  const handleGenerateCreativePrompt = useCallback(async () => {
    if (!currentImage) {
        setUiState(s => ({...s, error: t('errorNoImageLoaded')}));
        return;
    }
    setUiState(s => ({...s, isLoading: true, loadingMessage: t('loadingStudioAnalysis')}));
    try {
        const subjectFiles = [currentImage, ...studioSubjects];
        const newPrompt = await generateCreativePrompt(subjectFiles, studioStyleFile, studioOutfitFiles, studioPrompt);
        setStudioState(s => ({...s, prompt: newPrompt}));
    } catch (err) {
        handleApiError(err, 'errorFailedToProcessImage');
    } finally {
        setUiState(s => ({...s, isLoading: false}));
    }
  }, [currentImage, studioSubjects, studioStyleFile, studioOutfitFiles, studioPrompt, handleApiError, t, setUiState]);

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
    if (!currentImage) {
      setStudioState(s => ({ ...s, prompt: '', styleFile: null, subjects: [], outfitFiles: [] }));
    }
  }, [currentImage]);

  return {
    studioState, setStudioState,
    studioPrompt, studioStyleFile, studioSubjects, studioOutfitFiles,
    handleGeneratePhotoshoot,
    handleStudioAddSubject, handleStudioRemoveSubject,
    handleStudioAddOutfitFile, handleStudioRemoveOutfitFile,
    handleGenerateCreativePrompt,
  };
};
