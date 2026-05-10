<script setup lang="ts">
import { ref, watch } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'

const uiStore = useUiStore()
const { darkMode, showInventory, showGroceries } = storeToRefs(uiStore)
const { toggleDarkMode, notify } = uiStore

const userStore = useUserStore()
const { portions, mealsGoal } = storeToRefs(userStore)
const { updatePortions, updateMealsGoal } = userStore

const localShowInventory = ref(showInventory.value)
const localShowGroceries = ref(showGroceries.value)

watch(showInventory, (v) => { localShowInventory.value = v })
watch(showGroceries, (v) => { localShowGroceries.value = v })

const localPortions = ref(portions.value)
const localMealsGoal = ref(mealsGoal.value)

watch(portions, (v) => { localPortions.value = v })
watch(mealsGoal, (v) => { localMealsGoal.value = v })

let portionsTimer: ReturnType<typeof setTimeout> | null = null
let mealsTimer: ReturnType<typeof setTimeout> | null = null

function changePortions(delta: number): void {
  localPortions.value = Math.max(1, localPortions.value + delta)
  if (portionsTimer) clearTimeout(portionsTimer)
  portionsTimer = setTimeout(async () => {
    const diff = localPortions.value - portions.value
    if (diff !== 0) await updatePortions(diff)
    portionsTimer = null
  }, 300)
}

function changeMealsGoal(delta: number): void {
  localMealsGoal.value = Math.max(1, localMealsGoal.value + delta)
  if (mealsTimer) clearTimeout(mealsTimer)
  mealsTimer = setTimeout(async () => {
    const diff = localMealsGoal.value - mealsGoal.value
    if (diff !== 0) await updateMealsGoal(diff)
    mealsTimer = null
  }, 300)
}

function save(): void {
  uiStore.setShowInventory(localShowInventory.value)
  uiStore.setShowGroceries(localShowGroceries.value)
  notify('Paramètres sauvegardés')
}
</script>

<template>
  <div class="settings fade-in" data-testid="settings-view">

    <!-- Header -->
    <div class="settings__header">
      <h1 class="kb-h1">Paramètres<span class="roman">.</span></h1>
      <p class="settings__sub">Personnalisez votre expérience Kubo.</p>
    </div>

    <div class="settings__grid">

      <!-- Modules -->
      <div class="settings__section">
        <p class="settings__section-label">Modules</p>

        <div class="settings__card">
          <!-- Inventaire -->
          <div class="settings__row">
            <div class="settings__row-left">
              <div class="settings__icon-wrap settings__icon-wrap--ochre">
                <KuboIcon name="box" :size="18" />
              </div>
              <div>
                <p class="settings__row-title">Inventaire</p>
                <p class="settings__row-desc">Gérer vos stocks d'ingrédients</p>
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
          </div>

          <div class="settings__divider" />

          <!-- Courses -->
          <div class="settings__row">
            <div class="settings__row-left">
              <div class="settings__icon-wrap settings__icon-wrap--blue">
                <KuboIcon name="shopping-cart" :size="18" />
              </div>
              <div>
                <p class="settings__row-title">Courses</p>
                <p class="settings__row-desc">Liste de courses automatique</p>
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
          </div>
        </div>
      </div>

      <!-- Mon foyer -->
      <div class="settings__section">
        <p class="settings__section-label">Mon foyer</p>

        <div class="settings__card">
          <!-- Portions -->
          <div class="settings__row">
            <div class="settings__row-left">
              <div class="settings__icon-wrap">
                <KuboIcon name="users" :size="18" />
              </div>
              <div>
                <p class="settings__row-title">Portions</p>
                <p class="settings__row-desc">Nombre de convives</p>
              </div>
            </div>
            <div class="settings__stepper">
              <button class="settings__step-btn" @click="changePortions(-1)">
                <KuboIcon name="minus" :size="13" />
              </button>
              <span class="settings__step-val" data-testid="portions-value">{{ localPortions }}</span>
              <button class="settings__step-btn" @click="changePortions(1)">
                <KuboIcon name="plus" :size="13" />
              </button>
            </div>
          </div>

          <div class="settings__divider" />

          <!-- Repas / semaine -->
          <div class="settings__row">
            <div class="settings__row-left">
              <div class="settings__icon-wrap">
                <KuboIcon name="calendar" :size="18" />
              </div>
              <div>
                <p class="settings__row-title">Repas / semaine</p>
                <p class="settings__row-desc">Objectif hebdomadaire</p>
              </div>
            </div>
            <div class="settings__stepper">
              <button class="settings__step-btn" @click="changeMealsGoal(-1)">
                <KuboIcon name="minus" :size="13" />
              </button>
              <span class="settings__step-val" data-testid="meals-goal-value">{{ localMealsGoal }}</span>
              <button class="settings__step-btn" @click="changeMealsGoal(1)">
                <KuboIcon name="plus" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Apparence -->
      <div class="settings__section">
        <p class="settings__section-label">Apparence</p>

        <div class="settings__card">
          <div class="settings__row">
            <div class="settings__row-left">
              <div :class="['settings__icon-wrap', darkMode ? 'settings__icon-wrap--ochre' : '']">
                <KuboIcon :name="darkMode ? 'sun' : 'moon'" :size="18" />
              </div>
              <div>
                <p class="settings__row-title">Mode sombre</p>
                <p class="settings__row-desc">Style &amp; Confort nocturne</p>
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
          </div>
        </div>
      </div>

    </div>

    <!-- Save -->
    <div class="settings__footer">
      <button class="btn-sage" data-testid="settings-save-btn" @click="save">
        <KuboIcon name="check" :size="14" />
        Sauvegarder
      </button>
    </div>

  </div>
</template>

<style scoped>
.settings {
  padding: 30px 36px 40px;
  max-width: 680px;
}

.settings__header {
  margin-bottom: 28px;
}
.settings__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
}

/* Grid */
.settings__grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings__section-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--kubo-text-faint);
  padding: 0 4px;
  margin-bottom: 10px;
}

/* Card */
.settings__card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}
.settings__row-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings__icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.settings__icon-wrap--ochre {
  background: var(--kubo-ochre-soft);
  color: var(--kubo-ochre);
}
.settings__icon-wrap--blue {
  background: var(--kubo-blue-soft);
  color: var(--kubo-blue);
}
.settings__row-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--kubo-text);
  line-height: 1.3;
}
.settings__row-desc {
  font-size: 12px;
  color: var(--kubo-text-faint);
  margin-top: 2px;
}

.settings__divider {
  height: 1px;
  background: var(--kubo-border);
  margin: 0 20px;
}

/* Toggle */
.settings__toggle {
  width: 48px;
  height: 28px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: 99px;
  cursor: pointer;
  position: relative;
  transition: background var(--transition-base), border-color var(--transition-base);
  padding: 3px;
  flex-shrink: 0;
}
.settings__toggle--on {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
}
.settings__toggle-thumb {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  display: block;
  transform: translateX(0);
  transition: transform var(--transition-base);
}
.settings__toggle--on .settings__toggle-thumb {
  transform: translateX(20px);
}

/* Stepper */
.settings__stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.settings__step-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-sm);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}
.settings__step-btn:hover {
  border-color: var(--kubo-green);
  color: var(--kubo-green);
}
.settings__step-val {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 22px;
  color: var(--kubo-text);
  min-width: 28px;
  text-align: center;
}

/* Footer */
.settings__footer {
  margin-top: 24px;
}
.btn-sage {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
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
</style>
