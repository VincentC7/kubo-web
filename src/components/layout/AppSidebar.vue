<script setup lang="ts">
/**
 * AppSidebar — Navigation principale
 * Chaque lien est filtré par useFeatureAccess().
 * Le bloc user en bas ouvre le profil si connecté, le login sinon.
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useFeatureAccess } from '@/composables/useFeatureAccess'
import type { ViewName } from '@/stores/uiStore'
import type { Feature } from '@/services/featureAccessService'

const uiStore = useUiStore()
const { currentView, sidebarCollapsed, showInventory, showGroceries } = storeToRefs(uiStore)
const { navTo, toggleSidebar } = uiStore

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { can } = useFeatureAccess()

interface NavItem {
  id: ViewName
  label: string
  icon: string
  feature: Feature
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'layout-dashboard',
    feature: 'nav:link:dashboard',
  },
  { id: 'catalog', label: 'Recettes', icon: 'utensils', feature: 'nav:link:catalog' },
  { id: 'planning', label: 'Menu Hebdo', icon: 'calendar', feature: 'nav:link:planning' },
  { id: 'groceries', label: 'Courses', icon: 'shopping-cart', feature: 'nav:link:groceries' },
  { id: 'inventory', label: 'Inventaire', icon: 'box', feature: 'nav:link:inventory' },
]

function isNavVisible(item: NavItem): boolean {
  if (!can.value(item.feature)) return false
  if (item.id === 'inventory') return showInventory.value
  if (item.id === 'groceries') return showGroceries.value
  return true
}

// User section
const userInitials = computed(() => {
  if (user.value?.firstName && user.value?.lastName) {
    return (user.value.firstName[0] + user.value.lastName[0]).toUpperCase()
  }
  if (!user.value?.email) return '?'
  const parts = user.value.email.split('@')[0].split(/[._-]/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
})

const userLabel = computed(() => {
  if (user.value?.firstName || user.value?.lastName) {
    return [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' ')
  }
  return user.value?.email?.split('@')[0] ?? 'Visiteur'
})

function emailToHue(email: string): number {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

const avatarStyle = computed(() => {
  if (!isAuthenticated.value || !user.value?.email) return {}
  const hue = emailToHue(user.value.email)
  return {
    background: `hsl(${hue}, 65%, 88%)`,
    color: `hsl(${hue}, 55%, 28%)`,
  }
})

function handleUserClick(): void {
  if (isAuthenticated.value) {
    navTo('profile')
  } else {
    navTo('login')
  }
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
        v-if="can('nav:link:settings')"
        :class="['sidebar__item', { 'sidebar__item--active': currentView === 'settings' }]"
        :title="sidebarCollapsed ? 'Paramètres' : undefined"
        data-testid="nav-settings"
        @click="navTo('settings')"
      >
        <KuboIcon name="settings" :size="20" />
        <span v-show="!sidebarCollapsed" class="sidebar__label">Paramètres</span>
      </button>
    </nav>

    <!-- User connecté -->
    <button
      v-if="isAuthenticated"
      class="sidebar__user"
      :title="sidebarCollapsed ? 'Mon profil' : undefined"
      @click="handleUserClick"
    >
      <div class="sidebar__avatar" :style="avatarStyle">
        <span>{{ userInitials }}</span>
      </div>
      <div v-show="!sidebarCollapsed" class="sidebar__user-info">
        <p class="sidebar__user-name">{{ userLabel }}</p>
        <p class="sidebar__user-email">{{ user?.email }}</p>
      </div>
      <KuboIcon
        v-show="!sidebarCollapsed"
        name="chevron-right"
        :size="14"
        class="sidebar__user-chevron"
      />
    </button>

    <!-- Bouton Se connecter (visiteur) -->
    <button
      v-else
      class="sidebar__login-btn"
      :title="sidebarCollapsed ? 'Se connecter' : undefined"
      @click="handleUserClick"
    >
      <KuboIcon v-if="sidebarCollapsed" name="log-in" :size="18" />
      <span v-else>Se connecter</span>
    </button>
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

/* User connecté */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-top: auto;
  cursor: pointer;
  transition: all var(--transition-base);
  width: 100%;
  text-align: left;
}
.sidebar__user:hover {
  border-color: var(--kubo-green);
  background: rgba(16, 185, 129, 0.06);
}
.sidebar--collapsed .sidebar__user {
  justify-content: center;
}
.sidebar__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  flex-shrink: 0;
}
.sidebar__user-info {
  overflow: hidden;
  flex: 1;
  min-width: 0;
}
.sidebar__user-name {
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__user-email {
  font-size: 10px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__user-chevron {
  color: var(--kubo-text-faint);
  flex-shrink: 0;
}

/* Bouton Se connecter (visiteur) */
.sidebar__login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 16px;
  width: 100%;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity var(--transition-base);
  box-shadow: 0 4px 16px var(--kubo-green-shadow);
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__login-btn:hover {
  opacity: 0.9;
}
.sidebar--collapsed .sidebar__login-btn {
  padding: 12px;
}
</style>
