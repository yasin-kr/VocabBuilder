import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import type {
  DocumentData,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { DataService, User, Word, WordFilters, WordInput } from '../types';
import { MAX_TRAINING_TASKS } from '../lib/training';
import {
  checkAnswer,
  cleanWord,
  makeTasks,
  normalizeText,
  searchTokens,
  updatedProgress,
  WORD_CATEGORIES,
} from './wordUtils';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);
const wordsCollection = collection(db, 'words_en_tr');
const persistenceReady = setPersistence(auth, browserLocalPersistence);
const cursors = new Map<string, Map<number, QueryDocumentSnapshot<DocumentData>>>();
let expectedUid: string | null = null;

function toUser(user: FirebaseUser): User {
  return {
    _id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Öğrenci',
    email: user.email ?? '',
    mode: 'firebase',
  };
}

function currentUid(): string {
  if (!expectedUid) throw new Error('Devam etmek için giriş yap.');
  if (auth.currentUser?.uid !== expectedUid) {
    throw new Error('Oturumun başka bir sekmede değişti. Devam etmek için sayfayı yenile.');
  }
  return expectedUid;
}

function assertSession(uid: string): void {
  if (currentUid() !== uid) throw new Error('Oturumun değişti. Devam etmek için sayfayı yenile.');
}

function wordKey(uid: string, english: string) {
  return doc(db, 'users', uid, 'wordKeysEnTr', normalizeText(english, 'en'));
}

function toWord(snapshot: DocumentSnapshot<DocumentData>): Word {
  const data = snapshot.data();
  if (!data) throw new Error('Kelime bulunamadı. Lütfen sayfayı yenile.');
  if (typeof data.en !== 'string' || typeof data.tr !== 'string') {
    throw new Error('Kelimenin İngilizce–Türkçe verileri eksik. Lütfen sayfayı yenile.');
  }
  return {
    _id: snapshot.id,
    en: String(data.en),
    tr: String(data.tr),
    category: String(data.category),
    owner: String(data.owner),
    progress: Number(data.progress ?? 0),
    ...(typeof data.isIrregular === 'boolean' ? { isIrregular: data.isIrregular } : {}),
  };
}

function wordData(input: WordInput): WordInput & { enNormalized: string; searchTokens: string[] } {
  const clean = cleanWord(input);
  return {
    ...clean,
    enNormalized: normalizeText(clean.en, 'en'),
    searchTokens: searchTokens(clean),
  };
}

function assertOwner(word: Word, uid: string): void {
  assertSession(uid);
  if (word.owner !== uid)
    throw new Error('Yalnızca kendi sözlüğündeki kelimeleri değiştirebilirsin.');
}

function filterConstraints(filters: WordFilters, uid: string): QueryConstraint[] {
  const constraints: QueryConstraint[] =
    filters.scope === 'own'
      ? [where('owner', '==', uid)]
      : [where('visibility', '==', 'public'), where('owner', '!=', uid)];
  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.category === 'verb' && filters.isIrregular !== undefined)
    constraints.push(where('isIrregular', '==', filters.isIrregular));
  const keyword = filters.keyword?.trim();
  if (keyword) {
    constraints.push(
      where('searchTokens', 'array-contains-any', [
        `en:${normalizeText(keyword, 'en')}`,
        `tr:${normalizeText(keyword, 'tr')}`,
      ]),
    );
  }
  return constraints;
}

function authError(error: unknown): never {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',
    'auth/invalid-credential': 'E-posta adresi veya şifre yanlış.',
    'auth/wrong-password': 'E-posta adresi veya şifre yanlış.',
    'auth/user-not-found': 'E-posta adresi veya şifre yanlış.',
    'auth/invalid-email': 'Geçerli bir e-posta adresi gir.',
    'auth/weak-password': 'En az altı harf ve bir rakam içeren daha güçlü bir şifre seç.',
    'auth/too-many-requests': 'Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.',
    'auth/network-request-failed': 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
    'auth/operation-not-allowed': 'Hesaba giriş henüz hazır değil. Demoyu keşfedebilirsin.',
    'auth/invalid-api-key': 'Hesaba giriş henüz hazır değil. Demoyu keşfedebilirsin.',
  };
  throw new Error(
    messages[code] ??
      (error instanceof Error && !code ? error.message : 'Bir sorun oluştu. Lütfen tekrar dene.'),
  );
}

export const firebaseService: DataService = {
  async restore() {
    await persistenceReady;
    await auth.authStateReady();
    expectedUid = auth.currentUser?.uid ?? null;
    cursors.clear();
    return auth.currentUser ? toUser(auth.currentUser) : null;
  },
  async signUp(input) {
    const name = input.name.trim();
    if (!name || name.length > 100) throw new Error('1–100 karakter uzunluğunda bir ad gir.');
    let credential: UserCredential;
    try {
      await persistenceReady;
      credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    } catch (error) {
      return authError(error);
    }
    const uid = credential.user.uid;
    expectedUid = uid;
    cursors.clear();
    try {
      assertSession(uid);
      await updateProfile(credential.user, { displayName: name });
      assertSession(uid);
      await setDoc(doc(db, 'users', uid), {
        name,
        email: credential.user.email,
        createdAt: serverTimestamp(),
      });
      assertSession(uid);
      return toUser(credential.user);
    } catch {
      if (auth.currentUser?.uid === uid) await signOut(auth).catch(() => undefined);
      expectedUid = null;
      throw new Error(
        'Hesabın oluşturuldu ancak profil kurulumu tamamlanamadı. Devam etmek için e-posta adresin ve şifrenle giriş yap.',
      );
    }
  },
  async signIn(input) {
    try {
      await persistenceReady;
      const credential = await signInWithEmailAndPassword(auth, input.email.trim(), input.password);
      expectedUid = credential.user.uid;
      assertSession(expectedUid);
      cursors.clear();
      return toUser(credential.user);
    } catch (error) {
      return authError(error);
    }
  },
  async signOut() {
    currentUid();
    await signOut(auth);
    expectedUid = null;
    cursors.clear();
  },
  async categories() {
    const uid = currentUid();
    const snapshot = await getDoc(doc(db, 'metadata', 'categories'));
    assertSession(uid);
    const values: unknown = snapshot.data()?.values;
    const categories = Array.isArray(values)
      ? values.filter(
          (value): value is string => typeof value === 'string' && WORD_CATEGORIES.includes(value),
        )
      : [];
    return categories.length ? [...new Set(categories)] : [...WORD_CATEGORIES];
  },
  async listWords(filters) {
    const uid = currentUid();
    const perPage = Math.min(100, Math.max(1, Math.floor(filters.limit)));
    const constraints = filterConstraints(filters, uid);
    const aggregate = await getCountFromServer(query(wordsCollection, ...constraints));
    assertSession(uid);
    const totalPages = Math.max(1, Math.ceil(aggregate.data().count / perPage));
    const page = Math.min(totalPages, Math.max(1, Math.floor(filters.page)));
    const ordering =
      filters.scope === 'all' ? [orderBy('owner'), orderBy(documentId())] : [orderBy(documentId())];
    const key = JSON.stringify({
      owner: uid,
      scope: filters.scope,
      category: filters.category ?? '',
      isIrregular: filters.category === 'verb' ? filters.isIrregular : undefined,
      keyword: [
        normalizeText(filters.keyword ?? '', 'en'),
        normalizeText(filters.keyword ?? '', 'tr'),
      ],
      perPage,
    });
    const pageCursors =
      page === 1
        ? new Map<number, QueryDocumentSnapshot<DocumentData>>()
        : (cursors.get(key) ?? new Map<number, QueryDocumentSnapshot<DocumentData>>());
    cursors.set(key, pageCursors);

    for (let currentPage = 1; currentPage <= page; currentPage += 1) {
      if (currentPage < page && pageCursors.has(currentPage)) continue;
      const previous = pageCursors.get(currentPage - 1);
      const snapshot = await getDocs(
        query(
          wordsCollection,
          ...constraints,
          ...ordering,
          ...(previous ? [startAfter(previous)] : []),
          limit(perPage),
        ),
      );
      assertSession(uid);
      const last = snapshot.docs.at(-1);
      if (last) pageCursors.set(currentPage, last);
      if (currentPage === page)
        return { results: snapshot.docs.map(toWord), totalPages, page, perPage };
      if (snapshot.empty)
        return { results: [], totalPages: currentPage, page: currentPage, perPage };
    }
    return { results: [], totalPages, page, perPage };
  },
  async statistics() {
    const uid = currentUid();
    const aggregate = await getCountFromServer(
      query(wordsCollection, where('owner', '==', uid), where('progress', '<', 100)),
    );
    assertSession(uid);
    return { totalCount: aggregate.data().count };
  },
  async createWord(input) {
    const owner = currentUid();
    const data = wordData(input);
    const reference = doc(wordsCollection);
    const key = wordKey(owner, data.en);
    await runTransaction(db, async (transaction) => {
      const claim = await transaction.get(key);
      assertSession(owner);
      if (claim.exists()) throw new Error('Bu kelime zaten sözlüğünde var.');
      transaction.set(key, { wordId: reference.id });
      transaction.set(reference, {
        ...data,
        owner,
        progress: 0,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    assertSession(owner);
    cursors.clear();
    return { ...cleanWord(input), _id: reference.id, owner, progress: 0 };
  },
  async editWord(id, input) {
    const uid = currentUid();
    const data = wordData(input);
    const reference = doc(db, 'words_en_tr', id);
    const result = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      const original = toWord(snapshot);
      assertOwner(original, uid);
      const nextKey = wordKey(uid, data.en);
      const previousKey = wordKey(uid, original.en);
      const nextClaim = await transaction.get(nextKey);
      const previousClaim =
        nextKey.path === previousKey.path ? nextClaim : await transaction.get(previousKey);
      assertSession(uid);
      if (nextClaim.exists() && nextClaim.data().wordId !== id) {
        throw new Error('Bu kelime zaten sözlüğünde var.');
      }
      const record = {
        ...data,
        owner: uid,
        progress: original.progress,
        visibility: 'public',
        createdAt: snapshot.data()?.createdAt,
        updatedAt: serverTimestamp(),
      };
      if (previousKey.path !== nextKey.path && previousClaim.exists())
        transaction.delete(previousKey);
      transaction.set(nextKey, { wordId: id });
      transaction.set(reference, record);
      return { ...cleanWord(input), _id: id, owner: uid, progress: original.progress };
    });
    assertSession(uid);
    cursors.clear();
    return result;
  },
  async deleteWord(id) {
    const uid = currentUid();
    const reference = doc(db, 'words_en_tr', id);
    await runTransaction(db, async (transaction) => {
      const word = toWord(await transaction.get(reference));
      assertOwner(word, uid);
      const key = wordKey(uid, word.en);
      const claim = await transaction.get(key);
      assertSession(uid);
      if (claim.exists()) transaction.delete(key);
      transaction.delete(reference);
    });
    assertSession(uid);
    cursors.clear();
  },
  async addWord(id) {
    const uid = currentUid();
    const source = toWord(await getDoc(doc(db, 'words_en_tr', id)));
    assertSession(uid);
    if (source.owner === uid) throw new Error('Bu kelime zaten sözlüğünde var.');
    return firebaseService.createWord(source);
  },
  async tasks() {
    const uid = currentUid();
    const snapshot = await getDocs(
      query(wordsCollection, where('owner', '==', uid), where('progress', '<', 100)),
    );
    assertSession(uid);
    return { words: makeTasks(snapshot.docs.map(toWord)) };
  },
  async answers(input) {
    const uid = currentUid();
    if (new Set(input.map((answer) => answer._id)).size !== input.length) {
      throw new Error('Bir kelimeyi her alıştırmada yalnızca bir kez yanıtlayabilirsin.');
    }
    if (input.length > MAX_TRAINING_TASKS)
      throw new Error(`Bir alıştırmada en fazla ${MAX_TRAINING_TASKS} yanıt gönderebilirsin.`);
    const results = await runTransaction(db, async (transaction) => {
      const references = input.map((answer) => doc(db, 'words_en_tr', answer._id));
      const snapshots = await Promise.all(
        references.map((reference) => transaction.get(reference)),
      );
      return input.map((answer, index) => {
        const word = toWord(snapshots[index]);
        assertOwner(word, uid);
        const result = checkAnswer(word, answer);
        transaction.update(references[index], {
          progress: updatedProgress(word.progress, result.isDone),
          updatedAt: serverTimestamp(),
        });
        return result;
      });
    });
    assertSession(uid);
    cursors.clear();
    return results;
  },
};
