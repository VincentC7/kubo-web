<script setup lang="ts">
/**
 * AppHeader — Organisme en-tête global sticky (contextuel)
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboProgressBar from '@/components/ui/KuboProgressBar.vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useInventoryStore } from '@/stores/inventoryStore'

const uiStore = useUiStore()
const { currentView } = storeToRefs(uiStore)

const planningStore = usePlanningStore()
const { periodLabel } = storeToRefs(planningStore)
const { changePeriod, clearPlanning } = planningStore

const inventoryStore = useInventoryStore()
const { progressPercent, progressText } = storeToRefs(inventoryStore)

const progressLabel = 'Courses cochées'
</script>

<template>
  <header
    v-if="
      currentView !== 'settings' &&
      currentView !== 'login' &&
      currentView !== 'register' &&
      currentView !== 'profile'
    "
    class="app-header"
    data-testid="app-header"
  >
    <!-- Period selector -->
    <div class="app-header__week" data-testid="week-selector">
      <button
        class="app-header__week-btn"
        title="Période précédente"
        data-testid="week-prev"
        @click="changePeriod(-1)"
      >
        <KuboIcon name="chevron-left" :size="18" />
      </button>
      <span class="app-header__week-label" data-testid="week-label">{{ periodLabel }}</span>
      <button
        class="app-header__week-btn"
        title="Période suivante"
        data-testid="week-next"
        @click="changePeriod(1)"
      >
        <KuboIcon name="chevron-right" :size="18" />
      </button>
    </div>

    <!-- Right -->
    <div class="app-header__right">
      <!-- Reset button (planning only) -->
      <KuboButton
        v-if="currentView === 'planning'"
        variant="danger"
        size="sm"
        data-testid="toolbar-reset-btn"
        @click="clearPlanning"
      >
        <KuboIcon name="rotate-ccw" :size="14" />
        Reset
      </KuboButton>

      <!-- Progress -->
      <div class="app-header__progress">
        <p class="app-header__progress-label">{{ progressLabel }}</p>
        <div class="app-header__progress-bar">
          <span class="app-header__progress-text">{{ progressText }}</span>
          <KuboProgressBar :value="progressPercent" :thin="true" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--kubo-border-mid);
}
:global(.dark) .app-header {
  background: rgba(2, 6, 23, 0.85);
}

/* Week selector */
.app-header__week {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border-mid);
  border-radius: var(--radius-lg);
  padding: 4px;
}
.app-header__week-btn {
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  transition: all var(--transition-base);
}
.app-header__week-btn:hover {
  background: var(--kubo-surface);
  color: var(--kubo-green);
  box-shadow: var(--shadow-card);
}
.app-header__week-label {
  padding: 0 20px;
  font-weight: 800;
  font-size: 13px;
  min-width: 200px;
  text-align: center;
  color: var(--kubo-text);
}

/* Right */
.app-header__right {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Progress */
.app-header__progress {
  display: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
@media (min-width: 1024px) {
  .app-header__progress {
    display: flex;
  }
}
.app-header__progress-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--kubo-text-faint);
}
.app-header__progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-header__progress-text {
  font-size: 11px;
  font-weight: 800;
  color: var(--kubo-green);
}
</style>
