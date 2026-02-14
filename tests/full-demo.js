const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runFullDemo() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 开始完整演示...');

    const timestamp = Date.now();
    const email = `demo_${timestamp}@example.com`;
    const password = 'Demo123456!';
    const username = `demo_user_${timestamp}`;

    // 1. 注册新用户
    console.log('1️⃣ 注册新用户...');
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-after-register.png'), fullPage: true });
    console.log('   ✓ 注册完成，自动跳转到登录页');

    // 2. 登录
    console.log('2️⃣ 登录...');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-dashboard.png'), fullPage: true });
    console.log('   ✓ 登录成功，进入 Dashboard');

    // 3. 进入 Create 页面
    console.log('3️⃣ 进入 Create 页面...');
    await page.click('text=Create');
    await page.waitForURL(`${BASE_URL}/create`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-create.png'), fullPage: true });

    // 4. 切换到 Text to Video Tab
    console.log('4️⃣ 切换到 Text to Video Tab...');
    await page.click('text=Text to Video');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-txt2vid.png'), fullPage: true });

    // 5. 填写 Prompt
    console.log('5️⃣ 填写 Prompt...');
    await page.fill('textarea[placeholder*="Describe"]', 'A beautiful anime girl with long flowing hair dancing under cherry blossoms at night, city street, neon lights, cinematic anime style, highly detailed');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-prompt-filled.png'), fullPage: true });
    console.log('   ✓ Prompt 已填写');

    // 6. 切换到 Video to Anime Tab
    console.log('6️⃣ 切换到 Video to Anime Tab...');
    await page.click('text=Video to Anime');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-vid2anime.png'), fullPage: true });

    // 7. 进入 Studio 页面
    console.log('7️⃣ 进入 Studio 页面...');
    await page.click('text=Studio');
    await page.waitForURL(`${BASE_URL}/studio`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-studio.png'), fullPage: true });

    // 8. 添加一个角色
    console.log('8️⃣ 添加角色...');
    await page.click('button:has([class*="plus"], [aria-label="Add"])');
    await page.waitForTimeout(500);

    await page.fill('input[name="name"]', 'Sakura - 樱花少女');
    await page.fill('textarea[placeholder*="description"]', '温柔善良，粉色头发，穿着樱花图案和服');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-add-character.png'), fullPage: true });

    // 9. 添加场景
    console.log('9️⃣ 添加场景...');
    await page.click('button:has([class*="plus"])');
    await page.waitForTimeout(500);

    await page.fill('textarea[placeholder*="scene"]', 'Sakura 走在樱花树下，伸手接住飘落的花瓣');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-add-scene.png'), fullPage: true });

    // 10. 进入 Gallery 页面
    console.log('10️⃣ 进入 Gallery 页面...');
    await page.click('text=Gallery');
    await page.waitForURL(`${BASE_URL}/gallery`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-gallery.png'), fullPage: true });

    // 11. 进入 Settings 页面
    console.log('11️⃣ 进入 Settings 页面...');
    await page.click('text=Settings');
    await page.waitForURL(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-settings.png'), fullPage: true });

    console.log('');
    console.log('✅ 演示完成！');
    console.log('');
    console.log('用户信息:');
    console.log(`   用户名: ${username}`);
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log('');
    console.log('所有截图已保存到:', SCREENSHOT_DIR);

  } catch (error) {
    console.error('❌ 演示出错:', error.message);
  } finally {
    await browser.close();
  }
}

runFullDemo();
