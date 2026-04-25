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
const cooldown = ref(false)

const isLoading = computed(() => authStore.isLoading)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') uiStore.navTo('catalog')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function validate(): string | null {
  if (!email.value.trim()) return "L'email est requis"
  if (!password.value) return 'Le mot de passe est requis'
  return null
}

async function submit(): Promise<void> {
  submitError.value = null
  const validationError = validate()
  if (validationError) {
    submitError.value = validationError
    return
  }

  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Erreur de connexion'
    // Cooldown de 3s après erreur
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

      <h1 class="auth-card__title">Connexion</h1>
      <p class="auth-card__subtitle">Accédez à vos recettes et votre planification</p>

      <form class="auth-form" @submit.prevent="submit">
        <!-- Email -->
        <div class="auth-field">
          <label class="auth-field__label" for="login-email">Email</label>
          <div class="auth-field__input-wrap">
            <KuboIcon name="mail" :size="16" class="auth-field__icon" />
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="auth-field__input"
              placeholder="vous@example.com"
              autocomplete="email"
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="auth-field">
          <label class="auth-field__label" for="login-password">Mot de passe</label>
          <div class="auth-field__input-wrap">
            <KuboIcon name="lock" :size="16" class="auth-field__icon" />
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="auth-field__input auth-field__input--with-toggle"
              placeholder="••••••••"
              autocomplete="current-password"
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
        </div>

        <!-- Erreur globale -->
        <p v-if="submitError" class="auth-error">
          <KuboIcon name="alert-circle" :size="14" />
          {{ submitError }}
        </p>

        <!-- Submit -->
        <button type="submit" class="auth-submit" :disabled="isLoading || cooldown">
          <span v-if="isLoading" class="auth-submit__spinner" />
          <span v-else>Se connecter</span>
        </button>
      </form>

      <!-- Footer -->
      <p class="auth-card__footer">
        Pas encore de compte ?
        <button class="auth-card__link" @click="uiStore.navTo('register')">Créer un compte</button>
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

/* Back */
.auth-card__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--kubo-text-muted);
  font-family: var(--font-base);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color var(--transition-base);
}
.auth-card__back:hover {
  color: var(--kubo-text);
}
</style>
