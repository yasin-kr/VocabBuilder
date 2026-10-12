import { beforeEach, describe, expect, it, vi } from 'vitest';

const live = vi.hoisted(() => ({
  restore: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  createWord: vi.fn(),
}));

vi.mock('./firebase', () => ({ firebaseService: live }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('VITE_DATA_PROVIDER', 'firebase');
  for (const key of ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID']) {
    vi.stubEnv(`VITE_FIREBASE_${key}`, 'configured-for-test');
  }
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  const user = {
    _id: 'real-user',
    name: 'Learner',
    email: 'learner@example.com',
    mode: 'firebase',
  };
  live.restore.mockResolvedValue(user);
  live.signIn.mockResolvedValue(user);
  live.signUp.mockResolvedValue(user);
  live.signOut.mockResolvedValue(undefined);
  live.createWord.mockImplementation(async (input) => ({
    ...input,
    _id: 'real-word',
    progress: 0,
  }));
});

describe('tab-local provider choice', () => {
  it('rejects legacy GoIT configuration instead of sending Turkish words to a Ukrainian API', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'goit');
    const { api, providerConfigured } = await import('./api');
    expect(providerConfigured).toBe(false);
    await expect(api.signIn({ email: 'learner@example.com', password: 'abcdef1' })).rejects.toThrow(
      'İngilizce–Türkçe için Firebase',
    );
    expect(live.signIn).not.toHaveBeenCalled();
    await api.enterDemo();
    expect((await api.createWord({ en: 'river', tr: 'nehir', category: 'noun' })).tr).toBe('nehir');
  });

  it('keeps demo mutations local when another tab removes the shared demo flag', async () => {
    const { api } = await import('./api');
    await api.enterDemo();
    localStorage.removeItem('vocabbuilder.demo.active');
    const word = await api.createWord({ en: 'river', tr: 'nehir', category: 'noun' });
    expect(word.owner).toBe('demo-user');
    expect(live.createWord).not.toHaveBeenCalled();
  });

  it('does not redirect a real session to demo when another tab enters the demo', async () => {
    const { api } = await import('./api');
    await api.signIn({ email: 'learner@example.com', password: 'abcdef1' });
    localStorage.setItem('vocabbuilder.demo.active', 'true');
    const input = { en: 'river', tr: 'nehir', category: 'noun' };
    expect((await api.createWord(input))._id).toBe('real-word');
    expect(live.createWord).toHaveBeenCalledWith(input);
  });

  it('uses the saved mode only at restore and prevents requests after logout', async () => {
    localStorage.setItem('vocabbuilder.demo.active', 'true');
    const { api } = await import('./api');
    expect((await api.restore())?.mode).toBe('demo');
    localStorage.removeItem('vocabbuilder.demo.active');
    await api.signOut();
    await expect(api.createWord({ en: 'river', tr: 'nehir', category: 'noun' })).rejects.toThrow(
      'giriş yap',
    );
    expect(live.createWord).not.toHaveBeenCalled();
  });
});
