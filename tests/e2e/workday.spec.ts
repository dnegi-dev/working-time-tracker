import { expect, test } from './fixtures.ts';

test('a full day: start, switch project, stop, totals and persistence', async ({ app, page }) => {
  await app.open();
  await app.english();
  await app.addProject('Apollo');
  await app.addProject('Zeus');
  await app.nav('today');

  await app.dragTo('Apollo');
  await expect(page.getByTestId('project-current')).toHaveText('Apollo');
  await app.slide();
  await expect(page.getByTestId('toggle')).toHaveText('Stop');

  await app.setTime('2026-09-28', '10:00');
  await app.dragTo('Zeus');
  await expect(page.getByTestId('project-current')).toHaveText('Zeus');
  await expect(page.getByTestId('orbit').filter({ hasText: 'Apollo' })).toContainText('2:00');
  await app.setTime('2026-09-28', '12:30');
  await expect(page.getByTestId('project-total')).toHaveText('2:30');
  await app.slide();

  await expect(page.getByTestId('today-total')).toHaveText('4:30');
  await expect(page.getByTestId('today-remaining')).toContainText('3:30 left');

  await page.reload();
  await expect(page.getByTestId('today-total')).toHaveText('4:30');
});

test('the workday bar fills and turns to overtime', async ({ app, page }) => {
  await app.open();
  await app.english();
  const bar = page.getByTestId('workday-bar');
  await app.slide();
  await app.setTime('2026-09-28', '12:00');
  await expect(bar.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '240');
  await expect(bar).toHaveAttribute('data-over', 'false');
  await app.setTime('2026-09-28', '17:30');
  await expect(page.getByTestId('today-remaining')).toContainText('overtime');
  await expect(bar).toHaveAttribute('data-over', 'true');
});

test('swipe straight for home office, dip at the end for an office day', async ({ app, page }) => {
  await app.open();
  await app.english();
  const bar = page.getByTestId('workday-bar');
  await expect(bar).toHaveAttribute('data-state', 'idle');
  await app.slide();
  await expect(bar).toHaveAttribute('data-state', 'running');
  await expect(bar).toHaveAttribute('data-mode', 'home');
  await expect(page.getByTestId('today-mode')).toHaveText('Home office');

  // while running the knob rests at the right end
  const knob = await app.settled(page.getByTestId('toggle'));
  const track = (await page.getByTestId('toggle').locator('..').boundingBox())!;
  expect(knob.x + knob.width).toBeGreaterThan(track.x + track.width - 12);

  await app.setTime('2026-09-28', '09:00');
  await app.slide();
  await expect(bar).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('today-mode')).toHaveCount(0);
  await app.slide({ dip: true });
  await expect(bar).toHaveAttribute('data-mode', 'office');
  await expect(page.getByTestId('today-mode')).toHaveText('Office');
  await app.nav('overview');
  await expect(page.getByTestId('quota-month')).toContainText('1 of');
});

test('lunch freezes the day and a swipe up resumes', async ({ app, page }) => {
  await app.open();
  await app.english();
  const bar = page.getByTestId('workday-bar');
  await app.slide();
  await app.setTime('2026-09-28', '12:00');
  await app.swipe('down');
  await expect(bar).toHaveAttribute('data-state', 'lunch');
  await expect(page.getByTestId('slot-lunch')).toBeVisible();
  await expect(page.getByTestId('today-total')).toHaveText('4:00');
  await app.setTime('2026-09-28', '12:30');
  await expect(page.getByTestId('today-total')).toHaveText('4:00');

  await app.swipe('up');
  await expect(bar).toHaveAttribute('data-state', 'running');
  await expect(page.getByTestId('slot-lunch')).toHaveCount(0);
  await app.setTime('2026-09-28', '13:30');
  await expect(page.getByTestId('today-total')).toHaveText('5:00');
});

test('stopping with the legal-break dip adds the break instead of deducting it', async ({
  app,
  page,
}) => {
  await app.open();
  await app.english();
  await app.slide();
  await app.setTime('2026-09-28', '15:00');
  await expect(page.getByTestId('today-total')).toHaveText('7:00');
  await app.slide({ dip: true });
  await expect(page.getByTestId('workday-bar')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('today-total')).toHaveText('7:00');
});

test('a holiday shows on Today when it is less than 4 days away', async ({ app, page }) => {
  await app.setTime('2026-10-01', '08:00');
  await app.open();
  await app.english();
  await expect(page.getByTestId('holiday')).toContainText('in 2 days');
  await app.setTime('2026-09-28', '08:00');
  await expect(page.getByTestId('holiday')).toHaveCount(0);
});

test.fixme('forgotten times can be added and edited (entry list removed from Today for now)', async ({
  app,
  page,
}) => {
  await app.open();
  await app.english();
  await page.getByTestId('add-entry').click();
  await page.getByLabel('From', { exact: true }).fill('07:00');
  await page.getByLabel('To', { exact: true }).fill('07:45');
  await page.getByRole('button', { name: 'Add' }).first().click();
  await expect(page.getByTestId('today-total')).toHaveText('0:45');
  await page.getByTestId('entries').locator('li button').first().click();
  await page.getByTestId('entries').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('today-total')).toHaveText('0:00');
});

test.fixme('vacation removes the day target (day type removed from Today for now)', async ({
  app,
  page,
}) => {
  await app.open();
  await app.english();
  await page.getByTestId('day-type').selectOption('vacation');
  await expect(page.getByTestId('today-remaining')).toContainText('0:00 left');
});

test('space bar starts and stops on desktop', async ({ app, page }, info) => {
  test.skip(info.project.name === 'mobile');
  await app.open();
  await page.locator('body').press('Space');
  await expect(page.getByTestId('toggle')).toHaveText(/Stop|Stopp/);
});
