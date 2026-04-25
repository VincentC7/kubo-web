/**
 * profile.spec.js — Tests E2E de la vue profil
 *
 * Prérequis : un compte de test doit exister côté API.
 * Configurer les variables d'environnement :
 *   TEST_USER_EMAIL    — email d'un compte existant
 *   TEST_USER_PASSWORD — mot de passe associé
 */
import { test, expect } from '@playwright/test'
import { waitForAppReady, loginAs } from './helpers.js'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'user@kubo.dev'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Password1'

test.describe('Profil — accès', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('clic sur le bloc user ouvre la vue profil', async ({ page }) => {
    await page.locator('.sidebar__user').click()
    await expect(page.locator('.profile-view')).toBeVisible()
  })

  test("affiche l'email de l'utilisateur", async ({ page }) => {
    await page.locator('.sidebar__user').click()
    await expect(page.locator('.profile-identity__email')).toContainText(TEST_EMAIL)
  })

  test('affiche le badge de rôle', async ({ page }) => {
    await page.locator('.sidebar__user').click()
    await expect(page.locator('.profile-role-badge')).toBeVisible()
  })

  test("affiche l'avatar avec les initiales", async ({ page }) => {
    await page.locator('.sidebar__user').click()
    await expect(page.locator('.profile-avatar')).toBeVisible()
    const text = await page.locator('.profile-avatar').textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })
})

test.describe('Profil — formulaire informations personnelles', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.locator('.sidebar__user').click()
  })

  test('affiche les champs prénom et nom', async ({ page }) => {
    await expect(page.locator('#edit-firstname')).toBeVisible()
    await expect(page.locator('#edit-lastname')).toBeVisible()
  })

  test('erreur si prénom vidé avant soumission', async ({ page }) => {
    await page.locator('#edit-firstname').clear()
    await page.locator('#edit-lastname').fill('Dupont')
    await page.locator('.profile-save-btn').first().click()
    await expect(page.locator('.profile-field__error').first()).toBeVisible()
  })

  test('erreur si nom vidé avant soumission', async ({ page }) => {
    await page.locator('#edit-firstname').fill('Jean')
    await page.locator('#edit-lastname').clear()
    await page.locator('.profile-save-btn').first().click()
    await expect(page.locator('.profile-field__error').first()).toBeVisible()
  })

  test('sauvegarde réussie — affiche le message de succès', async ({ page }) => {
    await page.locator('#edit-firstname').fill('Jean')
    await page.locator('#edit-lastname').fill('Dupont')
    await page.locator('.profile-save-btn').first().click()
    await expect(page.locator('.profile-feedback--success').first()).toBeVisible({ timeout: 8_000 })
  })

  test("sauvegarde réussie — le nom s'affiche dans la sidebar", async ({ page }) => {
    await page.locator('#edit-firstname').fill('Jean')
    await page.locator('#edit-lastname').fill('Dupont')
    await page.locator('.profile-save-btn').first().click()
    await page.locator('.profile-feedback--success').first().waitFor({ timeout: 8_000 })
    await expect(page.locator('.sidebar__user-name')).toContainText('Jean')
  })
})

test.describe('Profil — changement de mot de passe', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.locator('.sidebar__user').click()
  })

  test('affiche les champs mot de passe actuel, nouveau et confirmation', async ({ page }) => {
    await expect(page.locator('#current-pwd')).toBeVisible()
    await expect(page.locator('#new-pwd')).toBeVisible()
    await expect(page.locator('#confirm-pwd')).toBeVisible()
  })

  test('erreur si mot de passe actuel vide', async ({ page }) => {
    await page.locator('#new-pwd').fill('Nouveau1234!')
    await page.locator('#confirm-pwd').fill('Nouveau1234!')
    await page.locator('.profile-save-btn').last().click()
    await expect(page.locator('.profile-field__error').last()).toBeVisible()
  })

  test('erreur si nouveau MDP invalide (trop court)', async ({ page }) => {
    await page.locator('#current-pwd').fill(TEST_PASSWORD)
    await page.locator('#new-pwd').fill('abc')
    await page.locator('#confirm-pwd').fill('abc')
    await page.locator('.profile-save-btn').last().click()
    await expect(page.locator('.profile-field__error')).toBeVisible()
  })

  test('erreur si les nouveaux MDP ne correspondent pas', async ({ page }) => {
    await page.locator('#current-pwd').fill(TEST_PASSWORD)
    await page.locator('#new-pwd').fill('Nouveau1234!')
    await page.locator('#confirm-pwd').fill('Different5678!')
    await page.locator('.profile-save-btn').last().click()
    await expect(page.locator('.profile-field__error')).toContainText('correspondent pas')
  })

  test('erreur API si mot de passe actuel incorrect', async ({ page }) => {
    await page.locator('#current-pwd').fill('MauvaisMotDePasse1!')
    await page.locator('#new-pwd').fill('Nouveau1234!')
    await page.locator('#confirm-pwd').fill('Nouveau1234!')
    await page.locator('.profile-save-btn').last().click()
    await expect(page.locator('.profile-field__error')).toContainText('incorrect', {
      timeout: 8_000,
    })
  })

  test('indicateurs de règles apparaissent à la saisie du nouveau MDP', async ({ page }) => {
    await page.locator('#new-pwd').fill('test')
    await expect(page.locator('.pwd-rules')).toBeVisible()
  })

  test('toggle affichage mot de passe actuel', async ({ page }) => {
    await page.locator('#current-pwd').fill('secret')
    await expect(page.locator('#current-pwd')).toHaveAttribute('type', 'password')
    // Le bouton œil est le premier .profile-field__eye de la section MDP
    await page.locator('#current-pwd').locator('..').locator('.profile-field__eye').click()
    await expect(page.locator('#current-pwd')).toHaveAttribute('type', 'text')
  })
})

test.describe('Profil — déconnexion', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.locator('.sidebar__user').click()
  })

  test('bouton déconnexion est visible', async ({ page }) => {
    await expect(page.locator('.profile-logout')).toBeVisible()
  })

  test('déconnexion ramène au catalogue avec le bouton Se connecter', async ({ page }) => {
    await page.locator('.profile-logout').click()
    await expect(page.locator('.sidebar__login-btn')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('.sidebar__user')).not.toBeVisible()
  })
})
