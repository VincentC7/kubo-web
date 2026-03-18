<script setup>
/**
 * SettingsView — Vue paramètres : modules, objectifs, dark mode
 */
import { ref, watch } from 'vue'
import KuboCard from '@/components/ui/KuboCard.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/appStore.js'

const store = useAppStore()
const { darkMode, showInventory, showGroceries, portions, mealsGoal } = storeToRefs(store)
const { toggleDarkMode, notify, updatePortions, updateMealsGoal } = store

const localShowInventory = ref(showInventory.value)
const localShowGroceries = ref(showGroceries.value)

watch(showInventory, (v) => {
  localShowInventory.value = v
})
watch(showGroceries, (v) => {
  localShowGroceries.value = v
})

function save() {
  showInventory.value = localShowInventory.value
  showGroceries.value = localShowGroceries.value
  notify('Paramètres sauvegardés')
}
</script>

<template>
  <div class="settings fade-in" data-testid="settings-view">
    <header class="settings__header">
      <h1 class="settings__title">Paramètres</h1>
    </header>

    <div class="settings__stack">
      <!-- Module Inventaire -->
      <KuboCard rounded="2xl" class="settings__card settings__card--row">
        <div class="settings__module-left">
          <div class="settings__module-icon-wrap">
            <KuboIcon name="box" :size="22" class="settings__card-icon" />
          </div>
          <div>
            <h3 class="settings__module-title">Module Inventaire</h3>
            <p class="settings__module-desc">Gérer vos stocks d'ingrédients</p>
          </div>
        </div>
        <button
          :class="['settings__toggle', { 'settings__toggle--on': localShowInventory }]"
          :aria-checked="localShowInventory"
          role="switch"
          aria-label="Activer le module Inventaire"
          data-testid="inventory-toggle"
          @click="localShowInventory = !localShowInventory"
        >
          <span class="settings__toggle-thumb" />
        </button>
      </KuboCard>

      <!-- Module Courses -->
      <KuboCard rounded="2xl" class="settings__card settings__card--row">
        <div class="settings__module-left">
          <div class="settings__module-icon-wrap">
            <KuboIcon name="shopping-cart" :size="22" class="settings__card-icon" />
          </div>
          <div>
            <h3 class="settings__module-title">Module Courses</h3>
            <p class="settings__module-desc">Liste de courses automatique</p>
          </div>
        </div>
        <button
          :class="['settings__toggle', { 'settings__toggle--on': localShowGroceries }]"
          :aria-checked="localShowGroceries"
          role="switch"
          aria-label="Activer le module Courses"
          data-testid="groceries-toggle"
          @click="localShowGroceries = !localShowGroceries"
        >
          <span class="settings__toggle-thumb" />
        </button>
      </KuboCard>

      <!-- Objectifs -->
      <KuboCard rounded="2xl" class="settings__card">
        <h3 class="settings__card-title">
          <KuboIcon name="user" :size="18" class="settings__card-icon" />
          Mon foyer
        </h3>
        <div class="settings__steppers">
          <!-- Portions -->
          <div class="settings__stepper">
            <span class="settings__stepper-label">Nombre de portions</span>
            <div class="settings__stepper-ctrl">
              <button class="settings__stepper-btn" @click="updatePortions(-1)">
                <KuboIcon name="minus" :size="14" />
              </button>
              <span class="settings__stepper-value" data-testid="portions-value">{{
                portions
              }}</span>
              <button class="settings__stepper-btn" @click="updatePortions(1)">
                <KuboIcon name="plus" :size="14" />
              </button>
            </div>
          </div>
          <!-- Repas / semaine -->
          <div class="settings__stepper">
            <span class="settings__stepper-label">Repas / semaine</span>
            <div class="settings__stepper-ctrl">
              <button class="settings__stepper-btn" @click="updateMealsGoal(-1)">
                <KuboIcon name="minus" :size="14" />
              </button>
              <span class="settings__stepper-value" data-testid="meals-goal-value">{{
                mealsGoal
              }}</span>
              <button class="settings__stepper-btn" @click="updateMealsGoal(1)">
                <KuboIcon name="plus" :size="14" />
              </button>
            </div>
          </div>
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

/* Module cards */
.settings__module-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings__module-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--kubo-green-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-green);
}
.settings__module-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--kubo-text);
}
.settings__module-desc {
  font-size: 11px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-top: 2px;
}

/* Steppers */
.settings__steppers {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-lg);
}
.settings__stepper-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text);
}
.settings__stepper-ctrl {
  display: flex;
  align-items: center;
  gap: 12px;
}
.settings__stepper-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface);
  border-radius: var(--radius-sm);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}
.settings__stepper-btn:hover {
  border-color: var(--kubo-green);
  color: var(--kubo-green);
}
.settings__stepper-value {
  font-size: 16px;
  font-weight: 900;
  color: var(--kubo-text);
  min-width: 24px;
  text-align: center;
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
