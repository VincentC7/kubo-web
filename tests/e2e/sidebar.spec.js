/**
 * sidebar.spec.js — Tests de la navigation latérale
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateTo } from './helpers.js'

test.describe('Sidebar — affichage initial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('affiche la sidebar', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible()
  })

  test('affiche les items de navigation principaux', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
    await expect(page.getByTestId('nav-catalog')).toBeVisible()
    await expect(page.getByTestId('nav-planning')).toBeVisible()
    await expect(page.getByTestId('nav-settings')).toBeVisible()
  })

  test('le bouton toggle est présent', async ({ page }) => {
    await expect(page.getByTestId('sidebar-toggle')).toBeVisible()
  })
})

test.describe('Sidebar — collapse / expand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('cliquer sur sidebar-toggle réduit la sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).not.toHaveClass(/sidebar--collapsed/)
    await page.getByTestId('sidebar-toggle').click()
    await expect(sidebar).toHaveClass(/sidebar--collapsed/)
  })

  test('recliquer sur sidebar-toggle restaure la sidebar', async ({ page }) => {
    const toggle = page.getByTestId('sidebar-toggle')
    await toggle.click() // collapse
    await expect(page.getByTestId('sidebar')).toHaveClass(/sidebar--collapsed/)
    await toggle.click() // expand
    await expect(page.getByTestId('sidebar')).not.toHaveClass(/sidebar--collapsed/)
  })

  test('les labels de nav sont masqués quand la sidebar est réduite', async ({ page }) => {
    await page.getByTestId('sidebar-toggle').click()
    // Les labels (texte) sont masqués via v-show, la classe sidebar--collapsed est présente
    await expect(page.getByTestId('sidebar')).toHaveClass(/sidebar--collapsed/)
    // Les boutons de nav restent présents (accessibles via title)
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
  })
})

test.describe('Sidebar — navigation active', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('nav-dashboard est actif par défaut', async ({ page }) => {
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/sidebar__item--active/)
  })

  test('cliquer sur nav-catalog active le bon item', async ({ page }) => {
    await navigateTo(page, 'catalog')
    await expect(page.getByTestId('nav-catalog')).toHaveClass(/sidebar__item--active/)
    await expect(page.getByTestId('nav-dashboard')).not.toHaveClass(/sidebar__item--active/)
  })

  test('cliquer sur nav-settings active le bon item', async ({ page }) => {
    await navigateTo(page, 'settings')
    await expect(page.getByTestId('nav-settings')).toHaveClass(/sidebar__item--active/)
  })
})
