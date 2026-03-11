<script setup>
/**
 * AppHeader — Organisme en-tête global sticky
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboProgressBar from '@/components/ui/KuboProgressBar.vue'
import { useApp } from '@/composables/useApp.js'

const { weekRange, changeWeek, progressPercent, selectedRecipes, doneRecipes, user } = useApp()
</script>

<template>
  <header class="app-header">
    <!-- Week selector -->
    <div class="app-header__week">
      <button class="app-header__week-btn" title="Semaine précédente" @click="changeWeek(-1)">
        <KuboIcon name="chevron-left" :size="18" />
      </button>
      <span class="app-header__week-label">{{ weekRange }}</span>
      <button class="app-header__week-btn" title="Semaine suivante" @click="changeWeek(1)">
        <KuboIcon name="chevron-right" :size="18" />
      </button>
    </div>

    <!-- Right -->
    <div class="app-header__right">
      <!-- Progress -->
      <div class="app-header__progress">
        <p class="app-header__progress-label">Avancement</p>
        <div class="app-header__progress-bar">
          <span class="app-header__progress-text"
            >{{ doneRecipes.length }}/{{ selectedRecipes.length }}</span
          >
          <KuboProgressBar :value="progressPercent" :thin="true" />
        </div>
      </div>

      <!-- Avatar -->
      <div class="app-header__avatar">
        <img
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="user?.name"
          class="app-header__avatar-img"
        />
        <span v-else>{{ user?.initials }}</span>
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

/* Avatar */
.app-header__avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--kubo-surface-mute);
  border: 2px solid var(--kubo-surface);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: var(--kubo-text-muted);
  cursor: pointer;
}
.app-header__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
