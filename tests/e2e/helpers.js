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
 * @param {'dashboard'|'catalog'|'planning'|'groceries'|'settings'} view
 */
export async function navigateTo(page, view) {
  await page.getByTestId(`nav-${view}`).click()
  await page.waitForTimeout(300) // transition out-in
}

/**
 * Ajoute la première recette visible au menu
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
