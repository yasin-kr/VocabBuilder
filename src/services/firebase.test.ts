import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '../types';

const state = vi.hoisted(() => ({
  auth: {
    currentUser: null as { uid: string; displayName: string; email: string } | null,
    authStateReady: vi.fn().mockResolvedValue(undefined),
  },
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getCount: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getAuth: () => state.auth,
  browserLocalPersistence: {},
  setPersistence: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: async () => ({ user: state.auth.currentUser }),
  signInWithEmailAndPassword: async () => ({ user: state.auth.currentUser }),
  updateProfile: state.updateProfile,
  signOut: state.signOut,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: (_db: unknown, name: string) => ({ path: name }),
  doc: (base: { path?: string }, ...segments: string[]) => ({
    path: [
      ...(base.path ? [base.path] : []),
      ...segments,
      ...(!segments.length ? ['new-word'] : []),
    ].join('/'),
    id: segments.at(-1) ?? 'new-word',
  }),
  documentId: () => '__name__',
  getCountFromServer: state.getCount,
  getDoc: state.getDoc,
  getDocs: state.getDocs,
  query: (...parts: unknown[]) => parts,
  where: (...parts: unknown[]) => parts,
  orderBy: (...parts: unknown[]) => parts,
  limit: (value: number) => value,
  startAfter: (value: unknown) => value,
  serverTimestamp: () => 'server-timestamp',
  runTransaction: state.runTransaction,
  setDoc: state.setDoc,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  state.auth.currentUser = { uid: 'user-a', displayName: 'Alex', email: 'alex@example.com' };
  state.updateProfile.mockResolvedValue(undefined);
  state.setDoc.mockResolvedValue(undefined);
  state.signOut.mockImplementation(async () => {
    state.auth.currentUser = null;
  });
});

const input = { en: 'river', tr: 'nehir', category: 'noun' };

describe('Firebase training answer limits', () => {
  const answers = (count: number): Answer[] =>
    Array.from({ length: count }, (_, index) => ({
      _id: `word-${index}`,
      en: 'river',
      tr: 'nehir',
      task: 'en',
    }));

  it('saves all 450 answers in a single transaction at the session boundary', async () => {
    const { firebaseService } = await import('./firebase');
    await firebaseService.restore();
    const transaction = {
      get: vi.fn().mockImplementation(async (reference: { id: string }) => ({
        id: reference.id,
        data: () => ({ ...input, owner: 'user-a', progress: 75 }),
      })),
      update: vi.fn(),
    };
    state.runTransaction.mockImplementation(async (_db, callback) => callback(transaction));
    const completed = answers(450);

    const results = await firebaseService.answers(completed);

    expect(state.runTransaction).toHaveBeenCalledOnce();
    expect(results).toEqual(completed.map((answer) => ({ ...answer, isDone: true })));
    expect(transaction.update.mock.calls).toEqual(
      completed.map((answer) => [
        { id: answer._id, path: `words_en_tr/${answer._id}` },
        { progress: 100, updatedAt: 'server-timestamp' },
      ]),
    );
  });

  it('rejects 451 answers before starting any writes', async () => {
    const { firebaseService } = await import('./firebase');
    await firebaseService.restore();

    await expect(firebaseService.answers(answers(451))).rejects.toThrow('en fazla 450 yanıt');

    expect(state.runTransaction).not.toHaveBeenCalled();
  });
});

describe('Firebase account consistency', () => {
  it('blocks every data operation and sign-out after the account changes in another tab', async () => {
    const { firebaseService } = await import('./firebase');
    await firebaseService.restore();
    state.auth.currentUser = { uid: 'user-b', displayName: 'Bob', email: 'bob@example.com' };
    const operations = [
      () => firebaseService.categories(),
      () => firebaseService.listWords({ page: 1, limit: 7, scope: 'own' }),
      () => firebaseService.statistics(),
      () => firebaseService.createWord(input),
      () => firebaseService.editWord('word', input),
      () => firebaseService.deleteWord('word'),
      () => firebaseService.addWord('word'),
      () => firebaseService.tasks(),
      () => firebaseService.answers([]),
      () => firebaseService.signOut(),
    ];
    for (const operation of operations) {
      await expect(operation()).rejects.toThrow('Oturumun');
    }
    expect(state.getDoc).not.toHaveBeenCalled();
    expect(state.getDocs).not.toHaveBeenCalled();
    expect(state.getCount).not.toHaveBeenCalled();
    expect(state.runTransaction).not.toHaveBeenCalled();
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it('rechecks the account after asynchronous reads before scheduling writes', async () => {
    const { firebaseService } = await import('./firebase');
    await firebaseService.restore();
    const transaction = {
      get: vi.fn().mockImplementation(async () => {
        state.auth.currentUser = { uid: 'user-b', displayName: 'Bob', email: 'bob@example.com' };
        return { exists: () => false };
      }),
      set: vi.fn(),
    };
    state.runTransaction.mockImplementation(async (_db, callback) => callback(transaction));
    await expect(firebaseService.createWord(input)).rejects.toThrow('Oturumun');
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('leaves a failed post-registration profile setup signed out with sign-in guidance', async () => {
    const { firebaseService } = await import('./firebase');
    state.updateProfile.mockRejectedValueOnce(new Error('Network unavailable'));
    await expect(
      firebaseService.signUp({ name: 'Alex', email: 'alex@example.com', password: 'abcdef1' }),
    ).rejects.toThrow('Hesabın oluşturuldu');
    expect(state.signOut).toHaveBeenCalledOnce();
    expect(state.auth.currentUser).toBeNull();
    await expect(firebaseService.createWord(input)).rejects.toThrow('giriş yap');
  });

  it('rejects an already claimed word inside the transaction before creating a duplicate', async () => {
    const { firebaseService } = await import('./firebase');
    await firebaseService.restore();
    const transaction = {
      get: vi
        .fn()
        .mockResolvedValue({ exists: () => true, data: () => ({ wordId: 'existing-word' }) }),
      set: vi.fn(),
    };
    state.runTransaction.mockImplementation(async (_db, callback) => callback(transaction));
    await expect(firebaseService.createWord(input)).rejects.toThrow('zaten sözlüğünde');
    expect(transaction.get).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-a/wordKeysEnTr/river' }),
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
