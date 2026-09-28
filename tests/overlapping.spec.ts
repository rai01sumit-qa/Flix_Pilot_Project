import { test, expect, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { FlixPage } from '../pages/FlixPage';

const viewports = [
  { name: '1200px', width: 1200, height: 800 },
  { name: '768px', width: 768, height: 1024 },
  { name: '375px', width: 375, height: 667 },
];

test.describe('Overlapping Validation', () => {
  test.setTimeout(180000);

  for (const viewport of viewports) {
    test.describe(`at ${viewport.name} viewport`, () => {
      let flixPage: FlixPage;
      let context: BrowserContext;

      test.beforeAll(async ({ browser }) => {
        test.setTimeout(180000);
        fs.mkdirSync(path.join('test-results', 'screenshots'), { recursive: true });

        context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          recordVideo: {
            dir: `test-results/videos/overlapping-${viewport.name}`,
            size: { width: viewport.width, height: viewport.height },
          },
        });
        const page = await context.newPage();
        flixPage = new FlixPage(page);

        const url = FlixPage.buildFlixUrl(viewport.width);
        await flixPage.navigateToUrl(url);
        await flixPage.waitForModules();
      });

      test.afterAll(async () => {
        test.setTimeout(180000);
        await context.close();
      });

      test(`should validate overlapping across all modules at ${viewport.name}`, async () => {
        // 1. Scroll the page till the end.
        await flixPage.scrollToEndOfPage();

        // 2. Evaluate overlapping for every relevant module.
        const issues = await flixPage.validateOverlapping();

        // 3. If issues are found, verify each module by taking a screenshot,
        //    then record every issue with a soft assertion before failing.
        if (issues.length > 0) {
          for (const issue of issues) {
            const safeName = issue.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
            await flixPage.takeScreenshot(`overlapping-${viewport.name}-${safeName}`);
            expect.soft(false, issue).toBe(true);
          }
        }

        // 4. Final hard assertion: fail the test if any overlapping issue exists.
        //    Video is already being recorded by the context and will be saved on close.
        expect(issues.length, `Overlapping issues found at ${viewport.name}: ${issues.join('; ')}`).toBe(0);
      });
    });
  }
});
