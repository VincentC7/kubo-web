import { describe, it, expect } from 'vitest'
import { can } from '@/services/featureAccessService'
import type { Feature } from '@/services/featureAccessService'
import type { UserRole } from '@/types/auth'

describe('featureAccessService — can()', () => {
  // ── Visiteur ────────────────────────────────────────────────────────────────

  describe('rôle visitor', () => {
    it('peut accéder au catalogue', () => {
      expect(can('visitor', 'view:catalog')).toBe(true)
    })

    it('peut voir le lien nav catalogue', () => {
      expect(can('visitor', 'nav:link:catalog')).toBe(true)
    })

    it('ne peut pas accéder au dashboard', () => {
      expect(can('visitor', 'view:dashboard')).toBe(false)
    })

    it('ne peut pas accéder au planning', () => {
      expect(can('visitor', 'view:planning')).toBe(false)
    })

    it('ne peut pas accéder aux courses', () => {
      expect(can('visitor', 'view:groceries')).toBe(false)
    })

    it("ne peut pas accéder à l'inventaire", () => {
      expect(can('visitor', 'view:inventory')).toBe(false)
    })

    it('ne peut pas accéder aux paramètres', () => {
      expect(can('visitor', 'view:settings')).toBe(false)
    })

    it('ne peut pas accéder au profil', () => {
      expect(can('visitor', 'view:profile')).toBe(false)
    })

    it('ne voit pas les liens nav protégés', () => {
      const protectedLinks: Feature[] = [
        'nav:link:dashboard',
        'nav:link:planning',
        'nav:link:groceries',
        'nav:link:inventory',
        'nav:link:settings',
      ]
      protectedLinks.forEach((feature) => {
        expect(can('visitor', feature)).toBe(false)
      })
    })
  })

  // ── Utilisateur connecté ────────────────────────────────────────────────────

  describe('rôle user', () => {
    it('peut accéder à toutes les vues', () => {
      const allViews: Feature[] = [
        'view:catalog',
        'view:dashboard',
        'view:planning',
        'view:groceries',
        'view:inventory',
        'view:settings',
        'view:profile',
      ]
      allViews.forEach((feature) => {
        expect(can('user', feature)).toBe(true)
      })
    })

    it('peut voir tous les liens de navigation', () => {
      const allLinks: Feature[] = [
        'nav:link:catalog',
        'nav:link:dashboard',
        'nav:link:planning',
        'nav:link:groceries',
        'nav:link:inventory',
        'nav:link:settings',
      ]
      allLinks.forEach((feature) => {
        expect(can('user', feature)).toBe(true)
      })
    })
  })

  // ── Admin ───────────────────────────────────────────────────────────────────

  describe('rôle admin', () => {
    it('a les mêmes accès que user (pas de features admin-only en front)', () => {
      const allFeatures: Feature[] = [
        'view:catalog',
        'view:dashboard',
        'view:planning',
        'view:groceries',
        'view:inventory',
        'view:settings',
        'view:profile',
        'nav:link:catalog',
        'nav:link:dashboard',
        'nav:link:planning',
        'nav:link:groceries',
        'nav:link:inventory',
        'nav:link:settings',
      ]
      allFeatures.forEach((feature) => {
        expect(can('admin', feature)).toBe(true)
      })
    })
  })

  // ── Cohérence ───────────────────────────────────────────────────────────────

  describe('cohérence de la matrice', () => {
    it('retourne false pour une feature inconnue (guard nullish)', () => {
      expect(can('user', 'view:nonexistent' as Feature)).toBe(false)
    })

    it('retourne false pour un rôle inconnu', () => {
      expect(can('superadmin' as UserRole, 'view:dashboard')).toBe(false)
    })

    it('visitor a exactement 2 features (catalog et nav:catalog)', () => {
      const allFeatures: Feature[] = [
        'view:catalog',
        'view:dashboard',
        'view:planning',
        'view:groceries',
        'view:inventory',
        'view:settings',
        'view:profile',
        'nav:link:catalog',
        'nav:link:dashboard',
        'nav:link:planning',
        'nav:link:groceries',
        'nav:link:inventory',
        'nav:link:settings',
      ]
      const visitorFeatures = allFeatures.filter((f) => can('visitor', f))
      expect(visitorFeatures).toHaveLength(2)
      expect(visitorFeatures).toContain('view:catalog')
      expect(visitorFeatures).toContain('nav:link:catalog')
    })
  })
})
