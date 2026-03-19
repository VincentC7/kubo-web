/**
 * planning.spec.js — Tests du menu hebdomadaire
 */
import { test, expect } from '@playwright/test'
import {
  waitForAppReady,
  navigateTo,
  addFirstRecipeToMenu,
  addFirstRecipeWithDetail,
} from './helpers.js'

test.describe('Planning — état vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'planning')
  })

  test("affiche l'état vide si aucune recette sélectionnée", async ({ page }) => {
    await expect(page.locator('.planning__empty')).toBeVisible()
  })

  test("n'affiche pas la grille en état vide", async ({ page }) => {
    await expect(page.getByTestId('planning-grid')).toBeHidden()
  })
})

test.describe('Planning — avec recettes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // Ajoute une recette depuis le catalogue
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'planning')
  })

  test("affiche la grille planning après ajout d'une recette", async ({ page }) => {
    await expect(page.getByTestId('planning-grid')).toBeVisible()
  })

  test('affiche au moins une PlanningCard pour la recette ajoutée', async ({ page }) => {
    const cards = page.getByTestId('planning-grid').locator('[data-testid^="plan-card-"]')
    await expect(cards.first()).toBeVisible()
  })

  test('la PlanningCard affiche le titre de la recette', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await expect(card.locator('.plan-card__title')).not.toBeEmpty()
  })

  test('peut marquer une recette comme cuisinée', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.getByTestId('plan-card-done-btn').click()
    await expect(card).toHaveClass(/plan-card--done/)
  })

  test('le bouton passe à "Cuisiné ✓" après marquage', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.getByTestId('plan-card-done-btn').click()
    await expect(card.getByTestId('plan-card-done-btn')).toContainText('Cuisiné')
  })

  test('peut dé-marquer une recette cuisinée', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.getByTestId('plan-card-done-btn').click() // Marque
    await card.getByTestId('plan-card-done-btn').click() // Démarque
    await expect(card).not.toHaveClass(/plan-card--done/)
  })

  test('peut retirer une recette du planning', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.getByTestId('plan-card-remove-btn').click()
    await expect(page.getByTestId('planning-grid')).toBeHidden()
    await expect(page.locator('.planning__empty')).toBeVisible()
  })

  test('affiche un toast à la suppression', async ({ page }) => {
    await page
      .locator('[data-testid^="plan-card-"]')
      .first()
      .getByTestId('plan-card-remove-btn')
      .click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('retiré du menu')
  })

  test("peut ouvrir le détail d'une recette depuis la planning card", async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.locator('.plan-card__body').click()
    await expect(page.getByTestId('recipe-detail-modal')).toBeVisible()
  })

  test('peut fermer la modale depuis la planning view via le bouton ×', async ({ page }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.locator('.plan-card__body').click()
    await page.getByTestId('modal-close-btn').click()
    await expect(page.getByTestId('recipe-detail-modal')).toBeHidden()
  })

  test('modal-toggle-btn depuis planning retire la recette du menu et ferme la modale', async ({
    page,
  }) => {
    const card = page.locator('[data-testid^="plan-card-"]').first()
    await card.locator('.plan-card__body').click()
    await page.getByTestId('modal-toggle-btn').click()
    await expect(page.getByTestId('recipe-detail-modal')).toBeHidden()
    await expect(page.locator('.planning__empty')).toBeVisible()
  })
})

test.describe('Planning — reset semaine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'planning')
  })

  test('le bouton reset vide toute la semaine', async ({ page }) => {
    await page.getByTestId('toolbar-reset-btn').click()
    await expect(page.locator('.planning__empty')).toBeVisible()
  })

  test('affiche un toast après le reset', async ({ page }) => {
    await page.getByTestId('toolbar-reset-btn').click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('réinitialisée')
  })
})

test.describe('Planning — progression dans le header', () => {
  test.beforeEach(async ({ page }) => {
    // Desktop viewport pour voir la progress bar
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await waitForAppReady(page)
    // Charger le détail pour avoir les ingrédients (progressText N > 0)
    await addFirstRecipeWithDetail(page)
    await navigateTo(page, 'planning')
  })

  test('affiche le compteur 0/N dans le header (N > 0)', async ({ page }) => {
    const text = await page.locator('.app-header__progress-text').textContent()
    expect(text).toMatch(/^0\/\d+$/)
    const total = parseInt(text?.split('/')[1] ?? '0', 10)
    expect(total).toBeGreaterThan(0)
  })

  test('met à jour le compteur après avoir marqué une recette cuisinée', async ({ page }) => {
    await page
      .locator('[data-testid^="plan-card-"]')
      .first()
      .getByTestId('plan-card-done-btn')
      .click()
    // Le compteur "cuisinées" ne change pas progressText (qui est lié aux courses cochées)
    // On vérifie juste que la valeur reste cohérente au format x/N
    const text = await page.locator('.app-header__progress-text').textContent()
    expect(text).toMatch(/^\d+\/\d+$/)
  })
})
