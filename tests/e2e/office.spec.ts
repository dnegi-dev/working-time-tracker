import { expect, test } from './fixtures.ts';

test('office quota follows region holidays (June 2026: Corpus Christi is a holiday in NRW, not in Berlin)', async ({
  app,
  page,
}) => {
  await app.setTime('2026-06-01', '08:00');
  await app.open();
  await app.nav('settings');
  await page.getByTestId('quota-value').fill('3');
  await page.getByTestId('quota-value').blur();
  await page.getByTestId('region').selectOption('DE-NW');
  await app.nav('overview');
  // 22 weekdays − 1 holiday = 21 × 3/5 = 12.6 → 13
  await expect(page.getByTestId('quota-month')).toContainText('0 of 13');
  // the overview counts holidays but no longer lists them
  await expect(page.getByText('Fronleichnam')).toHaveCount(0);

  await app.nav('settings');
  await page.getByTestId('region').selectOption('DE-BE');
  await app.nav('overview');
  await expect(page.getByTestId('quota-month')).toContainText('0 of 14');
});

test.fixme('office days count and places set the mode (place removed from Today for now)', async ({
  app,
  page,
}) => {
  await app.open();
  await app.nav('settings');
  await page.getByTestId('place-building').fill('HQ');
  await page.getByTestId('place-room').fill('3.14');
  await page.getByRole('button', { name: 'Add' }).first().click();
  await app.nav('today');
  await page.getByTestId('place-select').selectOption({ label: 'HQ / 3.14 · Office' });
  await app.slide();
  await app.nav('overview');
  await expect(page.getByTestId('quota-month')).toContainText('1 of');
});

test.fixme('several places per day split the entry when enabled (place removed from Today for now)', async ({
  app,
  page,
}) => {
  await app.open();
  await app.nav('settings');
  await page.getByTestId('multi-place').check();
  await app.nav('today');
  await page.getByTestId('place-select').selectOption('home');
  await app.slide();
  await app.setTime('2026-09-28', '11:00');
  await page.getByTestId('place-select').selectOption('office');
  await expect(page.getByTestId('entries').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('entries')).toContainText('Home');
  await expect(page.getByTestId('entries')).toContainText('Office');
});

test('notes for a project', async ({ app, page }) => {
  await app.open();
  await app.addProject('Apollo');
  await app.openProject('Apollo');
  await page.getByTestId('note-input').fill('Kickoff done');
  await page.getByTestId('note-input').press('Enter');
  await expect(page.getByTestId('notes')).toContainText('Kickoff done');
});
