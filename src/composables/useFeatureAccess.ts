import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { can as canAccess, type Feature } from '@/services/featureAccessService'

/**
 * Composable de vérification des permissions.
 *
 * `can` est un ComputedRef<fn> : Vue détecte la dépendance sur `currentRole`
 * et re-render automatiquement les composants qui l'utilisent dans le template.
 *
 * Usage dans un composant :
 *   const { can } = useFeatureAccess()
 *   <div v-if="can('view:dashboard')">...</div>   ← can est appelé via .value implicite
 *
 * Dans le script :
 *   can.value('view:dashboard')
 */
export function useFeatureAccess() {
  const authStore = useAuthStore()
  const currentRole = computed(() => authStore.currentRole)

  const can = computed(() => (feature: Feature): boolean => {
    return canAccess(currentRole.value, feature)
  })

  return { can }
}
