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
