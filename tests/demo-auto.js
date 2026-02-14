const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function demo() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 开始自动演示...');

    // 1. 注册新用户
    console.log('1️⃣ 注册新用户...');
    await page.goto(`${BASE_URL}/register`);
    const timestamp = Date.now();
    await page.fill('input[name="username"]', `demo_user_${timestamp}`);
    await page.fill('input[name="email"]', `demo_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Demo123456!');
    await page.fill('input[name="confirmPassword"]', 'Demo123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-after-register.png'), fullPage: true });

    // 2. 查看初始状态 (应该重定向到登录页)
    console.log('2️⃣ 查看初始状态...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png'), fullPage: true });

    // 3. 登录
    console.log('3️⃣ 登录...');
    await page.fill('input[name="email"]', `demo_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Demo123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard.png'), fullPage: true });

    // 4. 进入 Create 页面
    console.log('4️⃣ 进入 Create 页面...');
    await page.click('text=Create');
    await page.waitForURL(`${BASE_URL}/create`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-create.png'), fullPage: true });

    // 5. 切换到 Text to Video Tab
    console.log('5️⃣ 切换到 Text to Video Tab...');
    await page.click('text=Text to Video');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-txt2vid.png'), fullPage: true });

    // 6. 填写 Prompt
    console.log('6️⃣ 填写 Prompt...');
    await page.fill('textarea[placeholder*="Describe"]', 'A beautiful anime girl with long flowing hair dancing in a city street at night');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-prompt-filled.png'), fullPage: true });

    // 7. 进入 Studio 页面
    console.log('7️⃣ 进入 Studio 页面...');
    await page.click('text=Studio');
    await page.waitForURL(`${BASE_URL}/studio`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-studio.png'), fullPage: true });

    // 8. 进入 Gallery 页面
    console.log('8️⃣ 进入 Gallery 页面...');
    await page.click('text=Gallery');
    await page.waitForURL(`${BASE_URL}/gallery`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-gallery.png'), fullPage: true });

    // 9. 进入 Settings 页面
    console.log('9️⃣ 进入 Settings 页面...');
    await page.click('text=Settings');
    await page.waitForURL(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-settings.png'), fullPage: true });

    console.log('✅ 演示完成！');

  } catch (error) {
    console.error('❌ 演示出错:', error);
  } finally {
    await browser.close();
  }
}

demo();
