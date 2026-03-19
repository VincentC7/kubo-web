import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  // ---- State ----
  const currentView = ref('dashboard')
  const sidebarCollapsed = ref(false)
  const darkMode = ref(false)
  const toastMessage = ref('')
  const toastVisible = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // ---- Computed ----
  const periodLabel = computed(() => currentView.value)

  // ---- Actions ----
  function navTo(view: string): void {
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
    periodLabel,
    navTo,
    toggleSidebar,
    setDarkMode,
    toggleDarkMode,
    notify,
  }
})
