import { computed } from 'vue'
import type { Ref } from 'vue'

export interface PasswordRules {
  length: boolean
  uppercase: boolean
  digit: boolean
}

/**
 * Composable de validation du mot de passe.
 * Retourne les règles en temps réel et un booléen de validité globale.
 *
 * @example
 * const { passwordRules, isPasswordValid } = usePasswordRules(newPassword)
 */
export function usePasswordRules(password: Ref<string>) {
  const passwordRules = computed<PasswordRules>(() => ({
    length: password.value.length >= 8,
    uppercase: /[A-Z]/.test(password.value),
    digit: /[0-9]/.test(password.value),
  }))

  const isPasswordValid = computed(() => Object.values(passwordRules.value).every(Boolean))

  return { passwordRules, isPasswordValid }
}
