/**
 * groceries.spec.js — Tests de la vue liste de courses
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo, addFirstRecipeToMenu } from './helpers.js'

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
    await addFirstRecipeToMenu(page)
    await navigateTo(page, 'groceries')
  })

  test("affiche la liste de courses après ajout d'une recette", async ({ page }) => {
    await expect(page.locator('.groceries__card')).toBeVisible()
  })

  test("affiche au moins un groupe d'ingrédients", async ({ page }) => {
    await expect(page.locator('.gg')).toHaveCount(1)
  })

  test('chaque groupe affiche le titre de la recette', async ({ page }) => {
    const group = page.locator('.gg').first()
    await expect(group.locator('.gg__title')).not.toBeEmpty()
  })

  test('affiche les ingrédients de la recette', async ({ page }) => {
    // Les classes sont scopées par Vue — on cible les labels dans la grille
    const items = page.locator('.gg__grid label')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})
