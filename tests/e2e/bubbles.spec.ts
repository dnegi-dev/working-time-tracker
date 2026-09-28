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

test('during a break a project can be queued for afterwards', async ({ app, page }) => {
  await app.dragTo('Apollo');
  await app.slide();
  await app.setTime('2026-09-28', '08:20');
  await app.dragTo('break');
  await app.queue('Zeus');
  await expect(page.getByTestId('break-next')).toHaveText('Next: Zeus');
  await expect(page.getByTestId('orbit').filter({ hasText: 'Zeus' })).toHaveAttribute(
    'data-queued',
    'true',
  );
  await app.dragTo('Zeus');
  await expect(page.getByTestId('focus-bubble')).toHaveAttribute('data-state', 'running');
  await expect(page.getByTestId('project-current')).toHaveText('Zeus');
});

async function breakFrom830To840(app: import('./fixtures.ts').AppPage, counts: string) {
  await app.nav('settings');
  await app.page.getByTestId('break-counts').selectOption(counts);
  await app.nav('today');
  await app.dragTo('Apollo');
  await app.slide();
  await app.setTime('2026-09-28', '08:30');
  await app.dragTo('break');
  await app.setTime('2026-09-28', '08:40');
}

test('break time can count for the project after the break', async ({ app, page }) => {
  await breakFrom830To840(app, 'after');
  await expect(page.getByTestId('project-total')).toHaveText('0:30');
  await app.dragTo('Zeus');
  await expect(page.getByTestId('project-total')).toHaveText('0:10');
  await expect(page.getByTestId('orbit').filter({ hasText: 'Apollo' })).toContainText('0:30');
  await expect(page.getByTestId('today-total')).toHaveText('0:40');
});

test('break time can be a regular pause', async ({ app, page }) => {
  await breakFrom830To840(app, 'pause');
  await expect(page.getByTestId('toggle')).toHaveText('Start');
  await expect(page.getByTestId('focus-bubble')).toHaveAttribute('data-state', 'break');
  await expect(page.getByTestId('today-total')).toHaveText('0:30');
  await app.queue('Zeus');
  await app.dragTo('Zeus');
  await expect(page.getByTestId('toggle')).toHaveText('Stop');
  await expect(page.getByTestId('project-current')).toHaveText('Zeus');
  await app.setTime('2026-09-28', '08:50');
  await expect(page.getByTestId('today-total')).toHaveText('0:40');
  await expect(page.getByTestId('orbit').filter({ hasText: 'Apollo' })).toContainText('0:30');
});
