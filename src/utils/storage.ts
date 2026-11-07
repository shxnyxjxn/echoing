import { INITIAL_SENTENCES } from '../constants/movieData';
import { Progress, Sentence } from '../types';

const SENTENCES_KEY = 'scene_shadow_sentences_v5';
const PROGRESS_KEY = 'scene_shadow_progress_v1';

// In-memory fallback
let memSentences: Sentence[] = [...INITIAL_SENTENCES];
let memProgress: Record<number, Progress> = {};

export function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(SENTENCES_KEY);
    if (!raw) {
      saveSentences(INITIAL_SENTENCES);
      return INITIAL_SENTENCES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memSentences = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read sentences from localStorage, using memory:', err);
  }
  return memSentences;
}

export function saveSentences(sentences: Sentence[]): void {
  memSentences = sentences;
  try {
    localStorage.setItem(SENTENCES_KEY, JSON.stringify(sentences));
  } catch (err) {
    console.warn('Failed to write sentences to localStorage, saved in memory:', err);
  }
}

export function loadProgress(): Record<number, Progress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return memProgress;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      memProgress = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read progress from localStorage, using memory:', err);
  }
  return memProgress;
}

export function saveProgress(progress: Record<number, Progress>): void {
  memProgress = progress;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to write progress to localStorage, saved in memory:', err);
  }
}

export function getOrCreateSentenceProgress(id: number, currentProgress: Record<number, Progress>): Progress {
  if (currentProgress[id]) {
    return currentProgress[id];
  }
  return {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}
