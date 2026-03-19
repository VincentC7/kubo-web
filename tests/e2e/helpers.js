/**
 * helpers.js — Utilitaires partagés pour les tests Playwright kubo-web
 */

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
