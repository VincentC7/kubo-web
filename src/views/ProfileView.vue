<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { emailToHue } from '@/utils/avatar'
import { usePasswordRules } from '@/composables/usePasswordRules'

const authStore = useAuthStore()
const userStore = useUserStore()
const { isLoading } = storeToRefs(authStore)
const { user } = storeToRefs(userStore)

const roleLabel = computed(() => {
  switch (authStore.currentRole) {
    case 'admin':
      return 'Administrateur'
    case 'user':
      return 'Utilisateur'
    default:
      return 'Visiteur'
  }
})

// ── Avatar ────────────────────────────────────────────────────────────────────
const initials = computed(() => {
  if (user.value?.firstName && user.value?.lastName) {
    return (user.value.firstName[0] + user.value.lastName[0]).toUpperCase()
  }
  const email = user.value?.email ?? ''
  const parts = email.split('@')[0].split(/[._-]/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
})

const avatarStyle = computed(() => {
  const email = user.value?.email
  if (!email) return {}
  const hue = emailToHue(email)
  return {
    background: `hsl(${hue}, 65%, 88%)`,
    color: `hsl(${hue}, 55%, 28%)`,
  }
})

const displayName = computed(() => {
  if (user.value?.firstName || user.value?.lastName) {
    return [user.value.firstName, user.value.lastName].filter(Boolean).join(' ')
  }
  return user.value?.email?.split('@')[0] ?? ''
})

// ── Edit profile ──────────────────────────────────────────────────────────────
const editFirstName = ref(user.value?.firstName ?? '')
const editLastName = ref(user.value?.lastName ?? '')
const profileSaving = ref(false)
const profileSuccess = ref(false)
const profileError = ref<string | null>(null)
const profileFieldErrors = ref<{ firstName?: string; lastName?: string }>({})

async function saveProfile(): Promise<void> {
  profileFieldErrors.value = {}
  profileError.value = null
  profileSuccess.value = false

  let valid = true
  if (!editFirstName.value.trim()) {
    profileFieldErrors.value.firstName = 'Le prénom est requis'
    valid = false
  }
  if (!editLastName.value.trim()) {
    profileFieldErrors.value.lastName = 'Le nom est requis'
    valid = false
  }
  if (!valid) return

  profileSaving.value = true
  try {
    await userStore.updateProfile({
      firstName: editFirstName.value.trim(),
      lastName: editLastName.value.trim(),
    })
    profileSuccess.value = true
    setTimeout(() => {
      profileSuccess.value = false
    }, 3000)
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : 'Erreur lors de la sauvegarde'
  } finally {
    profileSaving.value = false
  }
}

// ── Change password ───────────────────────────────────────────────────────────
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPwd = ref(false)
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)
const pwdSaving = ref(false)
const pwdSuccess = ref(false)
const pwdError = ref<string | null>(null)
const pwdFieldErrors = ref<{
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}>({})

const { passwordRules, isPasswordValid: isNewPasswordValid } = usePasswordRules(newPassword)

async function savePassword(): Promise<void> {
  pwdFieldErrors.value = {}
  pwdError.value = null
  pwdSuccess.value = false

  let valid = true
  if (!currentPassword.value) {
    pwdFieldErrors.value.currentPassword = 'Le mot de passe actuel est requis'
    valid = false
  }
  if (!isNewPasswordValid.value) {
    pwdFieldErrors.value.newPassword = 'Le nouveau mot de passe ne respecte pas les critères'
    valid = false
  }
  if (confirmPassword.value !== newPassword.value) {
    pwdFieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    valid = false
  }
  if (!valid) return

  pwdSaving.value = true
  try {
    await userStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    pwdSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      pwdSuccess.value = false
    }, 3000)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    if (msg.toLowerCase().includes('incorrect') || msg.includes('currentPassword')) {
      pwdFieldErrors.value.currentPassword = 'Mot de passe actuel incorrect'
    } else {
      pwdError.value = msg
    }
  } finally {
    pwdSaving.value = false
  }
}

async function logout(): Promise<void> {
  await authStore.logout()
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1 class="profile-header__title">Mon profil</h1>
    </div>

    <!-- Identity card -->
    <div class="profile-card">
      <div class="profile-identity">
        <div class="profile-avatar" :style="avatarStyle">{{ initials || '?' }}</div>
        <div class="profile-identity__info">
          <p class="profile-identity__name">{{ displayName }}</p>
          <p class="profile-identity__email">{{ user?.email }}</p>
          <span :class="['profile-role-badge', `profile-role-badge--${authStore.currentRole}`]">
            {{ roleLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit profile + Change password côte à côte -->
    <div class="profile-cards-row">
      <!-- Edit profile -->
      <div class="profile-card">
        <h2 class="profile-section-title">
          <KuboIcon name="user" :size="16" />
          Informations personnelles
        </h2>

        <form class="profile-form" @submit.prevent="saveProfile">
          <div class="profile-field-row">
            <div class="profile-field">
              <label class="profile-field__label" for="edit-firstname">Prénom</label>
              <input
                id="edit-firstname"
                v-model="editFirstName"
                type="text"
                :class="[
                  'profile-field__input',
                  { 'profile-field__input--error': profileFieldErrors.firstName },
                ]"
                placeholder="Jean"
                :disabled="profileSaving"
              />
              <p v-if="profileFieldErrors.firstName" class="profile-field__error">
                {{ profileFieldErrors.firstName }}
              </p>
            </div>
            <div class="profile-field">
              <label class="profile-field__label" for="edit-lastname">Nom</label>
              <input
                id="edit-lastname"
                v-model="editLastName"
                type="text"
                :class="[
                  'profile-field__input',
                  { 'profile-field__input--error': profileFieldErrors.lastName },
                ]"
                placeholder="Dupont"
                :disabled="profileSaving"
              />
              <p v-if="profileFieldErrors.lastName" class="profile-field__error">
                {{ profileFieldErrors.lastName }}
              </p>
            </div>
          </div>

          <div v-if="profileSuccess" class="profile-feedback profile-feedback--success">
            <KuboIcon name="check-circle" :size="14" />
            Profil mis à jour avec succès.
          </div>
          <div v-if="profileError" class="profile-feedback profile-feedback--error">
            <KuboIcon name="alert-circle" :size="14" />
            {{ profileError }}
          </div>

          <button type="submit" class="profile-save-btn" :disabled="profileSaving">
            <span v-if="profileSaving" class="profile-save-btn__spinner" />
            <template v-else>
              <KuboIcon name="save" :size="15" />
              Enregistrer
            </template>
          </button>
        </form>
      </div>

      <!-- Change password -->
      <div class="profile-card">
        <h2 class="profile-section-title">
          <KuboIcon name="lock" :size="16" />
          Changer de mot de passe
        </h2>

        <form class="profile-form" @submit.prevent="savePassword">
          <div class="profile-field">
            <label class="profile-field__label" for="current-pwd">Mot de passe actuel</label>
            <div class="profile-field__wrap">
              <input
                id="current-pwd"
                v-model="currentPassword"
                :type="showCurrentPwd ? 'text' : 'password'"
                :class="[
                  'profile-field__input profile-field__input--padded-right',
                  { 'profile-field__input--error': pwdFieldErrors.currentPassword },
                ]"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="pwdSaving"
              />
              <button
                type="button"
                class="profile-field__eye"
                @click="showCurrentPwd = !showCurrentPwd"
              >
                <KuboIcon :name="showCurrentPwd ? 'eye-off' : 'eye'" :size="15" />
              </button>
            </div>
            <p v-if="pwdFieldErrors.currentPassword" class="profile-field__error">
              {{ pwdFieldErrors.currentPassword }}
            </p>
          </div>

          <div class="profile-field">
            <label class="profile-field__label" for="new-pwd">Nouveau mot de passe</label>
            <div class="profile-field__wrap">
              <input
                id="new-pwd"
                v-model="newPassword"
                :type="showNewPwd ? 'text' : 'password'"
                :class="[
                  'profile-field__input profile-field__input--padded-right',
                  { 'profile-field__input--error': pwdFieldErrors.newPassword },
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="pwdSaving"
              />
              <button type="button" class="profile-field__eye" @click="showNewPwd = !showNewPwd">
                <KuboIcon :name="showNewPwd ? 'eye-off' : 'eye'" :size="15" />
              </button>
            </div>
            <div v-if="newPassword.length > 0" class="pwd-rules">
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.length }]">
                <KuboIcon :name="passwordRules.length ? 'check' : 'x'" :size="11" />
                8 car. min
              </span>
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.uppercase }]">
                <KuboIcon :name="passwordRules.uppercase ? 'check' : 'x'" :size="11" />
                1 majuscule
              </span>
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.digit }]">
                <KuboIcon :name="passwordRules.digit ? 'check' : 'x'" :size="11" />
                1 chiffre
              </span>
            </div>
            <p v-if="pwdFieldErrors.newPassword" class="profile-field__error">
              {{ pwdFieldErrors.newPassword }}
            </p>
          </div>

          <div class="profile-field">
            <label class="profile-field__label" for="confirm-pwd">Confirmer le mot de passe</label>
            <div class="profile-field__wrap">
              <input
                id="confirm-pwd"
                v-model="confirmPassword"
                :type="showConfirmPwd ? 'text' : 'password'"
                :class="[
                  'profile-field__input profile-field__input--padded-right',
                  { 'profile-field__input--error': pwdFieldErrors.confirmPassword },
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="pwdSaving"
              />
              <button
                type="button"
                class="profile-field__eye"
                @click="showConfirmPwd = !showConfirmPwd"
              >
                <KuboIcon :name="showConfirmPwd ? 'eye-off' : 'eye'" :size="15" />
              </button>
            </div>
            <p v-if="pwdFieldErrors.confirmPassword" class="profile-field__error">
              {{ pwdFieldErrors.confirmPassword }}
            </p>
          </div>

          <div v-if="pwdSuccess" class="profile-feedback profile-feedback--success">
            <KuboIcon name="check-circle" :size="14" />
            Mot de passe mis à jour avec succès.
          </div>
          <div v-if="pwdError" class="profile-feedback profile-feedback--error">
            <KuboIcon name="alert-circle" :size="14" />
            {{ pwdError }}
          </div>

          <button type="submit" class="profile-save-btn" :disabled="pwdSaving">
            <span v-if="pwdSaving" class="profile-save-btn__spinner" />
            <template v-else>
              <KuboIcon name="key" :size="15" />
              Changer le mot de passe
            </template>
          </button>
        </form>
      </div>
    </div>

    <!-- Logout -->
    <div class="profile-card profile-card--logout">
      <button class="profile-logout" :disabled="isLoading" @click="logout">
        <KuboIcon name="log-out" :size="16" />
        Se déconnecter
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  padding: 40px;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .profile-view {
    padding: 24px 16px;
  }
}

.profile-header {
  margin-bottom: 4px;
}
.profile-header__title {
  font-size: 24px;
  font-weight: 900;
  color: var(--kubo-text);
}

/* Grille côte à côte */
.profile-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .profile-cards-row {
    grid-template-columns: 1fr;
  }
}

/* Card */
.profile-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.profile-card--logout {
  padding: 16px;
}

/* Section title */
.profile-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 20px;
}

/* Identity */
.profile-identity {
  display: flex;
  align-items: center;
  gap: 20px;
}
.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 22px;
  flex-shrink: 0;
}
.profile-identity__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-identity__name {
  font-size: 17px;
  font-weight: 900;
  color: var(--kubo-text);
}
.profile-identity__email {
  font-size: 13px;
  font-weight: 600;
  color: var(--kubo-text-muted);
}

/* Role badge */
.profile-role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 999px;
  padding: 3px 10px;
  width: fit-content;
}
.profile-role-badge--user {
  background: rgba(16, 185, 129, 0.12);
  color: var(--kubo-green);
}
.profile-role-badge--admin {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}
.profile-role-badge--visitor {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
}

/* Form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}
.profile-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile-field__label {
  font-size: 11px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.profile-field__wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.profile-field__input {
  width: 100%;
  padding: 10px 13px;
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
.profile-field__input--padded-right {
  padding-right: 40px;
}
.profile-field__input--error {
  border-color: var(--kubo-danger, #ef4444);
}
.profile-field__input:focus {
  border-color: var(--kubo-green);
}
.profile-field__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.profile-field__eye {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--kubo-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.profile-field__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-danger, #ef4444);
}

/* Password rules */
.pwd-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.pwd-rule {
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
.pwd-rule--ok {
  color: var(--kubo-green);
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}

/* Feedback */
.profile-feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  padding: 10px 13px;
}
.profile-feedback--success {
  color: var(--kubo-green);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.profile-feedback--error {
  color: var(--kubo-danger, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Save button */
.profile-save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity var(--transition-base);
  box-shadow: 0 4px 16px var(--kubo-green-shadow);
  width: 100%;
  min-height: 40px;
  margin-top: auto;
}
.profile-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.profile-save-btn:not(:disabled):hover {
  opacity: 0.9;
}
.profile-save-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Logout */
.profile-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  color: var(--kubo-danger, #ef4444);
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all var(--transition-base);
}
.profile-logout:hover {
  background: rgba(239, 68, 68, 0.12);
}
.profile-logout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
