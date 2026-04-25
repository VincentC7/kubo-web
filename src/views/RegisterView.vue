<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'

const authStore = useAuthStore()
const uiStore = useUiStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitError = ref<string | null>(null)
const fieldErrors = ref<{ email?: string; password?: string }>({})
const cooldown = ref(false)
const success = ref(false)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') uiStore.navTo('catalog')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const isLoading = computed(() => authStore.isLoading)

// Validation frontend
const passwordRules = computed(() => ({
  length: password.value.length >= 8,
  uppercase: /[A-Z]/.test(password.value),
  digit: /[0-9]/.test(password.value),
}))
const isPasswordValid = computed(() => Object.values(passwordRules.value).every(Boolean))

function validate(): boolean {
  fieldErrors.value = {}
  let valid = true
  if (!email.value.trim()) {
    fieldErrors.value.email = "L'email est requis"
    valid = false
  }
  if (!isPasswordValid.value) {
    fieldErrors.value.password = 'Le mot de passe ne respecte pas les critères'
    valid = false
  }
  return valid
}

async function submit(): Promise<void> {
  submitError.value = null
  if (!validate()) return

  try {
    await authStore.register({ email: email.value.trim(), password: password.value })
    success.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur lors de l'inscription"

    // Mapper les codes d'erreur API vers des messages lisibles
    if (msg.includes('429') || msg.toLowerCase().includes('trop de tentatives')) {
      submitError.value = 'Trop de tentatives. Réessayez dans 1 heure.'
    } else if (msg.includes('409') || msg.toLowerCase().includes('existe déjà')) {
      submitError.value = 'Un compte existe déjà avec cet email.'
    } else {
      submitError.value = msg
    }

    cooldown.value = true
    setTimeout(() => {
      cooldown.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="auth-screen">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-card__logo">
        <div class="auth-card__logo-icon">
          <span class="auth-card__logo-k">K</span>
        </div>
        <span class="auth-card__logo-name">kubo</span>
      </div>

      <!-- Retour accueil -->
      <button class="auth-card__back" @click="uiStore.navTo('catalog')">
        <KuboIcon name="arrow-left" :size="14" />
        Continuer sans compte
      </button>

      <h1 class="auth-card__title">Créer un compte</h1>
      <p class="auth-card__subtitle">Rejoignez kubo pour planifier vos repas</p>

      <!-- Succès -->
      <div v-if="success" class="auth-success">
        <KuboIcon name="check-circle" :size="18" />
        <div>
          <p class="auth-success__title">Compte créé avec succès !</p>
          <p class="auth-success__sub">Vous pouvez maintenant vous connecter.</p>
        </div>
      </div>

      <form v-else class="auth-form" @submit.prevent="submit">
        <!-- Email -->
        <div class="auth-field">
          <label class="auth-field__label" for="register-email">Email</label>
          <div class="auth-field__input-wrap">
            <KuboIcon name="mail" :size="16" class="auth-field__icon" />
            <input
              id="register-email"
              v-model="email"
              type="email"
              :class="['auth-field__input', { 'auth-field__input--error': fieldErrors.email }]"
              placeholder="vous@example.com"
              autocomplete="email"
              :disabled="isLoading"
            />
          </div>
          <p v-if="fieldErrors.email" class="auth-field__error">{{ fieldErrors.email }}</p>
        </div>

        <!-- Password -->
        <div class="auth-field">
          <label class="auth-field__label" for="register-password">Mot de passe</label>
          <div class="auth-field__input-wrap">
            <KuboIcon name="lock" :size="16" class="auth-field__icon" />
            <input
              id="register-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :class="[
                'auth-field__input auth-field__input--with-toggle',
                { 'auth-field__input--error': fieldErrors.password },
              ]"
              placeholder="••••••••"
              autocomplete="new-password"
              :disabled="isLoading"
            />
            <button
              type="button"
              class="auth-field__toggle"
              :aria-label="showPassword ? 'Masquer' : 'Afficher'"
              @click="showPassword = !showPassword"
            >
              <KuboIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
            </button>
          </div>

          <!-- Indicateurs de force -->
          <div v-if="password.length > 0" class="auth-password-rules">
            <span
              :class="['auth-password-rule', { 'auth-password-rule--ok': passwordRules.length }]"
            >
              <KuboIcon :name="passwordRules.length ? 'check' : 'x'" :size="11" />
              8 caractères min
            </span>
            <span
              :class="['auth-password-rule', { 'auth-password-rule--ok': passwordRules.uppercase }]"
            >
              <KuboIcon :name="passwordRules.uppercase ? 'check' : 'x'" :size="11" />
              1 majuscule
            </span>
            <span
              :class="['auth-password-rule', { 'auth-password-rule--ok': passwordRules.digit }]"
            >
              <KuboIcon :name="passwordRules.digit ? 'check' : 'x'" :size="11" />
              1 chiffre
            </span>
          </div>
        </div>

        <!-- Erreur globale -->
        <p v-if="submitError" class="auth-error">
          <KuboIcon name="alert-circle" :size="14" />
          {{ submitError }}
        </p>

        <!-- Submit -->
        <button type="submit" class="auth-submit" :disabled="isLoading || cooldown">
          <span v-if="isLoading" class="auth-submit__spinner" />
          <span v-else>Créer mon compte</span>
        </button>
      </form>

      <!-- Footer -->
      <p class="auth-card__footer">
        Déjà un compte ?
        <button class="auth-card__link" @click="uiStore.navTo('login')">Se connecter</button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--kubo-bg);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: 28px;
  padding: 48px 40px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
}

/* Logo */
.auth-card__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}
.auth-card__logo-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
  flex-shrink: 0;
}
.auth-card__logo-k {
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
}
.auth-card__logo-name {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--kubo-green);
}

.auth-card__title {
  font-size: 22px;
  font-weight: 900;
  color: var(--kubo-text);
  margin-bottom: 6px;
}
.auth-card__subtitle {
  font-size: 13px;
  color: var(--kubo-text-muted);
  margin-bottom: 32px;
}

/* Success */
.auth-success {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-lg);
  color: var(--kubo-green);
  margin-bottom: 24px;
}
.auth-success__title {
  font-size: 14px;
  font-weight: 800;
  color: var(--kubo-green);
}
.auth-success__sub {
  font-size: 12px;
  color: var(--kubo-text-muted);
  margin-top: 2px;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.auth-field__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.auth-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.auth-field__icon {
  position: absolute;
  left: 14px;
  color: var(--kubo-text-faint);
  pointer-events: none;
}
.auth-field__input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-base);
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text);
  transition: border-color var(--transition-base);
  outline: none;
}
.auth-field__input--with-toggle {
  padding-right: 44px;
}
.auth-field__input--error {
  border-color: var(--kubo-danger, #ef4444);
}
.auth-field__input:focus {
  border-color: var(--kubo-green);
}
.auth-field__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-field__toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--kubo-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.auth-field__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-danger, #ef4444);
}

/* Password rules */
.auth-password-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.auth-password-rule {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--kubo-text-faint);
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: 999px;
  padding: 3px 8px;
  transition: all var(--transition-base);
}
.auth-password-rule--ok {
  color: var(--kubo-green);
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}

/* Error */
.auth-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--kubo-danger, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
}

/* Submit */
.auth-submit {
  margin-top: 8px;
  padding: 14px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-base);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    opacity var(--transition-base),
    box-shadow var(--transition-base);
  box-shadow: 0 4px 16px var(--kubo-green-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}
.auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.auth-submit:not(:disabled):hover {
  opacity: 0.9;
}
.auth-submit__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Footer */
.auth-card__footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--kubo-text-muted);
}
.auth-card__link {
  background: none;
  border: none;
  color: var(--kubo-green);
  font-weight: 800;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  text-decoration: underline;
}
</style>
