/**
 * auth.spec.js — Tests E2E du système d'authentification
 *
 * Prérequis : un compte de test doit exister côté API.
 * Configurer les variables d'environnement :
 *   TEST_USER_EMAIL    — email d'un compte existant
 *   TEST_USER_PASSWORD — mot de passe associé
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, loginAs, logout } from './helpers.js'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'user@kubo.dev'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Password1'

// ─── Visiteur ────────────────────────────────────────────────────────────────

test.describe('Visiteur — état initial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche le bouton "Se connecter" dans la sidebar', async ({ page }) => {
    await expect(page.locator('.sidebar__login-btn')).toBeVisible()
    await expect(page.locator('.sidebar__login-btn')).toContainText('Se connecter')
  })

  test('le bloc user connecté est absent', async ({ page }) => {
    await expect(page.locator('.sidebar__user')).not.toBeVisible()
  })

  test('les onglets protégés sont masqués (dashboard, planning…)', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).not.toBeVisible()
    await expect(page.getByTestId('nav-planning')).not.toBeVisible()
    await expect(page.getByTestId('nav-groceries')).not.toBeVisible()
  })

  test('le catalogue est accessible sans connexion', async ({ page }) => {
    await expect(page.getByTestId('nav-catalog')).toBeVisible()
  })
})

// ─── Ouverture modale ────────────────────────────────────────────────────────

test.describe('Modale login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('.sidebar__login-btn').click()
  })

  test('ouvre la modale au clic sur "Se connecter"', async ({ page }) => {
    await expect(page.locator('.auth-modal')).toBeVisible()
  })

  test('affiche le formulaire de connexion par défaut', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
  })

  test('se ferme avec la croix', async ({ page }) => {
    await page.locator('.auth-modal__close').click()
    await expect(page.locator('.auth-modal')).not.toBeVisible()
  })

  test('se ferme avec la touche Échap', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.locator('.auth-modal')).not.toBeVisible()
  })

  test("se ferme en cliquant sur l'overlay", async ({ page }) => {
    await page.locator('.auth-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.auth-modal')).not.toBeVisible()
  })

  test('switch vers le formulaire register', async ({ page }) => {
    await page.locator('.auth-modal__switch').click()
    await expect(page.locator('#reg-email')).toBeVisible()
    await expect(page.locator('#reg-firstname')).toBeVisible()
  })
})

// ─── Login ───────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('.sidebar__login-btn').click()
  })

  test('affiche une erreur si email vide', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-error')).toBeVisible()
  })

  test('affiche une erreur si mot de passe vide', async ({ page }) => {
    await page.locator('#login-email').fill(TEST_EMAIL)
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-error')).toBeVisible()
  })

  test('affiche une erreur avec des credentials incorrects', async ({ page }) => {
    await page.locator('#login-email').fill(TEST_EMAIL)
    await page.locator('#login-password').fill('mauvais_mot_de_passe')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 8_000 })
  })

  test('login réussi — modale se ferme et sidebar passe en mode connecté', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await expect(page.locator('.auth-modal')).not.toBeVisible()
    await expect(page.locator('.sidebar__user')).toBeVisible()
    await expect(page.locator('.sidebar__login-btn')).not.toBeVisible()
  })

  test('login réussi — les onglets protégés apparaissent', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
    await expect(page.getByTestId('nav-planning')).toBeVisible()
  })

  test('login réussi — redirige vers le dashboard', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/sidebar__item--active/)
  })
})

// ─── Logout ──────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('logout — bouton "Se connecter" réapparaît', async ({ page }) => {
    await logout(page)
    await expect(page.locator('.sidebar__login-btn')).toBeVisible()
    await expect(page.locator('.sidebar__user')).not.toBeVisible()
  })

  test('logout — les onglets protégés disparaissent', async ({ page }) => {
    await logout(page)
    await expect(page.getByTestId('nav-dashboard')).not.toBeVisible()
    await expect(page.getByTestId('nav-planning')).not.toBeVisible()
  })

  test('logout — redirige vers le catalogue', async ({ page }) => {
    await logout(page)
    await expect(page.getByTestId('nav-catalog')).toHaveClass(/sidebar__item--active/)
  })

  test('logout — tokens supprimés du localStorage', async ({ page }) => {
    await logout(page)
    const token = await page.evaluate(() => localStorage.getItem('kubo_token'))
    const refresh = await page.evaluate(() => localStorage.getItem('kubo_refresh_token'))
    expect(token).toBeNull()
    expect(refresh).toBeNull()
  })
})

// ─── Register ────────────────────────────────────────────────────────────────

test.describe('Register — validation formulaire', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('.sidebar__login-btn').click()
    await page.locator('.auth-modal__switch').click() // passer sur register
  })

  test('affiche les champs prénom, nom, email, mot de passe, confirmation', async ({ page }) => {
    await expect(page.locator('#reg-firstname')).toBeVisible()
    await expect(page.locator('#reg-lastname')).toBeVisible()
    await expect(page.locator('#reg-email')).toBeVisible()
    await expect(page.locator('#reg-password')).toBeVisible()
    await expect(page.locator('#reg-confirm-password')).toBeVisible()
  })

  test('erreur si prénom vide', async ({ page }) => {
    await page.locator('#reg-lastname').fill('Dupont')
    await page.locator('#reg-email').fill('nouveau@test.dev')
    await page.locator('#reg-password').fill('Test1234!')
    await page.locator('#reg-confirm-password').fill('Test1234!')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-field__error-msg').first()).toBeVisible()
  })

  test('erreur si les mots de passe ne correspondent pas', async ({ page }) => {
    await page.locator('#reg-firstname').fill('Jean')
    await page.locator('#reg-lastname').fill('Dupont')
    await page.locator('#reg-email').fill('nouveau@test.dev')
    await page.locator('#reg-password').fill('Test1234!')
    await page.locator('#reg-confirm-password').fill('Different1!')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-field__error-msg')).toContainText('correspondent pas')
  })

  test('indicateurs de règles mot de passe apparaissent à la saisie', async ({ page }) => {
    await page.locator('#reg-password').fill('abc')
    await expect(page.locator('.auth-rules')).toBeVisible()
    await expect(page.locator('.auth-rule').first()).not.toHaveClass(/auth-rule--ok/)
  })

  test('tous les indicateurs passent au vert avec un mot de passe valide', async ({ page }) => {
    await page.locator('#reg-password').fill('Test1234!')
    const rules = page.locator('.auth-rule')
    await expect(rules.nth(0)).toHaveClass(/auth-rule--ok/)
    await expect(rules.nth(1)).toHaveClass(/auth-rule--ok/)
    await expect(rules.nth(2)).toHaveClass(/auth-rule--ok/)
  })

  test('erreur si tentative de register avec un email déjà utilisé', async ({ page }) => {
    await page.locator('#reg-firstname').fill('Jean')
    await page.locator('#reg-lastname').fill('Dupont')
    await page.locator('#reg-email').fill(TEST_EMAIL) // email déjà existant
    await page.locator('#reg-password').fill('Test1234!')
    await page.locator('#reg-confirm-password').fill('Test1234!')
    await page.locator('button[type="submit"]').click()
    // L'API retourne 409 (email existant), 429 (rate-limit) ou 500 selon l'implémentation serveur
    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 8_000 })
  })
})
