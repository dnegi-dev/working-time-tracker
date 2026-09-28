import { expect, test } from './fixtures.ts';

test.beforeEach(async ({ app }) => {
  await app.open();
  await app.english();
  await app.addProject('Apollo');
  await app.addProject('Zeus');
  await app.nav('today');
});

test('holding on a project bubble switches; letting go early does not', async ({ app, page }) => {
  const focus = page.getByTestId('focus-bubble');
  await expect(focus).toHaveAttribute('data-state', 'stopped');
  await expect(page.getByTestId('orbit-break')).toHaveCount(0);

  await app.dragTo('Apollo');
  await expect(page.getByTestId('project-current')).toHaveText('Apollo');
  await app.dragTo('Zeus', { hold: false });
  await expect(page.getByTestId('project-current')).toHaveText('Apollo');

  await app.slide();
  await expect(focus).toHaveAttribute('data-state', 'running');
  await expect(page.getByTestId('orbit-break')).toBeVisible();
});

test('a break keeps the project running and hands over to the next one', async ({ app, page }) => {
  const focus = page.getByTestId('focus-bubble');
  await app.dragTo('Apollo');
  await app.slide();
  await app.setTime('2026-09-28', '08:10');
  await expect(focus).toHaveAttribute('data-focus', '0.40');
  await app.setTime('2026-09-28', '08:30');
  await expect(focus).toHaveAttribute('data-full', 'true');

  await app.dragTo('break');
  await expect(focus).toHaveAttribute('data-state', 'break');
  await app.setTime('2026-09-28', '08:40');
  await expect(page.getByTestId('break-time')).toHaveText('0:10');
  await expect(page.getByTestId('project-total')).toHaveText('0:40');

  await app.dragTo('Zeus');
  await expect(focus).toHaveAttribute('data-state', 'running');
  await expect(page.getByTestId('project-current')).toHaveText('Zeus');
  await expect(focus).toHaveAttribute('data-focus', '0.00');
  await expect(page.getByTestId('orbit').filter({ hasText: 'Apollo' })).toContainText('0:40');
  await expect(page.getByTestId('today-total')).toHaveText('0:40');
});

test('the focus round length is a setting', async ({ app, page }) => {
  await app.nav('settings');
  await page.getByTestId('focus-minutes').fill('50');
  await page.getByTestId('focus-minutes').blur();
  await app.nav('today');
  await app.slide();
  await app.setTime('2026-09-28', '08:30');
  await expect(page.getByTestId('focus-bubble')).toHaveAttribute('data-focus', '0.60');
  await expect(page.getByTestId('focus-bubble')).toHaveAttribute('data-full', 'false');
});
