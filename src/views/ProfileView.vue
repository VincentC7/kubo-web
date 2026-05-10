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
    case 'admin': return 'Administrateur'
    case 'user': return 'Membre'
    default: return 'Visiteur'
  }
})

const initials = computed(() => {
  if (user.value?.firstName && user.value?.lastName) {
    return (user.value.firstName[0] + user.value.lastName[0]).toUpperCase()
  }
  const email = user.value?.email ?? ''
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
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
  if (!editFirstName.value.trim()) { profileFieldErrors.value.firstName = 'Le prénom est requis'; valid = false }
  if (!editLastName.value.trim()) { profileFieldErrors.value.lastName = 'Le nom est requis'; valid = false }
  if (!valid) return

  profileSaving.value = true
  try {
    await userStore.updateProfile({
      firstName: editFirstName.value.trim(),
      lastName: editLastName.value.trim(),
    })
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
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
const pwdFieldErrors = ref<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})

const { passwordRules, isPasswordValid: isNewPasswordValid } = usePasswordRules(newPassword)

async function savePassword(): Promise<void> {
  pwdFieldErrors.value = {}
  pwdError.value = null
  pwdSuccess.value = false

  let valid = true
  if (!currentPassword.value) { pwdFieldErrors.value.currentPassword = 'Le mot de passe actuel est requis'; valid = false }
  if (!isNewPasswordValid.value) { pwdFieldErrors.value.newPassword = 'Le nouveau mot de passe ne respecte pas les critères'; valid = false }
  if (confirmPassword.value !== newPassword.value) { pwdFieldErrors.value.confirmPassword = 'Les mots de passe ne correspondent pas'; valid = false }
  if (!valid) return

  pwdSaving.value = true
  try {
    await userStore.changePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    pwdSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { pwdSuccess.value = false }, 3000)
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
  <div class="profile fade-in" data-testid="profile-view">

    <!-- Header -->
    <div class="profile__header">
      <div>
        <h1 class="kb-h1">Mon <span class="roman">profil.</span></h1>
        <p class="profile__sub">Gérez vos informations personnelles et votre sécurité.</p>
      </div>
    </div>

    <!-- Identity bento card (sage) -->
    <div class="profile__identity-card">
      <div class="profile__identity-left">
        <div class="profile__avatar" :style="avatarStyle">
          <span>{{ initials || '?' }}</span>
        </div>
        <div class="profile__identity-info">
          <p class="profile__identity-name">{{ displayName }}</p>
          <p class="profile__identity-email">{{ user?.email }}</p>
          <span :class="['profile__role-badge', `profile__role-badge--${authStore.currentRole}`]">
            {{ roleLabel }}
          </span>
        </div>
      </div>
      <!-- MOCK stats -->
      <div class="profile__stats">
        <div class="profile__stat">
          <span class="profile__stat-val">—</span>
          <span class="profile__stat-label">Recettes</span>
        </div>
        <div class="profile__stat">
          <span class="profile__stat-val">—</span>
          <span class="profile__stat-label">Semaines</span>
        </div>
        <div class="profile__stat">
          <span class="profile__stat-val">—</span>
          <span class="profile__stat-label">Budget</span>
        </div>
      </div>
    </div>

    <!-- Two-col grid: edit + password -->
    <div class="profile__grid">

      <!-- Edit profile -->
      <div class="profile__card">
        <h2 class="profile__card-title">
          <KuboIcon name="user" :size="15" />
          Informations
        </h2>

        <form class="profile__form" @submit.prevent="saveProfile">
          <div class="profile__field-row">
            <div class="profile__field">
              <label class="profile__label" for="edit-firstname">Prénom</label>
              <input
                id="edit-firstname"
                v-model="editFirstName"
                type="text"
                :class="['profile__input', { 'profile__input--error': profileFieldErrors.firstName }]"
                placeholder="Jean"
                :disabled="profileSaving"
              />
              <p v-if="profileFieldErrors.firstName" class="profile__field-error">{{ profileFieldErrors.firstName }}</p>
            </div>
            <div class="profile__field">
              <label class="profile__label" for="edit-lastname">Nom</label>
              <input
                id="edit-lastname"
                v-model="editLastName"
                type="text"
                :class="['profile__input', { 'profile__input--error': profileFieldErrors.lastName }]"
                placeholder="Dupont"
                :disabled="profileSaving"
              />
              <p v-if="profileFieldErrors.lastName" class="profile__field-error">{{ profileFieldErrors.lastName }}</p>
            </div>
          </div>

          <div v-if="profileSuccess" class="profile__feedback profile__feedback--ok">
            <KuboIcon name="check-circle" :size="14" />Profil mis à jour.
          </div>
          <div v-if="profileError" class="profile__feedback profile__feedback--err">
            <KuboIcon name="alert-circle" :size="14" />{{ profileError }}
          </div>

          <button type="submit" class="btn-sage profile__submit" :disabled="profileSaving">
            <span v-if="profileSaving" class="btn-spinner" />
            <template v-else><KuboIcon name="save" :size="14" />Enregistrer</template>
          </button>
        </form>
      </div>

      <!-- Change password -->
      <div class="profile__card">
        <h2 class="profile__card-title">
          <KuboIcon name="lock" :size="15" />
          Sécurité
        </h2>

        <form class="profile__form" @submit.prevent="savePassword">
          <div class="profile__field">
            <label class="profile__label" for="current-pwd">Mot de passe actuel</label>
            <div class="profile__input-wrap">
              <KuboIcon name="lock" :size="14" class="profile__input-icon" />
              <input
                id="current-pwd"
                v-model="currentPassword"
                :type="showCurrentPwd ? 'text' : 'password'"
                :class="['profile__input profile__input--left profile__input--right', { 'profile__input--error': pwdFieldErrors.currentPassword }]"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="pwdSaving"
              />
              <button type="button" class="profile__eye" @click="showCurrentPwd = !showCurrentPwd">
                <KuboIcon :name="showCurrentPwd ? 'eye-off' : 'eye'" :size="14" />
              </button>
            </div>
            <p v-if="pwdFieldErrors.currentPassword" class="profile__field-error">{{ pwdFieldErrors.currentPassword }}</p>
          </div>

          <div class="profile__field">
            <label class="profile__label" for="new-pwd">Nouveau mot de passe</label>
            <div class="profile__input-wrap">
              <KuboIcon name="lock" :size="14" class="profile__input-icon" />
              <input
                id="new-pwd"
                v-model="newPassword"
                :type="showNewPwd ? 'text' : 'password'"
                :class="['profile__input profile__input--left profile__input--right', { 'profile__input--error': pwdFieldErrors.newPassword }]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="pwdSaving"
              />
              <button type="button" class="profile__eye" @click="showNewPwd = !showNewPwd">
                <KuboIcon :name="showNewPwd ? 'eye-off' : 'eye'" :size="14" />
              </button>
            </div>
            <div v-if="newPassword.length > 0" class="pwd-rules">
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.length }]">
                <KuboIcon :name="passwordRules.length ? 'check' : 'x'" :size="10" />8 car.
              </span>
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.uppercase }]">
                <KuboIcon :name="passwordRules.uppercase ? 'check' : 'x'" :size="10" />Maj.
              </span>
              <span :class="['pwd-rule', { 'pwd-rule--ok': passwordRules.digit }]">
                <KuboIcon :name="passwordRules.digit ? 'check' : 'x'" :size="10" />Chiffre
              </span>
            </div>
            <p v-if="pwdFieldErrors.newPassword" class="profile__field-error">{{ pwdFieldErrors.newPassword }}</p>
          </div>

          <div class="profile__field">
            <label class="profile__label" for="confirm-pwd">Confirmer</label>
            <div class="profile__input-wrap">
              <KuboIcon name="lock" :size="14" class="profile__input-icon" />
              <input
                id="confirm-pwd"
                v-model="confirmPassword"
                :type="showConfirmPwd ? 'text' : 'password'"
                :class="['profile__input profile__input--left profile__input--right', { 'profile__input--error': pwdFieldErrors.confirmPassword }]"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="pwdSaving"
              />
              <button type="button" class="profile__eye" @click="showConfirmPwd = !showConfirmPwd">
                <KuboIcon :name="showConfirmPwd ? 'eye-off' : 'eye'" :size="14" />
              </button>
            </div>
            <p v-if="pwdFieldErrors.confirmPassword" class="profile__field-error">{{ pwdFieldErrors.confirmPassword }}</p>
          </div>

          <div v-if="pwdSuccess" class="profile__feedback profile__feedback--ok">
            <KuboIcon name="check-circle" :size="14" />Mot de passe mis à jour.
          </div>
          <div v-if="pwdError" class="profile__feedback profile__feedback--err">
            <KuboIcon name="alert-circle" :size="14" />{{ pwdError }}
          </div>

          <button type="submit" class="btn-sage profile__submit" :disabled="pwdSaving">
            <span v-if="pwdSaving" class="btn-spinner" />
            <template v-else><KuboIcon name="key" :size="14" />Changer</template>
          </button>
        </form>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="profile__danger">
      <button class="btn-danger" :disabled="isLoading" @click="logout">
        <KuboIcon name="log-out" :size="14" />
        Se déconnecter
      </button>
    </div>

  </div>
</template>

<style scoped>
.profile {
  padding: 30px 36px 40px;
  max-width: 900px;
}

.profile__header {
  margin-bottom: 24px;
}
.profile__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
}

/* Identity card */
.profile__identity-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  background: var(--kubo-green);
  border-radius: var(--radius-xl);
  padding: 28px 32px;
  margin-bottom: 20px;
  color: #fffdf7;
}
.profile__identity-left {
  display: flex;
  align-items: center;
  gap: 18px;
}
.profile__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
  border: 3px solid rgba(255,253,247,.3);
}
.profile__identity-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile__identity-name {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.3px;
  color: #fffdf7;
}
.profile__identity-email {
  font-size: 13px;
  color: rgba(255,253,247,.65);
}
.profile__role-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  border-radius: 999px;
  padding: 3px 10px;
  width: fit-content;
  background: rgba(255,253,247,.15);
  color: #fffdf7;
}

/* MOCK stats */
.profile__stats {
  display: flex;
  gap: 32px;
}
.profile__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.profile__stat-val {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 28px;
  color: #fffdf7;
  letter-spacing: -1px;
}
.profile__stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: rgba(255,253,247,.6);
}

/* Two-col grid */
.profile__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .profile__grid { grid-template-columns: 1fr; }
}

/* Card */
.profile__card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-card);
}
.profile__card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--kubo-text-muted);
}

/* Form */
.profile__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}
.profile__field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.profile__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--kubo-text-faint);
}
.profile__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.profile__input {
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
  box-sizing: border-box;
}
.profile__input--left { padding-left: 36px; }
.profile__input--right { padding-right: 38px; }
.profile__input--error { border-color: var(--kubo-tomato); }
.profile__input:focus { border-color: var(--kubo-green); }
.profile__input:disabled { opacity: .5; cursor: not-allowed; }
.profile__input-icon {
  position: absolute;
  left: 12px;
  color: var(--kubo-text-faint);
  pointer-events: none;
}
.profile__eye {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--kubo-text-faint);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.profile__field-error {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--kubo-tomato-deep);
}

/* Password rules */
.pwd-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
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
  background: var(--kubo-green-light);
  border-color: var(--kubo-sage-soft);
}

/* Feedback */
.profile__feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  padding: 10px 13px;
}
.profile__feedback--ok {
  color: var(--kubo-green);
  background: var(--kubo-green-light);
  border: 1px solid var(--kubo-sage-soft);
}
.profile__feedback--err {
  color: var(--kubo-tomato-deep);
  background: var(--kubo-tomato-soft);
  border: 1px solid var(--kubo-tomato);
}

/* Buttons */
.btn-sage {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--kubo-green);
  color: #fffdf7;
  border: none;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-base);
  transition: filter var(--transition-base);
}
.btn-sage:hover { filter: brightness(1.08); }
.btn-sage:disabled { opacity: .5; cursor: not-allowed; filter: none; }

.profile__submit { width: 100%; justify-content: center; margin-top: auto; }

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Danger zone */
.profile__danger {
  display: flex;
  justify-content: flex-start;
}
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--kubo-tomato-soft);
  border: 1px solid var(--kubo-tomato);
  color: var(--kubo-tomato-deep);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-base);
  transition: all var(--transition-base);
}
.btn-danger:hover { background: var(--kubo-tomato); color: #fff; }
.btn-danger:disabled { opacity: .5; cursor: not-allowed; }
</style>
