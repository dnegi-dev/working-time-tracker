import { readFileSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { expect, test } from './fixtures.ts';

async function seedDay(app: import('./fixtures.ts').AppPage) {
  await app.open();
  await app.slide();
  await app.setTime('2026-09-28', '12:00');
  await app.slide();
  await app.page.getByTestId('note-input').fill('Export me');
  await app.page.getByTestId('note-input').press('Enter');
  await app.nav('settings');
}

for (const format of ['md', 'csv', 'json', 'xlsx'] as const) {
  test(`export all goals as ${format}`, async ({ app, page }) => {
    await seedDay(app);
    for (const goal of ['Projects', 'Balance & quota', 'Notes'])
      await page.getByLabel(goal, { exact: true }).check();
    await page.getByTestId('export-format').selectOption(format);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^wtt-hours-projects-balance-notes-2026-09-01_2026-09-30\\.${format}$`),
    );
    const path = await download.path();
    if (format === 'xlsx') {
      const sheets = await readXlsxFile(path);
      expect(sheets.map((s) => s.sheet)).toEqual(['Hours', 'Projects', 'Balance & quota', 'Notes']);
      expect(sheets[0]?.data[0]).toContain('Worked');
      expect(sheets[3]?.data[1]).toContain('Export me');
    } else {
      const text = readFileSync(path, 'utf8');
      expect(text).toContain('Export me');
      expect(text).toContain('2026-09-28');
    }
  });
}

test('backup and restore round-trip', async ({ app, page }) => {
  await seedDay(app);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('backup').click(),
  ]);
  const backup = readFileSync(await download.path(), 'utf8');

  // wipe the day, then restore
  await app.nav('today');
  await page.getByTestId('entries').locator('li button').first().click();
  await page.getByTestId('entries').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('today-total')).toHaveText('0:00');

  await app.nav('settings');
  await page
    .getByTestId('restore-file')
    .setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await expect(page.getByTestId('restore-preview')).toContainText('1 entries');
  await page.getByTestId('restore-replace').click();
  await app.nav('today');
  await expect(page.getByTestId('today-total')).toHaveText('4:00');
});

test('a damaged backup is rejected', async ({ app, page }) => {
  await app.open();
  await app.nav('settings');
  await page.getByTestId('restore-file').setInputFiles({
    name: 'b.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"x"}'),
  });
  await expect(page.getByTestId('toast')).toContainText('not a Working Time backup');
});
