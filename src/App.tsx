/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Progress, ScreenType, Sentence } from './types';
import {
  loadProgress,
  loadSentences,
  saveProgress,
  saveSentences,
  getOrCreateSentenceProgress,
} from './utils/storage';
import { StartScreen } from './components/StartScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { EditScreen } from './components/EditScreen';
import { FinishScreen } from './components/FinishScreen';
import { YouTubePlayerRef } from './components/YouTubePlayer';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progress, setProgress] = useState<Record<number, Progress>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Player refs
  const listPlayerRef = useRef<YouTubePlayerRef | null>(null);
  const practicePlayerRef = useRef<YouTubePlayerRef | null>(null);
  const editPlayerRef = useRef<YouTubePlayerRef | null>(null);

  // Load initial data
  useEffect(() => {
    const loadedSentences = loadSentences();
    const loadedProgress = loadProgress();
    setSentences(loadedSentences);
    setProgress(loadedProgress);
  }, []);

  // Update sentence list
  const handleSaveSentences = (updated: Sentence[]) => {
    setSentences(updated);
    saveSentences(updated);
  };

  // Update progress for a sentence
  const handleUpdateProgress = (updatedProg: Progress) => {
    const updated = {
      ...progress,
      [updatedProg.id]: updatedProg,
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Toggle done state for a sentence
  const handleToggleDone = (id: number) => {
    const current = getOrCreateSentenceProgress(id, progress);
    const nextStatus = current.status === 'done' ? 'practiced' : 'done';
    const updatedProg: Progress = {
      ...current,
      status: nextStatus,
    };
    handleUpdateProgress(updatedProg);
  };

  const completedCount = sentences.filter((s) => progress[s.id]?.status === 'done').length;

  // Navigations
  const handleStartPractice = () => {
    // If sentences available, go to sentence list
    setCurrentScreen('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSentence = (index: number) => {
    setCurrentIndex(index);
    setCurrentScreen('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentScreen('finish');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeSentence = sentences[currentIndex] || sentences[0];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 font-sans selection:bg-emerald-200">
      {/* Mobile-first portrait container with max-w-[480px] centered */}
      <main className="w-full max-w-[480px] min-h-screen bg-slate-50 shadow-xl border-x border-slate-200/80 px-4 py-3 flex flex-col justify-between">
        <div className="w-full flex-1">
          {currentScreen === 'start' && (
            <StartScreen
              onStart={handleStartPractice}
              onEdit={() => {
                setCurrentScreen('edit');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              totalSentences={sentences.length}
            />
          )}

          {currentScreen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progress={progress}
              onSelectSentence={handleSelectSentence}
              onToggleDone={handleToggleDone}
              onBackToStart={() => {
                listPlayerRef.current?.stopPlayback();
                setCurrentScreen('start');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToEdit={() => {
                listPlayerRef.current?.stopPlayback();
                setCurrentScreen('edit');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              playerRef={listPlayerRef}
            />
          )}

          {currentScreen === 'practice' && activeSentence && (
            <PracticeScreen
              sentence={activeSentence}
              index={currentIndex}
              totalCount={sentences.length}
              completedCount={completedCount}
              progress={getOrCreateSentenceProgress(activeSentence.id, progress)}
              onUpdateProgress={handleUpdateProgress}
              onToggleDone={handleToggleDone}
              onPrev={handlePrevSentence}
              onNext={handleNextSentence}
              onBackToList={() => {
                practicePlayerRef.current?.stopPlayback();
                setCurrentScreen('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              playerRef={practicePlayerRef}
            />
          )}

          {currentScreen === 'edit' && (
            <EditScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onBack={() => {
                editPlayerRef.current?.stopPlayback();
                setCurrentScreen('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              playerRef={editPlayerRef}
            />
          )}

          {currentScreen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progress={progress}
              onPracticeSentence={(idx) => {
                handleSelectSentence(idx);
              }}
              onGoToList={() => {
                setCurrentScreen('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToStart={() => {
                setCurrentScreen('start');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
