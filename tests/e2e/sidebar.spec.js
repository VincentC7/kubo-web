/**
 * sidebar.spec.js — Tests de la navigation latérale
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo, loginAs, logout } from './helpers.js'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'user@kubo.dev'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Password1'

// ─── Affichage initial (visiteur) ────────────────────────────────────────────

test.describe('Sidebar — affichage initial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche la sidebar', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible()
  })

  test('affiche les items accessibles aux visiteurs', async ({ page }) => {
    await expect(page.getByTestId('nav-catalog')).toBeVisible()
    await expect(page.getByTestId('nav-dashboard')).not.toBeVisible()
  })

  test('le bouton toggle est présent', async ({ page }) => {
    await expect(page.getByTestId('sidebar-toggle')).toBeVisible()
  })
})

// ─── Collapse / expand ───────────────────────────────────────────────────────

test.describe('Sidebar — collapse / expand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('cliquer sur sidebar-toggle réduit la sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).not.toHaveClass(/sidebar--collapsed/)
    await page.getByTestId('sidebar-toggle').click()
    await expect(sidebar).toHaveClass(/sidebar--collapsed/)
  })

  test('recliquer sur sidebar-toggle restaure la sidebar', async ({ page }) => {
    const toggle = page.getByTestId('sidebar-toggle')
    await toggle.click()
    await expect(page.getByTestId('sidebar')).toHaveClass(/sidebar--collapsed/)
    await toggle.click()
    await expect(page.getByTestId('sidebar')).not.toHaveClass(/sidebar--collapsed/)
  })

  test('le bouton catalogue reste visible quand la sidebar est réduite', async ({ page }) => {
    await page.getByTestId('sidebar-toggle').click()
    await expect(page.getByTestId('sidebar')).toHaveClass(/sidebar--collapsed/)
    await expect(page.getByTestId('nav-catalog')).toBeVisible()
  })
})

// ─── Navigation active (nécessite connexion pour accéder au dashboard) ───────

test.describe('Sidebar — navigation active', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('nav-dashboard est actif après login', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/sidebar__item--active/)
  })

  test('cliquer sur nav-catalog active le bon item', async ({ page }) => {
    await navigateTo(page, 'catalog')
    await expect(page.getByTestId('nav-catalog')).toHaveClass(/sidebar__item--active/)
    await expect(page.getByTestId('nav-dashboard')).not.toHaveClass(/sidebar__item--active/)
  })

  test('cliquer sur nav-settings active le bon item', async ({ page }) => {
    await navigateTo(page, 'settings')
    await expect(page.getByTestId('nav-settings')).toHaveClass(/sidebar__item--active/)
  })
})

// ─── Sidebar visiteur ────────────────────────────────────────────────────────

test.describe('Sidebar — visiteur', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche le bouton "Se connecter"', async ({ page }) => {
    await expect(page.locator('.sidebar__login-btn')).toBeVisible()
    await expect(page.locator('.sidebar__login-btn')).toContainText('Se connecter')
  })

  test('le bloc user connecté est absent', async ({ page }) => {
    await expect(page.locator('.sidebar__user')).not.toBeVisible()
  })

  test('les onglets protégés sont masqués', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).not.toBeVisible()
    await expect(page.getByTestId('nav-planning')).not.toBeVisible()
  })

  test('clic sur "Se connecter" ouvre la modale', async ({ page }) => {
    await page.locator('.sidebar__login-btn').click()
    await expect(page.locator('.auth-modal')).toBeVisible()
  })
})

// ─── Sidebar connecté ────────────────────────────────────────────────────────

test.describe('Sidebar — utilisateur connecté', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test("affiche le bloc user avec l'email", async ({ page }) => {
    await expect(page.locator('.sidebar__user')).toBeVisible()
    await expect(page.locator('.sidebar__user-email')).toContainText(TEST_EMAIL)
  })

  test('le bouton "Se connecter" est absent', async ({ page }) => {
    await expect(page.locator('.sidebar__login-btn')).not.toBeVisible()
  })

  test('les onglets protégés sont visibles', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
    await expect(page.getByTestId('nav-planning')).toBeVisible()
  })

  test('clic sur le bloc user ouvre le profil', async ({ page }) => {
    await page.locator('.sidebar__user').click()
    await expect(page.locator('.profile-view')).toBeVisible()
  })

  test('après logout le bouton "Se connecter" réapparaît', async ({ page }) => {
    await logout(page)
    await expect(page.locator('.sidebar__login-btn')).toBeVisible()
    await expect(page.locator('.sidebar__user')).not.toBeVisible()
  })
})
