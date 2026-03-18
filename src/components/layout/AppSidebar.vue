<script setup>
/**
 * AppSidebar — Organisme navigation principale
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/appStore.js'

const store = useAppStore()
const { currentView, sidebarCollapsed, user, showInventory, showGroceries } = storeToRefs(store)
const { navTo, toggleSidebar } = store

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'layout-dashboard' },
  { id: 'catalog', label: 'Recettes', icon: 'utensils' },
  { id: 'planning', label: 'Menu Hebdo', icon: 'calendar' },
  { id: 'groceries', label: 'Courses', icon: 'shopping-cart' },
  { id: 'inventory', label: 'Inventaire', icon: 'box' },
]

function isNavVisible(item) {
  if (item.id === 'inventory') return showInventory.value
  if (item.id === 'groceries') return showGroceries.value
  return true
}
</script>

<template>
  <aside :class="['sidebar', { 'sidebar--collapsed': sidebarCollapsed }]" data-testid="sidebar">
    <!-- Logo + toggle -->
    <div class="sidebar__top">
      <div class="sidebar__brand">
        <div class="sidebar__logo">
          <span class="sidebar__logo-k">K</span>
        </div>
        <span v-show="!sidebarCollapsed" class="sidebar__name">kubo</span>
      </div>
      <button
        class="sidebar__toggle"
        title="Réduire"
        data-testid="sidebar-toggle"
        @click="toggleSidebar"
      >
        <KuboIcon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" :size="18" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar__nav" data-testid="sidebar-nav">
      <button
        v-for="item in NAV_ITEMS"
        v-show="isNavVisible(item)"
        :key="item.id"
        :class="['sidebar__item', { 'sidebar__item--active': currentView === item.id }]"
        :title="sidebarCollapsed ? item.label : undefined"
        :data-testid="`nav-${item.id}`"
        @click="navTo(item.id)"
      >
        <KuboIcon :name="item.icon" :size="20" />
        <span v-show="!sidebarCollapsed" class="sidebar__label">{{ item.label }}</span>
      </button>

      <div class="sidebar__divider" />

      <button
        :class="['sidebar__item', { 'sidebar__item--active': currentView === 'settings' }]"
        :title="sidebarCollapsed ? 'Paramètres' : undefined"
        data-testid="nav-settings"
        @click="navTo('settings')"
      >
        <KuboIcon name="settings" :size="20" />
        <span v-show="!sidebarCollapsed" class="sidebar__label">Paramètres</span>
      </button>
    </nav>

    <!-- User -->
    <div class="sidebar__user">
      <div class="sidebar__avatar">{{ user?.initials ?? '?' }}</div>
      <div v-show="!sidebarCollapsed" class="sidebar__user-info">
        <p class="sidebar__user-name">{{ user?.name }}</p>
        <p class="sidebar__user-role">{{ user?.role }}</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 280px;
  background: var(--kubo-surface);
  border-right: 1px solid var(--kubo-border);
  padding: 24px 20px;
  z-index: 50;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 8px;
  flex-shrink: 0;
}
.sidebar--collapsed {
  width: 88px;
}

/* Top */
.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}
.sidebar__logo {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
}
.sidebar__logo-k {
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
}
.sidebar__name {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--kubo-green);
  white-space: nowrap;
}
.sidebar__toggle {
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
}
.sidebar__toggle:hover {
  background: var(--kubo-surface-mute);
  color: var(--kubo-green);
}

/* Nav */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-base);
  font-weight: 800;
  font-size: 13px;
  transition: all var(--transition-base);
  white-space: nowrap;
  overflow: hidden;
}
.sidebar--collapsed .sidebar__item {
  justify-content: center;
  padding: 14px;
}
.sidebar__item:hover {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text);
}
.sidebar__item--active {
  background: var(--kubo-green) !important;
  color: #fff !important;
  box-shadow: 0 8px 20px -4px var(--kubo-green-shadow);
}
.sidebar__label {
  white-space: nowrap;
}
.sidebar__divider {
  height: 1px;
  background: var(--kubo-border);
  margin: 8px 0;
}

/* User */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-top: auto;
}
.sidebar--collapsed .sidebar__user {
  justify-content: center;
}
.sidebar__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d1fae5;
  color: #065f46;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  flex-shrink: 0;
}
.sidebar__user-info {
  overflow: hidden;
}
.sidebar__user-name {
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__user-role {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--kubo-text-muted);
}
</style>
