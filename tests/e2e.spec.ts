import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
const wordsKey = 'vocabbuilder.demo.words.en-tr.v1';

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (
      !new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/) &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
    ) {
      messages.push(`Unexpected external mutation: ${request.method()} ${request.url()}`);
      await route.abort();
      return;
    }
    await route.continue();
  });
});

test.afterEach(async ({ page }) => {
  expect(
    errors.get(page),
    'The browser must have no console errors, uncaught errors, or external mutations.',
  ).toEqual([]);
});

async function enterDemo(page: Page) {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Demoyu dene' }).click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.getByRole('table')).toBeVisible();
}

async function navigate(page: Page, name: 'Sözlük' | 'Öneriler' | 'Alıştırma') {
  const toggle = page.getByRole('button', { name: 'Menüyü aç' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('link', { name, exact: true }).click();
}

async function addWord(page: Page, en: string, tr: string) {
  await page.getByRole('button', { name: 'Kelime ekle', exact: true }).first().click();
  const modal = page.getByRole('dialog', { name: 'Kelime ekle', exact: true });
  await modal.getByLabel('Kategori', { exact: true }).selectOption('noun');
  await modal.getByLabel('İngilizce', { exact: true }).fill(en);
  await modal.getByLabel('Türkçe', { exact: true }).fill(tr);
  await modal.getByRole('button', { name: 'Ekle', exact: true }).click();
  await expect(modal).not.toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const bounds = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: window.innerWidth,
  }));
  expect(bounds.width, `Content overflows the ${bounds.viewport}px viewport`).toBeLessThanOrEqual(
    bounds.viewport,
  );
}

test('invalid authentication stays local, reports errors, and toggles the password accessibly', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/users\/(signin|signup)|identitytoolkit/.test(request.url())) requests.push(request.url());
  });
  await page.goto('/register');
  await page.getByRole('button', { name: 'Kayıt ol', exact: true }).click();
  await expect(page.getByText('Adını gir.', { exact: true })).toBeVisible();
  await expect(page.getByText('E-posta adresini gir.', { exact: true })).toBeVisible();
  await expect(page.getByText('Şifreni gir.', { exact: true })).toBeVisible();
  await page.getByLabel('Ad', { exact: true }).fill('Alex');
  await page.getByLabel('E-posta', { exact: true }).fill('invalid@example.info');
  await page.getByLabel('Şifre', { exact: true }).fill('abc1def');
  await page.getByRole('button', { name: 'Kayıt ol', exact: true }).click();
  await expect(page.getByLabel('E-posta', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Şifre', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Şifreyi göster' }).click();
  await expect(page.getByLabel('Şifre', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Şifreyi gizle' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Şifreyi gizle' }).click();
  await expect(page.getByLabel('Şifre', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('link', { name: 'Giriş yap', exact: true }).click();
  await expect(page.getByLabel('Şifre', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.getByText('E-posta adresini gir.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(requests).toEqual([]);
});

test('demo words can be added, validated, edited, refreshed, and deleted', async ({ page }) => {
  await enterDemo(page);
  await addWord(page, 'butterfly', 'kelebek');
  await expect(page.getByRole('cell', { name: 'Butterfly', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kelime ekle', exact: true }).click();
  const addModal = page.getByRole('dialog', { name: 'Kelime ekle', exact: true });
  await addModal.getByRole('button', { name: 'Ekle', exact: true }).click();
  await expect(addModal.getByText('Bir kategori seç.')).toBeVisible();
  await addModal.getByLabel('Kategori', { exact: true }).selectOption('noun');
  await addModal.getByLabel('İngilizce', { exact: true }).fill('butterfly');
  await addModal.getByLabel('Türkçe', { exact: true }).fill('kelebek');
  await addModal.getByRole('button', { name: 'Ekle', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Bu kelime zaten sözlüğünde var.');
  await expect(addModal.getByRole('alert')).toBeVisible();
  await expect(addModal.getByLabel('İngilizce', { exact: true })).toHaveValue('butterfly');
  await expect(addModal.getByLabel('Türkçe', { exact: true })).toHaveValue('kelebek');
  await addModal.getByRole('button', { name: 'Bildirimi kapat' }).click();
  await expect(addModal.getByRole('alert')).toHaveCount(0);
  await expect(addModal).toBeVisible();
  await addModal.getByRole('button', { name: 'İptal', exact: true }).click();
  await page.getByRole('button', { name: 'butterfly için işlemler', exact: true }).click();
  await page.getByRole('button', { name: 'Düzenle', exact: true }).click();
  const editModal = page.getByRole('dialog', { name: 'Kelimeyi düzenle', exact: true });
  await editModal.getByLabel('İngilizce', { exact: true }).fill('butterflies');
  await editModal.getByLabel('Türkçe', { exact: true }).fill('kelebekler');
  await editModal.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(editModal).not.toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.getByRole('cell', { name: 'Butterflies', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Kelebekler', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'butterflies için işlemler', exact: true }).click();
  await page.getByRole('button', { name: 'Sil', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Butterflies', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Butterflies', exact: true })).toHaveCount(0);
});

test('regular and irregular verbs retain their classification after editing', async ({ page }) => {
  await enterDemo(page);
  const verbs = [
    { en: 'practice', tr: 'pratik yapmak', editedTr: 'alıştırma yapmak', isIrregular: false },
    {
      en: 'sing sang sung',
      tr: 'şarkı söylemek',
      editedTr: 'şarkı söylemeye başlamak',
      isIrregular: true,
    },
  ];
  for (const verb of verbs) {
    await page.getByRole('button', { name: 'Kelime ekle', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Kelime ekle', exact: true });
    await modal.getByLabel('Kategori', { exact: true }).selectOption('verb');
    await expect(modal.getByRole('radio', { name: 'Düzenli', exact: true })).toBeChecked();
    if (verb.isIrregular) {
      await modal.getByRole('radio', { name: 'Düzensiz', exact: true }).check();
      await expect(
        modal.getByText('Fiilin üç halini aralarında boşluk bırakarak yazın.'),
      ).toBeVisible();
    }
    await modal.getByLabel('İngilizce', { exact: true }).fill(verb.en);
    await modal.getByLabel('Türkçe', { exact: true }).fill(verb.tr);
    await modal.getByRole('button', { name: 'Ekle', exact: true }).click();
    await expect(modal).not.toBeVisible();
    await page.getByRole('button', { name: `${verb.en} için işlemler`, exact: true }).click();
    await page.getByRole('button', { name: 'Düzenle', exact: true }).click();
    const editModal = page.getByRole('dialog', { name: 'Kelimeyi düzenle', exact: true });
    await expect(editModal.getByLabel('İngilizce', { exact: true })).toHaveValue(verb.en);
    await editModal.getByLabel('Türkçe', { exact: true }).fill(verb.editedTr);
    await editModal.getByRole('button', { name: 'Kaydet', exact: true }).click();
    await expect(editModal).not.toBeVisible();
  }
  const stored = await page.evaluate((key) => {
    const words = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{
      en: string;
      tr: string;
      category: string;
      isIrregular?: boolean;
    }>;
    return ['practice', 'sing sang sung'].map((en) => {
      const word = words.find((item) => item.en === en)!;
      return { en: word.en, tr: word.tr, category: word.category, isIrregular: word.isIrregular };
    });
  }, wordsKey);
  expect(stored).toEqual(
    verbs.map((verb) => ({
      en: verb.en,
      tr: verb.editedTr,
      category: 'verb',
      isIrregular: verb.isIrregular,
    })),
  );
  await page.reload();
  await page.getByLabel('Kategoriler', { exact: true }).selectOption('verb');
  await expect(page.getByRole('cell', { name: 'Practice', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Sing sang sung', exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Düzensiz', exact: true }).check();
  await expect(page.getByRole('cell', { name: 'Sing sang sung', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Practice', exact: true })).toHaveCount(0);
});

test('recommendations add to the dictionary and prevent repeated clicks', async ({ page }) => {
  await enterDemo(page);
  await navigate(page, 'Öneriler');
  await expect(page.getByRole('button', { name: 'Kelime ekle', exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'inspiration kelimesini sözlüğe ekle', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'inspiration sözlüğe eklendi', exact: true }),
  ).toBeDisabled();
  await navigate(page, 'Sözlük');
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('  inspiration  ');
  await expect(page.getByRole('cell', { name: 'Inspiration', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('pagination, 300 ms debouncing, trimmed search, and verb filters cooperate', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-12T12:00:00Z') });
  await enterDemo(page);
  await page.clock.pauseAt(new Date('2026-10-12T12:00:10Z'));
  await page.getByRole('button', { name: 'Sayfa 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sayfa 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('cell', { name: 'Together', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('  apple  ');
  await page.clock.runFor(299);
  await expect(page.getByRole('cell', { name: 'Together', exact: true })).toBeVisible();
  await page.clock.runFor(1);
  await expect(page.getByRole('cell', { name: 'Apple', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('   ');
  await page.clock.runFor(300);
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Sayfa 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByLabel('Kategoriler', { exact: true }).selectOption('verb');
  await expect(page.getByRole('radio', { name: 'Düzenli', exact: true })).toBeChecked();
  await expect(page.getByRole('cell', { name: 'Discover', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Düzensiz', exact: true }).check();
  await expect(page.getByRole('cell', { name: 'Run-ran-run', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Discover', exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('run');
  await page.clock.runFor(300);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('');
  await page.clock.runFor(300);
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await expect(page.getByRole('radio', { name: 'Düzensiz', exact: true })).toBeChecked();
});

test('training saves answers, skips blank entries, and persists word progress', async ({
  page,
}) => {
  await enterDemo(page);
  await navigate(page, 'Alıştırma');
  await expect(page.getByText('Kelime 1 / 16', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'İngilizceye çevir' }).fill('apple');
  await page.getByRole('button', { name: 'Sonraki', exact: true }).click();
  await expect(page.getByText('Kelime 2 / 16', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Türkçeye çevir' }).fill('yanlış yanıt');
  await page.getByRole('button', { name: 'Sonraki', exact: true }).click();
  await page.getByRole('button', { name: 'Sonraki', exact: true }).click();
  await expect(page.getByText('Kelime 4 / 16', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Tebrikler' });
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('2 yanıttan 1 tanesi doğru');
  await expect(modal).toContainText('14 kelime atlandı');
  await modal.getByRole('button', { name: 'Sözlüğe dön' }).click();
  await expect(page).toHaveURL(/\/dictionary$/);
  const progress = await page.evaluate((key) => {
    const words = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{
      en: string;
      progress: number;
    }>;
    return {
      apple: words.find((word) => word.en === 'apple')?.progress,
      beautiful: words.find((word) => word.en === 'beautiful')?.progress,
    };
  }, wordsKey);
  expect(progress).toEqual({ apple: 100, beautiful: 40 });
});

for (const taskCount of [451, 901]) {
  test(`${taskCount} training tasks continue in sessions of at most 450 without replaying answers`, async ({
    page,
  }) => {
    await enterDemo(page);
    const words = Array.from({ length: taskCount }, (_, index) => {
      const suffix = String.fromCharCode(
        97 + Math.floor(index / 676),
        97 + (Math.floor(index / 26) % 26),
        97 + (index % 26),
      );
      return {
        _id: `session-word-${index}`,
        en: `word ${suffix}`,
        tr: `kelime ${suffix}`,
        category: 'noun',
        progress: 0,
        owner: 'demo-user',
      };
    });
    await page.evaluate(({ key, values }) => localStorage.setItem(key, JSON.stringify(values)), {
      key: wordsKey,
      values: words,
    });
    await page.goto('/training');

    for (let offset = 0; offset < taskCount; offset += 450) {
      const sessionSize = Math.min(450, taskCount - offset);
      await test.step(`Save the session beginning at task ${offset + 1}`, async () => {
        await expect(
          page.getByText(`Alıştırma ${offset / 450 + 1} / ${Math.ceil(taskCount / 450)}`, {
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByText(`Kelime 1 / ${sessionSize}`, { exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'İngilizceye çevir' })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: 'İngilizceye çevir' })).toBeFocused();
        await expect(page.getByRole('progressbar', { name: 'Alıştırma ilerlemesi' })).toHaveText(
          String(sessionSize),
        );
        await expect(
          page.getByText(`Kelime ${words[offset].tr.slice('kelime '.length)}`, { exact: true }),
        ).toBeVisible();
        await page.getByRole('textbox', { name: 'İngilizceye çevir' }).fill(words[offset].en);
        if (sessionSize > 1) {
          await page.getByRole('button', { name: 'Sonraki', exact: true }).click();
          await expect(page.getByText(`Kelime 2 / ${sessionSize}`, { exact: true })).toBeVisible();
          await expect(page.getByRole('textbox', { name: 'Türkçeye çevir' })).toHaveValue('');
        } else {
          await expect(page.getByRole('button', { name: 'Sonraki', exact: true })).toHaveCount(0);
        }
        await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
        const results = page.getByRole('dialog', { name: 'Tebrikler' });
        await expect(results).toBeVisible();
        await expect(results).toContainText('1 yanıttan 1 tanesi doğru');
        if (sessionSize > 1)
          await expect(results).toContainText(`${sessionSize - 1} kelime atlandı`);
        else await expect(results).not.toContainText('kelime atlandı');

        const continueButton = results.getByRole('button', {
          name: 'Sonraki alıştırma',
          exact: true,
        });
        if (offset + sessionSize < taskCount) {
          await continueButton.click();
          await expect(results).not.toBeVisible();
          await expect(page).toHaveURL(/\/training$/);
        } else {
          await expect(continueButton).toHaveCount(0);
          await results.getByRole('button', { name: 'Sözlüğe dön' }).click();
          await expect(page).toHaveURL(/\/dictionary$/);
        }
      });
    }

    const saved = await page.evaluate((key) => {
      const stored = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{
        _id: string;
        progress: number;
      }>;
      return {
        ids: stored.map((word) => word._id),
        progressed: stored
          .filter((word) => word.progress !== 0)
          .map((word) => ({ _id: word._id, progress: word.progress })),
      };
    }, wordsKey);
    expect(saved.ids).toEqual(words.map((word) => word._id));
    expect(saved.progressed).toEqual(
      words
        .filter((_, index) => index % 450 === 0)
        .map((word) => ({ _id: word._id, progress: 25 })),
    );
  });
}

test('empty training opens Add word and the final task offers Save without Next', async ({
  page,
}) => {
  await enterDemo(page);
  await page.evaluate((key) => localStorage.setItem(key, '[]'), wordsKey);
  await page.goto('/training');
  await expect(
    page.getByRole('heading', { name: 'Şu anda çalışılacak kelimeniz yok.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Kelime ekle', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Kelime ekle', exact: true });
  await expect(modal).toBeVisible();
  await modal.getByLabel('Kategori', { exact: true }).selectOption('noun');
  await modal.getByLabel('İngilizce', { exact: true }).fill('apple');
  await modal.getByLabel('Türkçe', { exact: true }).fill('elma');
  await modal.getByRole('button', { name: 'Ekle', exact: true }).click();
  await expect(modal).not.toBeVisible();
  await navigate(page, 'Alıştırma');
  await expect(page.getByText('Kelime 1 / 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sonraki', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'İngilizceye çevir' }).fill('apple');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tebrikler' })).toContainText(
    '1 yanıttan 1 tanesi doğru',
  );
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/dictionary$/);
});

test('logout protects private pages and demo re-entry restores local words', async ({ page }) => {
  const legacyWords = JSON.stringify([
    { _id: 'legacy-1', en: 'legacy', ua: 'спадщина', category: 'noun', progress: 25 },
  ]);
  await page.goto('/register');
  await page.evaluate(
    (value) => localStorage.setItem('vocabbuilder.demo.words.v1', value),
    legacyWords,
  );
  await enterDemo(page);
  await expect(page.getByRole('cell', { name: 'Elma', exact: true })).toBeVisible();
  await addWord(page, 'moonlight', 'ay ışığı');
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/training');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Demoyu dene' }).click();
  await expect(page.getByRole('cell', { name: 'Moonlight', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Kelime ara' }).fill('  AY IŞIĞI  ');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('cell', { name: 'Moonlight', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('vocabbuilder.demo.words.v1'))).toBe(
    legacyWords,
  );
});

test('auth, dictionary, recommend, training, and dialogs fit 320, 375, 768, and 1440 pixels', async ({
  page,
}) => {
  test.setTimeout(75_000);
  for (const width of [320, 375, 768, 1440]) {
    await test.step(`Authentication at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'Kayıt ol', exact: true })).toBeVisible();
      await expectNoOverflow(page);
      if (width === 375)
        await page.screenshot({ path: '.local/qa/mobile375-register.png', fullPage: true });
      await page.getByRole('link', { name: 'Giriş yap', exact: true }).click();
      await expectNoOverflow(page);
    });
  }
  await enterDemo(page);
  for (const width of [320, 375, 768, 1440]) {
    await test.step(`Learning workspace at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/dictionary');
      await expect(page.getByRole('table')).toBeVisible();
      await expectNoOverflow(page);
      if (width === 375 || width === 1440)
        await page.screenshot({
          path: `.local/qa/${width === 375 ? 'mobile375' : 'desktop1440'}-dictionary.png`,
          fullPage: true,
        });
      await page.getByRole('button', { name: 'Kelime ekle', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoOverflow(page);
      const dialog = await page.getByRole('dialog').boundingBox();
      expect(dialog!.x).toBeGreaterThanOrEqual(0);
      expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
      await navigate(page, 'Öneriler');
      await expect(page.getByRole('table')).toBeVisible();
      await expectNoOverflow(page);
      await navigate(page, 'Alıştırma');
      await expect(page.getByRole('textbox')).toBeVisible();
      await expectNoOverflow(page);
    });
  }
});

test('mobile navigation and word dialogs close by Escape, backdrop, Cancel, and close button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enterDemo(page);
  const menu = page.getByRole('button', { name: 'Menüyü aç' });
  await menu.click();
  await expect(page.getByRole('dialog', { name: 'Menü' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sözlük', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.mouse.click(4, 100);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Öneriler');
  await expect(page).toHaveURL(/\/recommend$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Sözlük');
  const addButton = page.getByRole('button', { name: 'Kelime ekle', exact: true });
  for (const close of ['escape', 'backdrop', 'cancel', 'button']) {
    await addButton.click();
    const modal = page.getByRole('dialog', { name: 'Kelime ekle', exact: true });
    await expect(modal).toBeVisible();
    if (close === 'escape') await page.keyboard.press('Escape');
    if (close === 'backdrop') await page.mouse.click(2, 2);
    if (close === 'cancel') await modal.getByRole('button', { name: 'İptal', exact: true }).click();
    if (close === 'button') await modal.getByRole('button', { name: 'Pencereyi kapat' }).click();
    await expect(modal).not.toBeVisible();
    await expect(addButton).toBeFocused();
  }
});
