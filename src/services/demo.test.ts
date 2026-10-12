import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoService, enterDemo } from './demo';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
});

describe('explicit demo session', () => {
  it('starts an English–Turkish dictionary without changing existing Ukrainian demo data', async () => {
    const legacyKey = 'vocabbuilder.demo.words.v1';
    const legacyData = JSON.stringify([
      {
        _id: 'legacy',
        en: 'apple',
        ua: 'яблуко',
        category: 'noun',
        progress: 25,
        owner: 'demo-user',
      },
    ]);
    localStorage.setItem(legacyKey, legacyData);
    localStorage.setItem('vocabbuilder.demo.active', 'true');
    await demoService.restore();
    const page = await demoService.listWords({ page: 1, limit: 100, scope: 'own' });
    expect(page.results.find((word) => word.en === 'apple')?.tr).toBe('elma');
    expect(page.results.every((word) => typeof word.tr === 'string' && !('ua' in word))).toBe(true);
    expect(localStorage.getItem(legacyKey)).toBe(legacyData);
    expect(localStorage.getItem('vocabbuilder.demo.words.en-tr.v1')).not.toBeNull();
  });

  it('persists a Turkish answer with diacritics and updates learning progress', async () => {
    enterDemo();
    const word = (
      await demoService.listWords({ page: 1, limit: 7, keyword: 'beautiful', scope: 'own' })
    ).results[0];
    const result = await demoService.answers([
      { _id: word._id, en: word.en, tr: ' GÜZEL ', task: 'tr' },
    ]);
    expect(result[0].isDone).toBe(true);
    await demoService.signOut();
    enterDemo();
    expect(
      (await demoService.listWords({ page: 1, limit: 7, keyword: 'GÜZEL', scope: 'own' }))
        .results[0].progress,
    ).toBe(75);
  });

  it.each([
    '{broken-json',
    JSON.stringify([{ _id: 'bad', en: 'word', tr: 'kelime' }]),
    JSON.stringify([
      {
        _id: 'bad',
        en: 'word',
        tr: 'kelime',
        category: 'noun',
        progress: '100',
        owner: 'demo-user',
      },
    ]),
    JSON.stringify([
      {
        _id: 'bad',
        en: 'word',
        tr: 'kelime',
        category: 'noun',
        progress: 25,
        owner: 'foreign-user',
      },
    ]),
    JSON.stringify([
      { _id: 'bad', en: 'run', tr: 'koşmak', category: 'verb', progress: 25, owner: 'demo-user' },
    ]),
  ])('recovers malformed saved demo data during session restore: %s', async (saved) => {
    localStorage.setItem('vocabbuilder.demo.active', 'true');
    localStorage.setItem('vocabbuilder.demo.words.en-tr.v1', saved);
    expect((await demoService.restore())?.mode).toBe('demo');
    const page = await demoService.listWords({ page: 1, limit: 100, scope: 'own' });
    expect(page.results.length).toBeGreaterThan(0);
    expect(
      page.results.every(
        (word) => typeof word.category === 'string' && typeof word.progress === 'number',
      ),
    ).toBe(true);
  });

  it('preserves an intentionally empty saved dictionary', async () => {
    localStorage.setItem('vocabbuilder.demo.active', 'true');
    localStorage.setItem('vocabbuilder.demo.words.en-tr.v1', '[]');
    await demoService.restore();
    expect((await demoService.listWords({ page: 1, limit: 7, scope: 'own' })).results).toEqual([]);
  });

  it('does not authenticate visitors until they choose the demo', async () => {
    expect(await demoService.restore()).toBeNull();
    expect(enterDemo().mode).toBe('demo');
    expect((await demoService.restore())?.mode).toBe('demo');
    await demoService.signOut();
    expect(await demoService.restore()).toBeNull();
  });

  it('keeps created and edited vocabulary after leaving and reentering the demo', async () => {
    enterDemo();
    const created = await demoService.createWord({ en: 'river', tr: 'nehir', category: 'noun' });
    await demoService.editWord(created._id, { en: 'river', tr: 'ırmak', category: 'noun' });
    await demoService.signOut();
    enterDemo();
    const results = await demoService.listWords({
      page: 1,
      limit: 7,
      keyword: 'river',
      scope: 'own',
    });
    expect(results.results).toEqual([{ ...created, tr: 'ırmak' }]);
    await demoService.deleteWord(created._id);
    expect(
      (await demoService.listWords({ page: 1, limit: 7, keyword: 'river', scope: 'own' })).results,
    ).toEqual([]);
  });

  it('copies recommendations into the personal dictionary and rejects duplicates', async () => {
    enterDemo();
    const recommendation = (await demoService.listWords({ page: 1, limit: 7, scope: 'all' }))
      .results[0];
    const added = await demoService.addWord(recommendation._id);
    expect(added.owner).toBe('demo-user');
    expect(added._id).not.toBe(recommendation._id);
    await expect(demoService.addWord(recommendation._id)).rejects.toThrow('zaten sözlüğünde');
  });

  it('persists answer scores and removes newly mastered words from training', async () => {
    enterDemo();
    const apple = (
      await demoService.listWords({ page: 1, limit: 7, keyword: 'apple', scope: 'own' })
    ).results[0];
    expect(apple.progress).toBe(75);
    expect(
      await demoService.answers([{ _id: apple._id, en: 'Apple', tr: apple.tr, task: 'en' }]),
    ).toEqual([{ _id: apple._id, en: 'Apple', tr: apple.tr, task: 'en', isDone: true }]);
    expect((await demoService.tasks()).words.some((word) => word._id === apple._id)).toBe(false);
    await demoService.signOut();
    enterDemo();
    expect(
      (await demoService.listWords({ page: 1, limit: 7, keyword: 'apple', scope: 'own' }))
        .results[0].progress,
    ).toBe(100);
  });

  it('does not save a partially processed invalid answer batch', async () => {
    enterDemo();
    const word = (await demoService.listWords({ page: 1, limit: 7, scope: 'own' })).results[0];
    const answer = { _id: word._id, en: word.en, tr: word.tr, task: 'en' as const };
    await expect(demoService.answers([answer, answer])).rejects.toThrow('her alıştırmada');
    expect(
      (await demoService.listWords({ page: 1, limit: 7, keyword: word.en, scope: 'own' }))
        .results[0].progress,
    ).toBe(word.progress);
  });
});
