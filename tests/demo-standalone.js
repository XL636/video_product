const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runDemo() {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 开始演示...');

    const timestamp = Date.now();
    const email = `demo_${timestamp}@example.com`;
    const password = 'Demo123456!';

    // 1. 注册
    console.log('1. 注册...');
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="username"]', `demo_user_${timestamp}`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step01-register.png'), fullPage: true });

    // 2. 登录
    console.log('2. 登录...');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step02-dashboard.png'), fullPage: true });

    // 3. Create 页面
    console.log('3. Create 页面...');
    await page.click('text=Create');
    await page.waitForURL(`${BASE_URL}/create`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step03-create.png'), fullPage: true });

    // 4. Text to Video
    console.log('4. Text to Video...');
    await page.click('text=Text to Video');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step04-txt2vid.png'), fullPage: true });

    // 5. 填写 prompt
    console.log('5. 填写 prompt...');
    await page.fill('textarea[placeholder*="Describe"]', '樱花树下的美丽动漫少女');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step05-prompt.png'), fullPage: true });

    // 6. Studio 页面
    console.log('6. Studio 页面...');
    await page.click('text=Studio');
    await page.waitForURL(`${BASE_URL}/studio`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step06-studio.png'), fullPage: true });

    // 7. Gallery
    console.log('7. Gallery...');
    await page.click('text=Gallery');
    await page.waitForURL(`${BASE_URL}/gallery`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step07-gallery.png'), fullPage: true });

    // 8. Settings
    console.log('8. Settings...');
    await page.click('text=Settings');
    await page.waitForURL(`${BASE_URL}/settings`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step08-settings.png'), fullPage: true });

    console.log('✅ 完成！');
    console.log(`用户: ${email}`);
    console.log(`密码: ${password}`);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

runDemo();
