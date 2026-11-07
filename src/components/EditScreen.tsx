import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Sentence } from '../types';
import { INITIAL_SENTENCES, MOVIE_SETTINGS, getSpeakerTheme } from '../constants/movieData';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';

interface Props {
  sentences: Sentence[];
  onSaveSentences: (updated: Sentence[]) => void;
  onBack: () => void;
  playerRef: React.RefObject<YouTubePlayerRef | null>;
}

export function EditScreen({ sentences, onSaveSentences, onBack, playerRef }: Props) {
  // Editing state (null = add new, or sentence object)
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [speaker, setSpeaker] = useState('Disgust');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stressInput, setStressInput] = useState('');
  const [startTime, setStartTime] = useState<number>(MOVIE_SETTINGS.startSeconds);
  const [endTime, setEndTime] = useState<number>(MOVIE_SETTINGS.startSeconds + 2.5);

  // JSON modal / drawer
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick fill times from video player
  const handleSetStartNow = () => {
    if (playerRef.current) {
      const now = Math.round(playerRef.current.getCurrentTime() * 10) / 10;
      setStartTime(now);
      if (endTime <= now) {
        setEndTime(Math.min(MOVIE_SETTINGS.endSeconds, Math.round((now + 2.0) * 10) / 10));
      }
    }
  };

  const handleSetEndNow = () => {
    if (playerRef.current) {
      const now = Math.round(playerRef.current.getCurrentTime() * 10) / 10;
      setEndTime(now);
    }
  };

  // Test play current segment in form
  const handleTestSegment = () => {
    if (startTime >= endTime) return;
    playerRef.current?.playSegment(startTime, endTime, false);
  };

  // Populate form for editing existing sentence
  const handleStartEdit = (item: Sentence) => {
    setEditingId(item.id);
    setSpeaker(item.speaker);
    setText(item.text);
    setKorean(item.korean);
    setStressInput(item.stress?.join(', ') || '');
    setStartTime(item.start);
    setEndTime(item.end);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSpeaker('Disgust');
    setText('');
    setKorean('');
    setStressInput('');
    setStartTime(MOVIE_SETTINGS.startSeconds);
    setEndTime(MOVIE_SETTINGS.startSeconds + 2.5);
  };

  // Validation rules
  const duration = Math.max(0, endTime - startTime);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const isTimeOutOfRange =
    startTime < MOVIE_SETTINGS.startSeconds ||
    endTime > MOVIE_SETTINGS.endSeconds ||
    endTime <= startTime;

  const isLongWarning = duration > 4.0 || wordCount > 12;

  // Save Add or Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (isTimeOutOfRange) return;

    const stressArr = stressInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map((item) =>
        item.id === editingId
          ? {
              ...item,
              speaker,
              text: text.trim(),
              korean: korean.trim(),
              stress: stressArr,
              start: startTime,
              end: endTime,
            }
          : item
      );
      onSaveSentences(updated);
      handleCancelEdit();
    } else {
      // Add new
      const nextId =
        sentences.length > 0 ? Math.max(...sentences.map((s) => s.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: nextId,
        speaker,
        text: text.trim(),
        korean: korean.trim(),
        stress: stressArr,
        start: startTime,
        end: endTime,
      };
      onSaveSentences([...sentences, newSentence]);
      handleCancelEdit();
    }
  };

  // Delete sentence
  const handleDelete = (id: number) => {
    if (confirm('이 문장을 삭제하시겠습니까? / Delete this sentence?')) {
      const updated = sentences.filter((s) => s.id !== id);
      onSaveSentences(updated);
      if (editingId === id) handleCancelEdit();
    }
  };

  // Reorder sentences
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sentences.length) return;

    const copy = [...sentences];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onSaveSentences(copy);
  };

  // Reset to default Inside Out
  const handleResetToDefault = () => {
    if (
      confirm(
        '인사이드 아웃 기본 문장 목록으로 초기화하시겠습니까? / Reset to default Inside Out sentences?'
      )
    ) {
      onSaveSentences([...INITIAL_SENTENCES]);
      handleCancelEdit();
    }
  };

  // Open Export/Import Modal
  const handleOpenJsonModal = () => {
    setJsonText(JSON.stringify(sentences, null, 2));
    setJsonError(null);
    setCopied(false);
    setShowJsonModal(true);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON은 배열 형태여야 합니다 (Must be a JSON array).');
      }
      for (const item of parsed) {
        if (
          typeof item.text !== 'string' ||
          typeof item.start !== 'number' ||
          typeof item.end !== 'number'
        ) {
          throw new Error('각 문장에는 text, start, end 필드가 올바른 형식으로 있어야 합니다.');
        }
      }
      onSaveSentences(parsed);
      setShowJsonModal(false);
      handleCancelEdit();
    } catch (err: any) {
      setJsonError(err.message || '유효하지 않은 JSON 형식입니다.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4 pb-16">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back / 돌아가기</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
            title="기본 문장으로 리셋"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / 초기화</span>
          </button>

          <button
            onClick={handleOpenJsonModal}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Video Player at top (with one-line credit) */}
      <YouTubePlayer ref={playerRef} showCredit={true} />

      {/* Add / Edit Form Card */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingId !== null ? 'Edit Sentence / 문장 수정' : 'Add Sentence / 새 문장 추가'}
            </h2>
          </div>
          {editingId !== null && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Cancel / 취소
            </button>
          )}
        </div>

        <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
          {/* Speaker & Quick characters */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Speaker / 화자:</label>
            <div className="flex items-center gap-2 mb-1.5">
              {['Disgust', 'Anger', 'Joy'].map((spk) => (
                <button
                  type="button"
                  key={spk}
                  onClick={() => setSpeaker(spk)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    speaker === spk
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {spk}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="Character name (e.g., Disgust)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 text-xs bg-slate-50/50"
              required
            />
          </div>

          {/* English Text */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              English Sentence / 영어 문장 (3~12단어 권장):
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., There is a dangerous smell, people."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 text-xs bg-slate-50/50"
              required
            />
          </div>

          {/* Korean Meaning */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Korean Meaning / 한국어 뜻:
            </label>
            <input
              type="text"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="e.g., 얘들아, 위험한 냄새가 나."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 text-xs bg-slate-50/50"
              required
            />
          </div>

          {/* Stress Words */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Stress Words / 강세 단어 (쉼표로 구분):
            </label>
            <input
              type="text"
              value={stressInput}
              onChange={(e) => setStressInput(e.target.value)}
              placeholder="e.g., dangerous, smell"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 text-xs bg-slate-50/50"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              연습 화면에서 노란색 굵은 글씨로 강조되어 보여집니다.
            </p>
          </div>

          {/* Start & End Times with Now buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Timestamp 구간 (4초 ~ 45초 사이):</span>
              </span>
              <button
                type="button"
                onClick={handleTestSegment}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test / 구간 재생</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Start */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Start (초):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_SETTINGS.startSeconds}
                    max={MOVIE_SETTINGS.endSeconds}
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium text-[11px] shrink-0 cursor-pointer"
                    title="현재 재생 위치로 시작 시간 설정"
                  >
                    Now
                  </button>
                </div>
              </div>

              {/* End */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">End (초):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_SETTINGS.startSeconds}
                    max={MOVIE_SETTINGS.endSeconds}
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSetEndNow}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium text-[11px] shrink-0 cursor-pointer"
                    title="현재 재생 위치로 끝 시간 설정"
                  >
                    Now
                  </button>
                </div>
              </div>
            </div>

            {/* Validation messages */}
            {isTimeOutOfRange && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  시작과 끝 시간은 {MOVIE_SETTINGS.startSeconds}초와 {MOVIE_SETTINGS.endSeconds}초
                  사이여야 하며, 끝 시간이 시작 시간보다 커야 합니다.
                </span>
              </p>
            )}

            {/* Gentle warning if > 4s or > 12 words */}
            {isLongWarning && !isTimeOutOfRange && (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  주의: 4초({duration.toFixed(1)}s) 또는 12단어({wordCount}단어)를 초과하면
                  초보자가 한 호흡에 쉐도잉하기에 조금 길 수 있어요.
                </span>
              </p>
            )}
          </div>

          {/* Submit button (at least 48px) */}
          <button
            type="submit"
            disabled={isTimeOutOfRange || !text.trim()}
            className={`w-full min-h-[48px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
              isTimeOutOfRange || !text.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>{editingId !== null ? 'Save Changes / 수정 완료' : 'Add to List / 문장 등록'}</span>
          </button>
        </form>
      </div>

      {/* Current Sentences List */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700">
            Registered Sentences / 등록된 문장 ({sentences.length})
          </span>
          <span className="text-[11px] text-slate-400">순서 조정 및 편집 가능</span>
        </div>

        {sentences.map((item, idx) => {
          const theme = getSpeakerTheme(item.speaker);
          const isBeingEdited = editingId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border bg-white transition space-y-2 ${
                isBeingEdited
                  ? 'border-emerald-500 ring-2 ring-emerald-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-2xs ${theme.badge}`}
                  >
                    <span>{theme.emoji}</span>
                    <span>{item.speaker}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.start.toFixed(1)}s - {item.end.toFixed(1)}s
                  </span>
                </div>

                {/* Actions: Reorder, Edit, Delete, Test */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => playerRef.current?.playSegment(item.start, item.end, false)}
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="재생 테스트"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="위로 이동"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === sentences.length - 1}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="아래로 이동"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                    title="수정하기"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded-md text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="삭제하기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-800">{item.text}</div>
              <div className="text-[11px] text-slate-500">{item.korean}</div>

              {item.stress && item.stress.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">Stress:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.stress.map((w, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* JSON Import / Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Export / Import JSON (문장 데이터 입출력)
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              현재 등록된 문장 목록의 JSON을 복사(Export)하거나, 외부에서 작성한 JSON을 붙여넣어
              적용(Import)할 수 있습니다.
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              className="w-full h-48 p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] bg-slate-50 focus:outline-emerald-500"
            />

            {jsonError && (
              <p className="text-xs text-rose-600 font-medium">{jsonError}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied! / 복사됨' : 'Copy JSON / 복사'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  Close / 닫기
                </button>
                <button
                  type="button"
                  onClick={handleApplyJsonImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Apply / 적용하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
