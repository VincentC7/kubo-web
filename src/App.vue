<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import ToastNotification from '@/components/layout/ToastNotification.vue'
import DashboardView from '@/views/DashboardView.vue'
import CatalogView from '@/views/CatalogView.vue'
import PlanningView from '@/views/PlanningView.vue'
import GroceriesView from '@/views/GroceriesView.vue'
import InventoryView from '@/views/InventoryView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useAuthStore } from '@/stores/authStore'

const uiStore = useUiStore()
const { currentView } = storeToRefs(uiStore)

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const loading = ref(true)

// La modale auth est ouverte si on est sur login ou register
const isAuthModal = computed(
  () => currentView.value === 'login' || currentView.value === 'register',
)

// La vue affichée derrière la modale (ou principale si pas de modale)
const shellView = computed(() => {
  if (isAuthModal.value) return 'catalog'
  return currentView.value
})

onMounted(async () => {
  try {
    await authStore.tryRefresh()

    if (isAuthenticated.value) {
      uiStore.navTo('dashboard')
    } else {
      uiStore.navTo('catalog')
    }

    await useUserStore().init()

    if (isAuthenticated.value) {
      await Promise.all([
        useRecipeStore().init(),
        usePlanningStore().init(),
        useInventoryStore().init(),
      ])
    } else {
      await useRecipeStore().init()
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="app-root">
    <!-- Loading global -->
    <div v-if="loading" class="app-loader">
      <div class="app-loader__logo">
        <span class="app-loader__k">K</span>
      </div>
      <div class="app-loader__spinner" />
    </div>

    <!-- App shell (toujours monté après le loading) -->
    <div v-else class="app-shell">
      <AppSidebar class="app-shell__sidebar" />

      <div class="app-shell__main">
        <AppHeader />

        <main class="app-shell__content custom-scrollbar">
          <Transition name="view" mode="out-in">
            <DashboardView v-if="shellView === 'dashboard'" key="dashboard" />
            <CatalogView v-else-if="shellView === 'catalog'" key="catalog" />
            <PlanningView v-else-if="shellView === 'planning'" key="planning" />
            <GroceriesView v-else-if="shellView === 'groceries'" key="groceries" />
            <InventoryView v-else-if="shellView === 'inventory'" key="inventory" />
            <SettingsView v-else-if="shellView === 'settings'" key="settings" />
            <ProfileView v-else-if="shellView === 'profile'" key="profile" />
          </Transition>
        </main>
      </div>

      <ToastNotification />
      <AppBottomNav class="app-shell__bottom-nav" />

      <!-- Modale auth (login / register) par-dessus le shell -->
      <Transition name="modal">
        <AuthModal v-if="isAuthModal" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.app-root {
  height: 100vh;
  width: 100vw;
}

/* Loader */
.app-loader {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: var(--kubo-bg);
}
.app-loader__logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px var(--kubo-green-shadow);
}
.app-loader__k {
  color: #fff;
  font-weight: 900;
  font-size: 28px;
  line-height: 1;
}
.app-loader__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--kubo-border);
  border-top-color: var(--kubo-green);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Shell */
.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--kubo-bg);
  position: relative;
}

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

@media (max-width: 767px) {
  .app-shell__content {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
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

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .auth-modal__card,
.modal-leave-active .auth-modal__card {
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
</style>
