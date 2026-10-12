import type { DataService, User } from '../types';
import { DEMO_SESSION_KEY, demoService, enterDemo } from './demo';

const unsupportedProvider = import.meta.env.VITE_DATA_PROVIDER === 'goit';
export const providerName = 'Firebase';
export const providerConfigured =
  !unsupportedProvider &&
  Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID,
  );

let liveService: Promise<DataService> | undefined;
let selectedMode: 'demo' | 'live' | null = null;

async function live(): Promise<DataService> {
  if (unsupportedProvider) {
    throw new Error(
      'GoIT yalnızca İngilizce–Ukraynaca verileri destekliyor. İngilizce–Türkçe için Firebase kullan.',
    );
  }
  if (!providerConfigured) {
    throw new Error(
      'Hesaba giriş henüz hazır değil. VocabBuilder’ı denemek için demoyu keşfedebilirsin.',
    );
  }
  liveService ??= import('./firebase').then((module) => module.firebaseService);
  return liveService;
}

async function active(): Promise<DataService> {
  if (!selectedMode) throw new Error('Devam etmek için giriş yap veya demoyu seç.');
  return selectedMode === 'demo' ? demoService : live();
}

export const api: DataService & { enterDemo(): Promise<User> } = {
  async restore() {
    if (localStorage.getItem(DEMO_SESSION_KEY) === 'true') {
      const user = await demoService.restore();
      selectedMode = user ? 'demo' : null;
      return user;
    }
    const user = providerConfigured ? await (await live()).restore() : null;
    selectedMode = user ? 'live' : null;
    return user;
  },
  async signUp(input) {
    const user = await (await live()).signUp(input);
    selectedMode = 'live';
    localStorage.removeItem(DEMO_SESSION_KEY);
    return user;
  },
  async signIn(input) {
    const user = await (await live()).signIn(input);
    selectedMode = 'live';
    localStorage.removeItem(DEMO_SESSION_KEY);
    return user;
  },
  async signOut() {
    await (await active()).signOut();
    selectedMode = null;
  },
  async enterDemo() {
    const user = enterDemo();
    selectedMode = 'demo';
    return user;
  },
  async categories() {
    return (await active()).categories();
  },
  async listWords(filters) {
    return (await active()).listWords(filters);
  },
  async statistics() {
    return (await active()).statistics();
  },
  async createWord(input) {
    return (await active()).createWord(input);
  },
  async editWord(id, input) {
    return (await active()).editWord(id, input);
  },
  async deleteWord(id) {
    return (await active()).deleteWord(id);
  },
  async addWord(id) {
    return (await active()).addWord(id);
  },
  async tasks() {
    return (await active()).tasks();
  },
  async answers(input) {
    return (await active()).answers(input);
  },
};
