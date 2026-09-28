import { expect, test } from './fixtures.ts';

test.beforeEach(async ({ app }) => {
  await app.open();
  await app.english();
  await app.addProject('Apollo');
  await app.addProject('Zeus');
});

test('project bubbles show their share and the centre switches period', async ({ app, page }) => {
  await app.nav('today');
  await app.dragTo('Apollo');
  await app.slide();
  await app.setTime('2026-09-28', '09:30');
  await app.nav('overview');
  await expect(app.bubble('Apollo')).toContainText('1:30 · 100%');
  await expect(app.bubble('Zeus')).toContainText('0:00 · 0%');

  const stats = page.getByTestId('stats-bubble');
  await expect(stats).toHaveAttribute('data-period', 'month');
  await stats.click();
  await expect(stats).toHaveAttribute('data-period', 'year');
  await stats.click();
  await expect(stats).toHaveAttribute('data-period', 'all');
  await expect(stats).toContainText('1:30');
  await stats.click();
  await expect(page.getByTestId('balance-week')).toContainText('38:30 left');

  await app.openProject('Zeus');
  await expect(page).toHaveURL(/#\/project\//);
});

test('the overview fills the screen; shrinking it pushes the bubbles inwards', async ({
  app,
  page,
}) => {
  await app.addProject('Hera');
  for (const size of [
    { width: 1600, height: 1000 },
    { width: 900, height: 700 },
    { width: 360, height: 640 },
  ]) {
    await page.setViewportSize(size);
    const field = await app.settled(page.getByTestId('pool'));
    for (const bubble of await page.getByTestId('orbit').all()) {
      const b = await app.settled(bubble);
      expect(b.x).toBeGreaterThanOrEqual(field.x);
      expect(b.y).toBeGreaterThanOrEqual(field.y);
      expect(b.x + b.width).toBeLessThanOrEqual(field.x + field.width);
      expect(b.y + b.height).toBeLessThanOrEqual(field.y + field.height);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    expect(overflow).toBeLessThanOrEqual(1);
  }
  await page.getByTestId('stats-bubble').click();
  await expect(page.getByRole('main').getByRole('list')).toHaveCount(0);
});

test('a project rests after drag and hold, and comes back', async ({ app, page }) => {
  await app.rest('Apollo');
  await expect(app.bubble('Apollo')).toHaveCount(0);
  await expect(page.getByTestId('rest-bubble')).toHaveCount(1);
  await app.nav('today');
  await expect(app.bubble('Apollo')).toHaveCount(0);

  await app.nav('overview');
  await app.restore('Apollo');
  await expect(page.getByTestId('toast')).toHaveText('Apollo is back.');
  await expect(page.getByTestId('rest-bubble')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(app.bubble('Apollo')).toBeVisible();
});

test('the running project cannot rest', async ({ app, page }) => {
  await app.nav('today');
  await app.dragTo('Apollo');
  await app.slide();
  await app.nav('overview');
  await app.rest('Apollo');
  await expect(page.getByTestId('toast')).toHaveText('Stop or switch the running project first.');
  await expect(app.bubble('Apollo')).toBeVisible();
});

test('the resting place has a theme', async ({ app, page }) => {
  await expect(page.getByTestId('rest-zone')).toContainText('Let it sink');
  await app.nav('settings');
  await page.getByTestId('rest-theme').selectOption('sky');
  await app.nav('overview');
  await expect(page.getByTestId('rest-zone')).toHaveAttribute('data-theme', 'sky');
  await expect(page.getByTestId('rest-zone')).toContainText('Let it float away');
  await app.rest('Zeus');
  await app.restore('Zeus');
  await expect(page.getByTestId('toast')).toHaveText('Zeus is back.');
});
