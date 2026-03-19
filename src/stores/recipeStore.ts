import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { recipeService } from '@/services/recipeService'
import { useUserStore } from './userStore'
import type { RecipeListItem, RecipeWithPrice } from '@/types/recipe'

export const useRecipeStore = defineStore('recipe', () => {
  // ---- State ----
  const recipes = ref<RecipeListItem[]>([])
  const loading = ref(true)
  const loadingDetailId = ref<string | null>(null)

  // Cache détail : id → recette enrichie (évite les double-appels)
  const detailCache = new Map<string, RecipeListItem>()

  const filters = reactive({
    category: 'Tout',
    maxTime: 0,
    activeTags: [] as string[],
    search: '',
  })

  // ---- Pagination ----
  const catalogPage = ref(1)
  const catalogLimit = ref(20)
  const catalogPages = ref(1)
  const catalogLoading = ref(false)

  const catalogHasMore = computed(() => catalogPage.value < catalogPages.value)

  // ---- Computed ----
  const recipesWithPrice = computed<RecipeWithPrice[]>(() => {
    const userStore = useUserStore()
    return recipes.value.map((r) => ({
      ...r,
      totalPrice: r.ingredients.reduce(
        (acc, ing) => acc + ((ing.price || 0) / 2) * userStore.portions,
        0,
      ),
    }))
  })

  const filteredRecipes = computed<RecipeWithPrice[]>(() => {
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

  const allCategories = computed(() => ['Tout', ...new Set(recipes.value.map((r) => r.cat))])
  const allTags = computed(() => [...new Set(recipes.value.flatMap((r) => r.tags))])

  // ---- Filter actions ----
  function setFilterCategory(cat: string): void {
    filters.category = cat
  }

  function setFilterMaxTime(time: number): void {
    filters.maxTime = time
  }

  function toggleFilterTag(tag: string): void {
    const idx = filters.activeTags.indexOf(tag)
    if (idx > -1) filters.activeTags.splice(idx, 1)
    else filters.activeTags.push(tag)
  }

  function setSearch(value: string): void {
    filters.search = value
  }

  function resetFilters(): void {
    filters.category = 'Tout'
    filters.maxTime = 0
    filters.activeTags.length = 0
    filters.search = ''
  }

  // ---- Load actions ----
  async function init(): Promise<void> {
    loading.value = true
    try {
      const page = await recipeService.getRecipes(1, catalogLimit.value)
      recipes.value = page.items
      catalogPages.value = page.pages
      catalogPage.value = 1
    } finally {
      loading.value = false
    }
  }

  async function loadMoreRecipes(): Promise<void> {
    if (catalogLoading.value || !catalogHasMore.value) return
    catalogLoading.value = true
    try {
      const nextPage = catalogPage.value + 1
      const page = await recipeService.getRecipes(nextPage, catalogLimit.value)
      recipes.value = [...recipes.value, ...page.items]
      catalogPages.value = page.pages
      catalogPage.value = nextPage
    } finally {
      catalogLoading.value = false
    }
  }

  async function fetchDetail(id: string): Promise<void> {
    // Déjà en cache → on patche immédiatement, pas d'appel réseau
    if (detailCache.has(id)) {
      const cached = detailCache.get(id)!
      const idx = recipes.value.findIndex((r) => r.id === id)
      if (idx !== -1) Object.assign(recipes.value[idx], cached)
      return
    }

    loadingDetailId.value = id
    try {
      const detail = await recipeService.getRecipeById(id)
      detailCache.set(id, detail)
      const idx = recipes.value.findIndex((r) => r.id === id)
      if (idx !== -1) Object.assign(recipes.value[idx], detail)
    } finally {
      loadingDetailId.value = null
    }
  }

  return {
    recipes,
    loading,
    loadingDetailId,
    filters,
    catalogLoading,
    catalogHasMore,
    recipesWithPrice,
    filteredRecipes,
    allCategories,
    allTags,
    setFilterCategory,
    setFilterMaxTime,
    toggleFilterTag,
    setSearch,
    resetFilters,
    init,
    loadMoreRecipes,
    fetchDetail,
  }
})
