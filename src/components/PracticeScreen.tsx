import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Play,
  Pause,
  Repeat,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Progress, SelfCheckValue, Sentence, ShadowingStep, SubtitleMode, WordRecognitionResult } from '../types';
import { STEP_INFOS, getSpeakerTheme } from '../constants/movieData';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';

// SpeechRecognition type declaration
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface Props {
  sentence: Sentence;
  index: number;
  totalCount: number;
  completedCount: number;
  progress: Progress;
  onUpdateProgress: (updated: Progress) => void;
  onToggleDone: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onBackToList: () => void;
  playerRef: React.RefObject<YouTubePlayerRef | null>;
}

export function PracticeScreen({
  sentence,
  index,
  totalCount,
  completedCount,
  progress,
  onUpdateProgress,
  onToggleDone,
  onPrev,
  onNext,
  onBackToList,
  playerRef,
}: Props) {
  // Shadowing step (1 to 4)
  const [currentStep, setCurrentStep] = useState<ShadowingStep>(1);

  // 1. 단계별 자막 가리기 (4-Step Blind Mode)
  // [전체 보기(영+한)], [영어만], [한글만], [블라인드(모두 가림)]
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('blind');
  const [tempPeek, setTempPeek] = useState(false);

  // 2. 강세 단어(Stress words) 빈칸 모드 (Cloze Mode)
  const [isClozeMode, setIsClozeMode] = useState(false);
  const [revealedWordIndices, setRevealedWordIndices] = useState<Set<number>>(new Set());

  // Playback state
  const [isLooping, setIsLooping] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingAudioUrl, setRecordingAudioUrl] = useState<string | null>(null);
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Speech Recognition state
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [wordResult, setWordResult] = useState<WordRecognitionResult | null>(null);

  // Refs for media
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const theme = getSpeakerTheme(sentence.speaker);
  const isDone = progress.status === 'done';
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check speech recognition support once on mount
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
    }
  }, []);

  // When step changes, automatically recommend a subtitle mode
  const handleStepSelect = (step: ShadowingStep) => {
    setCurrentStep(step);
    if (step === 1 || step === 2 || step === 4) {
      setSubtitleMode('blind');
    } else {
      setSubtitleMode('all');
    }
  };

  // Reset local state when sentence index changes
  useEffect(() => {
    setCurrentStep(1);
    setSubtitleMode('blind');
    setTempPeek(false);
    setRevealedWordIndices(new Set());
    setRecordingAudioUrl(null);
    setWordResult(null);
    setIsPlayingSegment(false);
    setIsRecording(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, [sentence.id]);

  // Handle speed change
  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    playerRef.current?.setSpeed(speed);
  };

  // Play sentence
  const handlePlayToggle = () => {
    if (isPlayingSegment) {
      playerRef.current?.stopPlayback();
      setIsPlayingSegment(false);
    } else {
      setIsPlayingSegment(true);
      // Increment play count
      const updated: Progress = {
        ...progress,
        plays: progress.plays + 1,
      };
      onUpdateProgress(updated);

      playerRef.current?.playSegment(sentence.start, sentence.end, isLooping, () => {
        if (!isLooping) {
          setIsPlayingSegment(false);
        }
      });
    }
  };

  // Toggle loop
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (isPlayingSegment) {
      playerRef.current?.playSegment(sentence.start, sentence.end, nextLoop, () => {
        if (!nextLoop) {
          setIsPlayingSegment(false);
        }
      });
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      setMicPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordingAudioUrl(url);

        const nextStatus =
          currentStep === 4 ? 'done' : progress.status === 'done' ? 'done' : 'practiced';

        const updated: Progress = {
          ...progress,
          recordings: progress.recordings + 1,
          status: nextStatus,
        };
        onUpdateProgress(updated);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Play sentence once (loop ignored while recording)
      playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
        setTimeout(() => {
          stopRecording();
        }, 1000);
      });
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setMicPermissionDenied(true);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping mediaRecorder', e);
      }
    }
    setIsRecording(false);
  };

  // Play user's recorded voice
  const handlePlayMyVoice = () => {
    if (!recordingAudioUrl) return;

    if (isPlayingMyVoice && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingMyVoice(false);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.src = recordingAudioUrl;
      audioElementRef.current.play();
      setIsPlayingMyVoice(true);
      audioElementRef.current.onended = () => {
        setIsPlayingMyVoice(false);
      };
    }
  };

  // Replay original clip segment
  const handlePlayOriginal = () => {
    playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
      setIsPlayingSegment(false);
    });
    setIsPlayingSegment(true);
  };

  // Speech Recognition (Check My Words)
  const handleCheckWords = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isRecognizing) {
      recognitionRef.current?.stop();
      setIsRecognizing(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsRecognizing(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        evaluateSpeech(transcript);
        setIsRecognizing(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsRecognizing(false);
      };

      recognition.onend = () => {
        setIsRecognizing(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Could not start recognition', e);
      setIsRecognizing(false);
    }
  };

  const evaluateSpeech = (transcript: string) => {
    const cleanSpokenWords = transcript
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const targetWords = sentence.text.split(/\s+/).filter(Boolean);

    let matchCount = 0;
    const wordMatches = targetWords.map((originalWord) => {
      const cleanTarget = originalWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
      const matched = cleanSpokenWords.includes(cleanTarget);
      if (matched) matchCount++;
      return {
        word: originalWord,
        matched,
      };
    });

    setWordResult({
      transcript,
      wordMatches,
      matchedCount: matchCount,
      totalCount: targetWords.length,
    });
  };

  // Self-Check update
  const handleSelfCheckChange = (itemIdx: 0 | 1 | 2, val: SelfCheckValue) => {
    const newCheck: [SelfCheckValue, SelfCheckValue, SelfCheckValue] = [
      ...progress.selfCheck,
    ];
    newCheck[itemIdx] = val;
    onUpdateProgress({
      ...progress,
      selfCheck: newCheck,
    });
  };

  // Toggle reveal for a specific cloze word
  const toggleClozeReveal = (wordIdx: number) => {
    const next = new Set(revealedWordIndices);
    if (next.has(wordIdx)) {
      next.delete(wordIdx);
    } else {
      next.add(wordIdx);
    }
    setRevealedWordIndices(next);
  };

  // Helper to check if a word is stressed
  const isStressWord = (word: string): boolean => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const stressList = (sentence.stress || sentence.stressWords || []).map((w) =>
      w.replace(/[^a-zA-Z]/g, '').toLowerCase()
    );
    return stressList.includes(clean);
  };

  // Render sentence with stress highlights, cloze mode, and blur blind mode
  const renderSentenceText = () => {
    const isBlindActive = subtitleMode === 'blind' || subtitleMode === 'ko';
    const isBlurred = isBlindActive && !tempPeek;

    const words = sentence.text.split(' ');

    return (
      <div className="relative w-full py-1">
        {/* Blurred / Hidden Notice overlay if blind mode */}
        {isBlurred && (
          <div
            onClick={() => setTempPeek(true)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-[6px] rounded-xl cursor-pointer select-none transition-all hover:bg-slate-900/15 group p-2 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-semibold shadow-md">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>블라인드 모드 작동 중 (터치하여 살짝 보기)</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-1 font-medium bg-white/80 px-2 py-0.5 rounded-md">
              소리에만 귀를 기울여 원어민 억양을 복제해보세요!
            </span>
          </div>
        )}

        {/* English words display */}
        <div
          className={`text-[22px] sm:text-[24px] font-medium leading-relaxed text-slate-800 text-center tracking-tight transition duration-200 ${
            isBlurred ? 'select-none filter blur-[7px] opacity-25' : ''
          }`}
        >
          {words.map((w, i) => {
            const isStressed = isStressWord(w);

            // Cloze Mode (빈칸 퀴즈 모드)
            if (isClozeMode && isStressed) {
              const isRevealed = revealedWordIndices.has(i);

              if (!isRevealed) {
                // Hidden blank: [ _____ ]
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClozeReveal(i);
                    }}
                    title="클릭하여 단어 확인하기"
                    className="inline-flex items-center justify-center px-2 py-0.5 mx-1 rounded-lg bg-amber-100 hover:bg-amber-200 border-2 border-dashed border-amber-400 text-amber-900 font-mono font-bold text-sm tracking-wider shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    [ _____ ]
                  </button>
                );
              }

              // Revealed blank
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleClozeReveal(i);
                  }}
                  title="다시 가리기"
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-950 font-extrabold text-base shadow-xs cursor-pointer active:scale-95 transition"
                >
                  <span>{w}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                </button>
              );
            }

            // Normal highlight for stressed words
            if (isStressed) {
              return (
                <span
                  key={i}
                  className="font-extrabold text-amber-950 bg-gradient-to-r from-amber-200 to-amber-100 px-1.5 py-0.5 rounded-lg mx-0.5 shadow-2xs inline-block border border-amber-300/80"
                >
                  {w}
                </span>
              );
            }

            return (
              <span key={i} className="inline-block mx-0.5">
                {w}
              </span>
            );
          })}
        </div>

        {/* Peek active notice */}
        {tempPeek && isBlindActive && (
          <div className="mt-2 text-center">
            <button
              onClick={() => setTempPeek(false)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
            >
              다시 블라인드로 가리기 ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  const selfCheckQuestions = [
    {
      en: 'Did I keep up with the speed?',
      ko: '말하기 속도를 잘 맞췄나요?',
    },
    {
      en: 'Did I stress the bold words?',
      ko: '강조 단어(노란색)에 힘을 주었나요?',
    },
    {
      en: 'Did my voice go up and down like the actor?',
      ko: '억양(높낮이)을 배우처럼 살렸나요?',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center space-y-3.5 pb-16">
      {/* Hidden audio element for user recording playback */}
      <audio ref={audioElementRef} className="hidden" />

      {/* 3. 학습 진도율 (Progress Tracker Bar) at top */}
      <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>학습 진도율 (Progress)</span>
          </div>
          <span className="text-emerald-700 font-extrabold">
            {completedCount} / {totalCount} 완료 ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Top Navigation Row: List link, Sentence Counter, Arrow navigation */}
      <div className="w-full flex items-center justify-between py-0.5">
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
        >
          <List className="w-4 h-4" />
          <span>List / 목록</span>
        </button>

        {/* Counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className={`p-1.5 rounded-xl transition ${
              index === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
            }`}
            aria-label="Previous sentence"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-slate-900 tracking-tight px-1">
            Sentence {index + 1} / {totalCount}
          </span>

          <button
            onClick={onNext}
            className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Next sentence"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 1. Video Player (16:9) with mandatory one-line credit under it */}
      <YouTubePlayer ref={playerRef} showCredit={true} />

      {/* Step Guide Tabs (4 tabs in order) */}
      <div className="w-full bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {([1, 2, 3, 4] as ShadowingStep[]).map((step) => {
            const info = STEP_INFOS[step];
            const isActive = currentStep === step;

            return (
              <button
                key={step}
                onClick={() => handleStepSelect(step)}
                className={`py-2 px-1 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <span className="text-[11px] leading-tight block truncate w-full">
                  Step {step}
                </span>
                <span className="text-[10px] opacity-80 block truncate w-full">
                  {step === 1 ? '듣기' : step === 2 ? '웅얼' : step === 3 ? '보며 말' : '동시'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Step Instruction Banner */}
        <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{STEP_INFOS[currentStep].titleEn}</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-700 font-medium">{STEP_INFOS[currentStep].titleKo}</span>
          </div>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            {STEP_INFOS[currentStep].instructionEn}
          </p>
        </div>
      </div>

      {/* Sentence Display Card */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
        {/* 1. 단계별 자막 가리기 (4-Step Blind Mode) Tabs */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-0.5">
            <span>자막 가리기 모드 (Subtitle Mode):</span>
            <span className="text-emerald-700 font-bold">
              {subtitleMode === 'all'
                ? '전체 표시'
                : subtitleMode === 'en'
                ? '영어만'
                : subtitleMode === 'ko'
                ? '한글만'
                : '블라인드 (소리 집중)'}
            </span>
          </div>

          <div className="w-full grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setSubtitleMode('all');
                setTempPeek(false);
              }}
              className={`py-2 px-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex flex-col items-center justify-center leading-tight ${
                subtitleMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>전체 보기</span>
              <span className="text-[9px] opacity-75 font-normal">(영+한)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubtitleMode('en');
                setTempPeek(false);
              }}
              className={`py-2 px-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex flex-col items-center justify-center leading-tight ${
                subtitleMode === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>영어만</span>
              <span className="text-[9px] opacity-75 font-normal">(English)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubtitleMode('ko');
                setTempPeek(false);
              }}
              className={`py-2 px-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex flex-col items-center justify-center leading-tight ${
                subtitleMode === 'ko'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>한글만</span>
              <span className="text-[9px] opacity-75 font-normal">(해석만)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubtitleMode('blind');
                setTempPeek(false);
              }}
              className={`py-2 px-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex flex-col items-center justify-center leading-tight ${
                subtitleMode === 'blind'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>블라인드</span>
              <span className="text-[9px] opacity-80 font-normal">(모두 가림)</span>
            </button>
          </div>
        </div>

        {/* Speaker badge & Done Toggle Row */}
        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* 3. 파스텔톤 컬러 뱃지 */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${theme.badge}`}
            >
              <span>{theme.emoji}</span>
              <span>{sentence.speaker}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {sentence.start.toFixed(1)}s - {sentence.end.toFixed(1)}s
            </span>
          </div>

          {/* 3. '연습 완료(Done)' 체크 버튼 */}
          <button
            type="button"
            onClick={() => onToggleDone(sentence.id)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-2xs ${
              isDone
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-white' : 'text-slate-400'}`} />
            <span>{isDone ? '완료됨 (Done)' : '연습 완료 체크'}</span>
          </button>
        </div>

        {/* 2. 빈칸 퀴즈 모드(Cloze Mode) 토글 스위치 */}
        <div className="w-full bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            <div>
              <span className="font-bold text-amber-950 block leading-tight">
                빈칸 퀴즈 모드 (Cloze Mode)
              </span>
              <span className="text-[10px] text-amber-800">
                강세 단어가 <span className="font-mono font-bold">[ _____ ]</span>로 가려집니다 (터치시 공개)
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
            <input
              type="checkbox"
              checked={isClozeMode}
              onChange={(e) => {
                setIsClozeMode(e.target.checked);
                setRevealedWordIndices(new Set());
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Sentence Text Display */}
        <div className="w-full min-h-[64px] flex items-center justify-center py-1">
          {renderSentenceText()}
        </div>

        {/* Korean Meaning (respecting Subtitle Mode) */}
        {(subtitleMode === 'all' || subtitleMode === 'ko') && (
          <div className="w-full text-center border-t border-slate-100 pt-2 text-xs sm:text-sm text-slate-600 font-normal">
            {sentence.korean}
          </div>
        )}
      </div>

      {/* 5. Control Row: Play, Loop, Speed (at least 48px buttons) */}
      <div className="w-full bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Play / Pause button */}
          <button
            onClick={handlePlayToggle}
            className={`min-h-[48px] py-2 px-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition cursor-pointer active:scale-[0.98] ${
              isPlayingSegment
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isPlayingSegment ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingSegment ? 'Pause / 일시정지' : 'Play / 재생'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-90">
              {isPlayingSegment ? '구간 정지' : '이 문장 듣기'}
            </span>
          </button>

          {/* Loop button (on/off) */}
          <button
            onClick={handleToggleLoop}
            className={`min-h-[48px] py-2 px-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition cursor-pointer active:scale-[0.98] border ${
              isLooping
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Repeat className={`w-4 h-4 ${isLooping ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Loop: {isLooping ? 'ON / 반복 켜짐' : 'OFF / 반복 꺼짐'}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500">
              {isLooping ? '1.5초 간격 연속 반복' : '한 번만 재생'}
            </span>
          </button>
        </div>

        {/* Speed selector (0.5x / 0.75x / 1.0x) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500">Speed / 속도:</span>
          <div className="flex items-center gap-1.5">
            {[0.5, 0.75, 1.0].map((spd) => {
              const active = currentSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {spd.toFixed(spd === 1.0 ? 1 : 2)}×
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. Record Area */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Record & Compare / 녹음 및 비교
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            총 {progress.recordings}회 녹음됨
          </span>
        </div>

        {/* Mic permission warning if denied */}
        {micPermissionDenied && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <MicOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mic is off. You can still listen and shadow out loud.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                마이크 권한이 꺼져 있어도 화면의 자막과 영상을 보며 소리 내어 쉐도잉할 수 있어요!
              </p>
            </div>
          </div>
        )}

        {/* Big Record Button (at least 48px) */}
        <button
          onClick={handleStartRecording}
          className={`w-full min-h-[52px] py-3 px-4 rounded-xl font-bold text-base flex flex-col items-center justify-center transition cursor-pointer active:scale-[0.98] ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-600/30'
              : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 fill-current" />
            <span>
              {isRecording ? 'Recording... Tap to Stop / 녹음 중' : '🎙 Record / 동시 녹음 시작'}
            </span>
          </div>
          <span className="text-[11px] font-normal opacity-90">
            {isRecording
              ? '문장 종료 1초 후 자동 완료됩니다'
              : '클립이 재생되며 내 목소리를 함께 녹음합니다'}
          </span>
        </button>

        {/* Playback Buttons: My Voice & Original Replay */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* My Voice */}
          <button
            onClick={handlePlayMyVoice}
            disabled={!recordingAudioUrl}
            className={`min-h-[48px] py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition border ${
              recordingAudioUrl
                ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer'
                : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>{isPlayingMyVoice ? 'Pause / 멈춤' : '▶ My Voice / 내 목소리'}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500">
              {recordingAudioUrl ? '방금 녹음한 내 음성' : '녹음 후 활성화'}
            </span>
          </button>

          {/* Original */}
          <button
            onClick={handlePlayOriginal}
            className="min-h-[48px] py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition border bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 text-rose-600 fill-current" />
              <span>▶ Original / 원본 듣기</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500">
              배우의 원본 음성 바로 비교
            </span>
          </button>
        </div>
      </div>

      {/* 9. Word Check (Optional via Web Speech API) */}
      {speechSupported && (
        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Check My Words / 발음 단어 확인 (Web Speech API)
              </h3>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            버튼을 누르고 문장을 영어로 말해보세요. 브라우저가 인식한 단어를 색깔로 확인해 줍니다.
          </p>

          <button
            onClick={handleCheckWords}
            className={`w-full min-h-[46px] py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
              isRecognizing
                ? 'bg-emerald-600 text-white animate-pulse border-emerald-600'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>
              {isRecognizing
                ? 'Listening now... Speak! / 듣는 중...'
                : 'Check My Words / 발음 단어 확인하기'}
            </span>
          </button>

          {/* Word Matching Result */}
          {wordResult && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>인식 결과:</span>
                <span className="text-emerald-700 font-bold">
                  You said {wordResult.matchedCount} of {wordResult.totalCount} words!
                </span>
              </div>

              {/* Word Pills (Matched: Green, Missed: Gray with underline) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {wordResult.wordMatches.map((item, idx) => (
                  <span
                    key={idx}
                    className={`text-sm font-semibold px-2 py-0.5 rounded-md ${
                      item.matched
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-slate-100 text-slate-500 underline decoration-slate-400'
                    }`}
                  >
                    {item.word}
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                초록색은 정확히 인식된 단어예요. 틀려도 괜찮으니 편안하게 반복해보세요!
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. Self-Check (after recording or anytime) */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Self-Check / 나의 쉐도잉 셀프 평가
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">솔직하게 체크해보세요</span>
        </div>

        <div className="space-y-3">
          {selfCheckQuestions.map((q, idx) => {
            const currentVal = progress.selfCheck[idx as 0 | 1 | 2];

            return (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">{q.en}</span>
                  <span className="text-[11px] text-slate-500">{q.ko}</span>
                </div>

                {/* 3 Buttons: 😀 Good / 🙂 Fair / 😐 Poor */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSelfCheckChange(idx as 0 | 1 | 2, 'good')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      currentVal === 'good'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-base">😀</span>
                    <span>잘 맞춤</span>
                  </button>

                  <button
                    onClick={() => handleSelfCheckChange(idx as 0 | 1 | 2, 'fair')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      currentVal === 'fair'
                        ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-base">🙂</span>
                    <span>보통</span>
                  </button>

                  <button
                    onClick={() => handleSelfCheckChange(idx as 0 | 1 | 2, 'poor')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      currentVal === 'poor'
                        ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-base">😐</span>
                    <span>조금 아쉬움</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10. Next Button */}
      <div className="w-full pt-1">
        <button
          onClick={onNext}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white font-bold text-base shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>
            {index === totalCount - 1
              ? 'Finish Practice / 연습 완료하기'
              : 'Next Sentence / 다음 문장 ▶'}
          </span>
        </button>
      </div>
    </div>
  );
}
