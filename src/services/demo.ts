import type { Answer, DataService, User, Word, WordInput } from '../types';
import {
  checkAnswer,
  cleanWord,
  filterAndPaginate,
  makeTasks,
  normalizeText,
  updatedProgress,
  WORD_CATEGORIES,
} from './wordUtils';

const WORDS_KEY = 'vocabbuilder.demo.words.en-tr.v1';
export const DEMO_SESSION_KEY = 'vocabbuilder.demo.active';

const demoUser: User = {
  _id: 'demo-user',
  name: 'Deniz',
  email: '',
  mode: 'demo',
};

const ownSeed: Array<[string, string, string, number, boolean?]> = [
  ['apple', 'elma', 'noun', 75],
  ['beautiful', 'güzel', 'adjective', 50],
  ['discover', 'keşfetmek', 'verb', 25, false],
  ['journey', 'yolculuk', 'noun', 100],
  ['dream', 'rüya', 'noun', 50],
  ['run-ran-run', 'koşmak', 'verb', 25, true],
  ['always', 'her zaman', 'adverb', 75],
  ['together', 'birlikte', 'adverb', 50],
  ['knowledge', 'bilgi', 'noun', 25],
  ['bright', 'parlak', 'adjective', 0],
  ['create', 'oluşturmak', 'verb', 50, false],
  ['understand-understood-understood', 'anlamak', 'verb', 25, true],
  ['opportunity', 'fırsat', 'noun', 75],
  ['curious', 'meraklı', 'adjective', 0],
  ['explore', 'araştırmak', 'verb', 25, false],
  ['because', 'çünkü', 'conjunction', 100],
  ['grow-grew-grown', 'büyümek', 'verb', 50, true],
  ['peaceful', 'huzurlu', 'adjective', 0],
];

const publicSeed: Array<[string, string, string, boolean?]> = [
  ['inspiration', 'ilham', 'noun'],
  ['wonderful', 'harika', 'adjective'],
  ['achieve', 'başarmak', 'verb', false],
  ['adventure', 'macera', 'noun'],
  ['confident', 'öz güvenli', 'adjective'],
  ['learn', 'öğrenmek', 'verb', false],
  ['kindness', 'iyilik', 'noun'],
  ['take-took-taken', 'almak', 'verb', true],
  ['thoughtful', 'düşünceli', 'adjective'],
  ['beyond', 'ötesinde', 'preposition'],
  ['look forward to', 'dört gözle beklemek', 'phrasal verb'],
  ['eventually', 'sonunda', 'adverb'],
  ['horizon', 'ufuk', 'noun'],
  ['make-made-made', 'yapmak', 'verb', true],
  ['delighted', 'memnun', 'adjective'],
  ['at the moment', 'şu anda', 'functional phrase'],
  ['celebrate', 'kutlamak', 'verb', false],
  ['someone', 'birisi', 'pronoun'],
  ['freedom', 'özgürlük', 'noun'],
  ['quickly', 'hızlıca', 'adverb'],
  ['three', 'üç', 'numerals'],
];

const recommendedWords: Word[] = publicSeed.map(([en, tr, category, isIrregular], index) => ({
  _id: `recommend-${index + 1}`,
  en,
  tr,
  category,
  progress: 0,
  owner: 'demo-community',
  ...(isIrregular !== undefined ? { isIrregular } : {}),
}));

function isStoredWord(value: unknown): value is Word {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const word = value as Record<string, unknown>;
  if (
    typeof word._id !== 'string' ||
    !word._id.trim() ||
    typeof word.en !== 'string' ||
    typeof word.tr !== 'string' ||
    typeof word.category !== 'string' ||
    typeof word.progress !== 'number' ||
    !Number.isFinite(word.progress) ||
    word.progress < 0 ||
    word.progress > 100 ||
    word.owner !== demoUser._id ||
    (word.isIrregular !== undefined && typeof word.isIrregular !== 'boolean')
  )
    return false;
  try {
    cleanWord(word as unknown as WordInput);
    return true;
  } catch {
    return false;
  }
}

function readWords(): Word[] {
  const stored = localStorage.getItem(WORDS_KEY);
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.every(isStoredWord) &&
        new Set(parsed.map((word) => word._id)).size === parsed.length
      ) {
        return parsed;
      }
    } catch {
      localStorage.removeItem(WORDS_KEY);
    }
  }
  const words: Word[] = ownSeed.map(([en, tr, category, progress, isIrregular], index) => ({
    _id: `demo-${index + 1}`,
    en,
    tr,
    category,
    progress,
    owner: demoUser._id,
    ...(isIrregular !== undefined ? { isIrregular } : {}),
  }));
  writeWords(words);
  return words;
}

function writeWords(words: Word[]): void {
  localStorage.setItem(WORDS_KEY, JSON.stringify(words));
}

function assertUnique(words: Word[], input: WordInput, exceptId?: string): void {
  if (
    words.some(
      (word) =>
        word._id !== exceptId && normalizeText(word.en, 'en') === normalizeText(input.en, 'en'),
    )
  ) {
    throw new Error('Bu kelime zaten sözlüğünde var.');
  }
}

function findWord(words: Word[], id: string): Word {
  const word = words.find((candidate) => candidate._id === id);
  if (!word) throw new Error('Kelime bulunamadı. Lütfen sayfayı yenile.');
  return word;
}

export function enterDemo(): User {
  readWords();
  localStorage.setItem(DEMO_SESSION_KEY, 'true');
  return { ...demoUser };
}

export const demoService: DataService = {
  async restore() {
    if (localStorage.getItem(DEMO_SESSION_KEY) !== 'true') return null;
    readWords();
    return { ...demoUser };
  },
  async signUp() {
    throw new Error('Demo modunda hesap oluşturulmaz. Kayıt olmak için demodan çık.');
  },
  async signIn() {
    throw new Error('Demo modunda gerçek hesaba giriş yapılmaz. Giriş yapmak için demodan çık.');
  },
  async signOut() {
    localStorage.removeItem(DEMO_SESSION_KEY);
  },
  async categories() {
    return [...WORD_CATEGORIES];
  },
  async listWords(filters) {
    return filterAndPaginate(filters.scope === 'own' ? readWords() : recommendedWords, filters);
  },
  async statistics() {
    return { totalCount: readWords().filter((word) => word.progress < 100).length };
  },
  async createWord(input) {
    const words = readWords();
    const clean = cleanWord(input);
    assertUnique(words, clean);
    const word: Word = { ...clean, _id: crypto.randomUUID(), progress: 0, owner: demoUser._id };
    writeWords([word, ...words]);
    return word;
  },
  async editWord(id, input) {
    const words = readWords();
    const original = findWord(words, id);
    const clean = cleanWord(input);
    assertUnique(words, clean, id);
    const word: Word = { ...original, ...clean };
    if (clean.category !== 'verb') delete word.isIrregular;
    writeWords(words.map((candidate) => (candidate._id === id ? word : candidate)));
    return word;
  },
  async deleteWord(id) {
    const words = readWords();
    findWord(words, id);
    writeWords(words.filter((word) => word._id !== id));
  },
  async addWord(id) {
    const source = findWord(recommendedWords, id);
    return demoService.createWord(source);
  },
  async tasks() {
    return { words: makeTasks(readWords()) };
  },
  async answers(input: Answer[]) {
    const words = readWords();
    const seen = new Set<string>();
    const results = input.map((answer) => {
      if (seen.has(answer._id))
        throw new Error('Bir kelimeyi her alıştırmada yalnızca bir kez yanıtlayabilirsin.');
      seen.add(answer._id);
      const word = findWord(words, answer._id);
      const result = checkAnswer(word, answer);
      word.progress = updatedProgress(word.progress, result.isDone);
      return result;
    });
    writeWords(words);
    return results;
  },
};
