/**
 * planning.spec.js — Tests du menu hebdomadaire
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo, addFirstRecipeToMenu } from './helpers.js'

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

  test('affiche une PlanningCard pour la recette ajoutée', async ({ page }) => {
    const cards = page.getByTestId('planning-grid').locator('[data-testid^="plan-card-"]')
    await expect(cards).toHaveCount(1)
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
})

test.describe('Planning — reset semaine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'planning')
  })

  test('le bouton reset vide toute la semaine', async ({ page }) => {
    await page.getByTestId('planning-reset-btn').click()
    await expect(page.locator('.planning__empty')).toBeVisible()
  })

  test('affiche un toast après le reset', async ({ page }) => {
    await page.getByTestId('planning-reset-btn').click()
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
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'planning')
  })

  test('affiche le compteur 0/1 dans le header', async ({ page }) => {
    await expect(page.locator('.app-header__progress-text')).toContainText('0/1')
  })

  test('met à jour le compteur à 1/1 après marquage', async ({ page }) => {
    await page
      .locator('[data-testid^="plan-card-"]')
      .first()
      .getByTestId('plan-card-done-btn')
      .click()
    await expect(page.locator('.app-header__progress-text')).toContainText('1/1')
  })
})
