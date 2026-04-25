<script setup lang="ts">
/**
 * AuthRegisterForm — Formulaire d'inscription
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { usePasswordRules } from '@/composables/usePasswordRules'

const authStore = useAuthStore()
const uiStore = useUiStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<{
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}>({})
const cooldown = ref(false)
const success = ref(false)

const { passwordRules, isPasswordValid } = usePasswordRules(password)

const isLoading = () => authStore.isLoading

async function submit(): Promise<void> {
  error.value = null
  fieldErrors.value = {}

  let valid = true
  if (!firstName.value.trim()) {
    fieldErrors.value.firstName = 'Le prénom est requis'
    valid = false
  }
  if (!lastName.value.trim()) {
    fieldErrors.value.lastName = 'Le nom est requis'
    valid = false
  }
  if (!email.value.trim()) {
    fieldErrors.value.email = "L'email est requis"
    valid = false
  }
  if (!isPasswordValid.value) {
    fieldErrors.value.password = 'Le mot de passe ne respecte pas les critères'
    valid = false
  }
  if (confirmPassword.value !== password.value) {
    fieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    valid = false
  }
  if (!valid) return

  try {
    await authStore.register({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    success.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur lors de l'inscription"
    if (msg.includes('429') || msg.toLowerCase().includes('trop de tentatives')) {
      error.value = 'Trop de tentatives. Réessayez dans 1 heure.'
    } else if (msg.includes('409') || msg.toLowerCase().includes('existe déjà')) {
      error.value = 'Un compte existe déjà avec cet email.'
    } else {
      error.value = msg
    }
    cooldown.value = true
    setTimeout(() => {
      cooldown.value = false
    }, 3000)
  }
}
</script>

<template>
  <div>
    <h1 class="auth-modal__title">Créer un compte</h1>
    <p class="auth-modal__subtitle">Rejoignez kubo pour planifier vos repas</p>

    <!-- Succès -->
    <div v-if="success" class="auth-success">
      <KuboIcon name="check-circle" :size="18" />
      <div>
        <p class="auth-success__title">Compte créé avec succès !</p>
        <p class="auth-success__sub">Vous pouvez maintenant vous connecter.</p>
      </div>
    </div>

    <form v-else class="auth-form" @submit.prevent="submit">
      <div class="auth-field-row">
        <div class="auth-field">
          <label class="auth-field__label" for="reg-firstname">Prénom</label>
          <div class="auth-field__wrap">
            <KuboIcon name="user" :size="16" class="auth-field__icon" />
            <input
              id="reg-firstname"
              v-model="firstName"
              type="text"
              :class="['auth-field__input', { 'auth-field__input--error': fieldErrors.firstName }]"
              placeholder="Jean"
              autocomplete="given-name"
              :disabled="isLoading()"
            />
          </div>
          <p v-if="fieldErrors.firstName" class="auth-field__error-msg">
            {{ fieldErrors.firstName }}
          </p>
        </div>

        <div class="auth-field">
          <label class="auth-field__label" for="reg-lastname">Nom</label>
          <div class="auth-field__wrap">
            <KuboIcon name="user" :size="16" class="auth-field__icon" />
            <input
              id="reg-lastname"
              v-model="lastName"
              type="text"
              :class="['auth-field__input', { 'auth-field__input--error': fieldErrors.lastName }]"
              placeholder="Dupont"
              autocomplete="family-name"
              :disabled="isLoading()"
            />
          </div>
          <p v-if="fieldErrors.lastName" class="auth-field__error-msg">
            {{ fieldErrors.lastName }}
          </p>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-field__label" for="reg-email">Email</label>
        <div class="auth-field__wrap">
          <KuboIcon name="mail" :size="16" class="auth-field__icon" />
          <input
            id="reg-email"
            v-model="email"
            type="email"
            :class="['auth-field__input', { 'auth-field__input--error': fieldErrors.email }]"
            placeholder="vous@example.com"
            autocomplete="email"
            :disabled="isLoading()"
          />
        </div>
        <p v-if="fieldErrors.email" class="auth-field__error-msg">{{ fieldErrors.email }}</p>
      </div>

      <div class="auth-field">
        <label class="auth-field__label" for="reg-password">Mot de passe</label>
        <div class="auth-field__wrap">
          <KuboIcon name="lock" :size="16" class="auth-field__icon" />
          <input
            id="reg-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :class="[
              'auth-field__input auth-field__input--padded-right',
              { 'auth-field__input--error': fieldErrors.password },
            ]"
            placeholder="••••••••"
            autocomplete="new-password"
            :disabled="isLoading()"
          />
          <button
            type="button"
            class="auth-field__eye"
            :aria-label="showPassword ? 'Masquer' : 'Afficher'"
            @click="showPassword = !showPassword"
          >
            <KuboIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
          </button>
        </div>

        <div v-if="password.length > 0" class="auth-rules">
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
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            :class="[
              'auth-field__input auth-field__input--padded-right',
              { 'auth-field__input--error': fieldErrors.confirmPassword },
            ]"
            placeholder="••••••••"
            autocomplete="new-password"
            :disabled="isLoading()"
          />
          <button
            type="button"
            class="auth-field__eye"
            :aria-label="showConfirmPassword ? 'Masquer' : 'Afficher'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <KuboIcon :name="showConfirmPassword ? 'eye-off' : 'eye'" :size="16" />
          </button>
        </div>
        <p v-if="fieldErrors.confirmPassword" class="auth-field__error-msg">
          {{ fieldErrors.confirmPassword }}
        </p>
      </div>

      <p v-if="error" class="auth-error">
        <KuboIcon name="alert-circle" :size="14" />
        {{ error }}
      </p>

      <button type="submit" class="auth-submit" :disabled="isLoading() || cooldown">
        <span v-if="isLoading()" class="auth-submit__spinner" />
        <span v-else>Créer mon compte</span>
      </button>
    </form>

    <p class="auth-modal__footer">
      Déjà un compte ?
      <button class="auth-modal__switch" @click="uiStore.navTo('login')">Se connecter</button>
    </p>
  </div>
</template>
