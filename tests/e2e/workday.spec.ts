import { expect, test } from './fixtures.ts';

test('a full day: start, switch project, stop, totals and persistence', async ({ app, page }) => {
  await app.open();
  await app.english();
  await app.addProject('Apollo');
  await app.addProject('Zeus');
  await app.nav('today');

  await page.getByTestId('project-above').click();
  await expect(page.getByTestId('project-current')).toHaveText('Apollo');
  await app.slide();
  await expect(page.getByTestId('toggle')).toHaveText('Stop');

  await app.setTime('2026-09-28', '10:00');
  await page.getByTestId('project-above').click();
  await expect(page.getByTestId('project-current')).toHaveText('Zeus');
  await expect(page.getByTestId('project-below')).toContainText('Apollo');
  await app.setTime('2026-09-28', '12:30');
  await expect(page.getByTestId('project-total')).toHaveText('2:30');
  await app.slide();

  await expect(page.getByTestId('today-total')).toHaveText('4:30');
  await expect(page.getByTestId('today-remaining')).toContainText('3:30 left');
  await expect(page.getByTestId('entries').locator('li')).toHaveCount(2);

  await page.reload();
  await expect(page.getByTestId('today-total')).toHaveText('4:30');
});

test('swiping the project wheel switches without a break', async ({ app, page }) => {
  await app.open();
  await app.english();
  for (const name of ['Apollo', 'Zeus', 'Hera']) await app.addProject(name);
  await app.nav('today');
  const current = page.getByTestId('project-current');

  await app.swipeProject('down');
  await expect(current).toHaveText('Apollo');
  await app.slide();
  await app.setTime('2026-09-28', '09:00');
  await app.swipeProject('down');
  await expect(current).toHaveText('Zeus');
  await expect(page.getByTestId('project-below')).toContainText('Apollo');
  await expect(page.getByTestId('project-above')).toContainText('Hera');

  await app.setTime('2026-09-28', '10:00');
  await app.swipeProject('up');
  await expect(current).toHaveText('Apollo');
  await expect(page.getByTestId('project-below')).toContainText('Zeus');
  await expect(page.getByTestId('project-total')).toHaveText('1:00');
  await app.setTime('2026-09-28', '10:30');
  await app.swipeProject('up');
  await expect(current).toHaveText('Zeus');
  await expect(page.getByTestId('project-total')).toHaveText('1:00');
});

test('forgotten times can be added and edited', async ({ app, page }) => {
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
