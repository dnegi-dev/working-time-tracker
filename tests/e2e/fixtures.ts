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
