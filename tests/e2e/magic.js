const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.locator('div').nth(2).click();
  await page.locator('div').nth(2).click();
  await page.locator('div').nth(2).click();
  await page.locator('div').nth(4).click();
  await page.locator('div').nth(2).click();
  await page.locator('div').nth(2).click();
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();