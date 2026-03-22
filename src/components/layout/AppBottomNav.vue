<script setup lang="ts">
/**
 * AppBottomNav — Navigation mobile fixée en bas de l'écran (< 768px)
 * Miroir de la sidebar : mêmes items, même logique de visibilité.
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore'
import type { ViewName } from '@/stores/uiStore'

const uiStore = useUiStore()
const { currentView, showInventory, showGroceries } = storeToRefs(uiStore)
const { navTo } = uiStore

interface NavItem {
  id: ViewName
  label: string
  icon: string
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Accueil', icon: 'layout-dashboard' },
  { id: 'catalog', label: 'Recettes', icon: 'utensils' },
  { id: 'planning', label: 'Menu', icon: 'calendar' },
  { id: 'groceries', label: 'Courses', icon: 'shopping-cart' },
  { id: 'inventory', label: 'Inventaire', icon: 'box' },
  { id: 'settings', label: 'Réglages', icon: 'settings' },
]

function isVisible(item: NavItem): boolean {
  if (item.id === 'inventory') return showInventory.value
  if (item.id === 'groceries') return showGroceries.value
  return true
}
</script>

<template>
  <nav class="bottom-nav" data-testid="bottom-nav" aria-label="Navigation principale">
    <template v-for="item in ALL_NAV_ITEMS" :key="item.id">
      <button
        v-if="isVisible(item)"
        :class="['bottom-nav__item', { 'bottom-nav__item--active': currentView === item.id }]"
        :data-testid="`bottom-nav-${item.id}`"
        :aria-label="item.label"
        @click="navTo(item.id)"
      >
        <KuboIcon :name="item.icon" :size="22" />
        <span class="bottom-nav__label">{{ item.label }}</span>
      </button>
    </template>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: stretch;
  background: var(--kubo-surface);
  border-top: 1px solid var(--kubo-border);
  /* Safe area pour iPhone avec encoche */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}

/* Visible uniquement en mobile */
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 4px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  cursor: pointer;
  font-family: var(--font-base);
  transition: color var(--transition-base);
  min-width: 0;
}

.bottom-nav__item:hover {
  color: var(--kubo-text);
}

.bottom-nav__item--active {
  color: var(--kubo-green);
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
