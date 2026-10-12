import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, wordSchema } from './validation';

describe('authentication validation', () => {
  const credentials = { email: 'learner@example.com', password: 'abcdef1' };

  it('accepts the required password format with a number at either end', async () => {
    await expect(loginSchema.isValid(credentials)).resolves.toBe(true);
    await expect(loginSchema.isValid({ ...credentials, password: '1abcdef' })).resolves.toBe(true);
  });

  it.each(['abc1def', 'abcdefg', 'abcd123', 'abcdef12', 'abcdef!', ''])(
    'rejects invalid password %j',
    async (password) => {
      await expect(loginSchema.isValid({ ...credentials, password })).resolves.toBe(false);
    },
  );

  it.each([
    'first.last@example.com',
    'learner+tag@example.com',
    'learner@example.info',
    'learner@example1.com',
  ])('applies the specified email expression to %j', async (email) => {
    await expect(loginSchema.isValid({ ...credentials, email })).resolves.toBe(false);
  });

  it('requires a nonblank name only when registering and trims name and email', async () => {
    await expect(loginSchema.isValid(credentials)).resolves.toBe(true);
    await expect(registerSchema.isValid(credentials)).resolves.toBe(false);
    await expect(registerSchema.isValid({ ...credentials, name: '   ' })).resolves.toBe(false);
    await expect(
      registerSchema.validate({ ...credentials, name: '  Sam  ', email: ' learner@example.com ' }),
    ).resolves.toEqual({ ...credentials, name: 'Sam' });
  });
});

describe('word validation', () => {
  const word = { en: 'take care', tr: 'ilgilenmek', category: 'verb', isIrregular: false };

  it.each(['take care', "don't", 'well-being', 'a'])(
    'accepts a complete English word or phrase: %j',
    async (en) => {
      await expect(wordSchema.isValid({ ...word, en })).resolves.toBe(true);
    },
  );

  it.each(['123hello', 'hello!', '*', "'", 'word*', 'word\nphrase'])(
    'rejects invalid characters anywhere in English text: %j',
    async (en) => {
      await expect(wordSchema.isValid({ ...word, en })).resolves.toBe(false);
    },
  );

  it.each([
    'çığ',
    'öğrenmek',
    'İstanbul',
    'ışık',
    'özgürlük',
    'ŞÜKRÜ',
    'Türkiye’nin',
    "Ankara'ya",
    'iyi günler',
    'eş-dost',
  ])('accepts Turkish letters and apostrophes: %j', async (tr) => {
    await expect(wordSchema.isValid({ ...word, tr })).resolves.toBe(true);
  });

  it.each(['kelime2', 'merhaba!', 'піклуватися', 'привітhello', 'ı2', '東京', '   '])(
    'rejects digits, punctuation and non-Turkish scripts: %j',
    async (tr) => {
      await expect(wordSchema.isValid({ ...word, tr })).resolves.toBe(false);
    },
  );

  it('trims translations and requires a category', async () => {
    await expect(
      wordSchema.validate({ ...word, en: ' take care ', tr: ' ilgilenmek ' }),
    ).resolves.toEqual(word);
    await expect(wordSchema.isValid({ ...word, category: '' })).resolves.toBe(false);
  });
});
