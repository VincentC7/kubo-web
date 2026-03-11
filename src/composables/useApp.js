/**
 * useApp — Composable central de l'application Kubo
 * Gère la navigation, le planning, les filtres et le dark mode.
 */
import { ref, reactive, computed } from 'vue'
import { apiService } from '@/services/api.js'

// ---- Singletons partagés (état global sans Pinia) ----
const currentView = ref('dashboard')
const sidebarCollapsed = ref(false)
const darkMode = ref(false)

const user = ref(null)
const recipes = ref([])
const loading = ref(true)

const weeklyData = reactive({})
const currentDate = ref(new Date())

const filters = reactive({
  category: 'Tout',
  maxTime: 0,
  activeTags: [],
  search: '',
})

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null

// ---- Helpers semaine ----
function getWeekKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${weekNo}`
}

function getWeekRange(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  const sun = new Date(d)
  sun.setDate(d.getDate() - day + 7)
  const fmt = (dt) => dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} — ${fmt(sun)}`
}

export function useApp() {
  // ---- Données semaine active ----
  const weekKey = computed(() => getWeekKey(currentDate.value))

  function ensureWeek(key) {
    if (!weeklyData[key]) weeklyData[key] = {}
  }

  function getWeekEntries() {
    const key = weekKey.value
    ensureWeek(key)
    return weeklyData[key]
  }

  // ---- Navigation ----
  function navTo(view) {
    currentView.value = view
  }

  // ---- Sidebar ----
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // ---- Dark mode ----
  function setDarkMode(value) {
    darkMode.value = value
    document.documentElement.classList.toggle('dark', value)
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode.value)
  }

  // ---- Semaine ----
  const weekRange = computed(() => getWeekRange(currentDate.value))

  function changeWeek(delta) {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + delta * 7)
    currentDate.value = d
  }

  // ---- Planning ----
  const selectedRecipes = computed(() => {
    const entries = getWeekEntries()
    return recipes.value.filter((r) => entries[r.id]?.selected)
  })

  const doneRecipes = computed(() =>
    selectedRecipes.value.filter((r) => getWeekEntries()[r.id]?.done),
  )

  const progressPercent = computed(() => {
    const s = selectedRecipes.value.length
    if (!s) return 0
    return Math.round((doneRecipes.value.length / s) * 100)
  })

  function toggleRecipe(id) {
    const entries = getWeekEntries()
    if (!entries[id]) entries[id] = { selected: false, done: false }
    entries[id].selected = !entries[id].selected
    if (!entries[id].selected) entries[id].done = false
  }

  function markAsDone(id) {
    const entries = getWeekEntries()
    if (entries[id]) {
      entries[id].done = !entries[id].done
    }
  }

  function isSelected(id) {
    return !!getWeekEntries()[id]?.selected
  }

  function isDone(id) {
    return !!getWeekEntries()[id]?.done
  }

  function clearPlanning() {
    const entries = getWeekEntries()
    Object.keys(entries).forEach((id) => {
      entries[id].selected = false
      entries[id].done = false
    })
    notify('Semaine réinitialisée')
  }

  // ---- Filtres ----
  const filteredRecipes = computed(() => {
    return recipes.value.filter((r) => {
      const mCat = filters.category === 'Tout' || r.cat === filters.category
      const mTime = filters.maxTime === 0 || r.time <= filters.maxTime
      const mTags =
        filters.activeTags.length === 0 || filters.activeTags.every((t) => r.tags.includes(t))
      const q = filters.search.toLowerCase()
      const mSearch = r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
      return mCat && mTime && mTags && mSearch
    })
  })

  function setFilterCategory(cat) {
    filters.category = cat
  }

  function setFilterMaxTime(time) {
    filters.maxTime = time
  }

  function toggleFilterTag(tag) {
    const idx = filters.activeTags.indexOf(tag)
    if (idx > -1) filters.activeTags.splice(idx, 1)
    else filters.activeTags.push(tag)
  }

  function setSearch(value) {
    filters.search = value
  }

  function resetFilters() {
    filters.category = 'Tout'
    filters.maxTime = 0
    filters.activeTags.length = 0
    filters.search = ''
  }

  const allCategories = computed(() => ['Tout', ...new Set(recipes.value.map((r) => r.cat))])
  const allTags = computed(() => [...new Set(recipes.value.flatMap((r) => r.tags))])

  // ---- Nutrition ----
  const nutritionTotals = computed(() => {
    return selectedRecipes.value.reduce(
      (acc, r) => ({ prot: acc.prot + r.prot, fat: acc.fat + r.fat, carb: acc.carb + r.carb }),
      { prot: 0, fat: 0, carb: 0 },
    )
  })

  // ---- Toast ----
  function notify(message) {
    toastMessage.value = message
    toastVisible.value = true
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastVisible.value = false
    }, 3000)
  }

  // ---- Chargement initial ----
  async function init() {
    loading.value = true
    try {
      const [userData, recipesData] = await Promise.all([
        apiService.getUser(),
        apiService.getRecipes(),
      ])
      user.value = userData
      recipes.value = recipesData
      // Applique le dark mode selon les préférences système
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    currentView,
    sidebarCollapsed,
    darkMode,
    user,
    recipes,
    loading,
    currentDate,
    filters,
    toastMessage,
    toastVisible,

    // Computed
    weekRange,
    weekKey,
    selectedRecipes,
    doneRecipes,
    progressPercent,
    filteredRecipes,
    allCategories,
    allTags,
    nutritionTotals,

    // Actions
    navTo,
    toggleSidebar,
    toggleDarkMode,
    changeWeek,
    toggleRecipe,
    markAsDone,
    isSelected,
    isDone,
    clearPlanning,
    setFilterCategory,
    setFilterMaxTime,
    toggleFilterTag,
    setSearch,
    resetFilters,
    notify,
    init,
  }
}
