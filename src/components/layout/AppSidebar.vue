<script setup lang="ts">
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { emailToHue } from '@/utils/avatar'
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
  { id: 'dashboard', label: 'Synthèse', icon: 'layout-dashboard', feature: 'nav:link:dashboard' },
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

const userInitials = computed(() => {
  if (user.value?.firstName && user.value?.lastName) {
    return (user.value.firstName[0] + user.value.lastName[0]).toUpperCase()
  }
  if (!user.value?.email) return '?'
  const parts = user.value.email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
})

const userLabel = computed(() => {
  if (user.value?.firstName || user.value?.lastName) {
    return [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' ')
  }
  return user.value?.email?.split('@')[0] ?? 'Visiteur'
})

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
    <!-- Brand -->
    <div class="sidebar__top">
      <button class="sidebar__brand" @click="navTo('dashboard')">
        <div class="sidebar__mark">k</div>
        <span v-show="!sidebarCollapsed" class="sidebar__wordmark">kubo</span>
      </button>
      <button
        v-show="!sidebarCollapsed"
        class="sidebar__toggle"
        title="Réduire"
        data-testid="sidebar-toggle"
        @click="toggleSidebar"
      >
        <KuboIcon name="chevron-left" :size="16" />
      </button>
      <button
        v-show="sidebarCollapsed"
        class="sidebar__toggle"
        title="Étendre"
        data-testid="sidebar-toggle"
        @click="toggleSidebar"
      >
        <KuboIcon name="chevron-right" :size="16" />
      </button>
    </div>

    <!-- Section Cuisine -->
    <p v-show="!sidebarCollapsed" class="sidebar__section-label">Cuisine</p>
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
        <KuboIcon :name="item.icon" :size="17" />
        <span v-show="!sidebarCollapsed" class="sidebar__label">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Section Compte -->
    <p v-show="!sidebarCollapsed && (isAuthenticated || can('nav:link:settings'))" class="sidebar__section-label sidebar__section-label--mt">Compte</p>
    <nav class="sidebar__nav">
      <button
        v-if="isAuthenticated"
        :class="['sidebar__item', { 'sidebar__item--active': currentView === 'profile' }]"
        :title="sidebarCollapsed ? 'Mon profil' : undefined"
        data-testid="nav-profile"
        @click="navTo('profile')"
      >
        <KuboIcon name="user" :size="17" />
        <span v-show="!sidebarCollapsed" class="sidebar__label">Mon profil</span>
      </button>
      <button
        v-if="can('nav:link:settings')"
        :class="['sidebar__item', { 'sidebar__item--active': currentView === 'settings' }]"
        :title="sidebarCollapsed ? 'Paramètres' : undefined"
        data-testid="nav-settings"
        @click="navTo('settings')"
      >
        <KuboIcon name="settings" :size="17" />
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
      <button
        v-show="!sidebarCollapsed"
        class="sidebar__user-logout"
        title="Déconnexion"
        @click.stop="authStore.logout()"
      >
        <KuboIcon name="log-out" :size="13" />
      </button>
    </button>

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
  width: 232px;
  background: var(--kubo-surface);
  border-right: 1px solid var(--kubo-border);
  padding: 22px 14px 14px;
  z-index: 50;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 1px;
  flex-shrink: 0;
}
.sidebar--collapsed {
  width: 72px;
}

/* Brand */
.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 22px;
  gap: 8px;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}
.sidebar--collapsed .sidebar__brand {
  justify-content: center;
}
.sidebar__mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--kubo-green);
  color: var(--kubo-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
}
.sidebar__wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-style: italic;
  font-size: 26px;
  letter-spacing: -0.5px;
  color: var(--kubo-sage-deep);
  line-height: 1;
  white-space: nowrap;
}
.dark .sidebar__wordmark {
  color: var(--kubo-sage-deep);
}
.sidebar__toggle {
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--kubo-text-faint);
  border-radius: var(--radius-xs);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color var(--transition-base);
}
.sidebar__toggle:hover {
  color: var(--kubo-green);
}

/* Section labels */
.sidebar__section-label {
  padding: 12px 10px 6px;
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--kubo-text-faint);
  font-weight: 700;
}
.sidebar__section-label--mt {
  margin-top: 8px;
}

/* Nav */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  border-radius: 12px;
  cursor: pointer;
  font-family: var(--font-base);
  font-weight: 600;
  font-size: 13.5px;
  transition: background var(--transition-base), color var(--transition-base);
  white-space: nowrap;
  overflow: hidden;
}
.sidebar--collapsed .sidebar__item {
  justify-content: center;
  padding: 12px;
}
.sidebar__item:hover {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text);
}
.sidebar__item--active {
  background: var(--kubo-green) !important;
  color: #fffdf7 !important;
}
.sidebar__label {
  white-space: nowrap;
}

/* User */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  border-top: 1px solid var(--kubo-border);
  margin-top: auto;
  cursor: pointer;
  transition: background var(--transition-base);
  width: 100%;
  text-align: left;
  background: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  padding-top: 14px;
}
.sidebar__user:hover {
  background: var(--kubo-surface-mute);
}
.sidebar--collapsed .sidebar__user {
  justify-content: center;
}
.sidebar__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--kubo-green-light);
  color: var(--kubo-sage-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.sidebar__user-info {
  overflow: hidden;
  flex: 1;
  min-width: 0;
}
.sidebar__user-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--kubo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.sidebar__user-email {
  font-size: 11px;
  color: var(--kubo-text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  margin-top: 1px;
}
.sidebar__user-logout {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--kubo-border);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-base);
}
.sidebar__user-logout:hover {
  background: var(--kubo-tomato-soft);
  border-color: var(--kubo-tomato);
  color: var(--kubo-tomato-deep);
}

/* Login btn */
.sidebar__login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 16px;
  width: 100%;
  background: var(--kubo-green);
  color: #fffdf7;
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: filter var(--transition-base);
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__login-btn:hover {
  filter: brightness(1.08);
}
.sidebar--collapsed .sidebar__login-btn {
  padding: 12px;
}
</style>
