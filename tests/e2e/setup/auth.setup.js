/**
 * auth.setup.js — Global auth setup for Playwright
 *
 * Runs once before the test suite. Logs in via the UI, saves the
 * browser storage state (localStorage tokens) to playwright/.auth/user.json.
 * All tests that need an authenticated session load this state instead of
 * calling the login API, which avoids triggering the rate-limit (429).
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const AUTH_FILE = path.join(__dirname, '../../../playwright/.auth/user.json')

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'user@kubo.dev'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Password1'

setup('authenticate', async ({ page }) => {
  await page.goto('/')

  // Wait for the app to finish loading
  await page.waitForSelector('.app-shell__loader', { state: 'hidden', timeout: 15_000 })

  // Open login modal
  await page.locator('.sidebar__login-btn').waitFor({ state: 'visible', timeout: 10_000 })
  await page.locator('.sidebar__login-btn').click()
  await page.locator('.auth-modal').waitFor({ state: 'visible', timeout: 5_000 })

  // Fill and submit login form
  await page.locator('#login-email').fill(TEST_EMAIL)
  await page.locator('#login-password').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()

  // Wait for authenticated state
  await page.locator('.sidebar__user').waitFor({ state: 'visible', timeout: 15_000 })

  // Persist storage state (localStorage tokens + cookies)
  await page.context().storageState({ path: AUTH_FILE })
})
