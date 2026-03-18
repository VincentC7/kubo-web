/**
 * appStore — Store Pinia central de l'application Kubo
 * Migration de useApp.js vers Pinia (Setup Store API).
 */
import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiService } from '@/services/api.js'

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

export const useAppStore = defineStore('app', () => {
  // ---- State ----
  const currentView = ref('dashboard')
  const sidebarCollapsed = ref(false)
  const darkMode = ref(false)

  const user = ref(null)
  const recipes = ref([])
  const loading = ref(true)

  const weeklyData = reactive({})
  const currentDate = ref(new Date())

  const inventory = ref([])
  const viewMode = ref('week')
  const portions = ref(2)
  const mealsGoal = ref(5)
  const showInventory = ref(true)
  const showGroceries = ref(true)

  const filters = reactive({
    category: 'Tout',
    maxTime: 0,
    activeTags: [],
    search: '',
  })

  const toastMessage = ref('')
  const toastVisible = ref(false)
  let toastTimer = null

  // ---- Pagination catalogue ----
  const catalogPage = ref(1)
  const catalogLimit = ref(20)
  const catalogPages = ref(1)
  const catalogLoading = ref(false)

  // ---- Computed : semaine ----
  const weekKey = computed(() => getWeekKey(currentDate.value))
  const weekRange = computed(() => getWeekRange(currentDate.value))

  const periodLabel = computed(() => {
    const tab = currentView.value
    const mode = ['catalog', 'planning', 'groceries', 'inventory'].includes(tab)
      ? 'week'
      : viewMode.value
    if (mode === 'week') return getWeekRange(currentDate.value)
    if (mode === 'month')
      return currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return String(currentDate.value.getFullYear())
  })

  // ---- Helpers internes ----
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

  // ---- Période ----
  function changePeriod(delta) {
    const tab = currentView.value
    const mode = ['catalog', 'planning', 'groceries', 'inventory'].includes(tab)
      ? 'week'
      : viewMode.value
    const d = new Date(currentDate.value)
    if (mode === 'week') d.setDate(d.getDate() + delta * 7)
    else if (mode === 'month') d.setMonth(d.getMonth() + delta)
    else d.setFullYear(d.getFullYear() + delta)
    currentDate.value = d
  }

  // Compat legacy
  function changeWeek(delta) {
    changePeriod(delta)
  }

  function switchViewMode(mode) {
    viewMode.value = mode
  }

  // ---- Prix calculé par recette ----
  function getRecipePrice(recipe) {
    return recipe.ingredients.reduce((acc, ing) => acc + ((ing.price || 0) / 2) * portions.value, 0)
  }

  const recipesWithPrice = computed(() =>
    recipes.value.map((r) => ({ ...r, totalPrice: getRecipePrice(r) })),
  )

  // ---- Planning ----
  const selectedRecipes = computed(() => {
    const entries = getWeekEntries()
    return recipesWithPrice.value.filter((r) => entries[r.id]?.selected)
  })

  const doneRecipes = computed(() =>
    selectedRecipes.value.filter((r) => getWeekEntries()[r.id]?.done),
  )

  const progressPercent = computed(() => {
    if (currentView.value === 'groceries') {
      const totalIngs = selectedRecipes.value.flatMap((r) => r.ingredients).length
      if (!totalIngs) return 0
      const checked = selectedRecipes.value
        .flatMap((r) => r.ingredients)
        .filter((i) => inventory.value.find((inv) => inv.name === i.name)).length
      return Math.round((checked / totalIngs) * 100)
    }
    if (!mealsGoal.value) return 0
    return Math.min(100, Math.round((doneRecipes.value.length / mealsGoal.value) * 100))
  })

  const progressLabel = computed(() => {
    return currentView.value === 'groceries' ? 'Panier' : 'Objectif'
  })

  const progressText = computed(() => {
    if (currentView.value === 'groceries') {
      const totalIngs = selectedRecipes.value.flatMap((r) => r.ingredients).length
      const checked = selectedRecipes.value
        .flatMap((r) => r.ingredients)
        .filter((i) => inventory.value.find((inv) => inv.name === i.name)).length
      return `${checked}/${totalIngs}`
    }
    return `${doneRecipes.value.length}/${mealsGoal.value}`
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
      if (entries[id].done) {
        const recipe = recipesWithPrice.value.find((r) => r.id === id)
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            inventory.value = inventory.value.filter((item) => item.name !== ing.name)
          })
          notify('Consommé ! Stock mis à jour.')
        }
      }
    }
  }

  function isSelected(id) {
    return !!getWeekEntries()[id]?.selected
  }

  function isDone(id) {
    return !!getWeekEntries()[id]?.done
  }

  function clearPlanning() {
    const key = weekKey.value
    weeklyData[key] = {}
    notify('Semaine réinitialisée')
  }

  // ---- Inventaire ----
  function updateInventory(ingredient, isAdding) {
    if (isAdding) {
      if (!inventory.value.find((i) => i.name === ingredient.name)) {
        inventory.value = [...inventory.value, { ...ingredient }]
      }
    } else {
      inventory.value = inventory.value.filter((i) => i.name !== ingredient.name)
    }
  }

  function toggleRecipeIngredients(id) {
    const recipe = recipesWithPrice.value.find((r) => r.id === id)
    if (!recipe) return
    const allInStock = recipe.ingredients.every((ing) =>
      inventory.value.find((inv) => inv.name === ing.name),
    )
    if (allInStock) {
      recipe.ingredients.forEach((ing) => {
        inventory.value = inventory.value.filter((inv) => inv.name !== ing.name)
      })
    } else {
      recipe.ingredients.forEach((ing) => {
        if (!inventory.value.find((inv) => inv.name === ing.name)) {
          inventory.value = [...inventory.value, { ...ing }]
        }
      })
    }
  }

  function isInInventory(name) {
    return !!inventory.value.find((i) => i.name === name)
  }

  // ---- Paramètres ----
  function updatePortions(delta) {
    portions.value = Math.max(1, portions.value + delta)
  }

  function updateMealsGoal(delta) {
    mealsGoal.value = Math.max(1, mealsGoal.value + delta)
  }

  // ---- Budget ----
  const totalPrice = computed(() => selectedRecipes.value.reduce((acc, r) => acc + r.totalPrice, 0))

  const avgPrice = computed(() => {
    if (!selectedRecipes.value.length) return 0
    return totalPrice.value / selectedRecipes.value.length
  })

  // ---- Filtres ----
  const filteredRecipes = computed(() => {
    return recipesWithPrice.value.filter((r) => {
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
    if (!selectedRecipes.value.length) {
      return { prot: 30, fat: 30, carb: 40 }
    }
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

  // ---- Pagination catalogue ----
  const catalogHasMore = computed(() => catalogPage.value < catalogPages.value)

  // ---- Chargement initial ----
  async function init() {
    loading.value = true
    try {
      const [userData, recipesPage] = await Promise.all([
        apiService.getUser(),
        apiService.getRecipes(1, catalogLimit.value),
      ])
      user.value = userData
      recipes.value = recipesPage.items
      catalogPages.value = recipesPage.pages
      catalogPage.value = 1
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true)
      }
    } finally {
      loading.value = false
    }
  }

  /** Charge la page suivante et l'ajoute à la liste. */
  async function loadMoreRecipes() {
    if (catalogLoading.value || !catalogHasMore.value) return
    catalogLoading.value = true
    try {
      const nextPage = catalogPage.value + 1
      const recipesPage = await apiService.getRecipes(nextPage, catalogLimit.value)
      recipes.value = [...recipes.value, ...recipesPage.items]
      catalogPages.value = recipesPage.pages
      catalogPage.value = nextPage
    } finally {
      catalogLoading.value = false
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
    inventory,
    viewMode,
    portions,
    mealsGoal,
    showInventory,
    showGroceries,
    catalogLoading,
    catalogHasMore,

    // Computed
    weekRange,
    weekKey,
    periodLabel,
    selectedRecipes,
    doneRecipes,
    progressPercent,
    progressLabel,
    progressText,
    filteredRecipes,
    allCategories,
    allTags,
    nutritionTotals,
    totalPrice,
    avgPrice,
    recipesWithPrice,

    // Actions
    navTo,
    toggleSidebar,
    toggleDarkMode,
    changeWeek,
    changePeriod,
    switchViewMode,
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
    loadMoreRecipes,
    updateInventory,
    toggleRecipeIngredients,
    isInInventory,
    updatePortions,
    updateMealsGoal,
    getRecipePrice,
  }
})
