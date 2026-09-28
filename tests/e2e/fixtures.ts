import { test as base, expect, type Page } from '@playwright/test';

/** Berlin local time on Monday 2026-09-28 unless given. */
export const berlin = (date: string, hm: string) => new Date(`${date}T${hm}:00+02:00`);

export class AppPage {
  constructor(readonly page: Page) {}

  async setTime(date: string, hm: string) {
    await this.page.clock.setFixedTime(berlin(date, hm));
    // let the app's tick pick it up
    await this.page.evaluate(() => dispatchEvent(new Event('visibilitychange')));
  }

  async open(hash = '#/today', opts: { login?: boolean } = {}) {
    await this.page.goto(hash);
    if (opts.login !== false) await this.login();
  }

  async login(user = 'admin', pass = 'admin') {
    await this.page.getByLabel(/user|benutzer/i).fill(user);
    await this.page.getByLabel(/password|passwort/i).fill(pass);
    await this.page.getByRole('button', { name: /log in|anmelden/i }).click();
  }

  /** Language is detected from the browser (en-US); force English UI for stable selectors. */
  async english() {
    await this.page.getByTestId('nav-settings').click();
    await this.page.getByTestId('locale').selectOption('en');
    await this.page.getByTestId('nav-today').click();
  }

  nav(name: 'today' | 'overview' | 'projects' | 'settings') {
    return this.page.getByTestId(`nav-${name}`).click();
  }

  /** Slide the workday knob to the end and hold it there. */
  async slide() {
    const knob = this.page.getByTestId('toggle');
    const before = await knob.textContent();
    const k = (await knob.boundingBox())!;
    const t = (await knob.locator('..').boundingBox())!;
    await this.page.mouse.move(k.x + k.width / 2, k.y + k.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(t.x + t.width, k.y + k.height / 2, { steps: 8 });
    await expect(knob).not.toHaveText(before ?? '', { timeout: 3000 });
    await this.page.mouse.up();
  }

  /** Drag the project wheel: 'down' brings the project above into the middle, 'up' the one below. */
  async swipeProject(dir: 'down' | 'up') {
    const box = (await this.page.getByTestId('project-current').boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + (dir === 'down' ? 60 : -60), { steps: 6 });
    await this.page.mouse.up();
  }

  async addProject(name: string) {
    await this.nav('projects');
    await this.page.getByTestId('project-name').fill(name);
    await this.page.getByRole('button', { name: 'Add' }).click();
  }
}

export const test = base.extend<{ app: AppPage }>({
  app: async ({ page }, use) => {
    await page.clock.setFixedTime(berlin('2026-09-28', '08:00'));
    await use(new AppPage(page));
  },
});

export { expect };
