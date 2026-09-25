import { test, expect } from '@playwright/test';
import { FlixPage } from '../pages/FlixPage';

test.describe('Flix Modular Page - Cropping Overlapping Broken Validation', () => {
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

  test.describe('Cropping Feature - Valid Test Cases', () => {
    test('ALL-IN-ONE module images should be fully visible without cropping at 1200px viewport', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const cardCount = await flixPage.getElementCount(flixPage.allInOneCards);
      expect(cardCount).toBeGreaterThan(0);
      for (let i = 0; i < cardCount; i++) {
        const card = flixPage.allInOneCards.nth(i);
        const image = flixPage.allInOneImages.nth(i);
        const isCropped = await flixPage.isElementCropped(card, image);
        expect(isCropped).toBe(false);
      }
    });

    test('ALL-IN-ONE images should load actual asset src instead of placeholder', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const imageCount = await flixPage.getElementCount(flixPage.allInOneImages);
      expect(imageCount).toBeGreaterThan(0);
      for (let i = 0; i < imageCount; i++) {
        const src = await flixPage.getImageSrc(flixPage.allInOneImages.nth(i));
        const dataSrc = await flixPage.allInOneImages.nth(i).getAttribute('data-flixsrcset');
        expect(src).not.toContain('loading.gif');
        expect(dataSrc).not.toBeNull();
      }
    });

    test('ALL-IN-ONE module should render within viewport boundaries', async () => {
      await flixPage.scrollToElement(flixPage.allInOneModule);
      const box = await flixPage.getModuleBoundingBox(flixPage.allInOneModule);
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
      expect(box!.x).toBeGreaterThanOrEqual(0);
    });
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

  test.describe('Overlapping Feature - Valid Test Cases', () => {
    test('EYES THAT THRILL cards should not overlap horizontally at 1200px viewport', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const cardCount = await flixPage.getElementCount(flixPage.eyesThatThrillCards);
      expect(cardCount).toBeGreaterThan(1);
      for (let i = 0; i < cardCount - 1; i++) {
        const card1 = flixPage.eyesThatThrillCards.nth(i);
        const card2 = flixPage.eyesThatThrillCards.nth(i + 1);
        const overlap = await flixPage.hasHorizontalOverlap(card1, card2);
        expect(overlap).toBe(false);
      }
    });

    test('EYES THAT THRILL text containers should fit within card boundaries', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const cardCount = await flixPage.getElementCount(flixPage.eyesThatThrillCards);
      expect(cardCount).toBeGreaterThan(0);
      for (let i = 0; i < cardCount; i++) {
        const card = flixPage.eyesThatThrillCards.nth(i);
        const text = flixPage.eyesThatThrillTexts.nth(i);
        const isCropped = await flixPage.isElementCropped(card, text);
        expect(isCropped).toBe(false);
      }
    });

    test('EYES THAT THRILL module should have three distinct cards', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const cardCount = await flixPage.getElementCount(flixPage.eyesThatThrillCards);
      expect(cardCount).toBe(3);
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

  test.describe('Broken Feature - Valid Test Cases', () => {
    test('Video modules should have visible dimensions greater than zero', async () => {
      await flixPage.scrollToElement(flixPage.videoModule.first());
      const count = await flixPage.getElementCount(flixPage.videoContainers);
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const box = await flixPage.videoContainers.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);
      }
    });

    test('Shade gallery should display product images without loading.gif placeholder', async () => {
      await flixPage.scrollToElement(flixPage.shadeGalleryModule);
      const slides = await flixPage.getElementCount(flixPage.shadeGallerySlides);
      expect(slides).toBeGreaterThan(0);
      for (let i = 0; i < slides; i++) {
        const img = flixPage.shadeGallerySlides.nth(i).locator("//img");
        const src = await flixPage.getImageSrc(img);
        expect(src).not.toContain('loading.gif');
        const isBroken = await flixPage.isImageBroken(img);
        expect(isBroken).toBe(false);
      }
    });

    test('EYES THAT THRILL images should load with valid src attributes', async () => {
      await flixPage.scrollToElement(flixPage.eyesThatThrillModule);
      const imageCount = await flixPage.getElementCount(flixPage.eyesThatThrillImages);
      expect(imageCount).toBeGreaterThan(0);
      for (let i = 0; i < imageCount; i++) {
        const src = await flixPage.getImageSrc(flixPage.eyesThatThrillImages.nth(i));
        expect(src).not.toBeNull();
        expect(src).not.toContain('loading.gif');
      }
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

  test.describe('Responsive Behavior - Valid Test Cases', () => {
    const responsiveViewports = [
      { name: '2046px', width: 2046, height: 1152 },
      { name: '1720px', width: 1720, height: 900 },
      { name: '1200px', width: 1200, height: 800 },
      { name: '1024px', width: 1024, height: 768 },
      { name: '800px', width: 800, height: 600 },
      { name: '768px', width: 768, height: 1024 },
      { name: '375px', width: 375, height: 667 },
      { name: '360px', width: 360, height: 640 },
    ];

    for (const viewport of responsiveViewports) {
      test.describe(`at ${viewport.name} viewport`, () => {
        let responsivePage: FlixPage;

        test.beforeAll(async ({ browser }) => {
          test.setTimeout(180000);
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            recordVideo: { dir: 'test-results/videos', size: { width: viewport.width, height: viewport.height } },
          });
          const page = await context.newPage();
          responsivePage = new FlixPage(page);
          // widthcall matches the viewport, like a real host page would send
          await responsivePage.navigateToFlix(viewport.width);
          await responsivePage.waitForModules();
        });

        test.afterAll(async () => {
          test.setTimeout(180000);
          await responsivePage['page'].context().close();
        });

        test(`ALL-IN-ONE cards should stay within module boundaries at ${viewport.name}`, async () => {
          await responsivePage.scrollToElement(responsivePage.allInOneModule);
          const moduleBox = await responsivePage.getModuleBoundingBox(responsivePage.allInOneModule);
          const cardCount = await responsivePage.getElementCount(responsivePage.allInOneCards);
          expect(cardCount).toBeGreaterThan(0);
          for (let i = 0; i < cardCount; i++) {
            const cardBox = await responsivePage.allInOneCards.nth(i).boundingBox();
            if (cardBox && moduleBox) {
              expect(cardBox.x).toBeGreaterThanOrEqual(moduleBox.x - 1);
              expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(moduleBox.x + moduleBox.width + 1);
            }
          }
        });

        test(`EYES THAT THRILL cards should not overlap at ${viewport.name}`, async () => {
          await responsivePage.scrollToElement(responsivePage.eyesThatThrillModule);
          const cardCount = await responsivePage.getElementCount(responsivePage.eyesThatThrillCards);
          expect(cardCount).toBeGreaterThan(1);
          for (let i = 0; i < cardCount - 1; i++) {
            const box1 = await responsivePage.eyesThatThrillCards.nth(i).boundingBox();
            const box2 = await responsivePage.eyesThatThrillCards.nth(i + 1).boundingBox();
            if (box1 && box2) {
              // 2D rectangle intersection — valid whether cards are side-by-side or stacked
              const overlaps2D = !(
                box2.x >= box1.x + box1.width ||
                box2.x + box2.width <= box1.x ||
                box2.y >= box1.y + box1.height ||
                box2.y + box2.height <= box1.y
              );
              expect(overlaps2D).toBe(false);
            }
          }
        });

        // Stacking is only expected on narrow (mobile) layouts
        if (viewport.width <= 480) {
          test(`EYES THAT THRILL cards should stack vertically at ${viewport.name}`, async () => {
            await responsivePage.scrollToElement(responsivePage.eyesThatThrillModule);
            const cardCount = await responsivePage.getElementCount(responsivePage.eyesThatThrillCards);
            expect(cardCount).toBeGreaterThan(1);
            for (let i = 0; i < cardCount - 1; i++) {
              const box1 = await responsivePage.eyesThatThrillCards.nth(i).boundingBox();
              const box2 = await responsivePage.eyesThatThrillCards.nth(i + 1).boundingBox();
              if (box1 && box2) {
                expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 1);
              }
            }
          });
        }

        test(`page should render without horizontal overflow at ${viewport.name}`, async () => {
          const hasHorizontalOverflow = await responsivePage['page'].evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 1
          );
          expect(hasHorizontalOverflow).toBe(false);
        });
      });
    }
  });
});
