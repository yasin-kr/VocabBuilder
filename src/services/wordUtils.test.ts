import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import {
  checkAnswer,
  cleanWord,
  filterAndPaginate,
  makeTasks,
  normalizeText,
  searchTokens,
  updatedProgress,
} from './wordUtils';

const words: Word[] = [
  { _id: '1', en: 'run-ran-run', tr: 'koşmak', category: 'verb', isIrregular: true, progress: 25 },
  { _id: '2', en: 'create', tr: 'oluşturmak', category: 'verb', isIrregular: false, progress: 100 },
  { _id: '3', en: 'beautiful', tr: 'güzel', category: 'adjective', progress: 75 },
];

describe('dictionary filtering', () => {
  it('distinguishes Turkish dotted and dotless I while retaining English case-insensitive search', () => {
    const vocabulary: Word[] = [
      { _id: 'beam', en: 'beam', tr: 'ışık', category: 'noun', progress: 0 },
      { _id: 'care', en: 'care', tr: 'ilgi', category: 'noun', progress: 0 },
      { _id: 'idea', en: 'idea', tr: 'düşünce', category: 'noun', progress: 0 },
    ];
    const ids = (keyword: string) =>
      filterAndPaginate(vocabulary, { page: 1, limit: 7, scope: 'own', keyword }).results.map(
        (word) => word._id,
      );
    expect(ids('I')).toEqual(['beam', 'idea']);
    expect(ids('İ')).toEqual(['care']);
    expect(ids('IDEA')).toEqual(['idea']);
    expect(searchTokens(vocabulary[0])).toContain('tr:ışık');
    expect(searchTokens(vocabulary[0])).not.toContain('en:ışık');
    expect(searchTokens(vocabulary[1])).toContain('tr:ilgi');
  });

  it('trims keywords and searches inside both languages before pagination', () => {
    expect(
      filterAndPaginate(words, { page: 1, limit: 1, keyword: '  ÜZ  ', scope: 'own' }).results[0]
        ._id,
    ).toBe('3');
    expect(
      filterAndPaginate(words, { page: 1, limit: 1, keyword: ' RUN ', scope: 'own' }).results[0]
        ._id,
    ).toBe('1');
  });

  it('distinguishes a false regular filter from an omitted filter', () => {
    expect(
      filterAndPaginate(words, {
        page: 1,
        limit: 7,
        category: 'verb',
        isIrregular: false,
        scope: 'own',
      }).results.map((word) => word._id),
    ).toEqual(['2']);
  });

  it('clamps stale pages after deletion and preserves an empty first page', () => {
    expect(filterAndPaginate(words, { page: 9, limit: 2, scope: 'own' })).toMatchObject({
      page: 2,
      totalPages: 2,
    });
    expect(filterAndPaginate([], { page: 9, limit: 7, scope: 'own' })).toEqual({
      results: [],
      page: 1,
      perPage: 7,
      totalPages: 1,
    });
  });
});

describe('word validation and server search tokens', () => {
  it('accepts UI-supported curly apostrophes and normalizes lookup keys consistently', () => {
    expect(cleanWord({ en: 'you’re', tr: 'sen varsın', category: 'functional phrase' }).en).toBe(
      'you’re',
    );
    expect(normalizeText(' I’M ', 'en')).toBe("i'm");
    expect(normalizeText('I', 'en')).toBe('i');
    expect(normalizeText('I', 'tr')).toBe('ı');
    expect(normalizeText('İ', 'tr')).toBe('i');
    expect(normalizeText(' IŞIK İLGİ ', 'tr')).toBe('ışık ilgi');
  });
  it('accepts Turkish phrases while removing irrelevant verb state', () => {
    expect(
      cleanWord({
        en: ' look  forward to ',
        tr: ' dört gözle beklemek ',
        category: 'phrasal verb',
        isIrregular: true,
      }),
    ).toEqual({ en: 'look forward to', tr: 'dört gözle beklemek', category: 'phrasal verb' });
    expect(cleanWord({ en: 'memory', tr: 'hafıza', category: 'noun' }).tr).toBe('hafıza');
  });

  it('requires verb type and prevents invalid alphabet submissions', () => {
    expect(() => cleanWord({ en: 'run', tr: 'koşmak', category: 'verb' })).toThrow(
      'düzenli mi düzensiz mi',
    );
    expect(() => cleanWord({ en: 'word!', tr: 'kelime', category: 'noun' })).toThrow(
      'İngilizce kelime',
    );
    expect(() => cleanWord({ en: 'word', tr: 'слово', category: 'noun' })).toThrow('Türkçe');
  });

  it('indexes interior substrings and full phrases in both languages', () => {
    const tokens = searchTokens({ en: 'Look up', tr: 'aramak' });
    expect(tokens).toContain('en:ook u');
    expect(tokens).toContain('en:look up');
    expect(tokens).toContain('tr:rama');
    expect(tokens).not.toContain('en: up');
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});

describe('training scoring', () => {
  it('grades Turkish I/ı and İ/i with Turkish case rules without dropping diacritics', () => {
    const light: Word = { _id: 'light', en: 'light', tr: 'ışık', category: 'noun', progress: 0 };
    const interest: Word = {
      _id: 'interest',
      en: 'interest',
      tr: 'ilgi',
      category: 'noun',
      progress: 0,
    };
    expect(checkAnswer(light, { _id: 'light', en: 'light', tr: ' IŞIK ', task: 'tr' }).isDone).toBe(
      true,
    );
    expect(checkAnswer(light, { _id: 'light', en: 'light', tr: 'isik', task: 'tr' }).isDone).toBe(
      false,
    );
    expect(
      checkAnswer(interest, { _id: 'interest', en: 'interest', tr: 'İLGİ', task: 'tr' }).isDone,
    ).toBe(true);
    expect(
      checkAnswer(interest, { _id: 'interest', en: 'interest', tr: 'ILGI', task: 'tr' }).isDone,
    ).toBe(false);
  });
  it('excludes mastered words and alternates requested answer language', () => {
    expect(makeTasks(words)).toEqual([
      { _id: '1', tr: 'koşmak', task: 'en' },
      { _id: '3', en: 'beautiful', task: 'tr' },
    ]);
  });

  it('checks only the answer language and normalizes case and spaces', () => {
    expect(
      checkAnswer(words[0], { _id: '1', en: ' RUN-RAN-RUN ', tr: 'koşmak', task: 'en' }).isDone,
    ).toBe(true);
    expect(checkAnswer(words[0], { _id: '1', en: 'run', tr: 'koşmak', task: 'en' }).isDone).toBe(
      false,
    );
  });

  it('bounds progression for repeated successes or errors', () => {
    expect(updatedProgress(90, true)).toBe(100);
    expect(updatedProgress(0, false)).toBe(0);
    expect(updatedProgress(50, false)).toBe(40);
  });
});
