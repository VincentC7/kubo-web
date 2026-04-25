<script setup lang="ts">
/**
 * AuthLoginForm — Formulaire de connexion
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'

const authStore = useAuthStore()
const uiStore = useUiStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref<string | null>(null)
const cooldown = ref(false)

const isLoading = () => authStore.isLoading

async function submit(): Promise<void> {
  error.value = null
  if (!email.value.trim()) {
    error.value = "L'email est requis"
    return
  }
  if (!password.value) {
    error.value = 'Le mot de passe est requis'
    return
  }
  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de connexion'
    cooldown.value = true
    setTimeout(() => {
      cooldown.value = false
    }, 3000)
  }
}
</script>

<template>
  <div>
    <h1 class="auth-modal__title">Connexion</h1>
    <p class="auth-modal__subtitle">Accédez à vos recettes et à votre planification</p>

    <form class="auth-form" @submit.prevent="submit">
      <div class="auth-field">
        <label class="auth-field__label" for="login-email">Email</label>
        <div class="auth-field__wrap">
          <KuboIcon name="mail" :size="16" class="auth-field__icon" />
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="auth-field__input"
            placeholder="vous@example.com"
            autocomplete="email"
            :disabled="isLoading()"
          />
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-field__label" for="login-password">Mot de passe</label>
        <div class="auth-field__wrap">
          <KuboIcon name="lock" :size="16" class="auth-field__icon" />
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="auth-field__input auth-field__input--padded-right"
            placeholder="••••••••"
            autocomplete="current-password"
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
      </div>

      <p v-if="error" class="auth-error">
        <KuboIcon name="alert-circle" :size="14" />
        {{ error }}
      </p>

      <button type="submit" class="auth-submit" :disabled="isLoading() || cooldown">
        <span v-if="isLoading()" class="auth-submit__spinner" />
        <span v-else>Se connecter</span>
      </button>
    </form>

    <p class="auth-modal__footer">
      Pas encore de compte ?
      <button class="auth-modal__switch" @click="uiStore.navTo('register')">Créer un compte</button>
    </p>
  </div>
</template>
