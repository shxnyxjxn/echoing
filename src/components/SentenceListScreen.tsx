import React, { useState } from 'react';
import { ArrowLeft, Play, Eye, EyeOff, Sparkles, CheckCircle2, Check, Settings, PlusCircle } from 'lucide-react';
import { Progress, Sentence } from '../types';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import { getSpeakerTheme } from '../constants/movieData';

interface Props {
  sentences: Sentence[];
  progress: Record<number, Progress>;
  onSelectSentence: (index: number) => void;
  onToggleDone: (id: number) => void;
  onBackToStart: () => void;
  onGoToEdit: () => void;
  playerRef: React.RefObject<YouTubePlayerRef | null>;
}

export function SentenceListScreen({
  sentences,
  progress,
  onSelectSentence,
  onToggleDone,
  onBackToStart,
  onGoToEdit,
  playerRef,
}: Props) {
  const [hideAllText, setHideAllText] = useState(false);

  // Calculate statistics
  const completedCount = sentences.filter((s) => progress[s.id]?.status === 'done').length;
  const practicedCount = sentences.filter(
    (s) => progress[s.id]?.status === 'practiced' || progress[s.id]?.status === 'done'
  ).length;
  const progressPercent = sentences.length > 0 ? Math.round((completedCount / sentences.length) * 100) : 0;

  return (
    <div className="w-full flex flex-col items-center space-y-3.5 pb-12">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between py-1">
        <button
          onClick={onBackToStart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home / 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideAllText(!hideAllText)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="문장 자막 전체 숨기기/보이기"
          >
            {hideAllText ? <Eye className="w-3.5 h-3.5 text-slate-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{hideAllText ? 'Show All / 전체 보기' : 'Hide All / 전체 숨기기'}</span>
          </button>
          <button
            onClick={onGoToEdit}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
            title="Edit Sentences / 문장 편집"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. 학습 진도율 (Progress Tracker Bar) */}
      <div className="w-full bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>학습 진도율 (Progress Tracker)</span>
            </span>
            <span className="text-slate-500 text-[11px] mt-0.5 block">
              완료(★): {completedCount} / 연습중(◐): {practicedCount - completedCount} / 미시작(☆):{' '}
              {sentences.length - practicedCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-extrabold border border-emerald-200/60 shrink-0">
            <span>{completedCount}</span>
            <span className="text-emerald-500 font-normal">/</span>
            <span>{sentences.length} 완료 ({progressPercent}%)</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Video Player at top (with one-line credit underneath) */}
      <YouTubePlayer ref={playerRef} showCredit={true} />

      {/* Empty State */}
      {sentences.length === 0 && (
        <div className="w-full bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-xs text-slate-500">
            등록된 문장이 없습니다. [문장 편집]에서 문장을 추가해보세요.
          </p>
          <button
            onClick={onGoToEdit}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      )}

      {/* Sentences List Cards */}
      <div className="w-full space-y-3">
        {sentences.map((sentence, index) => {
          const itemProg = progress[sentence.id];
          const status = itemProg?.status || 'new';
          const isDone = status === 'done';
          const theme = getSpeakerTheme(sentence.speaker);

          // Progress mark: ☆ not started, ◐ practiced, ★ done
          let progressIcon = (
            <span className="text-slate-400 text-base font-bold select-none" title="☆ Not started (미시작)">
              ☆
            </span>
          );
          let progressBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';

          if (isDone) {
            progressIcon = (
              <span className="text-amber-500 text-base font-bold select-none" title="★ Done (완료)">
                ★
              </span>
            );
            progressBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          } else if (status === 'practiced') {
            progressIcon = (
              <span className="text-emerald-600 text-base font-bold select-none" title="◐ Practiced (연습완료)">
                ◐
              </span>
            );
            progressBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          }

          // Stress words highlighting
          const renderSentenceText = () => {
            if (hideAllText) {
              return (
                <span className="text-slate-400 italic text-sm tracking-widest select-none">
                  •••••••••••••• (자막 숨김)
                </span>
              );
            }

            const words = sentence.text.split(' ');
            const stressList = (sentence.stress || sentence.stressWords || []).map((w) =>
              w.replace(/[^a-zA-Z]/g, '').toLowerCase()
            );

            return words.map((w, i) => {
              const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
              const isStressed = stressList.includes(clean);
              return (
                <span
                  key={i}
                  className={
                    isStressed
                      ? 'font-extrabold text-amber-950 bg-amber-200/90 px-1 py-0.5 rounded-md mx-0.5 shadow-2xs'
                      : 'font-medium text-slate-700'
                  }
                >
                  {w}{' '}
                </span>
              );
            });
          };

          return (
            <div
              key={sentence.id}
              onClick={() => onSelectSentence(index)}
              className={`w-full bg-white rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2.5 active:scale-[0.99] group text-left ${
                isDone
                  ? 'border-emerald-300 ring-1 ring-emerald-200/80 shadow-xs'
                  : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>

                  {/* 3. 파스텔톤 컬러 뱃지 */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border shadow-2xs ${theme.badge}`}
                  >
                    <span>{theme.emoji}</span>
                    <span>{sentence.speaker}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {sentence.start.toFixed(1)}s ~ {sentence.end.toFixed(1)}s
                  </span>
                </div>

                {/* 3. 연습 완료(Done) 원터치 체크 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDone(sentence.id);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                    isDone
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="완료 상태 토글"
                >
                  <Check className={`w-3.5 h-3.5 ${isDone ? 'text-white' : 'text-slate-400'}`} />
                  <span>{isDone ? '완료됨' : '완료 체크'}</span>
                </button>
              </div>

              {/* Sentence Text */}
              <div className="text-base leading-snug pt-0.5">{renderSentenceText()}</div>

              {/* Korean translation (shown if not hiding all) */}
              {!hideAllText && (
                <div className="text-xs text-slate-500 font-normal">
                  {sentence.korean}
                </div>
              )}

              {/* Card Footer: Plays & Recordings count */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${progressBadgeClass}`}
                  >
                    {progressIcon}
                    <span>{isDone ? '완료' : status === 'practiced' ? '연습됨' : '미시작'}</span>
                  </span>
                  <span>
                    재생 {itemProg?.plays || 0}회 · 녹음 {itemProg?.recordings || 0}회
                  </span>
                </div>
                <span className="font-semibold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                  <span>Practice / 연습</span>
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button at bottom */}
      {sentences.length > 0 && (
        <button
          onClick={() => onSelectSentence(0)}
          className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white font-bold text-base shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Practice from First Sentence / 1번부터 연습</span>
        </button>
      )}
    </div>
  );
}
