/**
 * inventory.spec.js — Tests de la vue inventaire
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo, addFirstRecipeToMenu } from './helpers.js'

test.describe('Inventaire — état vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'inventory')
  })

  test('affiche la vue inventaire', async ({ page }) => {
    await expect(page.getByTestId('inventory-view')).toBeVisible()
  })

  test("affiche l'état vide sans ingrédients en stock", async ({ page }) => {
    await expect(page.locator('.inventory__empty')).toBeVisible()
  })

  test('affiche le compteur à 0', async ({ page }) => {
    await expect(page.getByTestId('inventory-count')).toContainText('0')
  })
})

test.describe('Inventaire — avec recettes planifiées', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'inventory')
  })

  test('affiche les ingrédients manquants', async ({ page }) => {
    await expect(page.locator('.inventory__item--missing').first()).toBeVisible()
  })

  test('peut ajouter un ingrédient manquant au stock', async ({ page }) => {
    const missingItem = page.locator('.inventory__item--missing').first()
    await missingItem.locator('button').click()
    // Le compteur doit augmenter
    await expect(page.getByTestId('inventory-count')).not.toContainText('0')
  })
})

test.describe('Inventaire — via les courses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await addFirstRecipeToMenu(page)
    // Cocher un ingrédient depuis les courses
    await navigateTo(page, 'groceries')
    const firstCheckbox = page.locator('.gg__checkbox').first()
    await firstCheckbox.check()
    await navigateTo(page, 'inventory')
  })

  test('les ingrédients cochés dans Courses apparaissent dans le stock', async ({ page }) => {
    await expect(page.getByTestId('inventory-count')).not.toContainText('0')
  })

  test('peut retirer un ingrédient du stock', async ({ page }) => {
    const removeBtn = page.locator('.inventory__item-remove').first()
    await removeBtn.click()
    await expect(page.locator('.toast')).toBeVisible()
    await expect(page.locator('.toast')).toContainText('retiré')
  })
})
