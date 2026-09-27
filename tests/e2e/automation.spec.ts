import { expect, test } from './fixtures.ts';

test('a deep link (NFC/QR/Shortcut) toggles tracking and duplicates are ignored', async ({
  app,
  page,
}) => {
  await app.open();
  await page.goto('#/do/toggle?mode=office&source=nfc');
  await expect(page.getByTestId('toast')).toContainText('toggle');
  await expect(page.getByTestId('toggle')).toHaveText('Stop');
  await expect(page).toHaveURL(/#\/today$/);

  // Same tag scanned again 20 s later → ignored
  await app.setTime('2026-09-28', '08:00');
  await page.goto('#/do/toggle?source=nfc');
  await expect(page.getByTestId('toggle')).toHaveText('Stop');

  await app.setTime('2026-09-28', '09:00');
  await page.goto('#/do/toggle?source=nfc');
  await expect(page.getByTestId('toggle')).toHaveText('Start');
  await expect(page.getByTestId('today-total')).toHaveText('1:00');
});

test('unknown project in a link shows an error', async ({ app, page }) => {
  await app.open();
  await page.goto('#/do/switch-project?project=Nope');
  await expect(page.getByTestId('toast')).toContainText('Unknown project');
});

test('a link opened before login runs after login', async ({ app, page }) => {
  await app.open('#/do/clock-in?source=qr', { login: false });
  await app.login();
  await expect(page.getByTestId('toggle')).toHaveText('Stop');
});

test('with "open links in app", links are handed to the installed app', async ({ app, page }) => {
  await app.open();
  await app.nav('settings');
  await page.getByTestId('open-in').selectOption('app');
  await page.evaluate(() => {
    addEventListener(
      'wtt:redirect',
      (e) => ((window as unknown as { redirected: string }).redirected = (e as CustomEvent).detail),
    );
  });
  await page.goto('#/do/toggle?source=nfc');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { redirected?: string }).redirected))
    .toMatch(/^(web\+)?wtt:\/\/toggle\?source=nfc$/); // wtt:// on iOS
  // app not installed → falls back to running here
  await expect(page.getByTestId('toggle')).toHaveText('Stop');
});

test('the link builder shows app and web links', async ({ app, page }) => {
  await app.open();
  await app.nav('settings');
  await expect(page.getByTestId('native-link')).toHaveText('wtt://toggle?source=nfc');
  await expect(page.getByTestId('web-link')).toContainText(
    '/working-time-tracker/#/do/toggle?source=nfc',
  );
  await expect(page.getByRole('img', { name: 'QR code for the link' })).toBeVisible();
});
