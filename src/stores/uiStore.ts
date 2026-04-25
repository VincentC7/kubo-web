import { ref } from 'vue'
import { defineStore } from 'pinia'

const DARK_MODE_KEY = 'kubo_dark_mode'

export type ViewName =
  | 'dashboard'
  | 'catalog'
  | 'planning'
  | 'groceries'
  | 'inventory'
  | 'settings'
  | 'login'
  | 'register'
  | 'profile'

export const useUiStore = defineStore('ui', () => {
  // ---- State ----
  const currentView = ref<ViewName>('dashboard')
  const sidebarCollapsed = ref(false)
  // Initialise depuis localStorage
  const darkMode = ref(localStorage.getItem(DARK_MODE_KEY) === 'true')
  // Applique immédiatement la classe dark au démarrage
  if (darkMode.value) document.documentElement.classList.add('dark')
  const toastMessage = ref('')
  const toastVisible = ref(false)
  const showInventory = ref(true)
  const showGroceries = ref(true)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // ---- Actions ----
  function navTo(view: ViewName): void {
    currentView.value = view
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setDarkMode(value: boolean): void {
    darkMode.value = value
    document.documentElement.classList.toggle('dark', value)
    localStorage.setItem(DARK_MODE_KEY, String(value))
  }

  function toggleDarkMode(): void {
    setDarkMode(!darkMode.value)
  }

  function notify(message: string): void {
    toastMessage.value = message
    toastVisible.value = true
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastVisible.value = false
    }, 3000)
  }

  function setShowInventory(value: boolean): void {
    showInventory.value = value
  }

  function setShowGroceries(value: boolean): void {
    showGroceries.value = value
  }

  return {
    currentView,
    sidebarCollapsed,
    darkMode,
    toastMessage,
    toastVisible,
    showInventory,
    showGroceries,
    navTo,
    toggleSidebar,
    setDarkMode,
    toggleDarkMode,
    notify,
    setShowInventory,
    setShowGroceries,
  }
})
