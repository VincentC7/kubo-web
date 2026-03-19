/**
 * groceries.spec.js — Tests de la vue liste de courses
 */
import { test, expect } from '@playwright/test'
import {
  waitForAppReady,
  navigateTo,
  addFirstRecipeToMenu,
  addFirstRecipeWithDetail,
} from './helpers.js'

test.describe('Courses — état vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateTo(page, 'groceries')
  })

  test("affiche l'état vide sans recettes planifiées", async ({ page }) => {
    await expect(page.locator('.groceries__empty')).toBeVisible()
  })

  test("l'état vide contient un message d'information", async ({ page }) => {
    await expect(page.locator('.groceries__empty')).toContainText('Planifiez des repas')
  })
})

test.describe('Courses — avec recettes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // Charger le détail pour avoir les ingrédients disponibles dans les courses
    await addFirstRecipeWithDetail(page)
    await navigateTo(page, 'groceries')
  })

  test("affiche la liste de courses après ajout d'une recette", async ({ page }) => {
    await expect(page.locator('.groceries__list')).toBeVisible()
  })

  test("affiche au moins un groupe d'ingrédients", async ({ page }) => {
    await expect(page.locator('.gg')).toHaveCount(1)
  })

  test('chaque groupe affiche le titre de la recette', async ({ page }) => {
    const group = page.locator('.gg').first()
    await expect(group.locator('.gg__title')).not.toBeEmpty()
  })

  test('affiche les ingrédients de la recette', async ({ page }) => {
    const items = page.locator('.gg label')
    await expect(items.first()).toBeVisible()
  })

  test('affiche le prix total des courses', async ({ page }) => {
    await expect(page.getByTestId('groceries-total-price')).toBeVisible()
    await expect(page.getByTestId('groceries-total-price')).toContainText('€')
  })

  test("cocher un ingrédient met à jour le stock dans l'inventaire", async ({ page }) => {
    const firstCheckbox = page.locator('.gg__checkbox').first()
    await firstCheckbox.check()
    await navigateTo(page, 'inventory')
    await expect(page.getByTestId('inventory-count')).not.toContainText('0')
  })

  test('tout cocher via le bouton "Tout cocher" ajoute tous les ingrédients au stock', async ({
    page,
  }) => {
    // Clic sur le bouton "Tout cocher" du premier groupe
    const toggleAllBtn = page.locator('.gg').first().locator('button').first()
    await toggleAllBtn.click()
    await navigateTo(page, 'inventory')
    await expect(page.getByTestId('inventory-count')).not.toContainText('0')
  })
})
