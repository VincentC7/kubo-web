/**
 * dashboard.spec.js — Tests du tableau de bord nutritionnel
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo, addFirstRecipeToMenu } from './helpers.js'

test.describe('Dashboard — etat vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test("affiche l'etat vide quand aucune recette planifiee", async ({ page }) => {
    await expect(page.locator('.dashboard__empty')).toBeVisible()
  })

  test('affiche le CTA pour aller vers le catalogue', async ({ page }) => {
    await expect(page.locator('.dashboard__empty')).toContainText('Parcourir les recettes')
  })

  test('le CTA redirige vers le catalogue', async ({ page }) => {
    await page.locator('.dashboard__empty button', { hasText: 'Parcourir les recettes' }).click()
    await expect(page.getByTestId('catalog-view')).toBeVisible()
  })
})

test.describe('Dashboard — avec recettes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'dashboard')
  })

  test("n'affiche plus l'etat vide", async ({ page }) => {
    await expect(page.locator('.dashboard__empty')).toBeHidden()
  })

  test('affiche le graphique doughnut', async ({ page }) => {
    await expect(page.locator('.dashboard__chart-wrap canvas')).toBeVisible()
  })

  test('affiche les 3 indicateurs nutritionnels (proteines, lipides, glucides)', async ({
    page,
  }) => {
    await expect(page.locator('.nli')).toHaveCount(3)
  })

  test('affiche la liste des recettes selectionnees', async ({ page }) => {
    await expect(page.locator('.dashboard__dish-item').first()).toBeVisible()
  })

  test('la barre de progression dans le header reflete les recettes cuisinees', async ({
    page,
  }) => {
    await expect(page.locator('.app-header__progress-text')).toContainText('0/5')
  })
})
