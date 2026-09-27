import { expect, test } from './fixtures.ts';

test('the app is behind a login and remembers it', async ({ app, page }) => {
  await app.open('#/today', { login: false });
  await app.login('admin', 'wrong');
  await expect(page.getByRole('alert')).toBeVisible();
  await app.login('admin', 'admin');
  await expect(page.getByTestId('toggle')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('toggle')).toBeVisible();
  await app.nav('settings');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('language can be switched', async ({ app, page }) => {
  await app.open();
  await app.nav('settings');
  await page.getByTestId('locale').selectOption('de');
  await expect(page.getByTestId('nav-today')).toContainText('Heute');
  await page.getByTestId('locale').selectOption('en');
  await expect(page.getByTestId('nav-today')).toContainText('Today');
});
