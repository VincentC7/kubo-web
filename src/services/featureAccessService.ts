import type { UserRole } from '@/types/auth'

/**
 * Matrice de permissions statique.
 * À terme, peut être remplacée par une réponse API /features.
 */
export type Feature =
  | 'view:catalog'
  | 'view:dashboard'
  | 'view:planning'
  | 'view:groceries'
  | 'view:inventory'
  | 'view:settings'
  | 'view:profile'
  | 'nav:link:catalog'
  | 'nav:link:dashboard'
  | 'nav:link:planning'
  | 'nav:link:groceries'
  | 'nav:link:inventory'
  | 'nav:link:settings'

const ACCESS_MATRIX: Record<Feature, UserRole[]> = {
  // Vues
  'view:catalog': ['visitor', 'user', 'admin'],
  'view:dashboard': ['user', 'admin'],
  'view:planning': ['user', 'admin'],
  'view:groceries': ['user', 'admin'],
  'view:inventory': ['user', 'admin'],
  'view:settings': ['user', 'admin'],
  'view:profile': ['user', 'admin'],
  // Liens de navigation
  'nav:link:catalog': ['visitor', 'user', 'admin'],
  'nav:link:dashboard': ['user', 'admin'],
  'nav:link:planning': ['user', 'admin'],
  'nav:link:groceries': ['user', 'admin'],
  'nav:link:inventory': ['user', 'admin'],
  'nav:link:settings': ['user', 'admin'],
}

export function can(role: UserRole, feature: Feature): boolean {
  return ACCESS_MATRIX[feature]?.includes(role) ?? false
}
