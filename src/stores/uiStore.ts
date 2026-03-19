import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ViewName = 'dashboard' | 'catalog' | 'planning' | 'groceries' | 'inventory' | 'settings'

export const useUiStore = defineStore('ui', () => {
  // ---- State ----
  const currentView = ref<ViewName>('dashboard')
  const sidebarCollapsed = ref(false)
  const darkMode = ref(false)
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
  }
})
