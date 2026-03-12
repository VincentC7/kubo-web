<script setup>
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastNotification from '@/components/layout/ToastNotification.vue'
import DashboardView from '@/views/DashboardView.vue'
import CatalogView from '@/views/CatalogView.vue'
import PlanningView from '@/views/PlanningView.vue'
import GroceriesView from '@/views/GroceriesView.vue'
import InventoryView from '@/views/InventoryView.vue'
import SettingsView from '@/views/SettingsView.vue'
import { useApp } from '@/composables/useApp.js'

const { currentView, loading, init } = useApp()

onMounted(() => init())
</script>

<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <AppSidebar class="app-shell__sidebar" />

    <!-- Main -->
    <div class="app-shell__main">
      <AppHeader />

      <!-- Loading state -->
      <div v-if="loading" class="app-shell__loader">
        <div class="app-shell__spinner" />
        <p>Chargement…</p>
      </div>

      <!-- Views -->
      <main v-else class="app-shell__content custom-scrollbar">
        <Transition name="view" mode="out-in">
          <DashboardView v-if="currentView === 'dashboard'" key="dashboard" />
          <CatalogView v-else-if="currentView === 'catalog'" key="catalog" />
          <PlanningView v-else-if="currentView === 'planning'" key="planning" />
          <GroceriesView v-else-if="currentView === 'groceries'" key="groceries" />
          <InventoryView v-else-if="currentView === 'inventory'" key="inventory" />
          <SettingsView v-else-if="currentView === 'settings'" key="settings" />
        </Transition>
      </main>
    </div>

    <ToastNotification />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--kubo-bg);
}

/* Sidebar masquée sur mobile */
.app-shell__sidebar {
  display: none;
}
@media (min-width: 768px) {
  .app-shell__sidebar {
    display: flex;
  }
}

.app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.app-shell__content {
  flex: 1;
  overflow-y: auto;
}

/* Loader */
.app-shell__loader {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--kubo-text-muted);
  font-size: 14px;
  font-weight: 700;
}
.app-shell__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--kubo-border);
  border-top-color: var(--kubo-green);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* View transitions */
.view-enter-active,
.view-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.view-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.view-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
