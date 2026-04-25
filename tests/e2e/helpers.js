/**
 * helpers.js — Utilitaires partagés pour les tests Playwright kubo-web
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/user.json')

/**
 * Attend que l'app soit chargée (spinner disparu, vue visible)
 * @param {import('@playwright/test').Page} page
 */
export async function waitForAppReady(page) {
  // Le spinner de chargement doit disparaître
  await page.waitForSelector('.app-shell__loader', { state: 'hidden', timeout: 10_000 })
}

/**
 * Navigue vers une vue via la sidebar
 * @param {import('@playwright/test').Page} page
 * @param {'dashboard'|'catalog'|'planning'|'groceries'|'inventory'|'settings'} view
 */
export async function navigateTo(page, view) {
  await page.getByTestId(`nav-${view}`).click()
  await page.waitForTimeout(300) // transition out-in
}

/**
 * Injecte les tokens sauvegardés dans auth.json directement dans le localStorage
 * du navigateur, puis navigue vers / pour que l'app démarre en mode connecté.
 *
 * Cette approche évite tout appel à l'API /login pendant les tests, ce qui
 * contourne le rate-limit 429 (3 tentatives/heure) déclenché quand plusieurs
 * suites de tests s'enchaînent.
 *
 * Les paramètres `email` et `password` sont conservés pour la compatibilité
 * de signature mais ne sont utilisés qu'en fallback si auth.json est absent.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function loginAs(page, email, password) {
  // ── Chemin rapide : injecter les tokens depuis auth.json ──────────────────
  if (fs.existsSync(AUTH_FILE)) {
    /** @type {{ origins: Array<{ origin: string, localStorage: Array<{ name: string, value: string }> }> }} */
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
    const origin = state.origins?.find((o) => o.origin === 'http://localhost:5173')
    const entries = origin?.localStorage ?? []
    const token = entries.find((e) => e.name === 'kubo_token')?.value
    const refreshToken = entries.find((e) => e.name === 'kubo_refresh_token')?.value

    if (token && refreshToken) {
      // Aller sur la page pour que le contexte soit dans le bon domaine
      await page.goto('/')
      // Injecter les tokens AVANT que l'app Vue se monte
      await page.evaluate(
        ([t, r]) => {
          localStorage.setItem('kubo_token', t)
          localStorage.setItem('kubo_refresh_token', r)
        },
        [token, refreshToken],
      )
      // Recharger pour que l'app démarre avec les tokens déjà présents
      await page.reload()
      await waitForAppReady(page)
      // Attendre que la sidebar passe en mode connecté
      await page.locator('.sidebar__user').waitFor({ state: 'visible', timeout: 10_000 })
      return
    }
  }

  // ── Fallback : login via l'UI (si auth.json absent ou tokens manquants) ───
  await page.goto('/')
  await waitForAppReady(page)

  await page.locator('.sidebar__login-btn').waitFor({ state: 'visible', timeout: 5_000 })
  await page.locator('.sidebar__login-btn').click()
  await page.locator('.auth-modal').waitFor({ state: 'visible', timeout: 5_000 })

  const loginEmailField = page.locator('#login-email')
  if (!(await loginEmailField.isVisible())) {
    await page.locator('.auth-modal__switch').click()
    await loginEmailField.waitFor({ state: 'visible', timeout: 3_000 })
  }

  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.locator('button[type="submit"]').click()

  await page.locator('.sidebar__user').waitFor({ state: 'visible', timeout: 10_000 })
}

/**
 * Se déconnecte depuis la vue profil.
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
  // Ouvrir le profil depuis la sidebar
  await page.locator('.sidebar__user').click()
  // Cliquer sur le bouton déconnexion
  await page.locator('.profile-logout').click()
  // Attendre que le bouton Se connecter réapparaisse
  await page.locator('.sidebar__login-btn').waitFor({ state: 'visible', timeout: 5_000 })
}

/**
 * Ajoute la première recette visible au menu (via le bouton toggle de la carte).
 * N'attend PAS le chargement du détail (ingrédients non disponibles).
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} Le titre de la recette ajoutée
 */
export async function addFirstRecipeToMenu(page) {
  await navigateTo(page, 'catalog')
  const firstCard = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]').first()
  const title = await firstCard.locator('.recipe-card__title').textContent()
  await firstCard.getByTestId('recipe-toggle-btn').click()
  return title?.trim() ?? ''
}

/**
 * Ajoute la première recette au menu EN chargeant son détail via la modale.
 * Garantit que les ingrédients sont disponibles dans le store après l'appel.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} Le titre de la recette ajoutée
 */
export async function addFirstRecipeWithDetail(page) {
  await navigateTo(page, 'catalog')
  const firstCard = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]').first()
  const title = await firstCard.locator('.recipe-card__title').textContent()
  // Ouvrir la modale pour déclencher fetchDetail
  await firstCard.click()
  const modal = page.getByTestId('recipe-detail-modal')
  // Attendre que les ingrédients du détail soient chargés
  await modal.locator('.rdm__ingredient').first().waitFor({ state: 'visible', timeout: 10_000 })
  // Ajouter via le bouton de la modale (ferme aussi la modale)
  await page.getByTestId('modal-toggle-btn').click()
  return title?.trim() ?? ''
}
