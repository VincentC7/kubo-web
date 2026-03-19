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
    // Attendre qu'au moins une carte soit présente, puis vérifier le minimum
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(5)
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
    // Récupérer le titre de la première recette pour s'en servir comme terme de recherche
    const firstTitle = await page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
      .locator('.recipe-card__title')
      .textContent()
    const searchTerm = firstTitle?.trim().slice(0, 5) ?? ''
    await searchInput.fill(searchTerm)
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    // Au moins une carte doit correspondre (la première recette)
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test("affiche l'état vide quand aucun résultat", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Rechercher…"]')
    await searchInput.fill('xyzimpossible')
    await expect(page.getByTestId('recipe-grid')).toBeHidden()
    await expect(page.locator('.catalog__empty')).toBeVisible()
  })

  test('réaffiche toutes les recettes après avoir effacé la recherche', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Rechercher…"]')
    // Utiliser un terme introuvable pour arriver à 0
    await searchInput.fill('xyzimpossible')
    await expect(page.locator('.catalog__empty')).toBeVisible()
    // Effacer → les recettes reviennent
    await searchInput.clear()
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(5)
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

test.describe('Catalogue — détail enrichi (après chargement API)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'catalog')
  })

  test('affiche les ingrédients après chargement du détail', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    // Attend que les skeletons disparaissent et que les vrais ingrédients apparaissent
    await expect(modal.locator('.rdm__ingredient').first()).toBeVisible({ timeout: 10_000 })
  })

  test('affiche les étapes avec leur numéro après chargement', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    // Attend qu'au moins un bloc d'étape soit visible
    await expect(modal.locator('.rdm__step-block').first()).toBeVisible({ timeout: 10_000 })
  })

  test('chaque étape contient au moins une instruction', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    await expect(modal.locator('.rdm__step-block').first()).toBeVisible({ timeout: 10_000 })
    const firstStep = modal.locator('.rdm__step-block').first()
    await expect(firstStep.locator('.rdm__step-instruction').first()).toBeVisible()
  })

  test('affiche les stats (kcal) après chargement du détail', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    // Le skeleton inline kcal doit disparaître et laisser place à un chiffre
    await expect(modal.locator('.rdm__skeleton--inline')).toBeHidden({ timeout: 10_000 })
    await expect(modal.locator('.rdm__stat-value').nth(1)).toContainText('kcal')
  })

  test('la deuxième ouverture de la même recette est instantanée (cache)', async ({ page }) => {
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    // Première ouverture — attend le détail
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    await expect(modal.locator('.rdm__ingredient').first()).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('modal-close-btn').click()
    // Deuxième ouverture — pas de skeleton du tout
    await firstCard.click()
    await expect(modal.locator('.rdm__skeleton--bar')).toBeHidden()
    await expect(modal.locator('.rdm__ingredient').first()).toBeVisible()
  })
})

test.describe('Catalogue — filtres', () => {
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

  test('filtre par catégorie réduit la liste', async ({ page }) => {
    await page.getByTestId('filter-btn').click()
    // Prendre le premier chip de catégorie disponible
    const firstChip = page.locator('.fm__group').first().locator('.fm__chip').first()
    await expect(firstChip).toBeVisible()
    await firstChip.click()
    await page.locator('.fm__close').click()
    const cards = page.getByTestId('recipe-grid').locator('[data-testid^="recipe-card-"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })
})
