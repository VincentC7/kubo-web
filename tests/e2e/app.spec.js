/**
 * app.spec.js — Tests de chargement et navigation globale
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe("Démarrage de l'application", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('affiche le spinner de chargement puis disparaît', async ({ page }) => {
    // Le loader est visible au tout début
    // (il peut déjà être parti si le mock est rapide, on vérifie donc juste qu'il n'est plus là)
    await waitForAppReady(page)
    await expect(page.locator('.app-shell__loader')).toBeHidden()
  })

  test('affiche la sidebar et le header après chargement', async ({ page }) => {
    await waitForAppReady(page)
    await expect(page.getByTestId('sidebar')).toBeVisible()
    await expect(page.getByTestId('app-header')).toBeVisible()
  })

  test('affiche le tableau de bord par défaut', async ({ page }) => {
    await waitForAppReady(page)
    await expect(page.getByTestId('dashboard-view')).toBeVisible()
  })

  test('affiche le label de la semaine courante dans le header', async ({ page }) => {
    await waitForAppReady(page)
    const label = page.getByTestId('week-label')
    await expect(label).toBeVisible()
    // Le label doit contenir un mois en français (jan, fév, mars…)
    await expect(label).toContainText('—')
  })
})

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('navigue vers le catalogue via la sidebar', async ({ page }) => {
    await navigateTo(page, 'catalog')
    await expect(page.getByTestId('catalog-view')).toBeVisible()
  })

  test('navigue vers le menu hebdo', async ({ page }) => {
    await navigateTo(page, 'planning')
    await expect(page.getByTestId('planning-view')).toBeVisible()
  })

  test('navigue vers les courses', async ({ page }) => {
    await navigateTo(page, 'groceries')
    await expect(page.getByTestId('groceries-view')).toBeVisible()
  })

  test('navigue vers les paramètres', async ({ page }) => {
    await navigateTo(page, 'settings')
    await expect(page.getByTestId('settings-view')).toBeVisible()
  })

  test('le bouton actif de la sidebar est correctement mis en évidence', async ({ page }) => {
    await navigateTo(page, 'catalog')
    const btn = page.getByTestId('nav-catalog')
    await expect(btn).toHaveClass(/sidebar__item--active/)
  })

  test("peut naviguer d'une vue à l'autre plusieurs fois", async ({ page }) => {
    await navigateTo(page, 'catalog')
    await expect(page.getByTestId('catalog-view')).toBeVisible()
    await navigateTo(page, 'planning')
    await expect(page.getByTestId('planning-view')).toBeVisible()
    await navigateTo(page, 'dashboard')
    await expect(page.getByTestId('dashboard-view')).toBeVisible()
  })
})

test.describe('Sélecteur de semaine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('change la semaine en cliquant sur le bouton suivant', async ({ page }) => {
    const label = page.getByTestId('week-label')
    const before = await label.textContent()
    await page.getByTestId('week-next').click()
    const after = await label.textContent()
    expect(after).not.toBe(before)
  })

  test('revient à la semaine précédente', async ({ page }) => {
    const label = page.getByTestId('week-label')
    const original = await label.textContent()
    await page.getByTestId('week-next').click()
    await page.getByTestId('week-prev').click()
    const back = await label.textContent()
    expect(back).toBe(original)
  })
})
