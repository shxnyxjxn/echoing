import React from 'react';
import { Play, Settings, Sparkles, Volume2, Mic, Flame, CheckCircle2 } from 'lucide-react';
import { EducationalNoticeCard } from './EducationalNoticeCard';
import { MOVIE_SETTINGS } from '../constants/movieData';

interface Props {
  onStart: () => void;
  onEdit: () => void;
  totalSentences: number;
}

export function StartScreen({ onStart, onEdit, totalSentences }: Props) {
  return (
    <div className="w-full flex flex-col items-center space-y-6 pb-8">
      {/* Header Banner with Movie Badge */}
      <div className="w-full text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-semibold tracking-wide border border-emerald-200/80 mb-3 shadow-xs">
          <span>🥦 Disgust & Anger Scene 🔥</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{MOVIE_SETTINGS.movieTitleEn} ({MOVIE_SETTINGS.movieTitleKo})</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Scene Shadow:<br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-600 bg-clip-text text-transparent">
            에코잉(Echoing)
          </span>
        </h1>

        <p className="mt-2 text-base font-medium text-slate-600">
          Listen. Copy. Speak at the same time.
        </p>
        <p className="text-xs text-slate-500">
          듣고, 흉내 내고, 배우와 동시에 말해보는 영화 쉐도잉 앱
        </p>
      </div>

      {/* Target Learner & Why this scene info card */}
      <div className="w-full bg-gradient-to-br from-emerald-50/70 via-white to-rose-50/60 rounded-2xl p-4 border border-emerald-100/80 shadow-xs text-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>왜 이 장면일까요? (Why Inside Out?)</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          교과서의 딱딱한 대화 대신, 까칠이(Disgust)와 버럭이(Anger)의 감정 가득한 일상 영어를 통해
          자연스러운 억양(Intonation)과 강세(Stress)를 신나게 마스터해보세요!
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
            고1 맞춤 (CEFR B1–B2)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
            총 {totalSentences}개 핵심 문장
          </span>
        </div>
      </div>

      {/* What is Shadowing? Card (3 bullet points, English + Korean) */}
      <div className="w-full bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-slate-800 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Volume2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            What is Shadowing? / 쉐도잉이란?
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          원어민의 음성을 그림자(Shadow)처럼 <strong>0.5초의 간격을 두고 거의 동시에</strong> 따라 말하며 
          리듬, 강세, 높낮이를 복제하듯 연습하는 가장 효과적인 스피킹 훈련법입니다.
        </p>

        <div className="space-y-2.5 pt-1">
          {/* Bullet 1 */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Listen & Mumble / 귀로 듣고 웅얼거리기
              </span>
              <span className="text-slate-600">
                Catch the rhythm, intonation, and melody first. (자막 없이 소리와 리듬의 파도를 먼저 느껴요.)
              </span>
            </div>
          </div>

          {/* Bullet 2 */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Read & Shadow / 자막 보며 강조하기
              </span>
              <span className="text-slate-600">
                Match pronunciation and stress on bold words. (자막의 굵은 글씨 단어에 확실한 강세를 실어 말해요.)
              </span>
            </div>
          </div>

          {/* Bullet 3 */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Echo without Text / 자막 없이 동시에 쏟아내기
              </span>
              <span className="text-slate-600">
                Speak at the exact same pace like an echo! (자막을 끄고 배우의 입술과 호흡에 맞춰 동시 발화!)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button (at least 48px tall) */}
      <div className="w-full space-y-3 pt-1">
        <button
          onClick={onStart}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-lg shadow-md shadow-emerald-700/20 active:scale-[0.98] transition flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            <span>Start Practice / 연습 시작</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-100 tracking-normal mt-0.5">
            {totalSentences}개 문장 차근차근 시작하기
          </span>
        </button>

        {/* Small Link: Edit Sentences */}
        <div className="text-center">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      </div>

      {/* Educational Use & Source Card (Mandatory on Start screen) */}
      <EducationalNoticeCard className="w-full mt-2" defaultExpanded={true} />
    </div>
  );
}
