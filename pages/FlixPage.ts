import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FlixPage extends BasePage {
  readonly inpageContainer: Locator;
  readonly descriptionModule: Locator;
  readonly shadeGalleryModule: Locator;
  readonly videoModule: Locator;
  readonly allInOneModule: Locator;
  readonly eyesThatThrillModule: Locator;
  readonly eyePlayModule: Locator;
  readonly allInOneImages: Locator;
  readonly eyesThatThrillCards: Locator;
  readonly eyesThatThrillTexts: Locator;
  readonly videoBackground: Locator;
  readonly shadeGallerySlides: Locator;
  readonly allInOneCards: Locator;
  readonly eyesThatThrillImages: Locator;
  readonly videoContainers: Locator;
  readonly privacyPolicyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.inpageContainer = page.locator("//div[@id='flix-inpage']");
    this.descriptionModule = page.locator("//div[@data-module='FM00002I']");
    this.shadeGalleryModule = page.locator("//div[@data-module='FM00004A']");
    this.videoModule = page.locator("//div[@data-module='FM00008B']");
    this.allInOneModule = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]");
    this.eyesThatThrillModule = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]");
    this.eyePlayModule = page.locator("//div[@data-module='FM00002D'][contains(.,'EYE PLAY')]");
    this.allInOneImages = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]//img");
    this.allInOneCards = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]//div[contains(@class,'f1xIN-fm2d-card')]");
    this.eyesThatThrillCards = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//div[contains(@class,'f1xIN-fm2d-card')]");
    this.eyesThatThrillTexts = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//div[contains(@class,'f1xIN-fm2d-text')]");
    this.eyesThatThrillImages = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//img");
    this.videoBackground = page.locator("//div[@data-module='FM00008B']//div[contains(@class,'f1xIN-background-image')]");
    this.videoContainers = page.locator("//div[@data-module='FM00008B']");
    this.shadeGallerySlides = page.locator("//div[@data-module='FM00004A']//div[contains(@class,'f1xIN-fm4a-slide')]");
    this.privacyPolicyLink = page.locator("//span[@id='flix-privacy-policy']//a");
  }

  async navigateToFlix(widthCall?: number): Promise<void> {
    const baseUrl = process.env.FLIX_BASE_URL || 'https://demo.flix360.io/performance/modularvnew/index.html';
    const mpn = process.env.FLIX_MPN || 'dummy_EAN_mascara';
    const distId = process.env.FLIX_DIST_ID || '6';
    const iso = process.env.FLIX_ISO || 'en';
    const flso = process.env.FLIX_FLSO || '987678';
    const ean = process.env.FLIX_EAN || '080';
    // Explicit param wins (responsive tests pass their viewport width, like a real
    // host page would); otherwise fall back to env, then 1200.
    const widthcall = widthCall !== undefined ? String(widthCall) : (process.env.FLIX_WIDTHCALL || '1200');
    const url = `${baseUrl}?mpn=${mpn}&distId=${distId}&iso=${iso}&flso=${flso}&ean=${ean}&widthcall=${widthcall}`;
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await this.loadFullPageTopToBottom();
    await this.page.waitForFunction(() => document.querySelectorAll("div[data-module='FM00002D']").length >= 3, { timeout: 15000 });
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForFunction(() => window.scrollY === 0, { timeout: 5000 });
  }

  /**
   * Loads ALL page content from top to bottom BEFORE any validation runs.
   * Scrolls gradually (viewport-sized steps) so IntersectionObserver-based
   * lazy loaders actually trigger, keeps going until the page height stops
   * growing, then waits until every image has finished its load cycle.
   */
  async loadFullPageTopToBottom(): Promise<void> {
    await this.page.evaluate(async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const step = Math.max(300, Math.floor(window.innerHeight * 0.75));
      let lastHeight = -1;
      let stableRounds = 0;

      // Re-scroll the whole page until its height stops changing
      // (growing height = lazy modules still being injected).
      while (stableRounds < 2) {
        for (let y = 0; y <= document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await delay(350);
        }
        window.scrollTo(0, document.body.scrollHeight);
        await delay(800);

        if (document.body.scrollHeight === lastHeight) {
          stableRounds++;
        } else {
          stableRounds = 0;
          lastHeight = document.body.scrollHeight;
        }
      }

      window.scrollTo(0, 0);
      await delay(300);
    });

    // Every image element must have finished loading (complete === true).
    // Non-fatal if a stray image never completes — the validations themselves
    // will surface genuine broken images.
    await this.page
      .waitForFunction(() => Array.from(document.images).every((img) => img.complete), { timeout: 30000 })
      .catch(() => {});
  }

  async waitForModules(): Promise<void> {
    await this.inpageContainer.waitFor({ state: 'visible', timeout: 60000 });
    await this.page.waitForSelector("//div[@data-module='FM00002D']", { timeout: 60000 });
  }

  async getModuleBoundingBox(locator: Locator) {
    return await locator.boundingBox();
  }

  async getImageSrc(locator: Locator): Promise<string | null> {
    return await locator.getAttribute('src');
  }

  async getImageNaturalSize(locator: Locator): Promise<{ width: number; height: number }> {
    return await locator.evaluate((img: HTMLImageElement) => ({ width: img.naturalWidth, height: img.naturalHeight }));
  }

  async isImageBroken(locator: Locator): Promise<boolean> {
    return await locator.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 0);
  }

  async getBackgroundColor(locator: Locator): Promise<string> {
    return await locator.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  }

  async hasHorizontalOverlap(locator1: Locator, locator2: Locator): Promise<boolean> {
    const box1 = await locator1.boundingBox();
    const box2 = await locator2.boundingBox();
    if (!box1 || !box2) return false;
    return !(box2.x >= box1.x + box1.width || box2.x + box2.width <= box1.x);
  }

  async isElementCropped(parent: Locator, child: Locator): Promise<boolean> {
    const parentBox = await parent.boundingBox();
    const childBox = await child.boundingBox();
    if (!parentBox || !childBox) return true;
    const horizontalCropped = childBox.x < parentBox.x || childBox.x + childBox.width > parentBox.x + parentBox.width;
    const verticalCropped = childBox.y < parentBox.y || childBox.y + childBox.height > parentBox.y + parentBox.height;
    return horizontalCropped || verticalCropped;
  }

  async getRenderedSize(locator: Locator): Promise<{ width: number; height: number }> {
    const box = await locator.boundingBox();
    return { width: box?.width || 0, height: box?.height || 0 };
  }

  async isModuleEmpty(moduleLocator: Locator): Promise<boolean> {
    const box = await moduleLocator.boundingBox();
    const text = await moduleLocator.textContent();
    return (!box || box.width === 0 || box.height === 0) && (!text || text.trim().length === 0);
  }
}
