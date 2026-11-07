import React from 'react';
import { Trophy, Sparkles, RotateCcw, List, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { Progress, Sentence } from '../types';
import { ONE_LINE_CREDIT, getSpeakerTheme } from '../constants/movieData';

interface Props {
  sentences: Sentence[];
  progress: Record<number, Progress>;
  onPracticeSentence: (index: number) => void;
  onGoToList: () => void;
  onGoToStart: () => void;
}

export function FinishScreen({
  sentences,
  progress,
  onPracticeSentence,
  onGoToList,
  onGoToStart,
}: Props) {
  // Statistics
  const completedSentences = sentences.filter((s) => progress[s.id]?.status === 'done');
  const totalRecordings = Object.values(progress).reduce((acc, p) => acc + (p.recordings || 0), 0);
  const totalPlays = Object.values(progress).reduce((acc, p) => acc + (p.plays || 0), 0);

  // Sentences with any selfCheck marked 'poor' (😐)
  const reviewSentences = sentences
    .map((sentence, idx) => ({ sentence, index: idx, prog: progress[sentence.id] }))
    .filter(({ prog }) => prog?.selfCheck?.some((val) => val === 'poor'));

  return (
    <div className="w-full flex flex-col items-center space-y-6 pb-12 text-slate-800">
      {/* Celebration Header */}
      <div className="w-full text-center pt-4 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 shadow-lg shadow-amber-500/20 mb-1">
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Great Job! / 수고하셨습니다!
        </h1>
        <p className="text-sm font-medium text-slate-600">
          오늘의 인사이드 아웃 쉐도잉 훈련을 훌륭하게 완주하셨습니다!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 text-center shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">완료 문장</span>
          <span className="text-xl font-extrabold text-emerald-600 block mt-0.5">
            {completedSentences.length}
            <span className="text-xs font-normal text-slate-400 ml-0.5">/ {sentences.length}</span>
          </span>
          <span className="text-[10px] text-slate-400">★ 4단계 달성</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 text-center shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">총 녹음 횟수</span>
          <span className="text-xl font-extrabold text-rose-600 block mt-0.5">
            {totalRecordings}
            <span className="text-xs font-normal text-slate-400 ml-0.5">회</span>
          </span>
          <span className="text-[10px] text-slate-400">목소리 도전</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 text-center shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">구간 반복</span>
          <span className="text-xl font-extrabold text-amber-600 block mt-0.5">
            {totalPlays}
            <span className="text-xs font-normal text-slate-400 ml-0.5">회</span>
          </span>
          <span className="text-[10px] text-slate-400">원어민 청취</span>
        </div>
      </div>

      {/* Sentences marked 😐 section */}
      {reviewSentences.length > 0 ? (
        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">😐</span>
              <h2 className="text-xs font-bold text-slate-900">
                Review Sentences / 다시 복습해볼 문장 ({reviewSentences.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">아쉬웠던 문장만 골라 연습</span>
          </div>

          <p className="text-[11px] text-slate-500">
            셀프 평가에서 '조금 아쉬움(😐)'으로 체크했던 문장들이에요. 한 번 더 연습해보면 훨씬 자연스러워집니다!
          </p>

          <div className="space-y-2 pt-1">
            {reviewSentences.map(({ sentence, index }) => {
              const theme = getSpeakerTheme(sentence.speaker);
              return (
                <div
                  key={sentence.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${theme.bg}`}
                      >
                        {sentence.speaker}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {sentence.text}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {sentence.korean}
                    </p>
                  </div>

                  <button
                    onClick={() => onPracticeSentence(index)}
                    className="shrink-0 min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Practice again / 다시 연습</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 text-center space-y-1">
          <div className="inline-flex items-center gap-1 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>완벽합니다! 아쉬운 평가로 체크된 문장이 없습니다.</span>
          </div>
          <p className="text-[11px] text-emerald-700">
            모든 문장의 리듬과 강세를 멋지게 소화해냈어요! 언제든 다시 복습할 수 있습니다.
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="w-full space-y-2.5 pt-2">
        <button
          onClick={onGoToList}
          className="w-full min-h-[50px] py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <List className="w-4 h-4" />
          <span>Back to Sentences / 문장 목록 보기</span>
        </button>

        <button
          onClick={onGoToStart}
          className="w-full min-h-[46px] py-2.5 px-5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Go to Start Screen / 첫 화면으로</span>
        </button>
      </div>

      {/* Mandatory Credit at bottom of finish screen */}
      <div className="w-full mt-4 text-center px-2">
        <p className="text-[13px] leading-snug text-slate-500 font-normal select-none">
          {ONE_LINE_CREDIT}
        </p>
      </div>
    </div>
  );
}
