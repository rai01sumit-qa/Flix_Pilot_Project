import { test, expect } from '@playwright/test';
import { FlixPage } from '../pages/FlixPage';

test.describe('Flix Modular Page - Invalid Test Cases', () => {
  test.setTimeout(180000);
  let flixPage: FlixPage;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      recordVideo: { dir: 'test-results/videos', size: { width: 1200, height: 800 } },
    });
    const page = await context.newPage();
    flixPage = new FlixPage(page);
    await flixPage.navigateToFlix();
    await flixPage.waitForModules();
  });

  test.afterAll(async () => {
    test.setTimeout(180000);
    await flixPage['page'].context().close();
  });

  test.describe('Cropping Feature - Invalid Test Cases', () => {
    test('ALL-IN-ONE images should display loading.gif placeholder indicating broken lazy load', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const imageCount = await flixPage.getElementCount(flixPage.allInOneImages);
      expect(imageCount).toBeGreaterThan(0);
      let brokenCount = 0;
      for (let i = 0; i < imageCount; i++) {
        const src = await flixPage.getImageSrc(flixPage.allInOneImages.nth(i));
        if (src && src.includes('loading.gif')) {
          brokenCount++;
        }
      }
      expect(brokenCount).toBeGreaterThan(0);
    });

    test('ALL-IN-ONE text content should have near-zero height indicating cropped or missing text', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const cardCount = await flixPage.getElementCount(flixPage.allInOneCards);
      let clippedCount = 0;
      for (let i = 0; i < cardCount; i++) {
        const text = flixPage.allInOneCards.nth(i).locator("//div[contains(@class,'f1xIN-fm2d-text')]");
        const box = await text.boundingBox();
        const txt = await text.textContent();
        if ((box && box.height < 20) || (!txt || txt.trim().length === 0)) {
          clippedCount++;
        }
      }
      expect(clippedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Overlapping Feature - Invalid Test Cases', () => {
    test('EYES THAT THRILL cards should have zero gap between adjacent cards indicating layout overlap risk', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const cardCount = await flixPage.getElementCount(flixPage.eyesThatThrillCards);
      expect(cardCount).toBeGreaterThan(1);
      let zeroGapCount = 0;
      for (let i = 0; i < cardCount - 1; i++) {
        const box1 = await flixPage.eyesThatThrillCards.nth(i).boundingBox();
        const box2 = await flixPage.eyesThatThrillCards.nth(i + 1).boundingBox();
        if (box1 && box2) {
          const gap = box2.x - (box1.x + box1.width);
          if (gap < 5) {
            zeroGapCount++;
          }
        }
      }
      expect(zeroGapCount).toBeGreaterThan(0);
    });

    test('EYES THAT THRILL cards should have inconsistent heights indicating broken grid alignment', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const cardCount = await flixPage.getElementCount(flixPage.eyesThatThrillCards);
      const heights: number[] = [];
      for (let i = 0; i < cardCount; i++) {
        const box = await flixPage.eyesThatThrillCards.nth(i).boundingBox();
        if (box) heights.push(box.height);
      }
      expect(heights.length).toBeGreaterThan(1);
      const maxHeight = Math.max(...heights);
      const minHeight = Math.min(...heights);
      expect(maxHeight - minHeight).toBeGreaterThan(30);
    });
  });

  test.describe('Broken Feature - Invalid Test Cases', () => {
    test('Video module background should render as black or empty indicating broken state', async () => {
      await flixPage.scrollToElement(flixPage.videoModule.first());
      const count = await flixPage.getElementCount(flixPage.videoBackground);
      expect(count).toBeGreaterThan(0);
      let brokenCount = 0;
      for (let i = 0; i < count; i++) {
        const bg = await flixPage.getBackgroundColor(flixPage.videoBackground.nth(i));
        const box = await flixPage.videoBackground.nth(i).boundingBox();
        if (bg === 'rgb(0, 0, 0)' || bg === 'rgba(0, 0, 0, 0)' || !box || box.width === 0 || box.height === 0) {
          brokenCount++;
        }
      }
      expect(brokenCount).toBeGreaterThan(0);
    });

    test('Lazy loaded images should still show loading.gif placeholder indicating broken image load', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const imageCount = await flixPage.getElementCount(flixPage.allInOneImages);
      expect(imageCount).toBeGreaterThan(0);
      let brokenCount = 0;
      for (let i = 0; i < imageCount; i++) {
        const src = await flixPage.getImageSrc(flixPage.allInOneImages.nth(i));
        if (src && src.includes('loading.gif')) {
          brokenCount++;
        }
      }
      expect(brokenCount).toBeGreaterThan(0);
    });

    test('Video module should have empty or zero dimension background container', async () => {
      await flixPage.scrollToElement(flixPage.videoModule.first());
      const count = await flixPage.getElementCount(flixPage.videoBackground);
      expect(count).toBeGreaterThan(0);
      let emptyCount = 0;
      for (let i = 0; i < count; i++) {
        const box = await flixPage.videoBackground.nth(i).boundingBox();
        const text = await flixPage.videoBackground.nth(i).textContent();
        if ((!box || box.width === 0 || box.height === 0) && (!text || text.trim().length === 0)) {
          emptyCount++;
        }
      }
      expect(emptyCount).toBeGreaterThan(0);
    });
  });
});
