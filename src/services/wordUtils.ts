import type { Answer, AnswerResult, Task, Word, WordFilters, WordInput, WordPage } from '../types';
import { ENGLISH_PATTERN, TURKISH_PATTERN } from '../lib/validation';

export const WORD_CATEGORIES = [
  'verb',
  'participle',
  'noun',
  'adjective',
  'pronoun',
  'numerals',
  'adverb',
  'preposition',
  'conjunction',
  'phrasal verb',
  'functional phrase',
];

export function normalizeText(value: string, language: 'en' | 'tr'): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’ʼ]/g, "'")
    .toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
}

export function cleanWord(input: WordInput): WordInput {
  const en = input.en.trim().replace(/\s+/g, ' ');
  const tr = input.tr.trim().replace(/\s+/g, ' ');

  if (!ENGLISH_PATTERN.test(en)) {
    throw new Error('İngilizce kelime için harf, boşluk, kesme işareti veya kısa çizgi kullan.');
  }
  if (!TURKISH_PATTERN.test(tr)) {
    throw new Error('Türkçe karşılığı Türkçe harflerle gir.');
  }
  if (en.length > 64 || tr.length > 64) {
    throw new Error('Her kelime veya ifade için en fazla 64 karakter kullan.');
  }
  if (!WORD_CATEGORIES.includes(input.category)) {
    throw new Error('Bir kelime kategorisi seç.');
  }
  if (input.category === 'verb' && typeof input.isIrregular !== 'boolean') {
    throw new Error('Fiilin düzenli mi düzensiz mi olduğunu seç.');
  }

  return {
    en,
    tr,
    category: input.category,
    ...(input.category === 'verb' ? { isIrregular: input.isIrregular } : {}),
  };
}

export function searchTokens(input: Pick<WordInput, 'en' | 'tr'>): string[] {
  const tokens = new Set<string>();
  for (const language of ['en', 'tr'] as const) {
    const normalized = normalizeText(input[language], language);
    for (let start = 0; start < normalized.length; start += 1) {
      for (let end = start + 1; end <= normalized.length; end += 1) {
        const token = normalized.slice(start, end);
        if (token === token.trim()) tokens.add(`${language}:${token}`);
      }
    }
  }
  return [...tokens];
}

export function filterAndPaginate(words: Word[], filters: WordFilters): WordPage {
  const keywordEn = normalizeText(filters.keyword ?? '', 'en');
  const keywordTr = normalizeText(filters.keyword ?? '', 'tr');
  const matching = words.filter((word) => {
    if (
      keywordEn &&
      !normalizeText(word.en, 'en').includes(keywordEn) &&
      !normalizeText(word.tr, 'tr').includes(keywordTr)
    )
      return false;
    if (filters.category && word.category !== filters.category) return false;
    if (
      filters.category === 'verb' &&
      filters.isIrregular !== undefined &&
      word.isIrregular !== filters.isIrregular
    )
      return false;
    return true;
  });
  const perPage = Math.max(1, Math.floor(filters.limit));
  const totalPages = Math.max(1, Math.ceil(matching.length / perPage));
  const page = Math.min(totalPages, Math.max(1, Math.floor(filters.page)));
  return {
    results: matching.slice((page - 1) * perPage, page * perPage),
    totalPages,
    page,
    perPage,
  };
}

export function makeTasks(words: Word[]): Task[] {
  return words
    .filter((word) => word.progress < 100)
    .map((word, index) =>
      index % 2 === 0
        ? { _id: word._id, tr: word.tr, task: 'en' }
        : { _id: word._id, en: word.en, task: 'tr' },
    );
}

export function checkAnswer(word: Word, answer: Answer): AnswerResult {
  const isDone =
    normalizeText(answer[answer.task], answer.task) ===
    normalizeText(word[answer.task], answer.task);
  return { ...answer, isDone };
}

export function updatedProgress(progress: number, isDone: boolean): number {
  return Math.max(0, Math.min(100, progress + (isDone ? 25 : -10)));
}
