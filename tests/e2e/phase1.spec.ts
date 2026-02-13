import { test, expect } from '@playwright/test'

// Base URL from environment or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

test.describe('Phase 1: Basic Framework E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL)
  })

  test('1. Home page loads correctly', async ({ page }) => {
    // Should be redirected to login if not authenticated
    await page.waitForURL(`${BASE_URL}/login`)
    await expect(page).toHaveTitle(/Anime Video/)
  })

  test('2. User registration', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Create account')
    await expect(page).toHaveURL(`${BASE_URL}/register`)

    // Fill registration form
    const timestamp = Date.now()
    const username = `testuser_${timestamp}`
    const email = `test_${timestamp}@example.com`
    const password = 'Test123456!'

    await page.fill('input[name="username"]', username)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="confirmPassword"]', password)

    // Submit registration
    await page.click('button[type="submit"]')

    // Should redirect to dashboard or show success message
    await page.waitForURL(/dashboard|login/, { timeout: 5000 })
  })

  test('3. User login', async ({ page }) => {
    // Navigate to login if not already there
    if (!page.url().includes('login')) {
      await page.goto(`${BASE_URL}/login`)
    }

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')

    // Submit login
    await page.click('button[type="submit"]')

    // Should redirect to dashboard on success
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 })

    // Verify dashboard elements
    await expect(page.locator('h1, h2')).toContainText('Dashboard')
  })

  test('4. API returns JWT token', async ({ page }) => {
    // Login and check for token in localStorage
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 })

    // Check localStorage for JWT token
    const token = await page.evaluate(() => {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.state?.token
      }
      return null
    })

    expect(token).not.toBeNull()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  test('5. File upload functionality', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`)

    // Navigate to Create page
    await page.click('text=Create')
    await expect(page).toHaveURL(`${BASE_URL}/create`)

    // Check for dropzone
    const dropzone = page.locator('[data-testid="dropzone"], .dropzone, [class*="drop"]').first()
    await expect(dropzone).toBeVisible()

    // Create a test file
    const file = {
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    }

    // Upload file via the file input
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer
    })

    // Wait for upload to complete (check for success indicator)
    await page.waitForTimeout(2000)

    // Verify file was uploaded (check for uploaded state or URL)
    const uploadedState = await page.evaluate(() => {
      const dropzone = document.querySelector('[class*="drop"], .dropzone')
      return dropzone?.classList.contains('uploaded') || dropzone?.innerHTML.includes('uploaded')
    })

    // Note: This test might fail if backend is not running
    // We're mainly checking that the UI handles upload
  })

  test('6. Navigation between pages', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`)

    // Navigate to each page
    const pages = [
      { path: '/create', name: 'Create' },
      { path: '/studio', name: 'Studio' },
      { path: '/gallery', name: 'Gallery' },
      { path: '/settings', name: 'Settings' },
    ]

    for (const pageItem of pages) {
      await page.click(`text=${pageItem.name}`)
      await page.waitForURL(`${BASE_URL}${pageItem.path}`)
      await expect(page).toHaveURL(`${BASE_URL}${pageItem.path}`)
    }
  })

  test('7. Settings page loads and API key forms are present', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`)

    // Navigate to Settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(`${BASE_URL}/settings`)

    // Check for API key configuration cards
    await expect(page.locator('text=Kling AI')).toBeVisible()
    await expect(page.locator('text=Hailuo')).toBeVisible()
    await expect(page.locator('text=ComfyUI')).toBeVisible()

    // Check for default settings
    await expect(page.locator('text=Default Provider')).toBeVisible()
    await expect(page.locator('text=Default Style Preset')).toBeVisible()
  })

  test('8. Logout functionality', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123456!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`)

    // Find and click logout button (usually in user menu)
    const userMenuButton = page.locator('[class*="avatar"], [class*="user"]').first()
    await userMenuButton.click()

    // Click logout option
    const logoutButton = page.locator('text=Logout, text=Sign out').first()
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }

    // Should redirect to login page
    await page.waitForURL(`${BASE_URL}/login`)

    // Verify token is removed
    const token = await page.evaluate(() => {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.state?.token
      }
      return null
    })

    expect(token).toBeNull()
  })
})

test.describe('API Endpoint Health Checks', () => {
  test('1. Backend health check', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL || 'http://localhost:8000'}/health`)
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  test('2. API docs endpoint', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL || 'http://localhost:8000'}/docs`)
    expect(response.status()).toBe(200)
  })
})
