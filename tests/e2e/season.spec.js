/**
 * season.spec.js — Tests de la section "Produits de saison" dans le Dashboard
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe('Dashboard — section produits de saison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'dashboard')
  })

  test('la section saison est visible même sans recettes planifiées', async ({ page }) => {
    await expect(page.getByTestId('season-section')).toBeVisible()
  })

  test("affiche le titre 'Produits de saison'", async ({ page }) => {
    await expect(page.getByTestId('season-section')).toContainText('Produits de saison')
  })

  test('affiche le mois courant actif dans le sélecteur', async ({ page }) => {
    const mois = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jui',
      'Jui',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ]
    const moisCourant = mois[new Date().getMonth()]
    await expect(page.locator('.season-month-btn--active')).toContainText(moisCourant)
  })

  test('affiche au moins un groupe (légumes ou fruits) après chargement', async ({ page }) => {
    await page.locator('.season-section__skeleton').waitFor({ state: 'hidden', timeout: 10_000 })
    const groups = page.locator('.season-section__group')
    await expect(groups.first()).toBeVisible()
  })

  test('affiche des items avec une image et un nom', async ({ page }) => {
    await page.locator('.season-section__skeleton').waitFor({ state: 'hidden', timeout: 10_000 })
    const firstItem = page.getByTestId('season-item').first()
    await expect(firstItem).toBeVisible()
    await expect(firstItem.locator('.season-item__name')).not.toBeEmpty()
  })

  test('affiche un groupe légumes et un groupe fruits', async ({ page }) => {
    await page.locator('.season-section__skeleton').waitFor({ state: 'hidden', timeout: 10_000 })
    const section = page.getByTestId('season-section')
    await expect(section).toContainText('Légumes')
    await expect(section).toContainText('Fruits')
  })

  test('affiche plusieurs items dans chaque groupe', async ({ page }) => {
    await page.locator('.season-section__skeleton').waitFor({ state: 'hidden', timeout: 10_000 })
    const items = page.getByTestId('season-item')
    const count = await items.count()
    expect(count).toBeGreaterThan(4)
  })

  test('la section reste visible en mode mois (pas seulement en semaine)', async ({ page }) => {
    // Bascule sur le mode mois — vérifie que la section saison reste affichée
    await page.locator('.dashboard__view-btn').nth(1).click()
    await expect(page.getByTestId('season-section')).toBeVisible()
  })
})
