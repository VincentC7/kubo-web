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

  test('affiche le champ Pseudo pré-rempli avec le nom utilisateur', async ({ page }) => {
    // Le mock retourne "Jean Dupont"
    await expect(
      page.locator('label', { hasText: 'Pseudo' }).locator('..').locator('input'),
    ).toHaveValue('Jean Dupont')
  })

  test('affiche le champ Objectif Calories pré-rempli', async ({ page }) => {
    await expect(
      page.locator('label', { hasText: 'Objectif Calories' }).locator('..').locator('input'),
    ).toHaveValue('2000')
  })

  test('affiche le toggle dark mode', async ({ page }) => {
    await expect(page.getByTestId('darkmode-toggle')).toBeVisible()
  })

  test('affiche le bouton Sauvegarder', async ({ page }) => {
    await expect(page.getByTestId('settings-save-btn')).toBeVisible()
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

test.describe('Paramètres — sauvegarde du profil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'settings')
  })

  test('peut modifier le pseudo et sauvegarder', async ({ page }) => {
    const nameInput = page.locator('label', { hasText: 'Pseudo' }).locator('..').locator('input')
    await nameInput.fill('Marie Dupont')
    await page.getByTestId('settings-save-btn').click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('sauvegardé')
  })

  test("peut modifier l'objectif calories", async ({ page }) => {
    const kcalInput = page
      .locator('label', { hasText: 'Objectif Calories' })
      .locator('..')
      .locator('input')
    await kcalInput.fill('1800')
    await page.getByTestId('settings-save-btn').click()
    await expect(page.locator('.toast')).toBeVisible()
  })

  test('le bouton Sauvegarder affiche un loader pendant la sauvegarde', async ({ page }) => {
    const saveBtn = page.getByTestId('settings-save-btn')
    // Déclenche la sauvegarde et vérifie immédiatement l'état loading
    await saveBtn.click()
    // Le spinner apparaît brièvement (mock ~400ms)
    await expect(saveBtn.locator('.kubo-btn__spinner')).toBeVisible()
    // Puis disparaît
    await expect(saveBtn.locator('.kubo-btn__spinner')).toBeHidden({ timeout: 2000 })
  })
})
