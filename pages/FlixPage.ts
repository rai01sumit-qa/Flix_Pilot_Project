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
    const legacyAllInOne = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]");
    const modernAllInOne = page.locator("//div[@data-module='FM00043A'][.//img[contains(@alt,'ALL-IN-ONE')]]");
    this.allInOneModule = legacyAllInOne.or(modernAllInOne);
    this.eyesThatThrillModule = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]");
    this.eyePlayModule = page.locator("//div[@data-module='FM00002D'][contains(.,'EYE PLAY')]");
    this.allInOneImages = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]//img")
      .or(page.locator("//div[@data-module='FM00043A']//img"));
    this.allInOneCards = page.locator("//div[@data-module='FM00002D'][contains(.,'ALL-IN-ONE')]//div[contains(@class,'f1xIN-fm2d-card')]")
      .or(page.locator("//div[@data-module='FM00043A']//div[contains(@class,'f1xIN-fm43a-card')]"));
    this.eyesThatThrillCards = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//div[contains(@class,'f1xIN-fm2d-card')]");
    this.eyesThatThrillTexts = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//div[contains(@class,'f1xIN-fm2d-text')]");
    this.eyesThatThrillImages = page.locator("//div[@data-module='FM00002D'][contains(.,'EYES THAT THRILL')]//img");
    this.videoBackground = page.locator("//div[@data-module='FM00008B']//div[contains(@class,'f1xIN-background-image')]");
    this.videoContainers = page.locator("//div[@data-module='FM00008B']");
    this.shadeGallerySlides = page.locator("//div[@data-module='FM00004A']//div[contains(@class,'f1xIN-fm4a-slide')]");
    this.privacyPolicyLink = page.locator("//span[@id='flix-privacy-policy']//a");
  }

  /**
   * Builds a Flix URL from environment variables.
   * Priority:
   *   1. FLIX_URL (complete URL)
   *   2. FLIX_BASE_URL + FLIX_MPN/DIST_ID/ISO/FLSO/EAN + widthcall
   */
  static buildFlixUrl(widthCall?: number): string {
    if (process.env.FLIX_URL) {
      const url = new URL(process.env.FLIX_URL);
      if (widthCall !== undefined) {
        url.searchParams.set('widthcall', String(widthCall));
      }
      return url.toString();
    }

    const baseUrl = process.env.FLIX_BASE_URL || 'https://demo.flix360.io/performance/modularvnew/index.html';
    const mpn = process.env.FLIX_MPN || 'dummy_EAN_mascara';
    const distId = process.env.FLIX_DIST_ID || '6';
    const iso = process.env.FLIX_ISO || 'en';
    const flso = process.env.FLIX_FLSO || '987678';
    const ean = process.env.FLIX_EAN || '080';
    const widthcall = widthCall !== undefined ? String(widthCall) : (process.env.FLIX_WIDTHCALL || '1200');
    return `${baseUrl}?mpn=${mpn}&distId=${distId}&iso=${iso}&flso=${flso}&ean=${ean}&widthcall=${widthcall}`;
  }

  async navigateToFlix(widthCall?: number): Promise<void> {
    const url = FlixPage.buildFlixUrl(widthCall);
    await this.navigateToUrl(url);
  }

  async navigateToUrl(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await this.loadFullPageTopToBottom();
    await this.page.waitForFunction(
      () => document.querySelectorAll("div[data-module='FM00002D'], div[data-module='FM00043A']").length >= 3,
      { timeout: 15000 }
    );
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForFunction(() => window.scrollY === 0, { timeout: 5000 });
  }

  /** Scroll to the very bottom of the page. */
  async scrollToEndOfPage(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
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
      // Safety guard: never loop forever even if the page keeps resizing.
      let rounds = 0;
      const maxRounds = 10;
      while (stableRounds < 2 && rounds < maxRounds) {
        rounds++;
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
    await this.page.waitForSelector("div[data-module='FM00002D'], div[data-module='FM00043A']", { timeout: 60000 });
  }

  async getModuleBoundingBox(locator: Locator) {
    return await locator.boundingBox();
  }

  async getImageSrc(locator: Locator): Promise<string | null> {
    return await locator.getAttribute('src');
  }

  async getCurrentImageSrc(locator: Locator): Promise<string | null> {
    return await locator.evaluate((img: HTMLImageElement) => img.currentSrc || img.getAttribute('src'));
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

  async has2DOverlap(locator1: Locator, locator2: Locator): Promise<boolean> {
    const box1 = await locator1.boundingBox();
    const box2 = await locator2.boundingBox();
    if (!box1 || !box2) return false;
    return !(
      box2.x >= box1.x + box1.width ||
      box2.x + box2.width <= box1.x ||
      box2.y >= box1.y + box1.height ||
      box2.y + box2.height <= box1.y
    );
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

  /** Capture a screenshot of the current viewport and return the buffer. */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: false });
  }

  /** Validate cropping across all relevant modules. Returns a list of issue descriptions. */
  async validateCropping(): Promise<string[]> {
    const issues: string[] = [];

    // ALL-IN-ONE images inside cards
    const allInOneCardCount = await this.getElementCount(this.allInOneCards);
    if (allInOneCardCount === 0) {
      issues.push('ALL-IN-ONE: no cards found');
    } else {
      for (let i = 0; i < allInOneCardCount; i++) {
        const card = this.allInOneCards.nth(i);
        const image = this.allInOneImages.nth(i);
        if (await this.isElementCropped(card, image)) {
          issues.push(`ALL-IN-ONE card ${i + 1}: image is cropped`);
        }
      }
    }

    // EYES THAT THRILL text containers inside cards
    const eyesCardCount = await this.getElementCount(this.eyesThatThrillCards);
    if (eyesCardCount === 0) {
      issues.push('EYES THAT THRILL: no cards found');
    } else {
      for (let i = 0; i < eyesCardCount; i++) {
        const card = this.eyesThatThrillCards.nth(i);
        const text = this.eyesThatThrillTexts.nth(i);
        if (await this.isElementCropped(card, text)) {
          issues.push(`EYES THAT THRILL card ${i + 1}: text container is cropped`);
        }
      }
    }

    // Module within viewport boundaries
    const moduleBox = await this.getModuleBoundingBox(this.allInOneModule);
    if (!moduleBox || moduleBox.width <= 0 || moduleBox.height <= 0 || moduleBox.x < 0) {
      issues.push('ALL-IN-ONE module: invalid bounding box or outside viewport');
    }

    return issues;
  }

  /** Validate overlapping across all relevant modules. Returns a list of issue descriptions. */
  async validateOverlapping(): Promise<string[]> {
    const issues: string[] = [];

    // EYES THAT THRILL cards
    const eyesCardCount = await this.getElementCount(this.eyesThatThrillCards);
    if (eyesCardCount < 2) {
      issues.push(`EYES THAT THRILL: expected at least 2 cards, found ${eyesCardCount}`);
    } else {
      for (let i = 0; i < eyesCardCount - 1; i++) {
        const card1 = this.eyesThatThrillCards.nth(i);
        const card2 = this.eyesThatThrillCards.nth(i + 1);
        if (await this.has2DOverlap(card1, card2)) {
          issues.push(`EYES THAT THRILL cards ${i + 1} & ${i + 2}: overlap`);
        }
      }
    }

    // ALL-IN-ONE cards
    const allInOneCardCount = await this.getElementCount(this.allInOneCards);
    if (allInOneCardCount >= 2) {
      for (let i = 0; i < allInOneCardCount - 1; i++) {
        const card1 = this.allInOneCards.nth(i);
        const card2 = this.allInOneCards.nth(i + 1);
        if (await this.has2DOverlap(card1, card2)) {
          issues.push(`ALL-IN-ONE cards ${i + 1} & ${i + 2}: overlap`);
        }
      }
    }

    return issues;
  }

  /** Validate broken images/modules across all relevant modules. Returns a list of issue descriptions. */
  async validateBroken(): Promise<string[]> {
    const issues: string[] = [];

    // Video modules dimensions
    const videoCount = await this.getElementCount(this.videoContainers);
    if (videoCount === 0) {
      issues.push('Video module: no video containers found');
    } else {
      for (let i = 0; i < videoCount; i++) {
        const box = await this.videoContainers.nth(i).boundingBox();
        if (!box || box.width <= 0 || box.height <= 0) {
          issues.push(`Video module ${i + 1}: zero or missing dimensions`);
        }
      }
    }

    // Shade gallery images
    const slideCount = await this.getElementCount(this.shadeGallerySlides);
    if (slideCount === 0) {
      issues.push('Shade gallery: no slides found');
    } else {
      for (let i = 0; i < slideCount; i++) {
        const img = this.shadeGallerySlides.nth(i).locator('//img');
        const src = await this.getCurrentImageSrc(img);
        if (!src || src.includes('loading.gif')) {
          issues.push(`Shade gallery slide ${i + 1}: placeholder or missing src`);
        }
        if (await this.isImageBroken(img)) {
          issues.push(`Shade gallery slide ${i + 1}: broken image`);
        }
      }
    }

    // EYES THAT THRILL images
    const eyesImageCount = await this.getElementCount(this.eyesThatThrillImages);
    if (eyesImageCount === 0) {
      issues.push('EYES THAT THRILL: no images found');
    } else {
      for (let i = 0; i < eyesImageCount; i++) {
        const img = this.eyesThatThrillImages.nth(i);
        const src = await this.getCurrentImageSrc(img);
        if (!src || src.includes('loading.gif')) {
          issues.push(`EYES THAT THRILL image ${i + 1}: placeholder or missing src`);
        }
        if (await this.isImageBroken(img)) {
          issues.push(`EYES THAT THRILL image ${i + 1}: broken image`);
        }
      }
    }

    // ALL-IN-ONE images
    const allInOneImageCount = await this.getElementCount(this.allInOneImages);
    if (allInOneImageCount === 0) {
      issues.push('ALL-IN-ONE: no images found');
    } else {
      for (let i = 0; i < allInOneImageCount; i++) {
        const img = this.allInOneImages.nth(i);
        const src = await this.getCurrentImageSrc(img);
        if (!src || src.includes('loading.gif')) {
          issues.push(`ALL-IN-ONE image ${i + 1}: placeholder or missing src`);
        }
        if (await this.isImageBroken(img)) {
          issues.push(`ALL-IN-ONE image ${i + 1}: broken image`);
        }
      }
    }

    return issues;
  }
}
