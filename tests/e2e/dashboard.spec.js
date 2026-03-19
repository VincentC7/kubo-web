/**
 * dashboard.spec.js — Tests du tableau de bord nutritionnel
 */
import { test, expect } from '@playwright/test'
import {
  waitForAppReady,
  navigateTo,
  addFirstRecipeToMenu,
  addFirstRecipeWithDetail,
} from './helpers.js'

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
    // La progression indique 0 cochés / N ingrédients (N > 0 car détail chargé via addFirstRecipeWithDetail)
    // On vérifie le format "0/N" avec N > 0
    // Note : addFirstRecipeToMenu (sans détail) → N=0, on doit recharger avec détail
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeWithDetail(page)
    await navigateTo(page, 'dashboard')
    const text = await page.locator('.app-header__progress-text').textContent()
    expect(text).toMatch(/^0\/\d+$/)
    const total = parseInt(text?.split('/')[1] ?? '0', 10)
    expect(total).toBeGreaterThan(0)
  })

  test('affiche le prix total de la période', async ({ page }) => {
    await expect(page.getByTestId('dash-total-price')).toBeVisible()
    await expect(page.getByTestId('dash-total-price')).toContainText('€')
  })

  test('affiche le prix moyen par repas', async ({ page }) => {
    await expect(page.locator('.dashboard__stat-mini-value').first()).toContainText('€')
  })

  test('les boutons de mode vue sont affichés (semaine / mois / année)', async ({ page }) => {
    const btns = page.locator('.dashboard__view-btn')
    await expect(btns).toHaveCount(3)
  })

  test('peut basculer sur le mode mois', async ({ page }) => {
    await page.locator('.dashboard__view-btn').nth(1).click()
    await expect(page.locator('.dashboard__view-btn--active').nth(0)).toContainText('Mois')
  })

  test('peut basculer sur le mode année', async ({ page }) => {
    await page.locator('.dashboard__view-btn').nth(2).click()
    await expect(page.locator('.dashboard__view-btn--active').nth(0)).toContainText('Année')
  })

  test('affiche le graphique budget', async ({ page }) => {
    await expect(page.locator('.dashboard__budget-chart-wrap canvas')).toBeVisible()
  })
})
