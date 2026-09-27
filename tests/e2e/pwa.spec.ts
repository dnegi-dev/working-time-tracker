import { test as plain } from '@playwright/test';
import { AppPage, expect, test } from './fixtures.ts';

test.describe('PWA and command API', () => {
  test('the app works offline after the first visit', async ({ app, page, context }) => {
    await app.open();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // now controlled by the service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('toggle')).toBeVisible();
    await context.setOffline(false);
  });

  test('manifest declares install and link handling', async ({ page }) => {
    const res = await page.request.get('manifest.webmanifest');
    const manifest = await res.json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.protocol_handlers[0].protocol).toBe('web+wtt');
  });
});

// Swagger UI stalls under a fake clock, so this test runs on real time.
plain(
  'the OpenAPI spec lists every command and Swagger executes them in the open app',
  async ({ page, context }) => {
    await new AppPage(page).open();
    await page.evaluate(() => navigator.serviceWorker.ready);
    const spec = await (await page.request.get('api/openapi.json')).json();
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        '/clock-in',
        '/clock-out',
        '/toggle',
        '/switch-project',
        '/switch-place',
        '/add-note',
        '/mark-day',
        '/status',
      ]),
    );

    const api = await context.newPage();
    await api.goto('api.html');
    await api.evaluate(() => navigator.serviceWorker.ready);
    await api.reload(); // controlled by the service worker from now on
    await api.getByText('/toggle', { exact: true }).click();
    await api.getByRole('button', { name: 'Execute' }).click();
    await expect(
      api.locator('.live-responses-table tbody .response-col_status').first(),
    ).toHaveText('200');
    await expect(page.getByTestId('toggle')).toHaveText(/Stop/);

    const status = await api.evaluate(async () => (await fetch('api/v1/status')).json());
    expect(status).toMatchObject({ ok: true, data: { running: true } });
  },
);

plain('the API answers 503 when no app tab is open', async ({ page }) => {
  await page.goto('api.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  const res = await page.evaluate(async () => (await fetch('api/v1/status')).status);
  expect(res).toBe(503);
});
