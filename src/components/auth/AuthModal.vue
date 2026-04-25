<script setup lang="ts">
/**
 * AuthModal — Modale login / register par-dessus le shell
 * Le fond (catalog) reste visible et flouté derrière.
 * Fermeture : croix, clic sur l'overlay, ou Échap.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'

const authStore = useAuthStore()
const uiStore = useUiStore()

const isLogin = computed(() => uiStore.currentView === 'login')
const isLoading = computed(() => authStore.isLoading)

// ── Login state ──────────────────────────────────────────────────────────────
const loginEmail = ref('')
const loginPassword = ref('')
const loginShowPassword = ref(false)
const loginError = ref<string | null>(null)
const loginCooldown = ref(false)

// ── Register state ───────────────────────────────────────────────────────────
const regFirstName = ref('')
const regLastName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regShowPassword = ref(false)
const regShowConfirmPassword = ref(false)
const regError = ref<string | null>(null)
const regFieldErrors = ref<{
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}>({})
const regCooldown = ref(false)
const regSuccess = ref(false)

// ── Password rules ───────────────────────────────────────────────────────────
const passwordRules = computed(() => ({
  length: regPassword.value.length >= 8,
  uppercase: /[A-Z]/.test(regPassword.value),
  digit: /[0-9]/.test(regPassword.value),
}))
const isPasswordValid = computed(() => Object.values(passwordRules.value).every(Boolean))

// ── Close ────────────────────────────────────────────────────────────────────
function close(): void {
  uiStore.navTo('catalog')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// ── Login submit ─────────────────────────────────────────────────────────────
async function submitLogin(): Promise<void> {
  loginError.value = null
  if (!loginEmail.value.trim()) {
    loginError.value = "L'email est requis"
    return
  }
  if (!loginPassword.value) {
    loginError.value = 'Le mot de passe est requis'
    return
  }

  try {
    await authStore.login({ email: loginEmail.value.trim(), password: loginPassword.value })
  } catch (e) {
    loginError.value = e instanceof Error ? e.message : 'Erreur de connexion'
    loginCooldown.value = true
    setTimeout(() => {
      loginCooldown.value = false
    }, 3000)
  }
}

// ── Register submit ──────────────────────────────────────────────────────────
async function submitRegister(): Promise<void> {
  regError.value = null
  regFieldErrors.value = {}

  let valid = true
  if (!regFirstName.value.trim()) {
    regFieldErrors.value.firstName = 'Le prénom est requis'
    valid = false
  }
  if (!regLastName.value.trim()) {
    regFieldErrors.value.lastName = 'Le nom est requis'
    valid = false
  }
  if (!regEmail.value.trim()) {
    regFieldErrors.value.email = "L'email est requis"
    valid = false
  }
  if (!isPasswordValid.value) {
    regFieldErrors.value.password = 'Le mot de passe ne respecte pas les critères'
    valid = false
  }
  if (regConfirmPassword.value !== regPassword.value) {
    regFieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    valid = false
  }
  if (!valid) return

  try {
    await authStore.register({
      firstName: regFirstName.value.trim(),
      lastName: regLastName.value.trim(),
      email: regEmail.value.trim(),
      password: regPassword.value,
    })
    regSuccess.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur lors de l'inscription"
    if (msg.includes('429') || msg.toLowerCase().includes('trop de tentatives')) {
      regError.value = 'Trop de tentatives. Réessayez dans 1 heure.'
    } else if (msg.includes('409') || msg.toLowerCase().includes('existe déjà')) {
      regError.value = 'Un compte existe déjà avec cet email.'
    } else {
      regError.value = msg
    }
    regCooldown.value = true
    setTimeout(() => {
      regCooldown.value = false
    }, 3000)
  }
}
</script>

<template>
  <!-- Overlay flouté -->
  <div class="auth-overlay" aria-modal="true" role="dialog" @click.self="close">
    <!-- Carte modale -->
    <div class="auth-modal">
      <!-- Bouton fermer -->
      <button class="auth-modal__close" aria-label="Fermer" @click="close">
        <KuboIcon name="x" :size="18" />
      </button>

      <!-- Logo -->
      <div class="auth-modal__logo">
        <div class="auth-modal__logo-icon">
          <span class="auth-modal__logo-k">K</span>
        </div>
        <span class="auth-modal__logo-name">kubo</span>
      </div>

      <!-- ── LOGIN ── -->
      <template v-if="isLogin">
        <h1 class="auth-modal__title">Connexion</h1>
        <p class="auth-modal__subtitle">Accédez à vos recettes et à votre planification</p>

        <form class="auth-form" @submit.prevent="submitLogin">
          <div class="auth-field">
            <label class="auth-field__label" for="login-email">Email</label>
            <div class="auth-field__wrap">
              <KuboIcon name="mail" :size="16" class="auth-field__icon" />
              <input
                id="login-email"
                v-model="loginEmail"
                type="email"
                class="auth-field__input"
                placeholder="vous@example.com"
                autocomplete="email"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-field__label" for="login-password">Mot de passe</label>
            <div class="auth-field__wrap">
              <KuboIcon name="lock" :size="16" class="auth-field__icon" />
              <input
                id="login-password"
                v-model="loginPassword"
                :type="loginShowPassword ? 'text' : 'password'"
                class="auth-field__input auth-field__input--padded-right"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="auth-field__eye"
                :aria-label="loginShowPassword ? 'Masquer' : 'Afficher'"
                @click="loginShowPassword = !loginShowPassword"
              >
                <KuboIcon :name="loginShowPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
          </div>

          <p v-if="loginError" class="auth-error">
            <KuboIcon name="alert-circle" :size="14" />
            {{ loginError }}
          </p>

          <button type="submit" class="auth-submit" :disabled="isLoading || loginCooldown">
            <span v-if="isLoading" class="auth-submit__spinner" />
            <span v-else>Se connecter</span>
          </button>
        </form>

        <p class="auth-modal__footer">
          Pas encore de compte ?
          <button class="auth-modal__switch" @click="uiStore.navTo('register')">
            Créer un compte
          </button>
        </p>
      </template>

      <!-- ── REGISTER ── -->
      <template v-else>
        <h1 class="auth-modal__title">Créer un compte</h1>
        <p class="auth-modal__subtitle">Rejoignez kubo pour planifier vos repas</p>

        <!-- Succès -->
        <div v-if="regSuccess" class="auth-success">
          <KuboIcon name="check-circle" :size="18" />
          <div>
            <p class="auth-success__title">Compte créé avec succès !</p>
            <p class="auth-success__sub">Vous pouvez maintenant vous connecter.</p>
          </div>
        </div>

        <form v-else class="auth-form" @submit.prevent="submitRegister">
          <div class="auth-field-row">
            <div class="auth-field">
              <label class="auth-field__label" for="reg-firstname">Prénom</label>
              <div class="auth-field__wrap">
                <KuboIcon name="user" :size="16" class="auth-field__icon" />
                <input
                  id="reg-firstname"
                  v-model="regFirstName"
                  type="text"
                  :class="[
                    'auth-field__input',
                    { 'auth-field__input--error': regFieldErrors.firstName },
                  ]"
                  placeholder="Jean"
                  autocomplete="given-name"
                  :disabled="isLoading"
                />
              </div>
              <p v-if="regFieldErrors.firstName" class="auth-field__error-msg">
                {{ regFieldErrors.firstName }}
              </p>
            </div>

            <div class="auth-field">
              <label class="auth-field__label" for="reg-lastname">Nom</label>
              <div class="auth-field__wrap">
                <KuboIcon name="user" :size="16" class="auth-field__icon" />
                <input
                  id="reg-lastname"
                  v-model="regLastName"
                  type="text"
                  :class="[
                    'auth-field__input',
                    { 'auth-field__input--error': regFieldErrors.lastName },
                  ]"
                  placeholder="Dupont"
                  autocomplete="family-name"
                  :disabled="isLoading"
                />
              </div>
              <p v-if="regFieldErrors.lastName" class="auth-field__error-msg">
                {{ regFieldErrors.lastName }}
              </p>
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-field__label" for="reg-email">Email</label>
            <div class="auth-field__wrap">
              <KuboIcon name="mail" :size="16" class="auth-field__icon" />
              <input
                id="reg-email"
                v-model="regEmail"
                type="email"
                :class="['auth-field__input', { 'auth-field__input--error': regFieldErrors.email }]"
                placeholder="vous@example.com"
                autocomplete="email"
                :disabled="isLoading"
              />
            </div>
            <p v-if="regFieldErrors.email" class="auth-field__error-msg">
              {{ regFieldErrors.email }}
            </p>
          </div>

          <div class="auth-field">
            <label class="auth-field__label" for="reg-password">Mot de passe</label>
            <div class="auth-field__wrap">
              <KuboIcon name="lock" :size="16" class="auth-field__icon" />
              <input
                id="reg-password"
                v-model="regPassword"
                :type="regShowPassword ? 'text' : 'password'"
                :class="[
                  'auth-field__input auth-field__input--padded-right',
                  { 'auth-field__input--error': regFieldErrors.password },
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="auth-field__eye"
                :aria-label="regShowPassword ? 'Masquer' : 'Afficher'"
                @click="regShowPassword = !regShowPassword"
              >
                <KuboIcon :name="regShowPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>

            <div v-if="regPassword.length > 0" class="auth-rules">
              <span :class="['auth-rule', { 'auth-rule--ok': passwordRules.length }]">
                <KuboIcon :name="passwordRules.length ? 'check' : 'x'" :size="11" />
                8 caractères min
              </span>
              <span :class="['auth-rule', { 'auth-rule--ok': passwordRules.uppercase }]">
                <KuboIcon :name="passwordRules.uppercase ? 'check' : 'x'" :size="11" />
                1 majuscule
              </span>
              <span :class="['auth-rule', { 'auth-rule--ok': passwordRules.digit }]">
                <KuboIcon :name="passwordRules.digit ? 'check' : 'x'" :size="11" />
                1 chiffre
              </span>
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-field__label" for="reg-confirm-password"
              >Confirmer le mot de passe</label
            >
            <div class="auth-field__wrap">
              <KuboIcon name="lock" :size="16" class="auth-field__icon" />
              <input
                id="reg-confirm-password"
                v-model="regConfirmPassword"
                :type="regShowConfirmPassword ? 'text' : 'password'"
                :class="[
                  'auth-field__input auth-field__input--padded-right',
                  { 'auth-field__input--error': regFieldErrors.confirmPassword },
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="auth-field__eye"
                :aria-label="regShowConfirmPassword ? 'Masquer' : 'Afficher'"
                @click="regShowConfirmPassword = !regShowConfirmPassword"
              >
                <KuboIcon :name="regShowConfirmPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
            <p v-if="regFieldErrors.confirmPassword" class="auth-field__error-msg">
              {{ regFieldErrors.confirmPassword }}
            </p>
          </div>

          <p v-if="regError" class="auth-error">
            <KuboIcon name="alert-circle" :size="14" />
            {{ regError }}
          </p>

          <button type="submit" class="auth-submit" :disabled="isLoading || regCooldown">
            <span v-if="isLoading" class="auth-submit__spinner" />
            <span v-else>Créer mon compte</span>
          </button>
        </form>

        <p class="auth-modal__footer">
          Déjà un compte ?
          <button class="auth-modal__switch" @click="uiStore.navTo('login')">Se connecter</button>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ── Overlay ── */
.auth-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Carte ── */
.auth-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
}

/* ── Croix ── */
.auth-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}
.auth-modal__close:hover {
  background: var(--kubo-surface);
  color: var(--kubo-text);
  border-color: var(--kubo-border-mid);
}

/* ── Logo ── */
.auth-modal__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}
.auth-modal__logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
  flex-shrink: 0;
}
.auth-modal__logo-k {
  color: #fff;
  font-weight: 900;
  font-size: 20px;
  line-height: 1;
}
.auth-modal__logo-name {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--kubo-green);
}

.auth-modal__title {
  font-size: 20px;
  font-weight: 900;
  color: var(--kubo-text);
  margin-bottom: 4px;
}
.auth-modal__subtitle {
  font-size: 13px;
  color: var(--kubo-text-muted);
  margin-bottom: 28px;
}

/* ── Form ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.auth-field__label {
  font-size: 11px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.auth-field__wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.auth-field__icon {
  position: absolute;
  left: 13px;
  color: var(--kubo-text-faint);
  pointer-events: none;
}
.auth-field__input {
  width: 100%;
  padding: 11px 13px 11px 38px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-base);
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text);
  outline: none;
  transition: border-color var(--transition-base);
}
.auth-field__input--padded-right {
  padding-right: 42px;
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

.auth-field__eye {
  position: absolute;
  right: 11px;
  background: none;
  border: none;
  color: var(--kubo-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.auth-field__error-msg {
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-danger, #ef4444);
}

/* ── Password rules ── */
.auth-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.auth-rule {
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
.auth-rule--ok {
  color: var(--kubo-green);
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}

/* ── Error ── */
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
  padding: 10px 13px;
}

/* ── Success ── */
.auth-success {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-lg);
  color: var(--kubo-green);
  margin-bottom: 16px;
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

/* ── Submit ── */
.auth-submit {
  margin-top: 6px;
  padding: 13px;
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
  min-height: 46px;
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

/* ── Footer ── */
.auth-modal__footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--kubo-text-muted);
}
.auth-modal__switch {
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
