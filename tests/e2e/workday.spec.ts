import { expect, test } from './fixtures.ts';

test('a full day: start, switch project, stop, totals and persistence', async ({ app, page }) => {
  await app.open();
  await app.english();
  await app.addProject('Apollo');
  await app.addProject('Zeus');
  await app.nav('today');

  await page.getByTestId('project-select').selectOption({ label: 'Apollo' });
  await page.getByTestId('toggle').click();
  await expect(page.getByTestId('toggle')).toHaveText('Stop');

  await app.setTime('2026-09-28', '10:00');
  await page.getByTestId('project-select').selectOption({ label: 'Zeus' });
  await app.setTime('2026-09-28', '12:30');
  await page.getByTestId('toggle').click();

  await expect(page.getByTestId('today-total')).toHaveText('4:30');
  await expect(page.getByTestId('today-remaining')).toContainText('3:30 left');
  await expect(page.getByTestId('entries').locator('li')).toHaveCount(2);

  await page.reload();
  await expect(page.getByTestId('today-total')).toHaveText('4:30');
});

test('forgotten times can be added and edited', async ({ app, page }) => {
  await app.open();
  await app.english();
  await page.getByTestId('add-entry').click();
  await page.getByLabel('From').fill('07:00');
  await page.getByLabel('To').fill('07:45');
  await page.getByRole('button', { name: 'Add' }).first().click();
  await expect(page.getByTestId('today-total')).toHaveText('0:45');
  await page.getByTestId('entries').locator('li button').first().click();
  await page.getByTestId('entries').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('today-total')).toHaveText('0:00');
});

test('vacation removes the day target', async ({ app, page }) => {
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
