import { Page, Locator } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async getBoundingBox(locator: Locator) {
    return await locator.boundingBox();
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  async getComputedStyle(locator: Locator, property: string): Promise<string> {
    return await locator.evaluate((el, prop) => window.getComputedStyle(el).getPropertyValue(prop), property);
  }
}
