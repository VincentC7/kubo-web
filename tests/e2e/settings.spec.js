/**
 * settings.spec.js — Tests de la vue paramètres
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe('Paramètres — affichage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'settings')
  })

  test('affiche la vue paramètres', async ({ page }) => {
    await expect(page.getByTestId('settings-view')).toBeVisible()
  })

  test('affiche le toggle dark mode', async ({ page }) => {
    await expect(page.getByTestId('darkmode-toggle')).toBeVisible()
  })

  test('affiche le bouton Sauvegarder', async ({ page }) => {
    await expect(page.getByTestId('settings-save-btn')).toBeVisible()
  })

  test('affiche le toggle du module Inventaire', async ({ page }) => {
    await expect(page.getByTestId('inventory-toggle')).toBeVisible()
  })

  test('affiche le toggle du module Courses', async ({ page }) => {
    await expect(page.getByTestId('groceries-toggle')).toBeVisible()
  })

  test('affiche le stepper de portions', async ({ page }) => {
    await expect(page.getByTestId('portions-value')).toBeVisible()
    await expect(page.getByTestId('portions-value')).toContainText('2')
  })

  test('affiche le stepper de repas/semaine', async ({ page }) => {
    await expect(page.getByTestId('meals-goal-value')).toBeVisible()
    await expect(page.getByTestId('meals-goal-value')).toContainText('5')
  })
})

test.describe('Paramètres — dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'settings')
  })

  test('active le dark mode en cliquant sur le toggle', async ({ page }) => {
    const toggle = page.getByTestId('darkmode-toggle')
    await toggle.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('désactive le dark mode en recliquant', async ({ page }) => {
    const toggle = page.getByTestId('darkmode-toggle')
    await toggle.click() // Active
    await toggle.click() // Désactive
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test("le toggle reflète l'état aria-checked", async ({ page }) => {
    const toggle = page.getByTestId('darkmode-toggle')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('Paramètres — steppers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'settings')
  })

  test('peut incrémenter les portions', async ({ page }) => {
    const value = page.getByTestId('portions-value')
    await expect(value).toContainText('2')
    await value.locator('..').locator('button').last().click()
    await expect(value).toContainText('3')
  })

  test('peut décrémenter les portions (min 1)', async ({ page }) => {
    const value = page.getByTestId('portions-value')
    await value.locator('..').locator('button').first().click()
    await expect(value).toContainText('1')
    // Ne descend pas en dessous de 1
    await value.locator('..').locator('button').first().click()
    await expect(value).toContainText('1')
  })

  test('peut incrémenter les repas/semaine', async ({ page }) => {
    const value = page.getByTestId('meals-goal-value')
    await expect(value).toContainText('5')
    await value.locator('..').locator('button').last().click()
    await expect(value).toContainText('6')
  })

  test('peut décrémenter les repas/semaine (min 1)', async ({ page }) => {
    const value = page.getByTestId('meals-goal-value')
    // Décrémente de 5 à 1
    for (let i = 0; i < 4; i++) {
      await value.locator('..').locator('button').first().click()
    }
    await expect(value).toContainText('1')
    // Ne descend pas en dessous de 1
    await value.locator('..').locator('button').first().click()
    await expect(value).toContainText('1')
  })
})

test.describe('Paramètres — sauvegarde', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'settings')
  })

  test('affiche un toast après sauvegarde', async ({ page }) => {
    await page.getByTestId('settings-save-btn').click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('sauvegardé')
  })
})

test.describe('Paramètres — toggles modules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // S'assurer que les deux modules sont activés avant chaque test
    await navigateTo(page, 'settings')
    const invToggle = page.getByTestId('inventory-toggle')
    const invOn = (await invToggle.getAttribute('aria-checked')) === 'true'
    if (!invOn) await invToggle.click()
    const groToggle = page.getByTestId('groceries-toggle')
    const groOn = (await groToggle.getAttribute('aria-checked')) === 'true'
    if (!groOn) await groToggle.click()
    await page.getByTestId('settings-save-btn').click()
  })

  test('désactiver Inventaire + sauvegarder masque nav-inventory', async ({ page }) => {
    await navigateTo(page, 'settings')
    // Désactiver
    const toggle = page.getByTestId('inventory-toggle')
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('settings-save-btn').click()
    // Le lien inventaire doit disparaître de la sidebar
    await expect(page.getByTestId('nav-inventory')).not.toBeVisible()
  })

  test('désactiver Courses + sauvegarder masque nav-groceries', async ({ page }) => {
    await navigateTo(page, 'settings')
    const toggle = page.getByTestId('groceries-toggle')
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('settings-save-btn').click()
    await expect(page.getByTestId('nav-groceries')).not.toBeVisible()
  })

  test('réactiver Inventaire + sauvegarder reaffiche nav-inventory', async ({ page }) => {
    // D'abord désactiver
    await navigateTo(page, 'settings')
    await page.getByTestId('inventory-toggle').click()
    await page.getByTestId('settings-save-btn').click()
    await expect(page.getByTestId('nav-inventory')).not.toBeVisible()
    // Puis réactiver
    await navigateTo(page, 'settings')
    await page.getByTestId('inventory-toggle').click()
    await page.getByTestId('settings-save-btn').click()
    await expect(page.getByTestId('nav-inventory')).toBeVisible()
  })
})
