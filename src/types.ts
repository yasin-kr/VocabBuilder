export type ProviderMode = 'demo' | 'firebase';

export interface User {
  _id: string;
  name: string;
  email: string;
  mode: ProviderMode;
}

export interface WordInput {
  en: string;
  tr: string;
  category: string;
  isIrregular?: boolean;
}

export interface Word extends WordInput {
  _id: string;
  progress: number;
  owner?: string;
}

export interface Task {
  _id: string;
  en?: string;
  tr?: string;
  task: 'en' | 'tr';
}

export interface Answer {
  _id: string;
  en: string;
  tr: string;
  task: 'en' | 'tr';
}

export interface AnswerResult extends Answer {
  isDone: boolean;
}

export interface WordFilters {
  page: number;
  limit: number;
  keyword?: string;
  category?: string;
  isIrregular?: boolean;
  scope: 'own' | 'all';
}

export interface WordPage {
  results: Word[];
  totalPages: number;
  page: number;
  perPage: number;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  name: string;
}

export interface DataService {
  restore(): Promise<User | null>;
  signUp(input: SignUpInput): Promise<User>;
  signIn(input: SignInInput): Promise<User>;
  signOut(): Promise<void>;
  categories(): Promise<string[]>;
  listWords(filters: WordFilters): Promise<WordPage>;
  statistics(): Promise<{ totalCount: number }>;
  createWord(input: WordInput): Promise<Word>;
  editWord(id: string, input: WordInput): Promise<Word>;
  deleteWord(id: string): Promise<void>;
  addWord(id: string): Promise<Word>;
  tasks(): Promise<{ words: Task[] }>;
  answers(input: Answer[]): Promise<AnswerResult[]>;
}
