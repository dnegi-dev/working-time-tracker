import { test as base, expect, type Locator, type Page } from '@playwright/test';

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

  nav(name: 'today' | 'overview' | 'settings') {
    return this.page.getByTestId(`nav-${name}`).click();
  }

  /** Slide the workday knob to the other end (optionally dipping down there) and hold. */
  async slide({ dip = false } = {}) {
    const k = await this.knob();
    const t = (await this.page.getByTestId('toggle').locator('..').boundingBox())!;
    const x = k.x < t.x + t.width / 2 ? t.x + t.width + 20 : t.x - 20;
    const path = [{ x, y: k.y }, ...(dip ? [{ x, y: k.y + 50 }] : [])];
    await this.holdKnob(k, path);
  }

  /** Swipe the workday knob down (lunch) or up (resume) and hold. */
  async swipe(direction: 'up' | 'down') {
    const k = await this.knob();
    await this.holdKnob(k, [{ x: k.x, y: k.y + (direction === 'down' ? 70 : -70) }]);
  }

  private async knob() {
    const knob = this.page.getByTestId('toggle');
    await knob.scrollIntoViewIfNeeded();
    const b = await this.settled(knob);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  /** Press the knob, move along the path and hold until the workday state changes. */
  private async holdKnob(from: { x: number; y: number }, path: { x: number; y: number }[]) {
    const bar = this.page.getByTestId('workday-bar');
    const before = (await bar.getAttribute('data-state')) ?? '';
    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down();
    for (const p of path) await this.page.mouse.move(p.x, p.y, { steps: 8 });
    await expect(bar).not.toHaveAttribute('data-state', before, { timeout: 3000 });
    await this.page.mouse.up();
  }

  /** Drag the focus bubble onto a project (or the break) bubble and hold it there. */
  async dragTo(target: string, { hold = true } = {}) {
    const center = this.page.getByTestId('focus-bubble');
    await center.scrollIntoViewIfNeeded();
    const bubble =
      target === 'break'
        ? this.page.getByTestId('orbit-break')
        : this.page.getByTestId('orbit').filter({ hasText: target });
    const a = (await center.boundingBox())!;
    const b = (await bubble.boundingBox())!;
    await this.page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await this.page.waitForTimeout(hold ? 900 : 150);
    await this.page.mouse.up();
  }

  /** During a break: drag a project bubble into the centre and hold it there. */
  async queue(name: string) {
    const bubble = this.page.getByTestId('orbit').filter({ hasText: name });
    const a = (await bubble.boundingBox())!;
    const b = (await this.page.getByTestId('focus-bubble').boundingBox())!;
    await this.page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await this.page.waitForTimeout(900);
    await this.page.mouse.up();
  }

  /** Pump the + bubble until it opens, then name the project. */
  async addProject(name: string) {
    await this.nav('overview');
    const p = await this.settled(this.page.getByTestId('pump'));
    await this.page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
    await this.page.mouse.down();
    await expect(this.page.getByTestId('project-name')).toBeVisible({ timeout: 4000 });
    await this.page.mouse.up();
    await this.page.getByTestId('project-name').fill(name);
    await this.page.getByTestId('project-name').press('Enter');
    await expect(this.bubble(name)).toBeVisible();
  }

  /** Wait until an element stops gliding and return its box. */
  async settled(el: Locator) {
    let last = '';
    await expect
      .poll(async () => {
        const box = JSON.stringify(await el.boundingBox());
        const same = box === last;
        last = box;
        return same;
      })
      .toBe(true);
    return JSON.parse(last) as { x: number; y: number; width: number; height: number };
  }

  bubble(name: string) {
    return this.page.getByTestId('orbit').filter({ hasText: name });
  }

  /** On the overview: tap a project bubble to open its page. */
  async openProject(name: string) {
    const b = await this.settled(this.bubble(name));
    await this.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await expect(this.page).toHaveURL(/#\/project\//);
  }

  /** Drag from one element's centre to another's and hold there. */
  async dragHold(from: Locator, to: Locator) {
    const a = await this.settled(from);
    const b = await this.settled(to);
    await this.page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await this.page.waitForTimeout(900);
    await this.page.mouse.up();
  }

  /** On the overview: drag a project onto the resting-place zone and hold. */
  rest(name: string) {
    return this.dragHold(this.bubble(name), this.page.getByTestId('rest-zone'));
  }

  /** Zoom into the resting place and drag a project back out. */
  async restore(name: string) {
    await this.page.getByTestId('rest-open').click();
    await expect(this.page.getByTestId('rest-place')).toHaveAttribute('data-zoomed', 'true');
    const bubble = this.page.getByTestId('rest-bubble').filter({ hasText: name });
    await this.dragHold(bubble, this.page.getByTestId('rest-return'));
  }
}

export const test = base.extend<{ app: AppPage }>({
  app: async ({ page }, use) => {
    await page.clock.setFixedTime(berlin('2026-09-28', '08:00'));
    await use(new AppPage(page));
  },
});

export { expect };
