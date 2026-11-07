import { Sentence } from '../types';

export const MOVIE_SETTINGS = {
  movieTitleEn: 'Inside Out',
  movieTitleKo: '인사이드 아웃',
  releaseYear: 2015,
  director: 'Pete Docter, Ronnie del Carmen',
  screenplay: 'Pete Docter, Meg LeFauve, Josh Cooley',
  productionCompany: 'Pixar Animation Studios',
  distributionCompany: 'Walt Disney Studios Motion Pictures',
  sceneDescription: '브로콜리를 보고 질색하는 까칠이와 디저트 금지에 분노하는 버럭이',
  youtubeVideoTitle: 'Disney•Pixar’s INSIDE OUT | Clip | Disgust & Anger',
  youtubeChannelName: 'Disney New Zealand',
  youtubeUrl: 'https://www.youtube.com/watch?v=6I-3oTvM-1o',
  videoId: '6I-3oTvM-1o',
  startSeconds: 4.0,
  endSeconds: 45,
  madeBy: '신예진',
  courseName: 'AI and English Language Education (ENG3088, Sungkyunkwan University)',
  courseNameKo: '성균관대학교 「인공지능과 영어교육」(ENG3088)',
} as const;

export const ONE_LINE_CREDIT = `Clip: ${MOVIE_SETTINGS.movieTitleEn} (${MOVIE_SETTINGS.releaseYear}), ${MOVIE_SETTINGS.distributionCompany} / ${MOVIE_SETTINGS.productionCompany} · via YouTube · For educational use only`;

export const EDUCATIONAL_NOTICE_EN =
  'This app was made only for non-commercial English learning in the university course AI and English Language Education (ENG3088, Sungkyunkwan University). The film clip is used only to practice listening and speaking (shadowing). It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.';

export const EDUCATIONAL_NOTICE_KO =
  '이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 비영리 영어 학습 목적으로만 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.';

export const INITIAL_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: 'Disgust',
    text: 'There is a dangerous smell, people.',
    korean: '얘들아, 위험한 냄새가 나.',
    stress: ['dangerous', 'smell'],
    start: 8.0,
    end: 9.8,
  },
  {
    id: 2,
    speaker: 'Disgust',
    text: 'Hold on, what is that?',
    korean: '잠깐, 저게 뭐야?',
    stress: ['Hold', 'what'],
    start: 10.0,
    end: 11.0,
  },
  {
    id: 3,
    speaker: 'Disgust',
    text: 'Well, I just saved our lives.',
    korean: '뭐, 내가 방금 우리 목숨을 구했네.',
    stress: ['saved', 'lives'],
    start: 23.0,
    end: 25.4,
  },
  {
    id: 4,
    speaker: 'Disgust',
    text: "Yeah, you're welcome.",
    korean: '그래, 천만에.',
    stress: ['welcome'],
    start: 25.4,
    end: 26.4,
  },
  {
    id: 5,
    speaker: 'Anger',
    text: "Wait, did he just say we couldn't have dessert?",
    korean: '잠깐, 방금 디저트 못 먹는다고 한 거야?',
    stress: ['dessert'],
    start: 29.5,
    end: 31.9,
  },
  {
    id: 6,
    speaker: 'Anger',
    text: "So that's how you want to play it, old man?",
    korean: '영감탱이, 그런 식으로 나오시겠다 이거지?',
    stress: ['play', 'old'],
    start: 36.4,
    end: 38.0,
  },
];

export const STEP_INFOS = {
  1: {
    titleEn: 'Step 1 Listen',
    titleKo: '1단계: 소리 듣기',
    instructionEn: 'Text hidden. Just listen 2–3 times to catch the rhythm.',
    instructionKo: '자막을 숨기고 소리의 리듬과 억양에 집중하여 2~3회 들어보세요.',
    defaultHideText: true,
  },
  2: {
    titleEn: 'Step 2 Mumble',
    titleKo: '2단계: 웅얼거리기',
    instructionEn: 'Text hidden. Quietly mumble along with the sound.',
    instructionKo: '자막 없이 소리를 들으며 입안으로 작게 웅얼웅얼 따라 해보세요.',
    defaultHideText: true,
  },
  3: {
    titleEn: 'Step 3 Read & Shadow',
    titleKo: '3단계: 보며 말하기',
    instructionEn: 'Text shown. Speak together with the video, stressing bold words.',
    instructionKo: '자막을 보며 강조 단어에 힘을 주고 영상과 동시에 말해보세요.',
    defaultHideText: false,
  },
  4: {
    titleEn: 'Step 4 Shadow',
    titleKo: '4단계: 쉐도잉 완성',
    instructionEn: 'Text hidden. Speak together with the video at the same time.',
    instructionKo: '자막 없이 배우와 완전히 같은 타이밍에 동시에 말해보세요!',
    defaultHideText: true,
  },
} as const;

export function getSpeakerTheme(speaker: string) {
  const s = speaker.toLowerCase().trim();
  if (s.includes('disgust') || s.includes('까칠')) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accent: 'emerald',
      emoji: '🥦',
      label: 'Disgust (까칠이)',
      colorName: '차분한 초록색',
    };
  }
  if (s.includes('anger') || s.includes('버럭')) {
    return {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      accent: 'rose',
      emoji: '🔥',
      label: 'Anger (버럭이)',
      colorName: '부드러운 다홍색',
    };
  }
  if (s.includes('joy') || s.includes('기쁨')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      accent: 'amber',
      emoji: '✨',
      label: 'Joy (기쁨이)',
      colorName: '따뜻한 노란색',
    };
  }
  return {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    accent: 'slate',
    emoji: '🎬',
    label: speaker,
    colorName: '회색',
  };
}
