import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import {
  EDUCATIONAL_NOTICE_EN,
  EDUCATIONAL_NOTICE_KO,
  MOVIE_SETTINGS,
} from '../constants/movieData';

interface Props {
  className?: string;
  defaultExpanded?: boolean;
}

export function EducationalNoticeCard({ className = '', defaultExpanded = true }: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Format seconds to m:ss
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const rangeFormatted = '0:05 – 0:45';

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-slate-800 transition-all ${className}`}
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Educational Use & Source / 교육용 고지 및 출처
            </h3>
            <p className="text-xs text-slate-500">
              Non-commercial English learning · ENG3088
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-3.5 leading-relaxed text-slate-600">
          {/* Notice Texts */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-start gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Educational Use Only / 교육 목적 전용</span>
            </div>
            <p className="text-slate-700 font-medium">{EDUCATIONAL_NOTICE_EN}</p>
            <p className="text-slate-600 pt-1 border-t border-slate-200/50">{EDUCATIONAL_NOTICE_KO}</p>
          </div>

          {/* Source Metadata Table / List */}
          <div className="grid grid-cols-1 gap-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-200/50 text-[12px]">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">영화 제목 (Title)</span>
              <span className="font-semibold text-slate-800 text-right">
                {MOVIE_SETTINGS.movieTitleEn} ({MOVIE_SETTINGS.movieTitleKo}) · {MOVIE_SETTINGS.releaseYear}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">감독 (Director)</span>
              <span className="font-medium text-slate-700 text-right">{MOVIE_SETTINGS.director}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">각본 (Screenplay)</span>
              <span className="font-medium text-slate-700 text-right">{MOVIE_SETTINGS.screenplay}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">제작 / 배급사</span>
              <span className="font-medium text-slate-700 text-right">
                {MOVIE_SETTINGS.productionCompany} / {MOVIE_SETTINGS.distributionCompany}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">장면 설명 (Scene)</span>
              <span className="font-medium text-slate-700 text-right">{MOVIE_SETTINGS.sceneDescription}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">학습 구간 (Range)</span>
              <span className="font-semibold text-emerald-700 text-right">{rangeFormatted}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">유튜브 원본 클립</span>
              <a
                href={MOVIE_SETTINGS.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 underline text-right"
              >
                <span>{MOVIE_SETTINGS.youtubeVideoTitle}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">채널명 (Channel)</span>
              <span className="font-medium text-slate-700 text-right">{MOVIE_SETTINGS.youtubeChannelName}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">제작자 (Made by)</span>
              <span className="font-semibold text-slate-800 text-right">{MOVIE_SETTINGS.madeBy}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
