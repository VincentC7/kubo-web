/**
 * header.spec.js — Tests de l'en-tête applicatif
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe('Header — affichage et masquage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche le header sur la vue dashboard', async ({ page }) => {
    await expect(page.getByTestId('app-header')).toBeVisible()
  })

  test('affiche le header sur la vue catalog', async ({ page }) => {
    await navigateTo(page, 'catalog')
    await expect(page.getByTestId('app-header')).toBeVisible()
  })

  test('masque le header sur la vue settings', async ({ page }) => {
    await navigateTo(page, 'settings')
    await expect(page.getByTestId('app-header')).not.toBeVisible()
  })

  test('affiche le sélecteur de période', async ({ page }) => {
    await expect(page.getByTestId('week-selector')).toBeVisible()
    await expect(page.getByTestId('week-label')).not.toBeEmpty()
  })

  test('les boutons prev/next de période sont présents', async ({ page }) => {
    await expect(page.getByTestId('week-prev')).toBeVisible()
    await expect(page.getByTestId('week-next')).toBeVisible()
  })
})

test.describe('Header — progression des courses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche la progression courses au format x/y', async ({ page }) => {
    // Par défaut, aucune recette au menu → 0/0
    const progressText = page.locator('.app-header__progress-text')
    await expect(progressText).toBeVisible()
    await expect(progressText).toContainText('/')
  })

  test('la progression se met à jour quand une recette est ajoutée au menu', async ({ page }) => {
    // 1. Ouvrir la modale pour déclencher fetchDetail (charge les ingrédients)
    await navigateTo(page, 'catalog')
    const firstCard = page
      .getByTestId('recipe-grid')
      .locator('[data-testid^="recipe-card-"]')
      .first()
    await firstCard.click()
    const modal = page.getByTestId('recipe-detail-modal')
    // Attendre que les ingrédients soient chargés
    await expect(modal.locator('.rdm__ingredient').first()).toBeVisible({ timeout: 10_000 })
    // 2. Ajouter la recette via le bouton de la modale
    await page.getByTestId('modal-toggle-btn').click()
    // 3. Naviguer ailleurs et vérifier la progression
    await navigateTo(page, 'dashboard')
    const progressText = await page.locator('.app-header__progress-text').textContent()
    const total = parseInt(progressText?.split('/')[1] ?? '0', 10)
    expect(total).toBeGreaterThan(0)
  })
})

test.describe('Header — sélecteur de période', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('avancer la période change le label', async ({ page }) => {
    const labelBefore = await page.getByTestId('week-label').textContent()
    await page.getByTestId('week-next').click()
    const labelAfter = await page.getByTestId('week-label').textContent()
    expect(labelAfter).not.toBe(labelBefore)
  })

  test('reculer la période change le label', async ({ page }) => {
    const labelBefore = await page.getByTestId('week-label').textContent()
    await page.getByTestId('week-prev').click()
    const labelAfter = await page.getByTestId('week-label').textContent()
    expect(labelAfter).not.toBe(labelBefore)
  })
})
