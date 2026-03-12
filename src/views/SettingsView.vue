<script setup>
/**
 * SettingsView — Vue paramètres utilisateur
 */
import { ref, watch } from 'vue'
import KuboCard from '@/components/ui/KuboCard.vue'
import KuboInput from '@/components/ui/KuboInput.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { useApp } from '@/composables/useApp.js'
import { apiService } from '@/services/api.js'

const { user, darkMode, toggleDarkMode, notify } = useApp()

const localName = ref(user.value?.name ?? '')
const localKcal = ref(user.value?.goalKcal ?? 2000)
const saving = ref(false)

// Synchronise si user charge après le montage
watch(user, (u) => {
  if (u) {
    localName.value = u.name
    localKcal.value = u.goalKcal
  }
})

async function save() {
  saving.value = true
  try {
    await apiService.saveUser({ name: localName.value, goalKcal: Number(localKcal.value) })
    user.value = { ...user.value, name: localName.value, goalKcal: Number(localKcal.value) }
    notify('Profil sauvegardé')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings fade-in" data-testid="settings-view">
    <header class="settings__header">
      <h1 class="settings__title">Paramètres</h1>
    </header>

    <div class="settings__stack">
      <!-- Profil -->
      <KuboCard rounded="2xl" class="settings__card">
        <h3 class="settings__card-title">
          <KuboIcon name="user" :size="18" class="settings__card-icon" />
          Profil Utilisateur
        </h3>
        <div class="settings__fields">
          <KuboInput v-model="localName" label="Pseudo" placeholder="Votre prénom" />
          <KuboInput
            v-model="localKcal"
            type="number"
            label="Objectif Calories"
            placeholder="2000"
          />
        </div>
      </KuboCard>

      <!-- Dark mode -->
      <KuboCard rounded="2xl" class="settings__card settings__card--row">
        <div class="settings__dark-left">
          <div class="settings__dark-icon-wrap">
            <KuboIcon :name="darkMode ? 'sun' : 'moon'" :size="22" class="settings__card-icon" />
          </div>
          <div>
            <h3 class="settings__dark-title">Mode sombre</h3>
            <p class="settings__dark-sub">Style &amp; Confort</p>
          </div>
        </div>
        <!-- Toggle switch -->
        <button
          :class="['settings__toggle', { 'settings__toggle--on': darkMode }]"
          :aria-checked="darkMode"
          role="switch"
          aria-label="Activer le mode sombre"
          data-testid="darkmode-toggle"
          @click="toggleDarkMode"
        >
          <span class="settings__toggle-thumb" />
        </button>
      </KuboCard>
    </div>

    <KuboButton
      variant="primary"
      size="lg"
      :full-width="true"
      :loading="saving"
      class="settings__save"
      data-testid="settings-save-btn"
      @click="save"
    >
      Sauvegarder
    </KuboButton>
  </div>
</template>

<style scoped>
.settings {
  padding: 48px;
  max-width: 600px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .settings {
    padding: 24px;
  }
}

.settings__header {
  margin-bottom: 32px;
}
.settings__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}

.settings__stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings__card {
  padding: 28px !important;
}
.settings__card--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings__card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 20px;
}
.settings__card-icon {
  color: var(--kubo-green);
}

.settings__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Dark toggle */
.settings__dark-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings__dark-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-green);
}
.settings__dark-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--kubo-text);
}
.settings__dark-sub {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--kubo-text-muted);
  margin-top: 2px;
}

.settings__toggle {
  width: 52px;
  height: 30px;
  background: var(--kubo-surface-mute);
  border: none;
  border-radius: 99px;
  cursor: pointer;
  position: relative;
  transition: background var(--transition-base);
  padding: 3px;
  flex-shrink: 0;
}
.settings__toggle--on {
  background: var(--kubo-green);
}
.settings__toggle-thumb {
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: block;
  transform: translateX(0);
  transition: transform var(--transition-base);
}
.settings__toggle--on .settings__toggle-thumb {
  transform: translateX(22px);
}

.settings__save {
  margin-top: 24px;
}
</style>
