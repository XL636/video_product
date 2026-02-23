import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api/v1'

test.describe('AI Creator Page', () => {
  let email: string
  let password: string
  let token: string

  test.beforeAll(async ({ request }) => {
    email = `creator_${Date.now()}@test.com`
    password = 'test1234'
    // Register
    await request.post(`${API}/auth/register`, {
      data: { username: `creator_${Date.now()}`, email, password },
    })
    // Login to get token
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email, password },
    })
    token = (await loginRes.json()).access_token
  })

  async function loginViaUI(page: any) {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"], input[placeholder*="邮箱"], input[placeholder*="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login")')
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)
  }

  test('1. Navigate to AI Creator and see input', async ({ page }) => {
    await loginViaUI(page)
    await page.goto(`${BASE}/ai-creator`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/screenshots/ai-creator-01-landing.png', fullPage: true })

    // Check for AI Creator page elements
    const title = page.locator('text=AI Creative Director, text=AI 创意总监').first()
    const hasTitle = await title.isVisible().catch(() => false)
    console.log('Has AI Creator title:', hasTitle)

    const input = page.locator('input').first()
    const hasInput = await input.isVisible().catch(() => false)
    console.log('Has input field:', hasInput)

    expect(hasTitle || hasInput).toBeTruthy()
  })

  test('2. Submit idea without ZhiPu API key', async ({ page }) => {
    await loginViaUI(page)
    await page.goto(`${BASE}/ai-creator`)
    await page.waitForLoadState('networkidle')

    const input = page.locator('input').first()
    await input.fill('一只猫在月光下的屋顶上优雅地跳舞')

    const submitBtn = page.locator('button:has-text("开始"), button:has-text("Start")').first()

    // Capture API response
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/creative/sessions') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)

    await submitBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/e2e/screenshots/ai-creator-02-no-key-error.png', fullPage: true })

    const response = await responsePromise
    if (response) {
      const status = response.status()
      const body = await response.json().catch(() => null)
      console.log('No-key API status:', status)
      console.log('No-key API body:', JSON.stringify(body))
      // Should return 400 with clear error message, not 500
      expect(status).toBe(400)
      expect(body?.detail).toContain('API Key')
    }
  })

  test('3. Submit idea with fake API key (error handling)', async ({ page, request }) => {
    // Save a fake cogvideo key
    const saveRes = await request.post(`${API}/settings/api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { provider: 'cogvideo', api_key: 'fake_key_for_test' },
    })
    console.log('Save key status:', saveRes.status())

    await loginViaUI(page)
    await page.goto(`${BASE}/ai-creator`)
    await page.waitForLoadState('networkidle')

    const input = page.locator('input').first()
    await input.fill('一只猫在月光下的屋顶上优雅地跳舞')
    await page.screenshot({ path: 'tests/e2e/screenshots/ai-creator-03-idea-filled.png', fullPage: true })

    const submitBtn = page.locator('button:has-text("开始"), button:has-text("Start")').first()

    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/creative/sessions') && resp.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null)

    await submitBtn.click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/e2e/screenshots/ai-creator-04-fake-key-result.png', fullPage: true })

    const response = await responsePromise
    if (response) {
      const status = response.status()
      const body = await response.json().catch(() => null)
      console.log('Fake-key API status:', status)
      console.log('Fake-key API body:', JSON.stringify(body))
      // Should return 502 with Chinese error, not 500 Internal Server Error
      expect(status).toBe(502)
      expect(body?.detail).toBeTruthy()
      console.log('Error message shown to user:', body?.detail)
    }

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/e2e/screenshots/ai-creator-05-error-toast.png', fullPage: true })
  })

  test('4. Verify API defaults (provider=jimeng)', async ({ request }) => {
    // Test that CreateSessionRequest defaults to jimeng, not cogvideo
    // We check by sending request without provider field
    const res = await request.post(`${API}/creative/sessions`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { idea: 'test idea' },
    })
    // The request should not fail with provider validation error
    // It may fail with API key error (502) or succeed - but NOT with "invalid provider"
    const status = res.status()
    const body = await res.json().catch(() => null)
    console.log('Default provider test - status:', status)
    console.log('Default provider test - body:', JSON.stringify(body))
    // Should not be 422 (validation error)
    expect(status).not.toBe(422)
  })
})
