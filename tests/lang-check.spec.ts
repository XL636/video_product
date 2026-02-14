import { test, expect } from '@playwright/test';

test('Language switcher test', async ({ page }) => {
  // 访问登录页面
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  // 截图登录页面
  await page.screenshot({ path: 'lang-check-login.png', fullPage: true });
  
  // 检查是否有语言切换器
  const langSwitcher = page.locator('button').filter({ hasText: /中文|English/ });
  await expect(langSwitcher.first()).toBeVisible();
  console.log('语言切换器可见');
  
  // 检查当前是否显示中文
  const welcomeText = await page.locator('text=欢迎回来').isVisible();
  console.log('欢迎回来 文本可见:', welcomeText);
  
  // 点击切换到英文
  await langSwitcher.first().click();
  await page.waitForTimeout(3000);
  
  // 截图英文界面
  await page.screenshot({ path: 'lang-check-en.png', fullPage: true });
  console.log('英文界面截图完成');
  
  // 检查是否显示英文
  const welcomeBackEn = await page.locator('text=Welcome back').isVisible();
  console.log('Welcome back 文本可见:', welcomeBackEn);
});
