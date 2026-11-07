export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  stressWords?: string[];
  start: number;
  end: number;
}

export type SubtitleMode = 'all' | 'en' | 'ko' | 'blind';

export type SelfCheckValue = 'good' | 'fair' | 'poor' | null;

export interface Progress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckValue, SelfCheckValue, SelfCheckValue];
  status: 'new' | 'practiced' | 'done';
}

export type ScreenType = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export type ShadowingStep = 1 | 2 | 3 | 4;

export interface WordRecognitionResult {
  transcript: string;
  wordMatches: {
    word: string;
    matched: boolean;
  }[];
  matchedCount: number;
  totalCount: number;
}
