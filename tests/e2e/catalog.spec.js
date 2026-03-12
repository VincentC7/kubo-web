/**
 * catalog.spec.js — Tests du catalogue de recettes
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe('Catalogue — affichage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('affiche la grille de recettes', async ({ page }) => {
    await expect(page.getByTestId('recipe-grid')).toBeVisible()
  })

  test('affiche au moins 5 recettes', async ({ page }) => {
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    await expect(cards).toHaveCount(10) // 10 recettes dans les mocks
  })

  test('chaque carte affiche un titre, un temps et un prix', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await expect(firstCard.locator('.recipe-card__title')).not.toBeEmpty()
    await expect(firstCard.locator('.recipe-card__meta')).toContainText('m') // xx m (minutes)
    await expect(firstCard.locator('.recipe-card__meta')).toContainText('€') // xx.xx€ (prix)
  })

  test('affiche le bouton Filtrer', async ({ page }) => {
    await expect(page.getByTestId('filter-btn')).toBeVisible()
  })
})

test.describe('Catalogue — recherche', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('filtre les recettes en tapant dans la recherche', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Rechercher…"]')
    await searchInput.fill('curry')
    await expect(
      page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]'),
    ).toHaveCount(1)
    await expect(page.getByTestId('recipe-grid')).toContainText('Curry')
  })

  test("affiche l'état vide quand aucun résultat", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Rechercher…"]')
    await searchInput.fill('xyzimpossible')
    await expect(page.getByTestId('recipe-grid')).toBeHidden()
    await expect(page.locator('.catalog__empty')).toBeVisible()
  })

  test('réaffiche toutes les recettes après avoir effacé la recherche', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Rechercher…"]')
    await searchInput.fill('curry')
    await searchInput.clear()
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    await expect(cards).toHaveCount(10)
  })
})

test.describe('Catalogue — modale de détail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('ouvre la modale au clic sur une carte', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    await expect(page.getByTestId('recipe-detail-modal')).toBeVisible()
  })

  test('la modale affiche le titre de la recette', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    const title = await firstCard.locator('.recipe-card__title').textContent()
    await firstCard.click()
    await expect(page.getByTestId('recipe-detail-modal')).toContainText(title?.trim() ?? '')
  })

  test('la modale affiche les ingrédients et les étapes', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    await expect(modal.locator('.rdm__section')).toHaveCount(2) // Ingrédients + Préparation
  })

  test('ferme la modale avec le bouton ×', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    await page.getByTestId('modal-close-btn').click()
    await expect(page.getByTestId('recipe-detail-modal')).toBeHidden()
  })

  test("ferme la modale en cliquant sur l'overlay", async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    // Clic sur l'overlay (coin haut-gauche, hors de la modale)
    await page.getByTestId('recipe-detail-modal').click({ position: { x: 10, y: 10 } })
    await expect(page.getByTestId('recipe-detail-modal')).toBeHidden()
  })
})

test.describe('Catalogue — ajout au menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('ajoute une recette au menu via le bouton + de la carte', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    const toggleBtn = firstCard.getByTestId('recipe-toggle-btn')
    await toggleBtn.click()
    // La carte doit avoir la classe --selected
    await expect(firstCard).toHaveClass(/recipe-card--selected/)
  })

  test('affiche un toast de confirmation après ajout', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.getByTestId('recipe-toggle-btn').click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('ajouté au menu')
  })

  test('désélectionne la recette en recliquant sur le bouton', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    const toggleBtn = firstCard.getByTestId('recipe-toggle-btn')
    await toggleBtn.click() // Ajoute
    await toggleBtn.click() // Retire
    await expect(firstCard).not.toHaveClass(/recipe-card--selected/)
  })

  test('ajoute depuis la modale et ferme celle-ci', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click() // Ouvre la modale
    await page.getByTestId('modal-toggle-btn').click() // Ajoute et ferme
    await expect(page.getByTestId('recipe-detail-modal')).toBeHidden()
    // La carte doit être sélectionnée
    await expect(firstCard).toHaveClass(/recipe-card--selected/)
  })
})

test.describe('Catalogue — panneau filtres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('ouvre le panneau filtres', async ({ page }) => {
    await page.getByTestId('filter-btn').click()
    await expect(page.locator('.fm')).toBeVisible()
  })

  test('ferme le panneau filtres', async ({ page }) => {
    await page.getByTestId('filter-btn').click()
    await page.locator('.fm__close').click()
    await expect(page.locator('.fm')).toBeHidden()
  })

  test('filtre par categorie Express', async ({ page }) => {
    await page.getByTestId('filter-btn').click()
    // Cibler uniquement le chip du groupe "Catégorie" (premier fm__group)
    await page.locator('.fm__group').first().locator('.fm__chip', { hasText: 'Express' }).click()
    await page.locator('.fm__close').click()
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(10)
  })
})
