import { test, expect } from '@playwright/test'
import path from 'path'

const BASE_URL = 'http://localhost:5173'

test.describe('Anime Video Generator - 功能演示', () => {
  test('1. 访问首页并跳转到登录页', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page).toHaveURL(/login/)
    await page.screenshot({ path: 'screenshots/01-login-page.png' })
  })

  test('2. 注册新用户', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)

    // 填写注册表单
    const timestamp = Date.now()
    await page.fill('input[name="username"]', `demo_user_${timestamp}`)
    await page.fill('input[name="email"]', `demo_${timestamp}@example.com`)
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.fill('input[name="confirmPassword"]', 'Demo123456!')

    // 等待表单加载
    await page.waitForTimeout(500)

    // 提交注册
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'screenshots/02-after-register.png' })
  })

  test('3. 登录系统', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')

    // 等待跳转到首页
    await page.waitForURL(BASE_URL, { timeout: 10000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'screenshots/03-dashboard.png' })
  })

  test('4. 测试 Create 页面 - Image to Video Tab', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)

    // 导航到 Create 页面
    await page.click('text=Create')
    await page.waitForURL(`${BASE_URL}/create`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/04-create-page.png' })

    // 切换到 Image to Video Tab
    await page.click('text=Image to Video')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/05-img2vid-tab.png' })
  })

  test('5. 测试 Create 页面 - Text to Video Tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)
    await page.click('text=Create')
    await page.waitForURL(`${BASE_URL}/create`)

    // 切换到 Text to Video Tab
    await page.click('text=Text to Video')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/06-txt2vid-tab.png' })

    // 填写测试 Prompt
    await page.fill('textarea[placeholder*="Describe"]', 'A beautiful anime girl with long flowing hair standing under cherry blossoms')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/07-txt2vid-filled.png' })
  })

  test('6. 测试 Create 页面 - Video to Anime Tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)
    await page.click('text=Create')
    await page.waitForURL(`${BASE_URL}/create`)

    // 切换到 Video to Anime Tab
    await page.click('text=Video to Anime')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/08-vid2anime-tab.png' })
  })

  test('7. 测试 Settings 页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)

    await page.click('text=Settings')
    await page.waitForURL(`${BASE_URL}/settings`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/09-settings-page.png' })
  })

  test('8. 测试 Studio 页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)

    await page.click('text=Studio')
    await page.waitForURL(`${BASE_URL}/studio`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/10-studio-page.png' })
  })

  test('9. 测试 Gallery 页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)

    await page.click('text=Gallery')
    await page.waitForURL(`${BASE_URL}/gallery`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/11-gallery-page.png' })
  })

  test('10. 完整用户流程演示', async ({ page, context }) => {
    await page.goto(BASE_URL)

    // 1. 登录
    await page.fill('input[name="email"]', 'demo@example.com')
    await page.fill('input[name="password"]', 'Demo123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(BASE_URL)
    await page.screenshot({ path: 'screenshots/demo-01-login.png' })

    // 2. 查看 Dashboard
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/demo-02-dashboard.png' })

    // 3. 进入 Create 页面
    await page.click('text=Create')
    await page.waitForURL(`${BASE_URL}/create`)
    await page.screenshot({ path: 'screenshots/demo-03-create.png' })

    // 4. 查看各个 Tab
    await page.click('text=Text to Video')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/demo-04-txt2vid.png' })

    await page.click('text=Video to Anime')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/demo-05-vid2anime.png' })

    // 5. 进入 Studio
    await page.click('text=Studio')
    await page.waitForURL(`${BASE_URL}/studio`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/demo-06-studio.png' })

    // 6. 进入 Gallery
    await page.click('text=Gallery')
    await page.waitForURL(`${BASE_URL}/gallery`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/demo-07-gallery.png' })

    // 7. 进入 Settings
    await page.click('text=Settings')
    await page.waitForURL(`${BASE_URL}/settings`)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/demo-08-settings.png' })
  })
})
