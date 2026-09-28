import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { FlixPage } from '../../pages/FlixPage';

const viewports = [
  { name: '1200px', width: 1200, height: 800 },
  { name: '768px', width: 768, height: 1024 },
  { name: '375px', width: 375, height: 667 },
];

test.use({ screenshot: 'off' });

test.describe('Broken Validation', () => {
  test.setTimeout(180000);

  for (const viewport of viewports) {
    test.describe(`at ${viewport.name} viewport`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
      });

      let flixPage: FlixPage;

      test.beforeEach(async ({ page }) => {
        test.setTimeout(180000);
        fs.mkdirSync(path.join('test-results', 'screenshots'), { recursive: true });

        flixPage = new FlixPage(page);
        const url = FlixPage.buildFlixUrl(viewport.width);
        await flixPage.navigateToUrl(url);
        await flixPage.waitForModules();
      });

      test(`should validate broken images/modules across all modules at ${viewport.name}`, async ({}, testInfo) => {
        // 1. Scroll the page till the end.
        await flixPage.scrollToEndOfPage();

        // 2. Evaluate broken images/modules for every relevant module.
        const issues = await flixPage.validateBroken();

        // 3. If issues are found, take a screenshot of each issue and attach it
        //    to the HTML report, then record every issue with a soft assertion.
        if (issues.length > 0) {
          for (const issue of issues) {
            const safeName = issue.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
            const screenshotName = `broken-${viewport.name}-${safeName}`;
            await flixPage.takeScreenshot(screenshotName);
            const screenshotPath = path.join('test-results', 'screenshots', `${screenshotName}.png`);
            await testInfo.attach(`Screenshot: ${issue}`, { path: screenshotPath, contentType: 'image/png' });
            expect.soft(false, issue).toBe(true);
          }
        }

        // 4. Final hard assertion: fail the test if any broken issue exists.
        //    Playwright records trace/video automatically for each test (see playwright.config.ts).
        expect(issues.length, `Broken issues found at ${viewport.name}: ${issues.join('; ')}`).toBe(0);
      });
    });
  }
});
